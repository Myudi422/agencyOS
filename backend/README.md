# AgencyOS Backend Documentation

Dokumentasi lengkap untuk setup lingkungan Python, instalasi dependensi, inisialisasi database, dan menjalankan backend FastAPI AgencyOS.

---

## 📋 Prasyarat (Prerequisites)

- **Python**: v3.10 atau versi lebih baru (Disarankan Python 3.11 - 3.13)
- **Pip**: Versi terbaru
- **OS**: Windows (PowerShell / Command Prompt) / Linux / macOS

---

## 🛠️ Langkah 1: Pindah ke Direktori Backend

Buka terminal (PowerShell) di root proyek `agencyOS`, lalu masuk ke folder `backend`:

```powershell
cd backend
```

---

## 🐍 Langkah 2: Membuat Virtual Environment (`venv`)

Buat folder lingkungan virtual isolasi Python bernama `venv`:

```powershell
python -m venv venv
```

---

## ⚡ Langkah 3: Mengaktifkan Virtual Environment

### **Di Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```
*(Jika muncul error ExecutionPolicy di PowerShell, jalankan `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` terlebih dahulu)*

### **Di Windows (Command Prompt / CMD):**
```cmd
venv\Scripts\activate.bat
```

### **Di Linux / macOS:**
```bash
source venv/bin/activate
```

---

## 📦 Langkah 4: Install Dependensi dengan `pip`

Pastikan virtual environment telah aktif, lalu jalankan perintah instalasi seluruh paket yang ada pada `requirements.txt`:

```powershell
pip install -r requirements.txt
```

*(Opsional) Upgrade `pip` ke versi terbaru:*
```powershell
python -m pip install --upgrade pip
```

---

## 🌱 Langkah 5: Inisialisasi & Seed Database

Jalankan skrip seed untuk membuat struktur tabel database Supabase PostgreSQL dan workspace awal:

### **Dari Folder Root `agencyOS`:**
```powershell
.\backend\venv\Scripts\python -m backend.seed
```

### **Atau Jika Berada di Dalam Folder `backend` (dengan venv aktif):**
```powershell
python -c "from backend.seed import seed_database; seed_database()"
```

---

## 🚀 Langkah 6: Menjalankan Server Backend (FastAPI)

Jalankan server Uvicorn dengan mode hot-reload:

### **Opsi A (Dari Root Directory `agencyOS` - Direkomendasikan):**
```powershell
.\backend\venv\Scripts\uvicorn backend.main:app --reload --port 8000
```

### **Opsi B (Dari Dalam Folder `backend` dengan Venv Aktif):**
```powershell
python -m uvicorn main:app --reload --port 8000
```

---

## 🛑 Langkah 7: Menghentikan Server Backend

- Untuk menghentikan server uvicorn yang sedang berjalan di terminal, tekan **`Ctrl + C`**.
- Jika ingin mematikan proses backend dari terminal PowerShell secara paksa:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

---

## 🌐 Link Akses API

Setelah server FastAPI berjalan di port `8000`:
- **Base Endpoint**: [http://localhost:8000](http://localhost:8000)
- **Swagger Interactive API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Interactive Docs**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
