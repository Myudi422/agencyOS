"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Scissors, Smartphone, Laptop, CheckCircle2, XCircle, RefreshCw,
  Copy, Download, Terminal, Play, Sparkles, Sliders, AlertTriangle,
  Video, Subtitles, HelpCircle, Layers, Check, ExternalLink, Code2, Cpu, Zap, Folder, FolderOpen,
  Plus, Trash2, Clock, SplitSquareHorizontal, SkipBack, SkipForward, Flag, BookmarkPlus, Clapperboard, Eye,
  Wand2, ImageIcon, FileText, Key, Wifi, WifiOff, Send, RotateCcw
} from "lucide-react";

// YouTube IFrame API global type
declare global {
  interface Window {
    YT: {
      Player: new (el: string | HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(s: number, allowSeek: boolean): void;
  getPlayerState(): number;
  playVideo(): void;
  pauseVideo(): void;
  destroy(): void;
}

interface AgentHealth {
  status: string;
  agent: string;
  version: string;
  clips_directory?: string;
  dependencies: {
    ffmpeg: boolean;
    yt_dlp: boolean;
    faster_whisper: boolean;
    requests: boolean;
  };
  all_ready: boolean;
}

interface ClipResult {
  clip_name: string;
  filename: string;
  url: string;
  start: number;
  end: number;
  duration: number;
  score: number;
}

interface ManualSegment {
  id: string;
  start: string;
  end: string;
  label: string;
}

interface JobStatus {
  job_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  url: string;
  logs: string[];
  clips: ClipResult[];
  error?: string;
}

const AUTO_SETUP_BAT_CODE = `@echo off
setlocal EnableDelayedExpansion

title AgencyOS YT-Clipper Auto Setup
color 0A

REM Selalu pindah ke folder BAT
cd /d "%~dp0"

echo ========================================================
echo    AgencyOS YT-Clipper Auto Setup Installer
echo ========================================================
echo.

:: Cari Python
set "PYTHON_EXE="

for /f "delims=" %%P in ('where python 2^>nul') do (
    set "PYTHON_EXE=%%P"
    goto :python_found
)

echo [X] Python tidak ditemukan.
echo.
echo Menginstall Python...

winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements

for /f "delims=" %%P in ('where python 2^>nul') do (
    set "PYTHON_EXE=%%P"
    goto :python_found
)

echo.
echo Gagal menemukan Python.
pause
exit /b 1

:python_found

echo [+] Python:
echo !PYTHON_EXE!

echo.
echo [2/4] Memeriksa FFmpeg...

ffmpeg -version >nul 2>&1

if errorlevel 1 (
    echo Menginstall FFmpeg...
    winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
) else (
    echo [+] FFmpeg OK
)

echo.
echo [3/4] Install Dependency...

"!PYTHON_EXE!" -m pip install --upgrade pip

"!PYTHON_EXE!" -m pip install fastapi uvicorn requests yt-dlp faster-whisper pydantic

echo.
echo [4/4] Menjalankan Local Engine Server...
echo ========================================================
echo Folder : %CD%
echo Script : %~dp0yt_clipper_agent.py
echo ========================================================

if not exist "%~dp0yt_clipper_agent.py" (
    echo.
    echo Backend belum ada.
    echo Downloading...

    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py' -OutFile '%~dp0yt_clipper_agent.py'"
)

if not exist "%~dp0yt_clipper_agent.py" (
    echo.
    echo Gagal download backend.
    pause
    exit /b 1
)

pushd "%~dp0"

"!PYTHON_EXE!" "%~dp0yt_clipper_agent.py"

set EXITCODE=!ERRORLEVEL!

popd

echo.
echo Server berhenti.
echo Exit Code : !EXITCODE!
pause
`;

export default function YtClipperPage() {
  // Device & Connection State
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const [healthStatus, setHealthStatus] = useState<AgentHealth | null>(null);
  const [connectionState, setConnectionState] = useState<"checking" | "connected" | "disconnected">("checking");
  const [isRefreshingHealth, setIsRefreshingHealth] = useState<boolean>(false);

  // Form Parameters
  const [ytUrl, setYtUrl] = useState<string>("");
  const [cropMode, setCropMode] = useState<number>(1);
  const [useSubtitle, setUseSubtitle] = useState<boolean>(true);
  const [whisperModel, setWhisperModel] = useState<string>("tiny");
  const [minScore, setMinScore] = useState<number>(0.40);
  const [padding, setPadding] = useState<number>(10);
  const [maxDuration, setMaxDuration] = useState<number>(60);
  const [maxClips, setMaxClips] = useState<number>(5);

  // Tab State: heatmap | manual | ai-generate
  const [activeTab, setActiveTab] = useState<"heatmap" | "manual" | "ai-generate">("heatmap");

  // Manual Clip State & Auto Heatmap Timeline
  const [manualUrl, setManualUrl] = useState<string>("");
  const [manualCropMode, setManualCropMode] = useState<number>(1);
  const [manualUseSubtitle, setManualUseSubtitle] = useState<boolean>(true);
  const [manualWhisperModel, setManualWhisperModel] = useState<string>("tiny");
  const [manualSegments, setManualSegments] = useState<ManualSegment[]>([
    { id: "1", start: "", end: "", label: "Klip 1" }
  ]);
  const [heatmapClips, setHeatmapClips] = useState<Array<{ start: number; end: number; duration: number; score: number }>>([]);
  const [heatmapMarkers, setHeatmapMarkers] = useState<Array<{ start: number; duration: number; score: number }>>([]);
  const [isAnalyzingHeatmap, setIsAnalyzingHeatmap] = useState<boolean>(false);

  // YouTube IFrame Player State
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytDivRef = useRef<HTMLDivElement>(null);
  const [ytApiReady, setYtApiReady] = useState<boolean>(false);
  const [ytPlayerReady, setYtPlayerReady] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loadedVideoId, setLoadedVideoId] = useState<string>("");
  const [markingSegId, setMarkingSegId] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Job & Processing State
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Generate State
  const [geminiPsid, setGeminiPsid] = useState<string>("");
  const [geminiPsidts, setGeminiPsidts] = useState<string>("");
  const [geminiConnected, setGeminiConnected] = useState<boolean>(false);
  const [isConnectingGemini, setIsConnectingGemini] = useState<boolean>(false);
  const [aiSubTab, setAiSubTab] = useState<"image" | "script" | "gallery">("image");
  // Image gen state
  const [imagePrompt, setImagePrompt] = useState<string>("");
  const [imageAspect, setImageAspect] = useState<string>("16:9");
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; filename: string }>>([]);
  const [imageGenText, setImageGenText] = useState<string>("");
  // Script gen state
  const [scriptTopic, setScriptTopic] = useState<string>("");
  const [scriptTone, setScriptTone] = useState<string>("santai");
  const [scriptLength, setScriptLength] = useState<string>("medium");
  const [isGeneratingScript, setIsGeneratingScript] = useState<boolean>(false);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [scriptCopied, setScriptCopied] = useState<boolean>(false);
  const [geminiModel, setGeminiModel] = useState<string>("gemini-3-flash"); // for image — flash only
  const [scriptModel, setScriptModel] = useState<string>("gemini-3-flash-thinking"); // for script — can use thinking
  // Gallery state
  const [galleryImages, setGalleryImages] = useState<Array<{ url: string; filename: string; created_at?: number }>>([]);
  const [galleryClips, setGalleryClips] = useState<Array<{ url: string; filename: string; size?: number; created_at?: number }>>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);

  // Detect Mobile User Agent & Screen Width
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = typeof window !== "undefined" ? navigator.userAgent : "";
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(mobileRegex.test(userAgent) || isMobileScreen);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) { setYtApiReady(true); return; }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => setYtApiReady(true);
  }, []);

  // Restore persisted state from localStorage
  useEffect(() => {
    try {
      const savedPsid = localStorage.getItem("tools_geminiPsid") || "";
      const savedPsidts = localStorage.getItem("tools_geminiPsidts") || "";
      const savedScriptModel = localStorage.getItem("tools_scriptModel");
      const savedScript = localStorage.getItem("tools_lastScript") || "";
      const savedConnected = localStorage.getItem("tools_geminiConnected") === "true";
      if (savedPsid) setGeminiPsid(savedPsid);
      if (savedPsidts) setGeminiPsidts(savedPsidts);
      if (savedScriptModel) setScriptModel(savedScriptModel);
      if (savedScript) setGeneratedScript(savedScript);
      if (savedConnected) setGeminiConnected(true);
    } catch {}
  }, []);

  // Persist cookies and model whenever they change
  useEffect(() => {
    try {
      if (geminiPsid) localStorage.setItem("tools_geminiPsid", geminiPsid);
      if (geminiPsidts) localStorage.setItem("tools_geminiPsidts", geminiPsidts);
      localStorage.setItem("tools_scriptModel", scriptModel);
      localStorage.setItem("tools_geminiConnected", geminiConnected ? "true" : "false");
    } catch {}
  }, [geminiPsid, geminiPsidts, scriptModel, geminiConnected]);

  // Extract YouTube video ID from URL
  const extractVideoId = useCallback((url: string): string => {
    const match = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([^&?#\s]{11})/);
    return match ? match[1] : "";
  }, []);

  // Format seconds → mm:ss
  const fmtTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Initialize/destroy YouTube player
  const initPlayer = useCallback((videoId: string) => {
    if (!ytApiReady || !ytDivRef.current) return;
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.destroy(); } catch { }
      ytPlayerRef.current = null;
    }
    ytPlayerRef.current = new window.YT.Player(ytDivRef.current, {
      videoId,
      playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
      events: {
        onReady: (e: { target: YTPlayer }) => {
          setYtPlayerReady(true);
          setDuration(e.target.getDuration());
        },
        onStateChange: (e: { data: number }) => {
          const playing = e.data === 1;
          setIsPlaying(playing);
          if (playing) {
            tickRef.current = setInterval(() => {
              const ct = ytPlayerRef.current?.getCurrentTime() ?? 0;
              setCurrentTime(ct);
            }, 200);
          } else {
            if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
          }
        }
      }
    });
  }, [ytApiReady]);

  // Fetch heatmap analysis for manual timeline view
  const fetchHeatmapForManual = useCallback(async (url: string) => {
    if (!url) return;
    setIsAnalyzingHeatmap(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/heatmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          min_score: minScore,
          padding,
          max_duration: maxDuration,
          video_duration: duration > 0 ? duration : undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.clips) setHeatmapClips(data.clips);
        if (data.markers) setHeatmapMarkers(data.markers);
      }
    } catch (e) {
      console.error("Heatmap fetch error:", e);
    } finally {
      setIsAnalyzingHeatmap(false);
    }
  }, [minScore, padding, maxDuration, duration]);

  // Load player & auto-fetch heatmap when user loads video
  const handleLoadVideo = useCallback(() => {
    const vid = extractVideoId(manualUrl);
    if (!vid) { alert("URL YouTube tidak valid!"); return; }
    setLoadedVideoId(vid);
    setYtPlayerReady(false);
    setCurrentTime(0);
    setDuration(0);
    setManualSegments([{ id: "1", start: "", end: "", label: "Klip 1" }]);
    setHeatmapClips([]);
    setHeatmapMarkers([]);
    initPlayer(vid);
    fetchHeatmapForManual(manualUrl);
  }, [manualUrl, extractVideoId, initPlayer, fetchHeatmapForManual]);

  const importHeatmapToSegments = () => {
    if (heatmapClips.length === 0) return;
    const maxDur = duration > 0 ? duration : Infinity;
    const imported: ManualSegment[] = heatmapClips.map((hc, idx) => {
      const safeEnd = Math.min(hc.end, maxDur);
      const safeStart = Math.min(hc.start, Math.max(0, safeEnd - 1));
      return {
        id: (Date.now() + idx).toString(),
        start: fmtTime(safeStart),
        end: fmtTime(safeEnd),
        label: `Heatmap Peak #${idx + 1} (${Math.round(hc.score * 100)}%)`
      };
    });
    setManualSegments(imported);
  };

  // Mark current time into a segment field
  const markTime = useCallback((segId: string, field: "start" | "end") => {
    const ct = ytPlayerRef.current?.getCurrentTime() ?? 0;
    updateManualSegment(segId, field, fmtTime(ct));
    setMarkingSegId(null);
  }, []);

  // Seek player to segment time
  const seekTo = useCallback((timeStr: string) => {
    const secs = parseTime(timeStr);
    ytPlayerRef.current?.seekTo(secs, true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      try { ytPlayerRef.current?.destroy(); } catch { }
    };
  }, []);

  // Check Gemini connection status on tab open
  useEffect(() => {
    if (activeTab === "ai-generate") {
      fetch("http://127.0.0.1:5000/api/gemini/status")
        .then(r => r.json())
        .then(d => setGeminiConnected(d.connected === true))
        .catch(() => setGeminiConnected(false));
    }
  }, [activeTab]);

  const handleGeminiConnect = async () => {
    if (!geminiPsid.trim()) return;
    setIsConnectingGemini(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/gemini/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ psid: geminiPsid.trim(), psidts: geminiPsidts.trim() })
      });
      if (res.ok) { setGeminiConnected(true); }
      else { const d = await res.json(); alert("Gagal connect Gemini: " + (d.detail || "Unknown error")); }
    } catch { alert("Tidak bisa terhubung ke agent. Pastikan agent berjalan."); }
    finally { setIsConnectingGemini(false); }
  };

  const fetchGallery = async () => {
    setIsLoadingGallery(true);
    try {
      const [imgRes, clipRes] = await Promise.all([
        fetch("http://127.0.0.1:5000/api/gallery/images"),
        fetch("http://127.0.0.1:5000/api/gallery/clips")
      ]);
      if (imgRes.ok) { const d = await imgRes.json(); setGalleryImages(d.images || []); }
      if (clipRes.ok) { const d = await clipRes.json(); setGalleryClips(d.clips || []); }
    } catch { /* silent */ }
    finally { setIsLoadingGallery(false); }
  };

  const handleDeleteGalleryImage = async (filename: string) => {
    if (!confirm(`Hapus gambar "${filename}"?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/gallery/images/${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (res.ok) setGalleryImages(prev => prev.filter(i => i.filename !== filename));
      else alert("Gagal menghapus gambar.");
    } catch { alert("Tidak bisa terhubung ke agent."); }
  };

  const handleDeleteClip = async (filename: string) => {
    if (!confirm(`Hapus klip "${filename}"?`)) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/gallery/clips/${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (res.ok) setGalleryClips(prev => prev.filter(c => c.filename !== filename));
      else alert("Gagal menghapus klip.");
    } catch { alert("Tidak bisa terhubung ke agent."); }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setGeneratedImages([]);
    setImageGenText("");
    try {
      const res = await fetch("http://127.0.0.1:5000/api/gemini/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt.trim(), aspect_ratio: imageAspect, model: geminiModel })
      });
      const data = await res.json();
      if (res.ok) {
        const newImgs: Array<{ url: string; filename: string }> = data.images || [];
        setGeneratedImages(newImgs);
        setImageGenText(data.text || "");
        // Append to gallery
        if (newImgs.length > 0) {
          setGalleryImages(prev => [
            ...newImgs.map(i => ({ ...i, created_at: Date.now() / 1000 })),
            ...prev
          ]);
        }
      } else { alert("Error: " + (data.detail || "Generate gagal")); }
    } catch { alert("Tidak bisa terhubung ke agent."); }
    finally { setIsGeneratingImage(false); }
  };

  const handleGenerateScript = async () => {
    if (!scriptTopic.trim()) return;
    setIsGeneratingScript(true);
    setGeneratedScript("");
    try {
      const res = await fetch("http://127.0.0.1:5000/api/gemini/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: scriptTopic.trim(), tone: scriptTone, length: scriptLength, model: scriptModel })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedScript(data.script || "");
        // Save to localStorage
        try { localStorage.setItem("tools_lastScript", data.script || ""); } catch {}
      }
      else { alert("Error: " + (data.detail || "Generate gagal")); }
    } catch { alert("Tidak bisa terhubung ke agent."); }
    finally { setIsGeneratingScript(false); }
  };

  // Check Local Agent Health
  const checkAgentHealth = async () => {
    setIsRefreshingHealth(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/health", {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const data: AgentHealth = await res.json();
        setHealthStatus(data);
        setConnectionState("connected");
      } else {
        setConnectionState("disconnected");
        setHealthStatus(null);
      }
    } catch (err) {
      setConnectionState("disconnected");
      setHealthStatus(null);
    } finally {
      setIsRefreshingHealth(false);
    }
  };

  // Continuous Auto-polling connection every 2 seconds
  useEffect(() => {
    checkAgentHealth();
    fetchGallery(); // Load gallery on mount
    const interval = setInterval(checkAgentHealth, 2000);
    return () => clearInterval(interval);
  }, []);

  // Poll Job Status when active
  useEffect(() => {
    if (!activeJobId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/status/${activeJobId}`);
        if (res.ok) {
          const statusData: JobStatus = await res.json();
          setJobStatus(statusData);

          if (statusData.status === "completed" || statusData.status === "failed") {
            setIsSubmitting(false);
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error("Failed to poll status", err);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [activeJobId]);

  // Handle Form Submit
  const handleStartClipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) {
      setErrorMessage("Silakan masukkan URL YouTube terlebih dahulu.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setJobStatus(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: ytUrl.trim(),
          crop_mode: cropMode,
          use_subtitle: useSubtitle,
          whisper_model: whisperModel,
          min_score: minScore,
          padding: padding,
          max_duration: maxDuration,
          max_clips: maxClips
        })
      });

      if (!res.ok) {
        throw new Error("Gagal memulai proses pencetakan klip lokal.");
      }

      const data = await res.json();
      setActiveJobId(data.job_id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Terjadi kesalahan saat menghubungkan ke Agent Lokal.");
    }
  };

  const copyDesktopLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Direct 1-Click Download setup_clipper.bat Batch File
  const downloadAutoSetupBat = () => {
    const element = document.createElement("a");
    const file = new Blob([AUTO_SETUP_BAT_CODE], { type: "application/cmd" });
    element.href = URL.createObjectURL(file);
    element.download = "setup_clipper.bat";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleOpenFolder = async () => {
    try {
      await fetch("http://127.0.0.1:5000/api/open-folder", { method: "POST" });
    } catch (err) {
      console.error("Failed to open folder", err);
    }
  };

  // Parse "mm:ss" or plain seconds string → float seconds
  const parseTime = (val: string): number => {
    val = val.trim();
    if (!val) return 0;
    if (val.includes(":")) {
      const parts = val.split(":").map(Number);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parseFloat(val) || 0;
  };

  const addManualSegment = () => {
    const newId = Date.now().toString();
    setManualSegments(prev => [...prev, {
      id: newId,
      start: "",
      end: "",
      label: `Klip ${prev.length + 1}`
    }]);
  };

  const removeManualSegment = (id: string) => {
    setManualSegments(prev => prev.filter(s => s.id !== id));
  };

  const updateManualSegment = (id: string, field: keyof ManualSegment, value: string) => {
    setManualSegments(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleManualClip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) {
      setErrorMessage("Masukkan URL YouTube terlebih dahulu.");
      return;
    }
    const validSegments = manualSegments.filter(s => s.start.trim() && s.end.trim());
    if (validSegments.length === 0) {
      setErrorMessage("Minimal 1 segmen harus memiliki waktu mulai dan akhir.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setJobStatus(null);

    try {
      const res = await fetch("http://127.0.0.1:5000/api/manual-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manualUrl.trim(),
          crop_mode: manualCropMode,
          use_subtitle: manualUseSubtitle,
          whisper_model: manualWhisperModel,
          segments: validSegments.map(s => ({
            start: parseTime(s.start),
            end: parseTime(s.end),
            label: s.label || `Klip`
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActiveJobId(data.job_id);
      } else {
        setErrorMessage(data.detail || "Terjadi kesalahan saat memulai job.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("Tidak dapat terhubung ke agent lokal.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ========================================================= */}
      {/* MOBILE RESTRICTION POPUP MODAL                            */}
      {/* ========================================================= */}
      {isMobile && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-md">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Akses Terbatas
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2 font-['Outfit']">
                Khusus Perangkat Desktop / Laptop
              </h2>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Browser HP/Tablet tidak diizinkan mengeksekusi instalasi Python & FFmpeg. Silakan akses menu ini melalui Komputer atau Laptop.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={copyDesktopLink}
                className="w-full py-2.5 px-4 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 hover:scale-[1.01] transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "Link Tersalin!" : "Salin Link untuk Desktop"}</span>
              </button>

              <Link
                href="/"
                className="block w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* HEADER SECTION                                             */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            <Scissors className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
                YT Heatmap Clipper
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                Semi-Local Client Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ekstraksi klip YouTube 9:16 vertikal otomatis dengan deteksi heatmap paling populer & AI subtitles.
            </p>
          </div>
        </div>

        {/* Local Engine Status Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs ${connectionState === "connected"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : connectionState === "checking"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connectionState === "connected" ? "bg-emerald-400" : "bg-rose-400"
                }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connectionState === "connected" ? "bg-emerald-600" : "bg-rose-600"
                }`}></span>
            </span>
            <span>
              {connectionState === "connected"
                ? "Agent Aktif (127.0.0.1:5000)"
                : connectionState === "checking"
                  ? "Mengecek Agent..."
                  : "Agent Offline (Perlu Setup 1-Klik)"}
            </span>
          </div>

          <button
            onClick={checkAgentHealth}
            disabled={isRefreshingHealth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Cek Ulang Koneksi Agent"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingHealth ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1-CLICK AUTOMATIC SETUP INSTALLER PANEL                    */}
      {/* ========================================================= */}
      {connectionState === "disconnected" && (
        <div className="bg-white rounded-2xl border border-purple-200 p-6 shadow-md space-y-6 animate-in fade-in duration-300">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-purple-900 to-slate-900 text-white rounded-2xl shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                <Zap className="w-6 h-6 text-purple-300 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-extrabold font-['Outfit'] text-white">
                  Installer 1-Klik Otomatis (Auto Download & Setup Python + FFmpeg)
                </h2>
                <p className="text-xs text-purple-200 mt-1">
                  Tidak perlu install manual! Cukup download installer 1-klik di bawah, jalankan sekali, dan sistem akan mengunduh Python, FFmpeg, serta mengaktifkan agent secara otomatis.
                </p>
              </div>
            </div>

            <button
              onClick={downloadAutoSetupBat}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 border border-purple-300/30"
            >
              <Download className="w-4 h-4" />
              <span>Download 1-Click Auto Setup (.bat)</span>
            </button>
          </div>

          {/* AUTO SETUP WORKFLOW STEPS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center">1</div>
              <h3 className="font-bold text-slate-900">Klik "Download Auto Setup"</h3>
              <p className="text-[11px] text-slate-500">
                Unduh file <code>setup_clipper.bat</code> langsung dari tombol di atas ke komputer Anda.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center">2</div>
              <h3 className="font-bold text-slate-900">Double Click `setup_clipper.bat`</h3>
              <p className="text-[11px] text-slate-500">
                Jalankan file tersebut. Script akan mendeteksi & mengunduh Python, FFmpeg, dan library secara otomatis.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center">3</div>
              <h3 className="font-bold text-slate-900">Dashboard Otomatis Terhubung</h3>
              <p className="text-[11px] text-slate-500">
                Sistem akan melakukan auto-detecting setiap 2 detik. Begitu agent aktif, layar ini langsung terbuka!
              </p>
            </div>
          </div>

          {/* Auto Detector Status */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex items-center justify-between text-purple-900">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin" />
              <span>Menunggu `setup_clipper.bat` dijalankan di perangkat lokal Anda...</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
              http://127.0.0.1:5000
            </span>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* CONNECTED STATE: CLIPPER DASHBOARD                        */}
      {/* ========================================================= */}
      {connectionState === "connected" && (
        <div className="space-y-6">

          {/* LOCAL STORAGE DIRECTORY BANNER */}
          {healthStatus && healthStatus.clips_directory && (
            <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-slate-900 block">Folder Penyimpanan Klip (Di Komputer Anda):</span>
                  <code className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate block mt-0.5">
                    {healthStatus.clips_directory}
                  </code>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(healthStatus.clips_directory || "");
                    alert("Path folder berhasil disalin ke clipboard!");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Path</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenFolder}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Buka Folder di PC</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB SWITCHER */}
          <div className="flex flex-wrap items-center gap-4 p-2 bg-slate-100/80 rounded-2xl border border-slate-200/80 w-fit">
            {/* Group 1: YouTube Tools */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-slate-200/60">
              <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider select-none">YouTube</span>
              <button
                type="button"
                onClick={() => { setActiveTab("heatmap"); setJobStatus(null); setActiveJobId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "heatmap"
                    ? "bg-purple-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-purple-700 hover:bg-slate-50"
                  }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto Heatmap
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("manual"); setJobStatus(null); setActiveJobId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "manual"
                    ? "bg-purple-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-purple-700 hover:bg-slate-50"
                  }`}
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
                Manual Editor
              </button>
            </div>

            {/* Group 2: AI Generate */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-xs border border-slate-200/60">
              <span className="text-[10px] font-extrabold text-slate-400 px-2 uppercase tracking-wider select-none">AI Content</span>
              <button
                type="button"
                onClick={() => { setActiveTab("ai-generate"); setJobStatus(null); setActiveJobId(null); }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === "ai-generate"
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs font-extrabold"
                    : "text-slate-600 hover:text-violet-700 hover:bg-slate-50"
                  }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                AI Generate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT 2 COLUMNS: CONFIGURATION FORM */}
            <div className="lg:col-span-2 space-y-6">

              {/* ======= VIDEO CLIP EDITOR PANEL ======= */}
              {/* ======= AI GENERATE PANEL ======= */}
              {activeTab === "ai-generate" && (
                <div className="space-y-5">

                  {/* Header */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-5 rounded-2xl border border-violet-200/80 shadow-xs">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-violet-500/30">
                        <Wand2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">AI Generate — Powered by Gemini</h3>
                        <p className="text-[11px] text-slate-500">Generate gambar & script konten menggunakan Google Gemini via cookie</p>
                      </div>
                      <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border ${geminiConnected ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}>
                        {geminiConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                        {geminiConnected ? "Gemini Terhubung" : "Belum Terhubung"}
                      </div>
                    </div>

                    {/* Cookie Config */}
                    {!geminiConnected && (
                      <div className="space-y-3 p-4 bg-white/70 rounded-xl border border-violet-200/60">
                        <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                          <Key className="w-3.5 h-3.5" />
                          Konfigurasi Cookie Gemini
                        </div>
                        <p className="text-[10px] text-slate-500">Buka <strong>gemini.google.com</strong> → F12 → Network → refresh → copy cookie <code className="bg-slate-100 px-1 rounded">__Secure-1PSID</code> dan <code className="bg-slate-100 px-1 rounded">__Secure-1PSIDTS</code></p>
                        <div className="space-y-2">
                          <input type="password" value={geminiPsid} onChange={e => setGeminiPsid(e.target.value)} placeholder="__Secure-1PSID  (wajib)" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none font-mono" />
                          <input type="password" value={geminiPsidts} onChange={e => setGeminiPsidts(e.target.value)} placeholder="__Secure-1PSIDTS  (opsional)" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none font-mono" />
                          <button type="button" onClick={handleGeminiConnect} disabled={isConnectingGemini || !geminiPsid.trim()} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                            {isConnectingGemini ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menghubungkan...</> : <><Wifi className="w-3.5 h-3.5" /> Connect ke Gemini</>}
                          </button>
                        </div>
                      </div>
                    )}

                    {geminiConnected && (
                      <button type="button" onClick={() => setGeminiConnected(false)} className="text-[10px] text-rose-500 hover:underline flex items-center gap-1">
                        <WifiOff className="w-3 h-3" /> Ganti Cookie / Disconnect
                      </button>
                    )}
                  </div>

                  {/* Sub-tab selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
                      <button type="button" onClick={() => setAiSubTab("image")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${aiSubTab === "image" ? "bg-white text-violet-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                        <ImageIcon className="w-3.5 h-3.5" /> Generate Image
                      </button>
                      <button type="button" onClick={() => setAiSubTab("script")} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${aiSubTab === "script" ? "bg-white text-violet-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                        <FileText className="w-3.5 h-3.5" /> Generate Script
                      </button>
                      <button type="button" onClick={() => { setAiSubTab("gallery"); fetchGallery(); }} className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${aiSubTab === "gallery" ? "bg-white text-violet-700 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>
                        <Folder className="w-3.5 h-3.5" /> Gallery
                        {(galleryImages.length + galleryClips.length) > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-extrabold">{galleryImages.length + galleryClips.length}</span>}
                      </button>
                    </div>

                    {aiSubTab === "image" && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-xl border border-violet-200">
                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Model Gambar:</span>
                        <span className="text-xs font-extrabold text-violet-800">Gemini 1.5 Flash (Image Engine)</span>
                      </div>
                    )}
                    {aiSubTab === "script" && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model:</span>
                        <select value={scriptModel} onChange={e => setScriptModel(e.target.value)} className="bg-transparent border-none text-xs font-extrabold text-violet-700 focus:outline-none cursor-pointer">
                          <option value="gemini-3-flash-thinking">Flash Thinking ✦ (Rekomendasi)</option>
                          <option value="gemini-3-flash">Gemini 1.5 Flash</option>
                          <option value="gemini-3-pro">Gemini 1.5 Pro</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* ── Generate Image ── */}
                  {aiSubTab === "image" && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-violet-600" />
                        <h4 className="text-sm font-bold text-slate-900">Generate Image dengan Gemini</h4>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Deskripsi Gambar</label>
                        <textarea rows={4} value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Contoh: Seorang pria muda berpakaian kasual sedang tersenyum menatap kamera dengan latar belakang studio bersih berwarna putih, pencahayaan profesional..." className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none resize-none" />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Ukuran / Rasio Gambar</label>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { val: "1:1", label: "1:1", desc: "Square" },
                            { val: "16:9", label: "16:9", desc: "YouTube" },
                            { val: "9:16", label: "9:16", desc: "TikTok" },
                            { val: "4:5", label: "4:5", desc: "Instagram" },
                            { val: "4:3", label: "4:3", desc: "Standard" },
                          ].map(r => (
                            <button key={r.val} type="button" onClick={() => setImageAspect(r.val)} className={`p-2.5 rounded-xl border text-center transition-all ${imageAspect === r.val ? "bg-violet-50 border-violet-300 text-violet-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                              <div className="text-xs font-extrabold">{r.label}</div>
                              <div className="text-[10px] text-slate-400">{r.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImage || !geminiConnected || !imagePrompt.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                        {isGeneratingImage ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating Image...</> : <><Sparkles className="w-4 h-4" />Generate Image dengan Gemini</>}
                      </button>

                      {!geminiConnected && <p className="text-[11px] text-center text-rose-500">Hubungkan Gemini terlebih dahulu di atas</p>}

                      {/* Image Results */}
                      {imageGenText && <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-xs text-violet-800 leading-relaxed">{imageGenText}</div>}

                      {generatedImages.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-700">{generatedImages.length} Gambar Dihasilkan:</p>
                          <div className="grid grid-cols-2 gap-3">
                            {generatedImages.map((img, i) => (
                              <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                                <img src={img.url} alt={`Generated ${i + 1}`} className="w-full h-48 object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a href={img.url} download={img.filename} className="px-3 py-1.5 rounded-lg bg-white text-slate-800 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-100">
                                    <Download className="w-3 h-3" /> Download
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Generate Script Konten ── */}
                  {aiSubTab === "script" && (
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-600" />
                        <h4 className="text-sm font-bold text-slate-900">Generate Script Konten dengan Gemini</h4>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">Topik / Brief Konten</label>
                        <textarea rows={3} value={scriptTopic} onChange={e => setScriptTopic(e.target.value)} placeholder="Contoh: Tips memulai bisnis online dari nol untuk pemula..." className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-violet-400 focus:border-violet-400 outline-none resize-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Gaya Bahasa (Tone)</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { val: "santai", label: "Santai" },
                              { val: "formal", label: "Formal" },
                              { val: "viral", label: "Viral" },
                              { val: "persuasif", label: "Persuasif" },
                            ].map(t => (
                              <button key={t.val} type="button" onClick={() => setScriptTone(t.val)} className={`py-1.5 rounded-lg border text-[11px] font-bold transition-all ${scriptTone === t.val ? "bg-violet-50 border-violet-300 text-violet-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>{t.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">Panjang Script</label>
                          <div className="flex flex-col gap-1.5">
                            {[
                              { val: "short", label: "Pendek", desc: "~100-150 kata" },
                              { val: "medium", label: "Sedang", desc: "~250-400 kata" },
                              { val: "long", label: "Panjang", desc: "~600-900 kata" },
                            ].map(l => (
                              <button key={l.val} type="button" onClick={() => setScriptLength(l.val)} className={`px-3 py-1.5 rounded-lg border text-left text-[11px] font-bold transition-all flex justify-between ${scriptLength === l.val ? "bg-violet-50 border-violet-300 text-violet-800" : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                <span>{l.label}</span><span className="font-normal text-slate-400">{l.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={handleGenerateScript} disabled={isGeneratingScript || !geminiConnected || !scriptTopic.trim()} className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed transition-all">
                        {isGeneratingScript ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating Script...</> : <><Send className="w-4 h-4" />Generate Script dengan Gemini</>}
                      </button>

                      {!geminiConnected && <p className="text-[11px] text-center text-rose-500">Hubungkan Gemini terlebih dahulu di atas</p>}

                      {/* Script Result */}
                      {generatedScript && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700">Hasil Script:</p>
                            <button type="button" onClick={() => { navigator.clipboard.writeText(generatedScript); setScriptCopied(true); setTimeout(() => setScriptCopied(false), 2000); }} className="px-3 py-1 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 text-[11px] font-bold flex items-center gap-1.5 transition-colors">
                              {scriptCopied ? <><Check className="w-3 h-3" />Disalin!</> : <><Copy className="w-3 h-3" />Copy Script</>}
                            </button>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                            {generatedScript}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* ── Gallery ── */}
                  {aiSubTab === "gallery" && (
                    <div className="space-y-5">

                      {/* AI Images Gallery */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-violet-600" />
                            <h4 className="text-sm font-bold text-slate-900">Galeri AI Image</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-extrabold border border-violet-200/60">{galleryImages.length} file</span>
                          </div>
                          <button type="button" onClick={fetchGallery} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Refresh gallery">
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGallery ? "animate-spin" : ""}`} />
                          </button>
                        </div>
                        {galleryImages.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Belum ada gambar yang di-generate.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {galleryImages.map((img, i) => (
                              <div key={img.filename + i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-50">
                                <img src={img.url} alt={img.filename} className="w-full h-44 object-cover" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.png"; }} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a href={img.url} download={img.filename} className="px-2.5 py-1.5 rounded-lg bg-white text-slate-800 text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100">
                                    <Download className="w-3 h-3" /> Download
                                  </a>
                                  <button type="button" onClick={() => handleDeleteGalleryImage(img.filename)} className="px-2.5 py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-rose-600">
                                    <Trash2 className="w-3 h-3" /> Hapus
                                  </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                  <p className="text-[9px] text-white/80 truncate font-mono">{img.filename}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Clips Gallery */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-purple-600" />
                            <h4 className="text-sm font-bold text-slate-900">Galeri Video Klip</h4>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-extrabold border border-purple-200/60">{galleryClips.length} klip</span>
                          </div>
                        </div>
                        {galleryClips.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Belum ada klip yang diproses.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {galleryClips.map((clip, i) => (
                              <div key={clip.filename + i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-purple-200 hover:bg-purple-50/30 transition-all group">
                                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                  <Video className="w-4.5 h-4.5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-800 truncate">{clip.filename}</p>
                                  {clip.size && <p className="text-[10px] text-slate-400">{(clip.size / (1024 * 1024)).toFixed(1)} MB</p>}
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <a href={clip.url} download={clip.filename} className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-bold flex items-center gap-1 transition-colors">
                                    <Download className="w-3 h-3" /> Download
                                  </a>
                                  <button type="button" onClick={() => handleDeleteClip(clip.filename)} className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-600 text-[10px] font-bold flex items-center gap-1 transition-colors">
                                    <Trash2 className="w-3 h-3" /> Hapus
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "manual" && (
                <div className="space-y-4">

                  {/* ── Header & URL Input ── */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Clapperboard className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 font-['Outfit']">Video Clip Editor</h3>
                        <p className="text-[11px] text-slate-500">Tonton video, tandai titik mulai & akhir langsung saat diputar — tanpa download penuh.</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500">
                          <Video className="w-4 h-4" />
                        </div>
                        <input
                          type="url"
                          value={manualUrl}
                          onChange={(e) => setManualUrl(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLoadVideo(); } }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleLoadVideo}
                        disabled={!ytApiReady || !manualUrl.trim()}
                        className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Load Video
                      </button>
                    </div>
                  </div>

                  {/* ── Embedded YouTube Player ── */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                    <div className="relative" style={{ paddingBottom: "56.25%" }}>
                      <div ref={ytDivRef} className="absolute inset-0 w-full h-full" />
                      {!loadedVideoId && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
                          <Play className="w-12 h-12 opacity-30" />
                          <span className="text-xs">Masukkan URL YouTube & klik Load Video</span>
                        </div>
                      )}
                    </div>

                    {/* Player Controls Bar */}
                    {ytPlayerReady && duration > 0 && (
                      <div className="px-4 py-3 space-y-3 border-t border-slate-700">
                        {/* Auto Heatmap Visual Timeline Bar */}
                        <div className="space-y-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700/80">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-amber-400">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                              Auto Heatmap Visual Timeline (Spot Paling Populer)
                              {isAnalyzingHeatmap && <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />}
                            </span>

                            {heatmapClips.length > 0 && (
                              <button
                                type="button"
                                onClick={importHeatmapToSegments}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold transition-all text-[10px] flex items-center gap-1 shadow-sm shrink-0"
                              >
                                ⚡ Import {heatmapClips.length} Segmen Heatmap ke Daftar Edit
                              </button>
                            )}
                          </div>

                          {/* Quick Heatmap Duration Controls */}
                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/60 text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-medium">Max Klip (Detik):</span>
                              <input
                                type="number"
                                min={15} max={180} step={5}
                                value={maxDuration}
                                onChange={(e) => setMaxDuration(Number(e.target.value))}
                                className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold mt-0.5"
                              />
                            </div>

                            <div>
                              <span className="text-slate-400 block font-medium">Padding (Detik):</span>
                              <input
                                type="number"
                                min={0} max={30} step={1}
                                value={padding}
                                onChange={(e) => setPadding(Number(e.target.value))}
                                className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold mt-0.5"
                              />
                            </div>

                            <div>
                              <span className="text-slate-400 block font-medium">Min Score Heatmap:</span>
                              <input
                                type="number"
                                min={0.1} max={0.9} step={0.05}
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                className="w-full px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-amber-300 font-mono font-bold mt-0.5"
                              />
                            </div>
                          </div>

                          {/* Reload heatmap with updated duration */}
                          <div className="flex justify-end pt-0.5">
                            <button
                              type="button"
                              onClick={() => fetchHeatmapForManual(manualUrl)}
                              disabled={isAnalyzingHeatmap || !manualUrl}
                              className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${isAnalyzingHeatmap ? "animate-spin" : ""}`} />
                              <span>Hitung Ulang Durasi Heatmap</span>
                            </button>
                          </div>

                          {/* Heatmap intensity track */}
                          <div className="relative h-2.5 bg-slate-900 rounded-full overflow-hidden flex items-center mt-1">
                            {heatmapMarkers.length > 0 ? (
                              heatmapMarkers.map((m, i) => {
                                const leftPct = (m.start / duration) * 100;
                                const widthPct = Math.max(0.6, (m.duration / duration) * 100);
                                const alpha = Math.max(0.4, m.score);
                                return (
                                  <div
                                    key={i}
                                    className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-400 to-rose-400 transition-all cursor-pointer hover:brightness-125"
                                    style={{
                                      left: `${leftPct}%`,
                                      width: `${widthPct}%`,
                                      opacity: alpha
                                    }}
                                    title={`Heatmap Peak @ ${fmtTime(m.start)} (Engagement: ${Math.round(m.score * 100)}%)`}
                                    onClick={() => {
                                      setCurrentTime(m.start);
                                      ytPlayerRef.current?.seekTo(m.start, true);
                                    }}
                                  />
                                );
                              })
                            ) : (
                              <div className="text-[9px] text-slate-500 text-center w-full">
                                {isAnalyzingHeatmap ? "Menganalisis data heatmap..." : "Tidak ada data heatmap/fallback"}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Player scrubber */}
                        <div className="relative h-6 group">
                          {/* Track */}
                          <div className="absolute top-2 left-0 right-0 h-2 bg-slate-700 rounded-full overflow-hidden">
                            {/* Progress */}
                            <div
                              className="h-full bg-purple-500 transition-none"
                              style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                            {/* Manual segment markers overlay */}
                            {manualSegments.map((seg, i) => {
                              const s = parseTime(seg.start);
                              const e = parseTime(seg.end);
                              if (!seg.start || !seg.end || s >= e) return null;
                              const colors = ["bg-emerald-400", "bg-amber-400", "bg-rose-400", "bg-cyan-400", "bg-pink-400"];
                              return (
                                <div
                                  key={seg.id}
                                  className={`absolute top-0 h-full opacity-70 ${colors[i % colors.length]}`}
                                  style={{ left: `${(s / duration) * 100}%`, width: `${((e - s) / duration) * 100}%` }}
                                />
                              );
                            })}
                          </div>
                          {/* Clickable seek range */}
                          <input
                            type="range"
                            min={0} max={duration} step={0.5}
                            value={currentTime}
                            onChange={(ev) => {
                              const t = Number(ev.target.value);
                              setCurrentTime(t);
                              ytPlayerRef.current?.seekTo(t, true);
                            }}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="text-purple-400 font-bold text-xs">{fmtTime(currentTime)}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => ytPlayerRef.current?.seekTo(Math.max(0, currentTime - 5), true)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"><SkipBack className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => ytPlayerRef.current?.seekTo(Math.min(duration, currentTime + 5), true)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"><SkipForward className="w-3.5 h-3.5" /></button>
                          </div>
                          <span>{fmtTime(duration)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Segment Marker List ── */}
                  {loadedVideoId && (
                    <form onSubmit={handleManualClip} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Flag className="w-3.5 h-3.5 text-purple-600" />
                            Segmen Klip ({manualSegments.length}/10)
                          </label>
                          {ytPlayerReady && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold">
                              ▶ Live @ {fmtTime(currentTime)}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={addManualSegment}
                          disabled={manualSegments.length >= 10}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 text-[11px] font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                          Tambah Segmen
                        </button>
                      </div>

                      {/* Segment rows */}
                      <div className="space-y-2.5">
                        {manualSegments.map((seg, idx) => {
                          const startSec = parseTime(seg.start);
                          const endSec = parseTime(seg.end);
                          const dur = seg.start && seg.end ? Math.max(0, endSec - startSec) : null;
                          const colors = ["border-emerald-300 bg-emerald-50", "border-amber-300 bg-amber-50", "border-rose-300 bg-rose-50", "border-cyan-300 bg-cyan-50", "border-pink-300 bg-pink-50"];
                          const dotColors = ["bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-pink-500"];

                          return (
                            <div key={seg.id} className={`p-3 rounded-xl border ${colors[idx % colors.length]} space-y-2`}>
                              {/* Segment header */}
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full ${dotColors[idx % dotColors.length]} text-white text-[10px] font-extrabold flex items-center justify-center shrink-0`}>{idx + 1}</span>
                                <input
                                  type="text"
                                  value={seg.label}
                                  onChange={(e) => updateManualSegment(seg.id, "label", e.target.value)}
                                  placeholder="Nama klip"
                                  className="flex-1 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-white/80 bg-white focus:ring-1 focus:ring-purple-400 outline-none"
                                />
                                {dur !== null && (
                                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border shrink-0">
                                    {dur.toFixed(0)}s
                                  </span>
                                )}
                                {manualSegments.length > 1 && (
                                  <button type="button" onClick={() => removeManualSegment(seg.id)} className="p-1 rounded-lg hover:bg-red-100 hover:text-red-500 text-slate-400 transition-colors shrink-0">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              {/* Time inputs + mark buttons */}
                              <div className="grid grid-cols-2 gap-2">
                                {/* Start */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                    Mulai
                                  </span>
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={seg.start}
                                      onChange={(e) => updateManualSegment(seg.id, "start", e.target.value)}
                                      placeholder="mm:ss"
                                      className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-white/80 bg-white focus:ring-1 focus:ring-green-400 outline-none font-mono min-w-0"
                                    />
                                    {ytPlayerReady && (
                                      <button
                                        type="button"
                                        onClick={() => markTime(seg.id, "start")}
                                        title="Tandai waktu saat ini sebagai Mulai"
                                        className="px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold transition-colors shrink-0"
                                      >
                                        ▶ Mark
                                      </button>
                                    )}
                                  </div>
                                  {seg.start && (
                                    <button type="button" onClick={() => seekTo(seg.start)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5">
                                      <SkipBack className="w-2.5 h-2.5" /> Seek ke sini
                                    </button>
                                  )}
                                </div>

                                {/* End */}
                                <div className="space-y-1">
                                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                                    Akhir
                                  </span>
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      value={seg.end}
                                      onChange={(e) => updateManualSegment(seg.id, "end", e.target.value)}
                                      placeholder="mm:ss"
                                      className="flex-1 px-2.5 py-1.5 text-[11px] rounded-lg border border-white/80 bg-white focus:ring-1 focus:ring-red-400 outline-none font-mono min-w-0"
                                    />
                                    {ytPlayerReady && (
                                      <button
                                        type="button"
                                        onClick={() => markTime(seg.id, "end")}
                                        title="Tandai waktu saat ini sebagai Akhir"
                                        className="px-2 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold transition-colors shrink-0"
                                      >
                                        ⏹ Mark
                                      </button>
                                    )}
                                  </div>
                                  {seg.end && (
                                    <button type="button" onClick={() => seekTo(seg.end)} className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5">
                                      <SkipForward className="w-2.5 h-2.5" /> Seek ke sini
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Quick Preset Durations */}
                              <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/80">
                                <span className="text-[10px] text-slate-500 font-semibold">Atur Durasi Klip:</span>
                                {[15, 30, 45, 60].map((durSec) => (
                                  <button
                                    key={durSec}
                                    type="button"
                                    onClick={() => {
                                      const startSec = parseTime(seg.start) || 0;
                                      updateManualSegment(seg.id, "end", fmtTime(startSec + durSec));
                                    }}
                                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-slate-200/80 shadow-2xs transition-colors"
                                    title={`Set durasi klip menjadi ${durSec} detik dari waktu mulai`}
                                  >
                                    {durSec}s
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Crop Mode */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">Mode Crop Output</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { val: 1, label: "Center 9:16", desc: "Default" },
                            { val: 2, label: "Split Kiri", desc: "Facecam kiri" },
                            { val: 3, label: "Split Kanan", desc: "Facecam kanan" },
                          ].map((m) => (
                            <button
                              key={m.val}
                              type="button"
                              onClick={() => setManualCropMode(m.val)}
                              className={`p-2 rounded-xl border text-center transition-all ${manualCropMode === m.val
                                  ? "bg-purple-50 border-purple-300 text-purple-800"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                            >
                              <div className="text-[11px] font-bold">{m.label}</div>
                              <div className="text-[10px] text-slate-400">{m.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Manual Mode AI Subtitle Configuration */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Subtitles className="w-4 h-4 text-purple-600" />
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">AI Auto Subtitle (Faster-Whisper)</h4>
                              <p className="text-[11px] text-slate-500">Otomatis tempel teks subtitle pada klip manual</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={manualUseSubtitle}
                              onChange={(e) => setManualUseSubtitle(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        {manualUseSubtitle && (
                          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-4">
                            <label className="text-xs font-medium text-slate-700">Model Whisper:</label>
                            <select
                              value={manualWhisperModel}
                              onChange={(e) => setManualWhisperModel(e.target.value)}
                              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                            >
                              <option value="tiny">Tiny (~75 MB - Paling Cepat)</option>
                              <option value="base">Base (~140 MB - Cepat)</option>
                              <option value="small">Small (~460 MB - Seimbang)</option>
                              <option value="medium">Medium (~1.5 GB - Paling Akurat)</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {errorMessage && (
                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {errorMessage}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                      >
                        {isSubmitting ? (
                          <><RefreshCw className="w-4 h-4 animate-spin" /><span>Memproses {manualSegments.filter(s => s.start && s.end).length} Klip...</span></>
                        ) : (
                          <><Scissors className="w-4 h-4" /><span>Render {manualSegments.filter(s => s.start && s.end).length} Klip Sekarang →</span></>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {activeTab === "heatmap" && (
                <form onSubmit={handleStartClipping} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">

                  {/* URL Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                      <span>URL Video YouTube</span>
                      <span className="text-[11px] font-normal text-slate-400">Standard / Shorts Video</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-rose-500">
                        <Video className="w-4 h-4" />
                      </div>
                      <input
                        type="url"
                        value={ytUrl}
                        onChange={(e) => setYtUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setYtUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-semibold text-slate-700 transition-colors"
                      >
                        Contoh Demo
                      </button>
                    </div>
                  </div>

                  {/* Crop Mode Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      <span>Pilih Mode Cropping 9:16 Vertikal</span>
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Mode 1 */}
                      <div
                        onClick={() => setCropMode(1)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${cropMode === 1
                            ? "bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">1. Center Crop</span>
                          {cropMode === 1 && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Krop tengah fokus utama. Sangat cocok untuk Podcast & Vlog.
                        </p>
                      </div>

                      {/* Mode 2 */}
                      <div
                        onClick={() => setCropMode(2)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${cropMode === 2
                            ? "bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">2. Split Left</span>
                          {cropMode === 2 && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Atas: Konten, Bawah: Facecam Kiri Bawah (Gaming Streamer).
                        </p>
                      </div>

                      {/* Mode 3 */}
                      <div
                        onClick={() => setCropMode(3)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${cropMode === 3
                            ? "bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">3. Split Right</span>
                          {cropMode === 3 && <CheckCircle2 className="w-4 h-4 text-purple-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Atas: Konten, Bawah: Facecam Kanan Bawah (Gaming Streamer).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Configuration */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Subtitles className="w-4 h-4 text-purple-600" />
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">AI Auto Subtitle (Faster-Whisper)</h4>
                          <p className="text-[11px] text-slate-500">Otomatis menembel teks subtitle pada video</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useSubtitle}
                          onChange={(e) => setUseSubtitle(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>

                    {useSubtitle && (
                      <div className="pt-2 border-t border-slate-200/80 flex items-center gap-4">
                        <label className="text-xs font-medium text-slate-700">Model Whisper:</label>
                        <select
                          value={whisperModel}
                          onChange={(e) => setWhisperModel(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-600"
                        >
                          <option value="tiny">Tiny (~75 MB - Paling Cepat)</option>
                          <option value="base">Base (~140 MB - Cepat)</option>
                          <option value="small">Small (~460 MB - Seimbang)</option>
                          <option value="medium">Medium (~1.5 GB - Paling Akurat)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Advanced Parameters */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Padding (Detik)</label>
                      <input
                        type="number"
                        value={padding}
                        onChange={(e) => setPadding(Number(e.target.value))}
                        min={0} max={30}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Max Clip (Detik)</label>
                      <input
                        type="number"
                        value={maxDuration}
                        onChange={(e) => setMaxDuration(Number(e.target.value))}
                        min={15} max={180}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Min Score Heatmap</label>
                      <input
                        type="number"
                        step="0.05"
                        value={minScore}
                        onChange={(e) => setMinScore(Number(e.target.value))}
                        min={0.1} max={0.9}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Maksimal Hasil Klip</label>
                      <input
                        type="number"
                        value={maxClips}
                        onChange={(e) => setMaxClips(Number(e.target.value))}
                        min={1} max={10}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Submit CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 hover:scale-[1.005] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sedang Memproses Klip Video...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Heatmap Clips Now</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* RIGHT 1 COLUMN: LIVE STATUS & SYSTEM INFOS */}

            <div className="space-y-6">

              {/* Realtime Job Progress Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-600" />
                  <span>Realtime Execution Log</span>
                </h3>

                {jobStatus ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-700 capitalize">Status: {jobStatus.status}</span>
                        <span className="text-purple-600 font-mono">{jobStatus.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-purple-600 h-full transition-all duration-300"
                          style={{ width: `${jobStatus.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Terminal Log Output */}
                    <div className="bg-slate-900 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                      {jobStatus.logs.map((log, i) => (
                        <p key={i} className="leading-tight">
                          <span className="text-purple-400">&gt;</span> {log}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                    <Scissors className="w-8 h-8 opacity-40" />
                    <p className="text-xs">Belum ada tugas pencetakan yang berjalan.</p>
                    <p className="text-[10px] text-slate-400">Masukkan URL YouTube di sebelah kiri lalu klik tombol Generate.</p>
                  </div>
                )}
              </div>

              {/* Agent Info Card */}
              {healthStatus && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Status System & Auto Dependencies Check</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">FFmpeg (Video Crop)</span>
                      <span className={`font-bold ${healthStatus.dependencies.ffmpeg ? "text-emerald-600" : "text-rose-500"}`}>
                        {healthStatus.dependencies.ffmpeg ? "Terdeteksi ✅" : "Missing ❌"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">yt-dlp (Downloader)</span>
                      <span className={`font-bold ${healthStatus.dependencies.yt_dlp ? "text-emerald-600" : "text-rose-500"}`}>
                        {healthStatus.dependencies.yt_dlp ? "Terdeteksi ✅" : "Missing ❌"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Faster-Whisper (AI Sub)</span>
                      <span className={`font-bold ${healthStatus.dependencies.faster_whisper ? "text-emerald-600" : "text-amber-500"}`}>
                        {healthStatus.dependencies.faster_whisper ? "Terdeteksi ✅" : "Optional ⚠️"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESULTS GALLERY: GENERATED CLIPS                          */}
      {/* ========================================================= */}
      {jobStatus && jobStatus.clips && jobStatus.clips.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-['Outfit'] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Hasil Klip Video Vertikal ({jobStatus.clips.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Klip siap diunggah ke YouTube Shorts, Instagram Reels, atau TikTok.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
            {jobStatus.clips.map((clip, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden space-y-3 p-3 flex flex-col justify-between">

                {/* HTML5 Video Preview */}
                <div className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-sm">
                  <video
                    src={clip.url}
                    controls
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-bold text-white">
                    Score: {(clip.score * 100).toFixed(0)}% 🔥
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{clip.clip_name}</h4>
                  <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                    <span>{clip.start}s - {clip.end}s</span>
                    <span>{clip.duration}s</span>
                  </div>
                </div>

                {/* Direct Local Download Button */}
                <a
                  href={clip.url}
                  download={clip.filename}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
