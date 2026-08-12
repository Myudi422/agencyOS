export interface TourStep {
  id: string;
  target: string; // CSS selector or data-tour attribute value e.g. '[data-tour="sidebar-nav"]'
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

export const DEFAULT_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: '[data-tour="sidebar-brand"]',
    title: "Selamat Datang di Shiera! 👋",
    description: "Platform manajemen agensi & media sosial otomatis. Mari kita jelajahi menu utama dan fitur penting untuk mengoptimalkan kerja tim Anda.",
    position: "right",
  },
  {
    id: "navigation",
    target: '[data-tour="sidebar-nav"]',
    title: "Navigasi Menu Utama 📌",
    description: "Akses cepat ke Dashboard, Penjadwalan Konten (Posts), Kalender Interaktif, Media Asset, Analitik Performance, dan Audit Log.",
    position: "right",
  },
  {
    id: "metrics-overview",
    target: '[data-tour="dashboard-metrics"]',
    title: "Ringkasan Performa Real-Time 📊",
    description: "Pantau total akun media sosial terhubung, status publikasi hari ini, job queue, dan akun aktif klien secara langsung.",
    position: "bottom",
  },
  {
    id: "content-calendar",
    target: '[data-tour="dashboard-content"]',
    title: "Ringkasan Konten & Kalender 📅",
    description: "Lihat postingan mendatang yang siap tayang dan tren performa publikasi 7 hari terakhir dalam satu tampilan visual.",
    position: "top",
  },
  {
    id: "activity-log",
    target: '[data-tour="dashboard-activity"]',
    title: "Aktivitas Terkini & Audit Stream ⚡",
    description: "Catatan otomatis setiap aksi sistem, posting terbit, maupun perubahan data. Sudah dioptimalkan maksimal 50 log terbaru.",
    position: "top",
  },
  {
    id: "ai-assistant",
    target: '[data-tour="ai-assistant-fab"]',
    title: "Shiera AI Assistant 🤖",
    description: "Asisten AI pintar untuk bantu buat caption otomatis dari gambar, analisa performa akun, dan optimasi jadwal tayang.",
    position: "left",
  },
];

export const COMPOSER_TOUR_STEPS: TourStep[] = [
  {
    id: "composer-accounts",
    target: '[data-tour="composer-accounts"]',
    title: "1. Pilih Akun Sosial Target 📱",
    description: "Pilih 1 atau beberapa saluran sosial (Instagram, TikTok, FB, YT, X, Threads) untuk dipublish sekaligus. Jika belum ada akun, klik tombol arahan untuk menghubungkan akun terlebih dahulu.",
    position: "bottom",
  },
  {
    id: "composer-caption",
    target: '[data-tour="composer-caption"]',
    title: "2. Teks Caption & AI Auto-Caption ✨",
    description: "Tulis caption postingan Anda atau tekan tombol AI Auto-Caption untuk menghasilkan caption & hashtag relevan secara otomatis dari sampel gambar.",
    position: "bottom",
  },
  {
    id: "composer-media",
    target: '[data-tour="composer-media"]',
    title: "3. Media, Carousel & Watermark 🖼️",
    description: "Unggah foto/video, atur urutan slide carousel, ambil aset media dari Cloud Storage B2, dan aktifkan Auto-Watermark branding agensi Anda.",
    position: "top",
  },
  {
    id: "composer-platform-options",
    target: '[data-tour="composer-platform-options"]',
    title: "4. Platform Specific Options ⚙️",
    description: "Konfigurasi parameter spesifik tiap platform seperti Instagram Reels placement, YouTube Video privacy & categories, TikTok Duet/Stitch permissions, dan X Polls.",
    position: "top",
  },
  {
    id: "composer-preview",
    target: '[data-tour="composer-preview"]',
    title: "5. Live Feed Preview 👁️",
    description: "Pratinjau visual postingan secara langsung sesuai tampilan beranda sosial media. Lengkap dengan pengubah rasio (1:1, 4:5, 9:16) & saklar cover thumbnail video.",
    position: "left",
  },
  {
    id: "composer-share",
    target: '[data-tour="composer-share"]',
    title: "6. Share Link Review Klien 🔗",
    description: "Buat dan bagikan link preview postingan khusus untuk review/approval klien langsung via WhatsApp atau salin link clipboard sebelum diterbitkan.",
    position: "top",
  },
  {
    id: "composer-actions",
    target: '[data-tour="composer-actions"]',
    title: "7. Aksi Publikasi & Penjadwalan 🚀",
    description: "Pilih mode penerbitan: 'Publish Now' (Terbitkan Sekarang), 'Schedule' (Jadwalkan Waktu Tayang spesifik), atau 'Save Draft' (Simpan Draf), lalu tekan Submit.",
    position: "top",
  },
];

export const QUEUE_TOUR_STEPS: TourStep[] = [
  {
    id: "queue-header",
    target: '[data-tour="queue-header"]',
    title: "1. Manajemen Antrean & Postingan 🚀",
    description: "Halaman pusat untuk mengelola seluruh status postingan agensi Anda (Draft, Terjadwal, Diproses, dan Riwayat tayang). Seluruh waktu tayang ditampilkan secara otomatis dalam format WIB (UTC+7).",
    position: "bottom",
  },
  {
    id: "queue-tabs",
    target: '[data-tour="queue-tabs"]',
    title: "2. Tab Filter Status Postingan 📑",
    description: "Gunakan tab ini untuk beralih antara Draf Lokal, Antrean Terjadwal, Status Diproses, dan Riwayat Hasil Publikasi.",
    position: "bottom",
  },
  {
    id: "queue-tab-draft",
    target: '[data-tour="queue-tab-draft-content"]',
    title: "3. Kelola Draf Konten ✏️",
    description: "Draf tersimpan secara aman di workspace lokal. Anda dapat mengedit teks/media, memilih ulang akun target, atau memprosesnya ke jadwal publikasi.",
    position: "top",
  },
  {
    id: "queue-tab-terjadwal",
    target: '[data-tour="queue-tab-terjadwal-content"]',
    title: "4. Antrean Post Terjadwal ⏰",
    description: "Pantau postingan yang siap diterbitkan otomatis sesuai jadwal WIB & UTC. Anda dapat membatalkan jadwal postingan kapan saja sebelum jam tayang tiba.",
    position: "top",
  },
  {
    id: "queue-tab-diproses",
    target: '[data-tour="queue-tab-diproses-content"]',
    title: "5. Monitoring Status Diproses 🔥",
    description: "Pantau proses penerbitan postingan yang sedang berjalan di background server hingga terbit sepenuhnya ke seluruh saluran target.",
    position: "top",
  },
  {
    id: "queue-tab-riwayat",
    target: '[data-tour="queue-tab-riwayat-content"]',
    title: "6. Riwayat Tayang & Sync Hasil 📊",
    description: "Lihat log status publikasi per platform (Berhasil/Gagal). Tekan tombol 'Sync Riwayat' di kanan atas untuk menyinkronkan status tayang terbaru dari server.",
    position: "top",
  },
];

export const ACCOUNTS_TOUR_STEPS: TourStep[] = [
  {
    id: "accounts-header",
    target: '[data-tour="accounts-header"]',
    title: "1. Social Account Manager 📱",
    description: "Kelola, pantau, dan atur otentikasi seluruh saluran media sosial terhubung (Instagram, TikTok, FB, YT, X, Threads, Pinterest, LinkedIn, Bluesky) dalam satu dashboard agensi.",
    position: "bottom",
  },
  {
    id: "accounts-connect-btn",
    target: '[data-tour="accounts-connect-btn"]',
    title: "2. Hubungkan Saluran Sosial Baru 🔌",
    description: "Tekan tombol ini untuk menambahkan saluran sosial media baru milik agensi atau klien dengan otentikasi OAuth instan yang aman.",
    position: "bottom",
  },
  {
    id: "accounts-controls",
    target: '[data-tour="accounts-controls"]',
    title: "3. Pencarian & Filter Akun 🔍",
    description: "Gunakan kotak pencarian username/channel, filter status koneksi (Terkoneksi/Perlu Rekonek), filter favorit, serta toggle tampilan Grid & List.",
    position: "top",
  },
  {
    id: "accounts-grid",
    target: '[data-tour="accounts-grid"]',
    title: "4. Briefing & Auto-Watermark 📑",
    description: "Atur dokumen briefing tone of voice khas tiap saluran serta konfigurasi Auto-Watermark (Gambar/Teks) otomatis pada setiap foto/video postingan.",
    position: "top",
  },
];

export const CALENDAR_TOUR_STEPS: TourStep[] = [
  {
    id: "calendar-header",
    target: '[data-tour="calendar-header"]',
    title: "1. Content Planner & Live Calendar 📅",
    description: "Tampilan kalender interaktif bulanan untuk memantau perencanaan dan jadwal tayang postingan media sosial secara visual dalam format WIB (UTC+7).",
    position: "bottom",
  },
  {
    id: "calendar-filter",
    target: '[data-tour="calendar-filter"]',
    title: "2. Filter Spesifik Platform 🎯",
    description: "Gunakan dropdown filter ini untuk menyaring jadwal postingan agar hanya menampilkan platform tertentu seperti Instagram, TikTok, YouTube, dll.",
    position: "bottom",
  },
  {
    id: "calendar-nav",
    target: '[data-tour="calendar-nav"]',
    title: "3. Navigasi Bulan & Tahun 🗓️",
    description: "Pilih bulan atau tahun dari dropdown dan tombol panah navigasi untuk melihat rencana konten masa lalu maupun bulan-bulan mendatang.",
    position: "bottom",
  },
  {
    id: "calendar-grid",
    target: '[data-tour="calendar-grid"]',
    title: "4. Cell Tanggal & Penjadwalan Cepat ➕",
    description: "Lihat badge postingan per hari. Arahkan kursor ke tanggal tertentu lalu tekan tombol '+' untuk langsung membuat postingan terpotong otomatis pada tanggal tersebut.",
    position: "top",
  },
];

export const AGENT_TOUR_STEPS: TourStep[] = [
  {
    id: "agent-header",
    target: '[data-tour="agent-header"]',
    title: "1. Shiera AI Agent Center 🤖",
    description: "Kelola asisten AI yang bekerja otomatis menghasilkan draf postingan & brief harian sesuai jadwal yang Anda tentukan.",
    position: "bottom",
  },
  {
    id: "agent-create-btn",
    target: '[data-tour="agent-create-btn"]',
    title: "2. Buat AI Agent Baru ⚡",
    description: "Buat agent baru dengan menentukan content pillar, format postingan, jadwal run harian, serta akun target sosmed.",
    position: "bottom",
  },
  {
    id: "agent-capacity",
    target: '[data-tour="agent-capacity"]',
    title: "3. Kapasitas & Daftar Agent 📊",
    description: "Pantau penggunaan kuota agent agensi Anda dan pilih agent di daftar untuk melihat detail konfigurasi serta log hasil.",
    position: "right",
  },
  {
    id: "agent-logs",
    target: '[data-tour="agent-logs"]',
    title: "4. Riwayat Run & Transfer ke Composer 📄",
    description: "Lihat hasil draf otomatis yang dibuat AI Agent. Anda dapat menyalin brief atau menekan 'Transfer ke Composer' untuk siap dipublish.",
    position: "top",
  },
];

export const STATISTICS_TOUR_STEPS: TourStep[] = [
  {
    id: "statistics-header",
    target: '[data-tour="statistics-header"]',
    title: "1. Analytics & Executive Report 📊",
    description: "Pantau performa agregat media sosial agensi Anda, impresi, reach, total likes, komentar, serta export laporan PDF.",
    position: "bottom",
  },
  {
    id: "statistics-filter",
    target: '[data-tour="statistics-filter"]',
    title: "2. Filter Multi-Akun & Rentang Waktu 🎯",
    description: "Pilih 1 atau beberapa akun sosial media dan tentukan periode analisa (Hari ini, 7 Hari, 30 Hari, atau Custom Tanggal).",
    position: "bottom",
  },
  {
    id: "statistics-export",
    target: '[data-tour="statistics-export"]',
    title: "3. Export Laporan PDF & Shiera AI 📄",
    description: "Generate PDF executive report lengkap dengan grafik & catatan agensi, serta manfaatkan AI untuk rangkuman performa otomatis.",
    position: "bottom",
  },
  {
    id: "statistics-metrics",
    target: '[data-tour="statistics-metrics"]',
    title: "4. Ringkasan Metric Performa 🚀",
    description: "Lihat total Likes, Komentar, Shares, Reach, Video Views, dan Pertumbuhan Followers secara real-time.",
    position: "top",
  },
];

export const CLIENTS_TOUR_STEPS: TourStep[] = [
  {
    id: "clients-header",
    target: '[data-tour="clients-header"]',
    title: "1. Roster Management Klien Agensi 💼",
    description: "Kelola profil seluruh klien agensi Anda, kustomisasi palet warna brand, penetapan timezone, dan saluran sosial terikat.",
    position: "bottom",
  },
  {
    id: "clients-add-btn",
    target: '[data-tour="clients-add-btn"]',
    title: "2. Tambah Klien Agensi Baru ➕",
    description: "Tekan tombol ini untuk menambahkan profil klien baru beserta deskripsi brand, aksen warna, dan timezone operasional.",
    position: "bottom",
  },
  {
    id: "clients-grid",
    target: '[data-tour="clients-grid"]',
    title: "3. Card Profil Klien & Saluran Terhubung 📱",
    description: "Lihat jumlah saluran sosial media yang terhubung ke klien, deskripsi brand, dan opsi hapus atau edit profil klien.",
    position: "top",
  },
];

export const TOUR_FLOWS: Record<string, TourStep[]> = {
  default: DEFAULT_TOUR_STEPS,
  composer: COMPOSER_TOUR_STEPS,
  queue: QUEUE_TOUR_STEPS,
  accounts: ACCOUNTS_TOUR_STEPS,
  calendar: CALENDAR_TOUR_STEPS,
  agent: AGENT_TOUR_STEPS,
  statistics: STATISTICS_TOUR_STEPS,
  clients: CLIENTS_TOUR_STEPS,
};
