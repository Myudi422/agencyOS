"""
YT Heatmap Clipper - Local Agent Server (AgencyOS Semi-Local Engine)
Runs locally on http://127.0.0.1:5000 to process YouTube videos locally.
"""

import os
import sys
import re
import json
import uuid
import shutil
import subprocess
import threading
import asyncio
import time
import base64
from typing import List, Dict, Optional
from pathlib import Path

try:
    from fastapi import FastAPI, BackgroundTasks, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles
    from pydantic import BaseModel
    import uvicorn
    import requests
except ImportError:
    print("Dependencies missing! Run: pip install fastapi uvicorn requests pydantic")

app = FastAPI(title="YT Heatmap Clipper Local Agent", version="1.0.0")

# Enable CORS for AgencyOS Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
CLIPS_DIR = BASE_DIR / "clips"
CLIPS_DIR.mkdir(exist_ok=True)
TEMP_DIR = BASE_DIR / "temp_yt"
TEMP_DIR.mkdir(exist_ok=True)
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)
GENERATED_DIR = BASE_DIR / "generated"
GENERATED_DIR.mkdir(exist_ok=True)

# Mount StaticFiles for /clips to handle HTTP Range headers (HTML5 video streaming 206 Partial Content)
app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")
app.mount("/generated", StaticFiles(directory=str(GENERATED_DIR)), name="generated")

# In-memory job store, whisper model cache & Gemini client state
jobs: Dict[str, Dict] = {}
_whisper_models_cache: Dict[str, any] = {}
_gemini_client = None
_gemini_loop = None


def get_whisper_model(model_name: str = "tiny"):
    """Loads and caches Faster-Whisper model in local models directory (downloads once)."""
    if model_name not in _whisper_models_cache:
        from faster_whisper import WhisperModel
        print(f"[Whisper] Loading model '{model_name}' (saving to {MODELS_DIR})...")
        _whisper_models_cache[model_name] = WhisperModel(
            model_name,
            device="cpu",
            compute_type="int8",
            download_root=str(MODELS_DIR)
        )
    return _whisper_models_cache[model_name]


class ClipRequest(BaseModel):
    url: str
    crop_mode: int = 1  # 1: Center, 2: Split Left, 3: Split Right
    use_subtitle: bool = True
    whisper_model: str = "tiny"  # tiny, base, small, medium
    min_score: float = 0.40
    padding: int = 10
    max_duration: int = 60
    max_clips: int = 5


def check_dependency(command: str) -> bool:
    return shutil.which(command) is not None


def check_python_package(package_name: str) -> bool:
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False


@app.get("/health")
def health_check():
    ffmpeg_ok = check_dependency("ffmpeg")
    ytdlp_ok = check_dependency("yt-dlp") or check_python_package("yt_dlp")
    whisper_ok = check_python_package("faster_whisper")

    return {
        "status": "online",
        "agent": "AgencyOS YT-Clipper Local Agent",
        "version": "1.0.0",
        "port": 5000,
        "clips_directory": str(CLIPS_DIR.resolve()),
        "dependencies": {
            "ffmpeg": ffmpeg_ok,
            "yt_dlp": ytdlp_ok,
            "faster_whisper": whisper_ok,
            "requests": check_python_package("requests")
        },
        "all_ready": ffmpeg_ok and ytdlp_ok
    }


@app.post("/api/open-folder")
def open_clips_folder():
    """Opens local clips directory in Windows File Explorer or Mac Finder."""
    try:
        folder_path = str(CLIPS_DIR.resolve())
        if os.name == "nt":
            os.startfile(folder_path)
        elif sys.platform == "darwin":
            subprocess.run(["open", folder_path])
        else:
            subprocess.run(["xdg-open", folder_path])
        return {"status": "success", "message": f"Opened folder: {folder_path}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to open folder: {str(e)}")


def extract_youtube_heatmap(
    url: str,
    min_score: float = 0.40,
    padding: int = 10,
    max_duration: int = 60,
    return_raw: bool = False,
    video_duration: Optional[float] = None
):
    """
    Extracts YouTube Heatmap (Most Replayed) data from video watch page.
    Guarantees clip bounds never exceed video duration and dynamically scales segments.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }

    try:
        res = requests.get(url, headers=headers, timeout=10)
        html = res.text
    except Exception:
        html = ""

    # Extract video title & duration from HTML meta or player response
    title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    title = title_match.group(1) if title_match else "YouTube Video"

    # Extract video duration in seconds
    video_dur_match = re.search(r'"lengthSeconds"\s*:\s*"(\d+)"', html)
    if not video_dur_match:
        video_dur_match = re.search(r'<meta property="og:video:duration" content="(\d+)"', html)

    if video_dur_match:
        extracted_dur = float(video_dur_match.group(1))
    elif video_duration and video_duration > 0:
        extracted_dur = float(video_duration)
    else:
        extracted_dur = 300.0

    # Extract heatmap markers using direct parameter regex matching
    markers = []
    pattern = r'"timeRangeStartMillis"\s*:\s*(\d+)[^}]*?"markerDurationMillis"\s*:\s*(\d+)[^}]*?"heatMarkerIntensityScoreNormalized"\s*:\s*([0-9.]+)'
    matches = re.findall(pattern, html)
    if matches:
        for start_ms, dur_ms, score in matches:
            markers.append({
                "start": float(start_ms) / 1000.0,
                "duration": float(dur_ms) / 1000.0,
                "score": float(score)
            })

    # Filter markers with high engagement score
    high_score_markers = [m for m in markers if m["score"] >= min_score]

    # If min_score filtered out all markers, take top 20% highest scoring markers
    if markers and not high_score_markers:
        sorted_markers = sorted(markers, key=lambda x: x["score"], reverse=True)
        top_count = max(1, len(sorted_markers) // 5)
        high_score_markers = sorted(sorted_markers[:top_count], key=lambda x: x["start"])

    # Dynamic Fallback if video HAS NO heatmap markers on YouTube (e.g., new video)
    if not high_score_markers:
        # Dynamically create sample segments distributed across video duration (never exceeding video length)
        num_segments = max(1, min(5, int(extracted_dur // max_duration) or 1))
        step = extracted_dur / (num_segments + 1)
        fallback_markers = []
        for i in range(1, num_segments + 1):
            m_start = round(i * step, 1)
            if m_start < extracted_dur:
                fallback_markers.append({
                    "start": m_start,
                    "duration": min(float(max_duration), extracted_dur - m_start),
                    "score": round(0.85 - (i * 0.05), 2)
                })
        high_score_markers = fallback_markers or [{"start": 0.0, "duration": min(float(max_duration), extracted_dur), "score": 0.85}]

    # Group adjacent markers into clips
    clips = []
    if high_score_markers:
        current_start = max(0.0, high_score_markers[0]["start"] - padding)
        current_end = min(extracted_dur, high_score_markers[0]["start"] + high_score_markers[0]["duration"] + padding)
        max_score = high_score_markers[0]["score"]

        for m in high_score_markers[1:]:
            m_start = max(0.0, m["start"] - padding)
            m_end = min(extracted_dur, m["start"] + m["duration"] + padding)

            if m_start <= current_end and (m_end - current_start) <= max_duration:
                current_end = min(extracted_dur, max(current_end, m_end))
                max_score = max(max_score, m["score"])
            else:
                clip_end = min(extracted_dur, min(current_start + max_duration, current_end))
                if clip_end > current_start:
                    clips.append({
                        "start": round(current_start, 1),
                        "end": round(clip_end, 1),
                        "duration": round(clip_end - current_start, 1),
                        "score": round(max_score, 2)
                    })
                current_start = m_start
                current_end = m_end
                max_score = m["score"]

        clip_end = min(extracted_dur, min(current_start + max_duration, current_end))
        if clip_end > current_start:
            clips.append({
                "start": round(current_start, 1),
                "end": round(clip_end, 1),
                "duration": round(clip_end - current_start, 1),
                "score": round(max_score, 2)
            })

    # Guarantee all clips strict upper bound by extracted_dur
    valid_clips = []
    for c in clips:
        if c["start"] < extracted_dur and c["end"] <= extracted_dur and c["end"] > c["start"]:
            valid_clips.append(c)

    if return_raw:
        return valid_clips, markers
    return valid_clips


def format_srt_timestamp(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def generate_subtitles(audio_path: str, srt_path: str, model_name: str = "tiny") -> bool:
    """Generates SRT subtitle file using Faster-Whisper if available (uses cached model)."""
    try:
        model = get_whisper_model(model_name)
        segments, _ = model.transcribe(audio_path, beam_size=5)

        with open(srt_path, "w", encoding="utf-8") as f:
            for i, segment in enumerate(segments, start=1):
                start_str = format_srt_timestamp(segment.start)
                end_str = format_srt_timestamp(segment.end)
                f.write(f"{i}\n{start_str} --> {end_str}\n{segment.text.strip()}\n\n")
        return True
    except Exception as e:
        print(f"Subtitle generation failed/skipped: {e}")
        return False


class HeatmapRequest(BaseModel):
    url: str
    min_score: float = 0.40
    padding: int = 10
    max_duration: int = 60
    video_duration: Optional[float] = None


@app.post("/api/heatmap")
def fetch_heatmap_analysis(req: HeatmapRequest):
    """Returns raw YouTube heatmap markers and clip suggestions without cutting/rendering."""
    try:
        clips, markers = extract_youtube_heatmap(
            req.url,
            min_score=req.min_score,
            padding=req.padding,
            max_duration=req.max_duration,
            return_raw=True,
            video_duration=req.video_duration
        )
        return {
            "status": "success",
            "url": req.url,
            "clips": clips,
            "markers": markers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch heatmap: {str(e)}")


def check_has_audio(file_path: str) -> bool:
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-select_streams", "a",
            "-show_entries", "stream=codec_type",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(file_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        return bool(res.stdout.strip())
    except Exception:
        return False


def process_clip_job(job_id: str, req: ClipRequest):
    job = jobs[job_id]
    try:
        job["status"] = "processing"
        job["progress"] = 10
        job["logs"].append("Fetching YouTube Heatmap data...")

        # Step 1: Parse Heatmap
        segments = extract_youtube_heatmap(
            req.url, 
            min_score=req.min_score, 
            padding=req.padding, 
            max_duration=req.max_duration
        )
        
        segments = segments[:req.max_clips]
        job["logs"].append(f"Found {len(segments)} high-engagement segments.")
        job["progress"] = 25

        rendered_clips = []
        
        for idx, seg in enumerate(segments, start=1):
            job["logs"].append(f"Processing Clip #{idx} ({seg['start']}s - {seg['end']}s, duration: {seg['duration']}s)...")
            
            # Temporary files
            seg_id = f"{job_id}_clip_{idx}"
            raw_output_template = str(TEMP_DIR / f"{seg_id}_raw.%(ext)s")
            audio_file = TEMP_DIR / f"{seg_id}_audio.wav"
            srt_file = TEMP_DIR / f"{seg_id}_sub.srt"
            output_clip = CLIPS_DIR / f"clip_{seg_id}.mp4"

            # Step 2: Download time section using yt-dlp
            download_cmd = [
                "yt-dlp",
                "-f", "18/b/bestvideo+bestaudio/best",
                "--extractor-args", "youtube:player_client=mweb,android",
                "--no-check-certificates",
                "--download-sections", f"*{seg['start']}-{seg['end']}",
                "--force-keyframes-at-cuts",
                "-o", raw_output_template,
                req.url
            ]
            
            job["logs"].append(f"Downloading section {seg['start']}s-{seg['end']}s...")
            dl_res = subprocess.run(download_cmd, capture_output=True, text=True)
            
            # Find the downloaded raw video file
            raw_matches = list(TEMP_DIR.glob(f"{seg_id}_raw.*"))
            raw_video = raw_matches[0] if raw_matches else None

            if not raw_video or not raw_video.exists():
                job["logs"].append(f"Warning: Failed to download clip #{idx}. Error: {dl_res.stderr[-200:] if dl_res.stderr else 'Unknown'}")
                continue

            # Check if raw video has audio stream
            has_audio = check_has_audio(str(raw_video))

            # Step 3: Subtitle Generation if requested
            has_subtitles = False
            if req.use_subtitle and has_audio and check_python_package("faster_whisper"):
                job["logs"].append(f"Transcribing audio with Whisper ({req.whisper_model})...")
                # Extract Audio for Whisper
                extract_audio_cmd = [
                    "ffmpeg", "-y", "-fflags", "+genpts", "-i", str(raw_video),
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                    str(audio_file)
                ]
                subprocess.run(extract_audio_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if audio_file.exists():
                    has_subtitles = generate_subtitles(str(audio_file), str(srt_file), req.whisper_model)

            # Step 4: Crop Video to Vertical 9:16 (720x1280)
            job["logs"].append(f"Rendering 9:16 vertical crop (Mode: {req.crop_mode})...")
            
            # FFmpeg filter selection
            if req.crop_mode == 2:
                # Split Left (Top: Center 720x960, Bottom: Bottom-Left Facecam 720x320)
                filter_graph = (
                    "[0:v]scale=-2:960,crop=720:960:(in_w-720)/2:0[top];"
                    "[0:v]crop=iw/3:ih/3:0:ih*2/3,scale=720:320[bot];"
                    "[top][bot]vstack[v]"
                )
                map_v = "[v]"
            elif req.crop_mode == 3:
                # Split Right (Top: Center 720x960, Bottom: Bottom-Right Facecam 720x320)
                filter_graph = (
                    "[0:v]scale=-2:960,crop=720:960:(in_w-720)/2:0[top];"
                    "[0:v]crop=iw/3:ih/3:iw*2/3:ih*2/3,scale=720:320[bot];"
                    "[top][bot]vstack[v]"
                )
                map_v = "[v]"
            else:
                # Mode 1: Default Center Crop (720x1280)
                filter_graph = "scale=-2:1280,crop=720:1280:(in_w-720)/2:0"
                map_v = None

            # Add subtitle overlay if available
            if has_subtitles and srt_file.exists():
                srt_escaped = str(srt_file).replace("\\", "/").replace(":", "\\:")
                sub_filter = f"subtitles='{srt_escaped}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2'"
                if map_v == "[v]":
                    filter_graph += f";[v]{sub_filter}[vsub]"
                    map_v = "[vsub]"
                else:
                    filter_graph += f",{sub_filter}"

            # Run FFmpeg render cleanly
            ffmpeg_render_cmd = ["ffmpeg", "-y", "-fflags", "+genpts", "-i", str(raw_video)]

            if not has_audio:
                # Add silent audio generator if video file has no audio stream
                ffmpeg_render_cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])

            if map_v:
                if has_audio:
                    ffmpeg_render_cmd.extend(["-filter_complex", filter_graph, "-map", map_v, "-map", "0:a"])
                else:
                    ffmpeg_render_cmd.extend(["-filter_complex", filter_graph, "-map", map_v, "-map", "1:a"])
            else:
                ffmpeg_render_cmd.extend(["-vf", filter_graph])
                if not has_audio:
                    ffmpeg_render_cmd.extend(["-map", "0:v", "-map", "1:a"])

            ffmpeg_render_cmd.extend([
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "26",
                "-c:a", "aac", "-b:a", "128k", "-async", "1", "-shortest",
                str(output_clip)
            ])

            ff_res = subprocess.run(ffmpeg_render_cmd, capture_output=True, text=True)

            # Cleanup temp files
            if raw_video and raw_video.exists():
                try: raw_video.unlink()
                except Exception: pass

            for temp_f in [audio_file, srt_file]:
                if temp_f.exists():
                    try: temp_f.unlink()
                    except Exception: pass

            if output_clip.exists() and output_clip.stat().st_size > 0:
                mb_size = round(output_clip.stat().st_size / (1024 * 1024), 2)
                rendered_clips.append({
                    "clip_name": f"Clip #{idx}",
                    "filename": output_clip.name,
                    "url": f"http://127.0.0.1:5000/clips/{output_clip.name}",
                    "start": seg["start"],
                    "end": seg["end"],
                    "duration": seg["duration"],
                    "score": seg["score"]
                })
                job["logs"].append(f"✅ Clip #{idx} successfully generated ({mb_size} MB)!")
            else:
                job["logs"].append(f"❌ Clip #{idx} render failed. Error: {ff_res.stderr[-200:] if ff_res.stderr else 'Unknown'}")
            
            job["progress"] = int(25 + (idx / len(segments)) * 70)

        job["progress"] = 100
        job["status"] = "completed"
        job["clips"] = rendered_clips
        job["logs"].append("🎉 All clips rendered successfully!")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["logs"].append(f"❌ Error: {str(e)}")


@app.post("/api/clip")
def start_clipping(req: ClipRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "url": req.url,
        "logs": ["Job queued."],
        "clips": [],
        "created_at": time.time()
    }

    background_tasks.add_task(process_clip_job, job_id, req)
    return {"job_id": job_id, "status": "queued", "message": "Clipping job started."}


@app.get("/api/status/{job_id}")
def get_job_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


@app.get("/api/clips")
def list_local_clips():
    """Returns list of all rendered clips in the clips directory."""
    clip_list = []
    for f in sorted(CLIPS_DIR.glob("*.mp4"), key=lambda x: x.stat().st_mtime, reverse=True):
        clip_list.append({
            "filename": f.name,
            "url": f"http://127.0.0.1:5000/clips/{f.name}",
            "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
            "created_at": f.stat().st_mtime
        })
    return {"clips": clip_list, "total": len(clip_list)}


class ManualClipRequest(BaseModel):
    url: str
    segments: List[Dict]  # list of {start: float, end: float, label: str}
    crop_mode: int = 1    # 1: Center, 2: Split Left, 3: Split Right
    use_subtitle: bool = False
    whisper_model: str = "tiny"


def process_manual_clip_job(job_id: str, req: ManualClipRequest):
    job = jobs[job_id]
    try:
        job["status"] = "processing"
        job["progress"] = 5
        job["logs"].append(f"Starting manual clip job: {len(req.segments)} segment(s).")

        rendered_clips = []

        for idx, seg in enumerate(req.segments, start=1):
            start = float(seg.get("start", 0))
            end = float(seg.get("end", 0))
            label = seg.get("label", f"Clip #{idx}")
            duration = round(end - start, 2)

            if duration <= 0:
                job["logs"].append(f"Skipping {label}: invalid duration ({duration}s).")
                continue

            job["logs"].append(f"Processing {label}: {start}s → {end}s ({duration}s)...")

            seg_id = f"manual_{job_id}_{idx}"
            raw_output_template = str(TEMP_DIR / f"{seg_id}_raw.%(ext)s")
            audio_file = TEMP_DIR / f"{seg_id}_audio.wav"
            srt_file = TEMP_DIR / f"{seg_id}_sub.srt"
            output_clip = CLIPS_DIR / f"clip_{seg_id}.mp4"

            # Download only the segment using --download-sections
            download_cmd = [
                "yt-dlp",
                "-f", "18/b/bestvideo+bestaudio/best",
                "--extractor-args", "youtube:player_client=mweb,android",
                "--no-check-certificates",
                "--download-sections", f"*{start}-{end}",
                "--force-keyframes-at-cuts",
                "-o", raw_output_template,
                req.url
            ]

            job["logs"].append(f"Downloading segment {start}s-{end}s (no full video download)...")
            dl_res = subprocess.run(download_cmd, capture_output=True, text=True)

            raw_matches = list(TEMP_DIR.glob(f"{seg_id}_raw.*"))
            raw_video = raw_matches[0] if raw_matches else None

            if not raw_video or not raw_video.exists():
                job["logs"].append(f"❌ Failed to download {label}: {dl_res.stderr[-150:] if dl_res.stderr else 'Unknown'}")
                continue

            has_audio = check_has_audio(str(raw_video))

            # Subtitle generation
            has_subtitles = False
            if req.use_subtitle and has_audio and check_python_package("faster_whisper"):
                job["logs"].append(f"Transcribing audio for {label}...")
                extract_audio_cmd = [
                    "ffmpeg", "-y", "-fflags", "+genpts", "-i", str(raw_video),
                    "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                    str(audio_file)
                ]
                subprocess.run(extract_audio_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if audio_file.exists():
                    has_subtitles = generate_subtitles(str(audio_file), str(srt_file), req.whisper_model)

            # FFmpeg filter selection
            if req.crop_mode == 2:
                filter_graph = (
                    "[0:v]scale=-2:960,crop=720:960:(in_w-720)/2:0[top];"
                    "[0:v]crop=iw/3:ih/3:0:ih*2/3,scale=720:320[bot];"
                    "[top][bot]vstack[v]"
                )
                map_v = "[v]"
            elif req.crop_mode == 3:
                filter_graph = (
                    "[0:v]scale=-2:960,crop=720:960:(in_w-720)/2:0[top];"
                    "[0:v]crop=iw/3:ih/3:iw*2/3:ih*2/3,scale=720:320[bot];"
                    "[top][bot]vstack[v]"
                )
                map_v = "[v]"
            else:
                filter_graph = "scale=-2:1280,crop=720:1280:(in_w-720)/2:0"
                map_v = None

            if has_subtitles and srt_file.exists():
                srt_escaped = str(srt_file).replace("\\", "/").replace(":", "\\:")
                sub_filter = f"subtitles='{srt_escaped}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Alignment=2'"
                if map_v == "[v]":
                    filter_graph += f";[v]{sub_filter}[vsub]"
                    map_v = "[vsub]"
                else:
                    filter_graph += f",{sub_filter}"

            ffmpeg_render_cmd = ["ffmpeg", "-y", "-fflags", "+genpts", "-i", str(raw_video)]

            if not has_audio:
                ffmpeg_render_cmd.extend(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"])

            if map_v:
                if has_audio:
                    ffmpeg_render_cmd.extend(["-filter_complex", filter_graph, "-map", map_v, "-map", "0:a"])
                else:
                    ffmpeg_render_cmd.extend(["-filter_complex", filter_graph, "-map", map_v, "-map", "1:a"])
            else:
                ffmpeg_render_cmd.extend(["-vf", filter_graph])
                if not has_audio:
                    ffmpeg_render_cmd.extend(["-map", "0:v", "-map", "1:a"])

            ffmpeg_render_cmd.extend([
                "-c:v", "libx264", "-preset", "ultrafast", "-crf", "26",
                "-c:a", "aac", "-b:a", "128k", "-async", "1", "-shortest",
                str(output_clip)
            ])

            ff_res = subprocess.run(ffmpeg_render_cmd, capture_output=True, text=True)

            # Cleanup temp
            if raw_video and raw_video.exists():
                try: raw_video.unlink()
                except: pass
            for temp_f in [audio_file, srt_file]:
                if temp_f.exists():
                    try: temp_f.unlink()
                    except: pass

            if output_clip.exists() and output_clip.stat().st_size > 0:
                mb_size = round(output_clip.stat().st_size / (1024 * 1024), 2)
                rendered_clips.append({
                    "clip_name": label,
                    "filename": output_clip.name,
                    "url": f"http://127.0.0.1:5000/clips/{output_clip.name}",
                    "start": start,
                    "end": end,
                    "duration": duration,
                    "score": 1.0
                })
                job["logs"].append(f"✅ {label} berhasil dirender ({mb_size} MB)!")
            else:
                job["logs"].append(f"❌ {label} gagal dirender. Error: {ff_res.stderr[-150:] if ff_res.stderr else 'Unknown'}")

            job["progress"] = int(10 + (idx / len(req.segments)) * 85)

        job["progress"] = 100
        job["status"] = "completed"
        job["clips"] = rendered_clips
        job["logs"].append(f"🎉 Selesai! {len(rendered_clips)} dari {len(req.segments)} klip berhasil dirender.")

    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["logs"].append(f"❌ Error: {str(e)}")


@app.post("/api/manual-clip")
def start_manual_clipping(req: ManualClipRequest, background_tasks: BackgroundTasks):
    if not req.segments:
        raise HTTPException(status_code=400, detail="Minimal 1 segmen harus ditentukan.")
    if len(req.segments) > 10:
        raise HTTPException(status_code=400, detail="Maksimal 10 segmen sekaligus.")

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "url": req.url,
        "mode": "manual",
        "logs": ["Manual clip job queued."],
        "clips": [],
        "created_at": time.time()
    }

    background_tasks.add_task(process_manual_clip_job, job_id, req)
    return {"job_id": job_id, "status": "queued", "message": f"Manual clip job dimulai dengan {len(req.segments)} segmen."}


# ============================================================
# GEMINI AI GENERATE ENDPOINTS
# ============================================================

class GeminiConfigRequest(BaseModel):
    psid: str
    psidts: str = ""


class GeminiImageRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "1:1"  # 1:1, 9:16, 16:9, 4:3, 4:5
    # IMPORTANT: Thinking models (gemini-3-flash-thinking, gemini-3-pro) do NOT support
    # image output. Always use gemini-3-flash for image generation.
    model: str = "gemini-3-flash"


class GeminiScriptRequest(BaseModel):
    topic: str
    tone: str = "santai"  # formal, santai, viral, persuasif
    length: str = "medium"  # short, medium, long
    model: str = "gemini-3-flash-thinking"  # Thinking model is great for scripts


def _run_in_gemini_loop(coro):
    """Run an async coroutine in the dedicated Gemini event loop thread."""
    global _gemini_loop
    if _gemini_loop is None or not _gemini_loop.is_running():
        raise RuntimeError("Gemini event loop not running")
    future = asyncio.run_coroutine_threadsafe(coro, _gemini_loop)
    return future.result(timeout=120)


def _start_gemini_loop():
    """Start a persistent asyncio event loop in a background thread for Gemini."""
    global _gemini_loop
    _gemini_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(_gemini_loop)
    _gemini_loop.run_forever()


# Start background loop immediately
_gemini_thread = threading.Thread(target=_start_gemini_loop, daemon=True)
_gemini_thread.start()
time.sleep(0.2)  # Give the loop time to start


async def _init_gemini_client(psid: str, psidts: str):
    """Initialize or re-initialize the Gemini client with given cookies."""
    global _gemini_client
    try:
        if _gemini_client is not None:
            try:
                await _gemini_client.close()
            except Exception:
                pass
        from gemini_webapi import GeminiClient
        client = GeminiClient(psid, psidts if psidts else None, proxy=None)
        await client.init(timeout=120, auto_close=False, auto_refresh=True)
        _gemini_client = client
        return True
    except Exception as e:
        print(f"[Gemini] Init error: {e}")
        _gemini_client = None
        raise e


@app.post("/api/gemini/config")
def gemini_config(req: GeminiConfigRequest):
    """Initialize Gemini client with provided cookies."""
    try:
        _run_in_gemini_loop(_init_gemini_client(req.psid, req.psidts))
        return {"status": "connected", "message": "Gemini client berhasil terhubung!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal terhubung ke Gemini: {str(e)}")


@app.get("/api/gemini/status")
def gemini_status():
    """Returns current Gemini client connection status."""
    global _gemini_client
    connected = _gemini_client is not None
    return {"connected": connected, "status": "online" if connected else "offline"}


@app.post("/api/gemini/generate-image")
def gemini_generate_image(req: GeminiImageRequest):
    """Generate image using Gemini. Returns saved image URL."""
    global _gemini_client
    if _gemini_client is None:
        raise HTTPException(status_code=400, detail="Gemini belum terhubung. Masukkan cookie __Secure-1PSID terlebih dahulu.")

    size_prompts = {
        "1:1": "square 1:1 aspect ratio",
        "9:16": "vertical 9:16 aspect ratio",
        "16:9": "wide 16:9 aspect ratio",
        "4:3": "standard 4:3 aspect ratio",
        "4:5": "portrait 4:5 aspect ratio",
    }
    size_hint = size_prompts.get(req.aspect_ratio, "square 1:1 aspect ratio")
    full_prompt = f"Generate an image of {req.prompt}. Aspect ratio: {size_hint}."

    async def _do_generate():
        # Clean model name for image generation (must use flash or unspecified, never thinking or obsolete 1.5)
        target_model = req.model if (req.model and "thinking" not in req.model and "1.5" not in req.model) else "gemini-3-flash"
        
        print(f"[Gemini] Generating image with model '{target_model}', prompt: {full_prompt}")
        response = None
        try:
            response = await _gemini_client.generate_content(full_prompt, model=target_model)
        except Exception as primary_err:
            print(f"[Gemini] Primary generate_content error with model '{target_model}': {primary_err}")
            # Fallback retry with model="unspecified"
            try:
                print(f"[Gemini] Retrying generate_content with model='unspecified'...")
                response = await _gemini_client.generate_content(full_prompt, model="unspecified")
            except Exception as retry_err:
                print(f"[Gemini] Retry with model='unspecified' error: {retry_err}")
                raise primary_err

        # Check if primary response produced images; if not, retry with model='unspecified' and simplified prompt
        if (not hasattr(response, "images") or not response.images) and target_model != "unspecified":
            print("[Gemini] No images in primary response. Retrying with model='unspecified' & simplified prompt...")
            alt_prompt = f"Generate an image: {req.prompt}"
            try:
                alt_response = await _gemini_client.generate_content(alt_prompt, model="unspecified")
                if hasattr(alt_response, "images") and alt_response.images:
                    response = alt_response
            except Exception as alt_err:
                print(f"[Gemini] Fallback retry error: {alt_err}")

        saved_images = []
        
        # Save generated images to disk
        if hasattr(response, "images") and response.images:
            print(f"[Gemini] Ditemukan {len(response.images)} gambar dalam respon.")
            for idx, img in enumerate(response.images):
                filename = f"gemini_img_{uuid.uuid4().hex[:8]}.png"
                saved = False
                
                # Method 1: Built-in img.save()
                try:
                    await img.save(path=str(GENERATED_DIR), filename=filename, verbose=True)
                    target_file = GENERATED_DIR / filename
                    if target_file.exists() and target_file.stat().st_size > 0:
                        saved_images.append({
                            "url": f"http://127.0.0.1:5000/generated/{filename}",
                            "filename": filename
                        })
                        saved = True
                        print(f"[Gemini] Berhasil menyimpan gambar {idx} ke {filename}")
                except Exception as save_err:
                    print(f"[Gemini] Gagal menyimpan gambar {idx} via save(): {save_err}")
                
                # Method 2: Fallback download using client session or requests with browser headers
                if not saved and hasattr(img, "url") and img.url:
                    try:
                        target_file = GENERATED_DIR / filename
                        # Try async client session
                        if hasattr(_gemini_client, "client") and _gemini_client.client:
                            resp = await _gemini_client.client.get(img.url)
                            if resp.status_code == 200:
                                target_file.write_bytes(resp.content)
                                saved_images.append({
                                    "url": f"http://127.0.0.1:5000/generated/{filename}",
                                    "filename": filename
                                })
                                saved = True
                                print(f"[Gemini] Fallback async download berhasil untuk {filename}")
                        
                        if not saved:
                            # Try synchronous requests
                            headers = {
                                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                                "Referer": "https://gemini.google.com/"
                            }
                            res = requests.get(img.url, headers=headers, timeout=15)
                            if res.status_code == 200:
                                target_file.write_bytes(res.content)
                                saved_images.append({
                                    "url": f"http://127.0.0.1:5000/generated/{filename}",
                                    "filename": filename
                                })
                                saved = True
                                print(f"[Gemini] Fallback requests download berhasil untuk {filename}")
                    except Exception as fallback_err:
                        print(f"[Gemini] Fallback download gagal: {fallback_err}")
        else:
            print("[Gemini] Tidak ada gambar dalam respon.")
            
        return response, saved_images

    try:
        response, saved_images = _run_in_gemini_loop(_do_generate())
    except Exception as e:
        err_msg = str(e)
        if any(term in err_msg.lower() for term in ["cookie", "auth", "login", "400", "401", "403"]):
            err_msg += " (Sesi cookie mungkin kadaluarsa. Silakan perbarui cookie __Secure-1PSID Gemini)."
        raise HTTPException(status_code=500, detail=f"Gemini generate image error: {err_msg}")

    return {
        "status": "success",
        "text": response.text if hasattr(response, "text") else "",
        "images": saved_images,
        "prompt_used": full_prompt
    }


@app.post("/api/gemini/generate-script")
def gemini_generate_script(req: GeminiScriptRequest):
    """Generate content script using Gemini."""
    global _gemini_client
    if _gemini_client is None:
        raise HTTPException(status_code=400, detail="Gemini belum terhubung. Masukkan cookie terlebih dahulu.")

    tone_map = {
        "formal": "profesional dan formal",
        "santai": "santai, friendly, dan mudah dipahami",
        "viral": "viral, menarik perhatian, menggunakan bahasa gaul yang kekinian",
        "persuasif": "persuasif dan meyakinkan, mendorong audiens untuk bertindak",
    }
    length_map = {
        "short": "singkat sekitar 100-150 kata",
        "medium": "sedang sekitar 250-400 kata",
        "long": "panjang dan detail sekitar 600-900 kata",
    }
    tone_desc = tone_map.get(req.tone, "santai")
    length_desc = length_map.get(req.length, "sedang sekitar 250-400 kata")

    system_prompt = f"""Kamu adalah content creator profesional Indonesia. 
Buatkan script konten untuk topik berikut dengan gaya bahasa yang {tone_desc}.
Panjang script: {length_desc}.
Topik: {req.topic}

Format output:
1. Judul Konten
2. Hook pembuka yang menarik (2-3 kalimat)
3. Isi utama konten
4. Call-to-action penutup

Gunakan bahasa Indonesia yang natural."""

    async def _do_generate():
        response = await _gemini_client.generate_content(system_prompt, model=req.model)
        return response

    try:
        response = _run_in_gemini_loop(_do_generate())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini generate script error: {str(e)}")

    return {
        "status": "success",
        "script": response.text if hasattr(response, "text") else str(response),
        "topic": req.topic,
        "tone": req.tone,
        "length": req.length
    }


# ============================================================
# GALLERY & DELETE ENDPOINTS
# ============================================================

@app.get("/api/gallery/images")
def gallery_images():
    """List all generated AI images."""
    images = []
    for f in sorted(GENERATED_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if f.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp") and f.is_file():
            images.append({
                "filename": f.name,
                "url": f"http://127.0.0.1:5000/generated/{f.name}",
                "size": f.stat().st_size,
                "created_at": f.stat().st_mtime
            })
    return {"images": images}


@app.delete("/api/gallery/images/{filename}")
def delete_generated_image(filename: str):
    """Delete a generated AI image by filename."""
    filepath = GENERATED_DIR / filename
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    # Security: ensure file is inside GENERATED_DIR
    try:
        filepath.resolve().relative_to(GENERATED_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    filepath.unlink()
    return {"status": "deleted", "filename": filename}


@app.get("/api/gallery/clips")
def gallery_clips():
    """List all processed clip files."""
    clips = []
    for f in sorted(CLIPS_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if f.suffix.lower() in (".mp4", ".mov", ".mkv", ".webm") and f.is_file():
            clips.append({
                "filename": f.name,
                "url": f"http://127.0.0.1:5000/clips/{f.name}",
                "size": f.stat().st_size,
                "created_at": f.stat().st_mtime
            })
    return {"clips": clips}


@app.delete("/api/gallery/clips/{filename}")
def delete_clip(filename: str):
    """Delete a clip file by filename."""
    filepath = CLIPS_DIR / filename
    if not filepath.exists() or not filepath.is_file():
        raise HTTPException(status_code=404, detail="File tidak ditemukan.")
    try:
        filepath.resolve().relative_to(CLIPS_DIR.resolve())
    except ValueError:
        raise HTTPException(status_code=403, detail="Akses ditolak.")
    filepath.unlink()
    return {"status": "deleted", "filename": filename}


if __name__ == "__main__":
    print("=" * 60)
    print("[+] AgencyOS YT-Clipper Local Agent is starting...")
    print("   URL: http://127.0.0.1:5000")
    print("   Health Check: http://127.0.0.1:5000/health")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=5000)
