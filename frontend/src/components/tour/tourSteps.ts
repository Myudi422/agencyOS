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
    title: "Selamat Datang di AgencyOS! 👋",
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
