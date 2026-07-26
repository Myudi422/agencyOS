@echo off
setlocal enabledelayedexpansion
title AgencyOS YT-Clipper Auto Setup
color 0A

echo ========================================================
echo    AgencyOS YT-Clipper Auto Setup Installer
echo ========================================================
echo.

:: 1. Check Python
echo [1/5] Memeriksa Python...
python --version >nul 2>&1
if !errorlevel! neq 0 (
    echo [!] Python tidak ditemukan. Mengunduh & Menginstall Python otomatis...
    winget install -e --id Python.Python.3.11 --accept-package-agreements --accept-source-agreements
    if !errorlevel! neq 0 (
        echo [X] Gagal install via winget. Silakan install Python 3.11 dari https://python.org
        echo.
        pause
        exit /b 1
    )
    echo [+] Python berhasil terinstall!
) else (
    echo [+] Python terdeteksi.
)

:: 2. Check FFmpeg
echo.
echo [2/5] Memeriksa FFmpeg...
ffmpeg -version >nul 2>&1
if !errorlevel! neq 0 (
    echo [!] FFmpeg tidak ditemukan. Mengunduh & Menginstall FFmpeg otomatis...
    winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
) else (
    echo [+] FFmpeg terdeteksi.
)

:: 3. Install Python Dependencies
echo.
echo [3/5] Menginstal library Python pendukung...
python -m pip install --upgrade pip
python -m pip install fastapi uvicorn requests yt-dlp faster-whisper pydantic

:: 4. Check & Download Agent Script from Raw GitHub
echo.
echo [4/5] Memeriksa script agen lokal...
if not exist yt_clipper_agent.py (
    echo [!] yt_clipper_agent.py tidak ditemukan. Mengunduh dari GitHub raw repository...
    curl -sL "https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py" -o yt_clipper_agent.py
    if not exist yt_clipper_agent.py (
        echo [!] Mencoba via PowerShell...
        powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/Myudi422/agencyOS/main/yt_clipper_agent.py' -OutFile 'yt_clipper_agent.py'"
    )
)

if exist yt_clipper_agent.py (
    echo [+] Script agen yt_clipper_agent.py terverifikasi!
) else (
    echo [X] Gagal mengunduh yt_clipper_agent.py dari GitHub. Pastikan koneksi internet aktif.
    pause
    exit /b 1
)

:: 5. Run Agent
echo.
echo [5/5] Menjalankan Local Engine Server...
echo ========================================================
echo    Server lokal aktif di http://127.0.0.1:5000
echo    Buka/kembali ke dashboard AgencyOS di browser Anda.
echo ========================================================
python yt_clipper_agent.py

echo.
echo [!] Server telah berhenti. Tekan tombol apa saja untuk keluar.
pause
