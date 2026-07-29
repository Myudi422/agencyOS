# Shiera - Landing Page & Design System Blueprint (`landingpage.md`)

Dokumen ini berisi **panduan desain visual bergaya Airbnb (Airbnb Design System)** yang disesuaikan dengan **Palet Warna Ungu (Shiera Purple Palette)**, lengkap dengan **strategi SEO, struktur copywriting landing page, serta spesifikasi komponen UI**.

---

## 🎨 1. Shiera Airbnb Design System (Purple Edition)

Konsep desain Shiera mengadaptasi filosofi Airbnb: **Clean White Canvas, Typography Modest & Human, Generous Whitespace, serta Soft Rounded Corners** dengan aksen tunggal **Electric Purple** (menggantikan warna Rausch Airbnb).

### A. Design Tokens & Color Palette

```yaml
design_system:
  name: Shiera Airbnb Purple Edition
  canvas: "#ffffff" # Clean White Canvas dasar
  
  colors:
    primary: "#7c3aed" # Electric Purple (Warna utama CTA, Search Orb, active badges)
    primary-hover: "#6d28d9" # Deep Purple untuk hover state
    primary-active: "#5b21b6" # Dark Purple state press/active
    primary-soft: "#f3e8ff" # Soft Lavender fill untuk highlight & badge background
    primary-border: "#ddd6fe" # Soft Purple hairline border
    
    ink: "#0f172a" # Deep Slate (Judul, headline, & teks utama - bukan hitam pekat)
    body: "#334155" # Slate Body text (Keterangan, deskripsi fitur)
    muted: "#64748B" # Muted slate (Sub-label, tanggal, placeholder)
    hairline: "#e2e8f0" # 1px divider hairline & border card
    hairline-soft: "#f1f5f9" # Surface divider sangat halus
    surface-soft: "#f8fafc" # Background filter band & hover state
    surface-card: "#ffffff" # Pure white card surface
    
    star-rating: "#0f172a" # Rating star & score (Gaya Airbnb: Menggunakan warna ink, bukan kuning)
    badge-new: "#7c3aed" # Purple text untuk NEW badges

  rounded:
    xs: "4px"
    sm: "8px" # Button standar & form input
    md: "16px" # Feature card & image corner clipping
    lg: "24px" # Section container & modal card
    full: "9999px" # Pill search bar, category pills, search orb, badges

  typography:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    display-xl: "28px / Weight 700 / Line-height 1.3" # Hero H1
    display-lg: "22px / Weight 600 / Line-height 1.3" # Section H2
    display-md: "18px / Weight 600 / Line-height 1.4" # Feature Card Title
    rating-display: "64px / Weight 700 / Line-height 1.1" # Airbnb Laurel Rating Display
    body-md: "16px / Weight 400 / Line-height 1.5" # Body text
    body-sm: "14px / Weight 400 / Line-height 1.4" # Meta text & captions
    button-md: "15px / Weight 500 / Line-height 1.2" # Primary CTA
    badge: "11px / Weight 600 / Line-height 1.2" # Floating badge label

  elevation:
    flat: "none"
    card-hover: "box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(124, 58, 237, 0.08)"
    pill-search: "box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04)"
```

---

## 🔍 2. Component Design Specifications (Airbnb Style)

### 1. Global Pill Search Bar (`search-bar-pill`)
* **Tampilan**: Floating bar berbentuk kapsul (`rounded-full`) dengan border hairline halus (`#e2e8f0`) dan bayangan lembut.
* **Segmen**: Terbagi menjadi 3 area interaktif:
  1. *Mau posting ke mana?* (Pilih Klien / Workspace)
  2. *Channel apa?* (Instagram, TikTok, FB, LinkedIn, RSS)
  3. *Tipe Solusi?* (Scheduler, KOL, Competitor Spy)
* **Search Orb (Tombol Cari)**: Lingkaran penuh 48x48px berwarna **Electric Purple (`#7c3aed`)** dengan ikon Magnifying Glass / Arrow putih di sisi paling kanan.

### 2. Category Pill Strip Filter (`category-strip`)
* Navigasi pill horizontal yang dapat di-scroll: `All Solutions`, `Social Scheduler`, `KOL Manager`, `News Publisher`, `Competitor Spy`, `Hashtag Saved`, `AI Clipper`.
* Pill aktif memiliki background **Purple Soft (`#f3e8ff`)** dengan teks **Primary Purple (`#7c3aed`)** dan border **Purple (`#7c3aed`)**.

### 3. Feature Cards (Property Card Style)
* Ratio gambar/mockup **1:1 atau 4:3** dengan rounded corner halus (`16px`).
* **Floating Badge (Top Left)**: Kapsul putih mengambang dengan teks seperti `"TOP CHOICE"`, `"AI POWERED"`, atau `"NEW"`.
* **Wishlist Heart Icon (Top Right)**: Tombol lingkaran kecil untuk menyimpan/bookmark fitur favorit pengguna.
* **Teks Card**: 
  * Judul Fitur (`16px / Weight 600`)
  * Deskripsi Meta Singkat (`14px / Muted`)
  * Metric Highlight (`Rp 0 / Effortless` atau `Efficiency +10x`).

### 4. Airbnb Rating Banner & Testimonial Display
* Menampilkan angka rating berukuran besar **`4.95`** (`64px / Bold / Ink `#0f172a``) diapit oleh ornamen *Laurel Wreath SVG*.
* Tulisan sub-rating: `"Dipercaya oleh 500+ Digital Agency & Media Publisher di Indonesia"`.

---

## 🚀 3. SEO & Metadata Strategy

### Target Keywords
* **Primary**: Shiera Social Media Scheduler, Platform Social Media Management Indonesia, Software KOL Management, Social Media All in One, Analisis Kompetitor Social Media.
* **Secondary**: Jadwal Post Instagram Otomatis, Social Media Tools untuk Agency, RSS Auto Publisher Media News, White-Label Social Media Report, Content Approval Client Workflow.

### Meta Tags (HTML Output Ready)
```html
<title>Shiera - All-in-One Social Media Scheduler, KOL Management & Competitor Analytics</title>
<meta name="description" content="Shiera adalah Platform Social Media Management #1 untuk Digital Agency, Media Publisher, dan Brand. Auto schedule post, kelola campaign KOL, analisa kompetitor, dan export laporan otomatis." />
<meta name="keywords" content="Shiera, social media scheduler, KOL management, social media analytics, check kompetitor, RSS media publisher, instagram scheduler" />
<meta property="og:title" content="Kelola Semua Media Sosial, KOL, dan Kompetitor dalam Satu Workspace - Shiera" />
<meta property="og:description" content="Tingkatkan efisiensi agency hingga 10x lipat dengan multi-account publishing, automated client reports, dan KOL tracker dari Shiera." />
<meta property="og:image" content="https://shiera.id/og-image.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

---

## 📐 4. Landing Page Wireframe & Copywriting (Airbnb Layout)

---

### [SECTION 1] Airbnb-Style Top Navigation Header
* **Height**: 80px | **Background**: Clean White (`#ffffff`) dengan 1px Hairline Bottom Border (`#e2e8f0`).
* **Left**: Logo **Shiera** (Teks Bold Clean Ink dengan titik aksen Purple).
* **Center (3 Tab Utama dengan Glyph Ikon Soft & Badge "NEW")**:
  * 🗓️ `Scheduler`
  * 🤝 `KOL Campaigns` `[NEW]`
  * 📰 `Media Publishers` `[NEW]`
* **Right**: 
  * `Untuk Agency` (Text Link)
  * 🌐 Language Icon (ID/EN)
  * `Login` (Ghost Button)
  * `Mulai Gratis` (Pill Button Purple `#7c3aed` dengan teks putih)

---

### [SECTION 2] Hero Section with Floating Search Pill

#### Headline (H1):
# Kelola Semua Sosmed, Campaign KOL, & Kompetitor Dalam Satu Command Center

#### Sub-headline:
Platform All-in-One hemat waktu untuk Digital Agency & Media Publisher. Publikasi konten multi-channel, pantau performa influencer, dan buat laporan otomatis.

#### Floating Search Pill Component (Hero Interactive Orb):
```
[ 🏢 Client Workspace  |  📱 Platform (IG/TikTok)  |  ✨ Pilih Solusi (Scheduler/KOL)  |  🟣 (SEARCH ORB) ]
```

#### Social Proof Pill Bar:
> ⭐ **4.95 / 5.0 Rating** dari 500+ Digital Agency & Media Publisher Indonesia

---

### [SECTION 3] Category Pill Strip (Interactive Filters)

```
[ ALL SOLUTIONS ] [ 🗓️ SCHEDULER ] [ 🤝 KOL MANAGEMENT ] [ 📰 MEDIA PUBLISHER ] [ 📊 REPORT & ANALYTICS ] [ 🔍 CHECK KOMPETITOR ] [ 🏷️ HASHTAG SAVED ]
```

---

### [SECTION 4] Feature Showcase Grid (Airbnb Property Card Layout)

#### Card 1: Social Media Scheduler & Smart Queue
* **Visual Plate**: Mockup Kalender Interaktif Drag-and-Drop & Multi-Post Composer.
* **Badge (Top Left)**: `Paling Populer`
* **Wishlist Button (Top Right)**: `❤️`
* **Card Copy**:
  * **Judul**: Multi-Platform Scheduler & Queue
  * **Meta**: Instagram, TikTok, Facebook, & LinkedIn sekaligus.
  * **Metric Tag**: `Hemat 15 Jam/Minggu`

#### Card 2: Influencer & KOL Campaign Manager
* **Visual Plate**: Grid Profile KOL, Rate Card Tracker, & Real-time Deliverable Status.
* **Badge (Top Left)**: `NEW FEATURE`
* **Card Copy**:
  * **Judul**: KOL Campaign & Deliverable Tracker
  * **Meta**: Database KOL, brief management, & kalkulasi ROI campaign otomatis.
  * **Metric Tag**: `Zero Budget Leak`

#### Card 3: News & Media Publishers Automation
* **Visual Plate**: Skema RSS Auto-Push dari CMS portal berita ke sosmed.
* **Badge (Top Left)**: `Khusus Media`
* **Card Copy**:
  * **Judul**: RSS Feed Auto-Push & Breaking News
  * **Meta**: Publikasi berita otomatis dalam hitungan detik tanpa input manual.
  * **Metric Tag**: `Instant Broadcast`

#### Card 4: Competitor Intelligence (Check Kompetitor)
* **Visual Plate**: Grafis perbandingan growth rate & top post kompetitor.
* **Badge (Top Left)**: `AI Powered`
* **Card Copy**:
  * **Judul**: Competitor Spy & Content Audit
  * **Meta**: Ketahui jam posting rahasia & hashtag terlaris kompetitor Anda.
  * **Metric Tag**: `Real-Time Insights`

#### Card 5: White-Label Automated PDF Report
* **Visual Plate**: Template laporan PDF profesional berlogo agency Anda.
* **Badge (Top Left)**: `1-Click Export`
* **Card Copy**:
  * **Judul**: Executive PDF Report Generator
  * **Meta**: Laporan bulanan klien siap kirim tanpa ribet buat slide.
  * **Metric Tag**: `White-Label Ready`

#### Card 6: Saved Hashtag Presets & AI Clipper
* **Visual Plate**: Tag Cloud Hashtag Manager & YouTube-to-Reels Clipper.
* **Badge (Top Left)**: `Power Feature`
* **Card Copy**:
  * **Judul**: Saved Hashtag Presets & AI Reels Clipper
  * **Meta**: Kelompokkan hashtag favorit & ubah video panjang jadi klip pendek.
  * **Metric Tag**: `1-Click Insert`

---

### [SECTION 5] Airbnb Rating Display & High-Trust Social Proof

#### Hero Rating Display:
```
         🌿  4.95  🌿
      GUEST & AGENCY FAVORITE
"Platform SMM Paling Stabil & Lengkap Di Indonesia"
```

> **"Shiera menghemat 70% waktu operasional agency kami. Dulu bikin laporan 15 klien butuh 3 hari, sekarang selesai dalam 5 menit!"**  
> — *Budi Pratama, Managing Director Creative Agency*

---

### [SECTION 6] Client Approval Portal (Collaboration Feature)

#### H2: Dapatkan Approval Klien Lebih Cepat Tanpa File Berantakan

1. **Bagikan Link Review**: Kirim link preview terlindungi tanpa perlu klien buat akun.
2. **Klien Cek & Comment**: Klien melihat visual persis feed asli dan dapat memberi catatan revisi.
3. **Auto-Schedule**: Konten yang disetujui (*Approved*) langsung masuk antrean tayang.

---

### [SECTION 7] Airbnb Reservation Card Style Pricing Matrix

Tampilan harga menggunakan gaya **Sticky Reservation Card** Airbnb dengan 4 tingkatan paket fleksibel:

| Card Component | Starter Trial | Creator | Agency (`GUEST FAVORITE`) | Studio (`TERBAIK`) |
| :--- | :--- | :--- | :--- | :--- |
| **Pill Badge** | Gratis 3 Hari | Creator Plan | **`Paling Populer`** | **`Terbaik`** |
| **Harga / Periode** | **Rp 0** *(3 hari)* | **Rp 49.000** */bulan* | **Rp 299.000** */bulan* | **Rp 749.000** */bulan* |
| **Kuota Post** | 6 Posts (2 post/hari) | 50 Posts (~1.6/hari) | 300 Posts (~10/hari) | 1.000 Posts (~33/hari) |
| **Social Accounts** | Unlimited Akun | Unlimited Akun | Unlimited Akun | Unlimited Akun |
| **Workspaces / Clients** | 1 Workspace | Personal / Brand | Multi-Client Management | Unlimited Clients |
| **Fitur Utama** | 10+ Platform & WA OTP | Scheduling & Media Library | Priority Queue & Multi-Client | API Access & Priority Support |
| **Metode Bayar** | Free Trial (WA Verify) | QRIS, GoPay, VA, Card | QRIS, GoPay, VA, Card | QRIS, GoPay, VA, Card |
| **CTA Button** | `Mulai Trial` (Secondary) | `Pilih Creator` (Secondary) | `Pilih Agency` (Pill Purple `#7c3aed`) | `Pilih Studio` (Secondary) |

---

### [SECTION 8] Frequently Asked Questions (FAQ - Rich Snippet Ready)

* **Q: Apakah Shiera aman dan tidak melanggar API Instagram/TikTok?**
  * **A**: 100% Aman. Shiera menggunakan API Resmi Graph API dari Meta, TikTok, dan LinkedIn.
* **Q: Bisakah saya mencoba Shiera secara gratis?**
  * **A**: Bisa! Tersedia Free Trial 14 Hari tanpa perlu kartu kredit.
* **Q: Apakah laporan PDF bisa dipasang logo agency saya?**
  * **A**: Ya, fitur White-Label PDF Report memungkinkan Anda memasang logo dan nama agency Anda sendiri.

---

### [SECTION 9] Final Footer & Call to Action

#### H1: Mulai Menghemat Waktu & Tingkatkan Client Satisfaction Hari Ini

* `[ Button Primary ]` **Mulai Free Trial 14 Hari dengan Shiera** *(Pill Purple `#7c3aed`)*
* `[ Subtext ]` *Tanpa Kartu Kredit • Cancel Kapan Saja • Support 24/7*

---

*Shiera © 2026. Designed with Airbnb Visual Elegance in Shiera Electric Purple.*
