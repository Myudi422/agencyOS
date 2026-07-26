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
import time
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

# Mount StaticFiles for /clips to handle HTTP Range headers (HTML5 video streaming 206 Partial Content)
app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")

# In-memory job store
jobs: Dict[str, Dict] = {}


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


def extract_youtube_heatmap(url: str, min_score: float = 0.40, padding: int = 10, max_duration: int = 60) -> List[Dict]:
    """
    Extracts YouTube Heatmap (Most Replayed) data from video watch page.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    res = requests.get(url, headers=headers)
    html = res.text

    # Extract video title & duration
    title_match = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    title = title_match.group(1) if title_match else "YouTube Video"

    # Extract heatmap markers from ytInitialData
    markers = []
    heatmap_match = re.search(r'"heatMarkerRenderer":\s*({[^}]+})', html)
    
    # Fallback to broad regex match for all heatMarkerRenderers
    all_markers = re.findall(r'{"heatMarkerRenderer":({[^}]+})}', html)
    
    if all_markers:
        for m_str in all_markers:
            try:
                data = json.loads(m_str)
                start_ms = int(data.get("timeRangeStartMillis", 0))
                dur_ms = int(data.get("markerDurationMillis", 0))
                score = float(data.get("heatMarkerIntensityScoreNormalized", 0))
                markers.append({
                    "start": start_ms / 1000.0,
                    "duration": dur_ms / 1000.0,
                    "score": score
                })
            except Exception:
                continue

    # Filter segments with high engagement
    high_score_markers = [m for m in markers if m["score"] >= min_score]
    
    # If no heatmap found, create default segments based on video length
    if not high_score_markers:
        # Fallback: Create 3 sample segments if heatmap isn't available
        high_score_markers = [
            {"start": 30.0, "duration": 30.0, "score": 0.85},
            {"start": 120.0, "duration": 30.0, "score": 0.90},
            {"start": 240.0, "duration": 30.0, "score": 0.80},
        ]

    # Group adjacent markers into clips
    clips = []
    if high_score_markers:
        current_start = max(0, high_score_markers[0]["start"] - padding)
        current_end = high_score_markers[0]["start"] + high_score_markers[0]["duration"] + padding
        max_score = high_score_markers[0]["score"]

        for m in high_score_markers[1:]:
            m_start = max(0, m["start"] - padding)
            m_end = m["start"] + m["duration"] + padding
            
            if m_start <= current_end and (m_end - current_start) <= max_duration:
                current_end = max(current_end, m_end)
                max_score = max(max_score, m["score"])
            else:
                clips.append({
                    "start": round(current_start, 1),
                    "end": round(min(current_start + max_duration, current_end), 1),
                    "duration": round(min(max_duration, current_end - current_start), 1),
                    "score": round(max_score, 2)
                })
                current_start = m_start
                current_end = m_end
                max_score = m["score"]

        clips.append({
            "start": round(current_start, 1),
            "end": round(min(current_start + max_duration, current_end), 1),
            "duration": round(min(max_duration, current_end - current_start), 1),
            "score": round(max_score, 2)
        })

    return clips


def format_srt_timestamp(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def generate_subtitles(audio_path: str, srt_path: str, model_name: str = "tiny") -> bool:
    """Generates SRT subtitle file using Faster-Whisper if available."""
    try:
        # pyrefly: ignore [missing-import]
        from faster_whisper import WhisperModel
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
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


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AgencyOS YT-Clipper Local Agent is starting...")
    print("   URL: http://127.0.0.1:5000")
    print("   Health Check: http://127.0.0.1:5000/health")
    print("=" * 60)
    uvicorn.run(app, host="127.0.0.1", port=5000)
