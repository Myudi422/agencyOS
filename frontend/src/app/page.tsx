"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calendar, Users, Newspaper, Search, Heart, Star, Sparkles, 
  ChevronDown, ArrowRight, Hash, Globe, TrendingUp, FileText,
  Check, LayoutGrid, FileBarChart, LineChart, Zap, Building2, Share2, ShieldCheck,
  Flame, CheckCircle2, Sliders, Play, Award, MessageCircle
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// SVG Laurel Wreath Component (Airbnb Style Rating Ornaments)
function LaurelWreathLeft({ className = "text-purple-400 w-8 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 32C14 28 8 20 8 12C8 7 11 3 16 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 28C10 27 5 21 6 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M14 20C8 18 4 12 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M16 11C11 9 9 4 13 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function LaurelWreathRight({ className = "text-purple-400 w-8 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4 32C10 28 16 20 16 12C16 7 13 3 8 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 28C14 27 19 21 18 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 20C16 18 20 12 17 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 11C13 9 15 4 11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

// Category Navigation List with vector SVG icons
const CATEGORIES = [
  { id: "ALL SOLUTIONS", label: "Semua Solusi", icon: LayoutGrid },
  { id: "SCHEDULER", label: "Scheduler & Queue", icon: Calendar },
  { id: "KOL MANAGEMENT", label: "KOL Campaigns", icon: Users },
  { id: "MEDIA PUBLISHER", label: "Media Publisher", icon: Newspaper },
  { id: "REPORT & ANALYTICS", label: "Report PDF", icon: FileBarChart },
  { id: "CHECK KOMPETITOR", label: "Check Kompetitor", icon: LineChart },
  { id: "HASHTAG SAVED", label: "Saved Hashtags", icon: Hash },
];

// Feature Cards Mock Data matching Airbnb Property Card style
const FEATURES = [
  {
    id: "scheduler",
    category: "SCHEDULER",
    badge: "Paling Populer",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    title: "Multi-Platform Scheduler & Smart Queue",
    meta: "Instagram, TikTok, Facebook, LinkedIn, X, YouTube, & Bluesky sekaligus dalam 1 composer.",
    metric: "Hemat 15 Jam/Minggu",
    visualBg: "from-purple-500/10 via-violet-500/5 to-slate-100",
    visualIcon: Calendar,
    visualTag: "Drag & Drop Calendar",
    iconColor: "text-purple-600",
    platforms: ["Instagram", "TikTok", "Facebook", "LinkedIn", "X", "YouTube", "Bluesky"]
  },
  {
    id: "kol",
    category: "KOL MANAGEMENT",
    badge: "NEW FEATURE",
    badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
    title: "KOL Campaign & Deliverable Tracker",
    meta: "Kelola database influencer, monitor brief & deliverable status, serta hitung ROI campaign secara real-time.",
    metric: "Zero Budget Leak",
    visualBg: "from-emerald-500/10 via-teal-500/5 to-slate-100",
    visualIcon: Users,
    visualTag: "Influencer CRM",
    iconColor: "text-emerald-600",
    platforms: ["TikTok", "Instagram", "YouTube"]
  },
  {
    id: "media",
    category: "MEDIA PUBLISHER",
    badge: "Khusus Media",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
    title: "RSS Feed Auto-Push & Breaking News",
    meta: "Otomatisasi publikasi berita dari CMS portal media Anda langsung ke semua sosmed dalam waktu 3 detik.",
    metric: "Instant Broadcast",
    visualBg: "from-sky-500/10 via-blue-500/5 to-slate-100",
    visualIcon: Newspaper,
    visualTag: "Auto RSS Engine",
    iconColor: "text-sky-600",
    platforms: ["Portal News", "WordPress", "RSS Feed"]
  },
  {
    id: "competitor",
    category: "CHECK KOMPETITOR",
    badge: "AI Powered",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    title: "Competitor Intelligence & Content Audit",
    meta: "Pantau jam posting rahasia, postingan terlaris, dan strategi engagement rate kompetitor secara otomatis.",
    metric: "Real-Time Insights",
    visualBg: "from-amber-500/10 via-orange-500/5 to-slate-100",
    visualIcon: TrendingUp,
    visualTag: "Competitor Spy",
    iconColor: "text-amber-600",
    platforms: ["Instagram", "TikTok", "LinkedIn"]
  },
  {
    id: "reports",
    category: "REPORT & ANALYTICS",
    badge: "1-Click Export",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    title: "Executive PDF Report Generator",
    meta: "Generate laporan bulanan berlogo agency Anda dalam format PDF siap kirim ke klien hanya dengan satu klik.",
    metric: "White-Label Ready",
    visualBg: "from-indigo-500/10 via-purple-500/5 to-slate-100",
    visualIcon: FileText,
    visualTag: "PDF Report Engine",
    iconColor: "text-indigo-600",
    platforms: ["PDF", "Custom Logo", "White Label"]
  },
  {
    id: "clipper",
    category: "HASHTAG SAVED",
    badge: "Power Feature",
    badgeColor: "bg-rose-100 text-rose-700 border-rose-200",
    title: "Saved Hashtag Presets & AI Reels Clipper",
    meta: "Simpan grup hashtag terlaris per industri dan potong video YouTube panjang menjadi video pendek Reels/Shorts.",
    metric: "1-Click Insert",
    visualBg: "from-rose-500/10 via-pink-500/5 to-slate-100",
    visualIcon: Hash,
    visualTag: "AI Video & Tag Helper",
    iconColor: "text-rose-600",
    platforms: ["Reels", "Shorts", "TikTok Clips"]
  }
];

const PRICING_PLANS = [
  {
    tier: "trial",
    badge: "Gratis 3 Hari",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    name: "Starter Trial",
    price: "Rp 0",
    period: "3 hari",
    posts: "6 Posts",
    postsDetail: "2 post / hari",
    highlight: "Uji coba gratis tanpa kartu kredit",
    features: [
      "6 posts total (2 post/hari)",
      "Gratis tanpa biaya (Rp 0)",
      "Unlimited akun sosial media",
      "Semua 10+ platform didukung",
      "Wajib Verifikasi WhatsApp OTP",
    ],
    buttonText: "Mulai Free Trial",
    buttonStyle: "bg-slate-900 text-white hover:bg-slate-800",
    popular: false
  },
  {
    tier: "creator",
    badge: "Creator Plan",
    badgeBg: "bg-slate-100 text-slate-700 border-slate-200",
    name: "Creator",
    price: "Rp 49.000",
    period: "/bulan",
    posts: "50 Posts",
    postsDetail: "~1.6 post / hari",
    highlight: "Cocok untuk Content Creator & Brand Personal",
    features: [
      "50 posts / bulan",
      "Unlimited akun sosial media",
      "Semua 10+ platform",
      "Bayar via QRIS, GoPay, VA, Card",
      "Scheduling & media library",
    ],
    buttonText: "Pilih Creator",
    buttonStyle: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300",
    popular: false
  },
  {
    tier: "agency",
    badge: "GUEST FAVORITE",
    badgeBg: "bg-purple-600 text-white shadow-sm font-bold",
    name: "Agency",
    price: "Rp 299.000",
    period: "/bulan",
    posts: "300 Posts",
    postsDetail: "~10 post / hari",
    highlight: "Pilihan utama Digital Agency di Indonesia",
    features: [
      "300 posts / bulan",
      "Unlimited akun sosial media",
      "Multi-client workspace management",
      "Semua 10+ platform",
      "Scheduling & media library",
      "Priority queue engine",
      "Metode bayar Midtrans QRIS/GoPay/VA",
    ],
    buttonText: "Coba Agency Pro",
    buttonStyle: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/25",
    popular: true
  },
  {
    tier: "studio",
    badge: "Terbaik",
    badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
    name: "Studio",
    price: "Rp 749.000",
    period: "/bulan",
    posts: "1.000 Posts",
    postsDetail: "~33 post / hari",
    highlight: "Untuk Large Agency & Publisher Berita",
    features: [
      "1.000 posts / bulan",
      "Unlimited akun sosial media",
      "Unlimited clients & workspaces",
      "Semua 10+ platform",
      "Full media library",
      "API access & priority support",
      "Metode bayar Midtrans lengkap",
    ],
    buttonText: "Pilih Studio",
    buttonStyle: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-300",
    popular: false
  }
];

const FAQS = [
  {
    question: "Apakah Shiera aman dan melanggar API Instagram / TikTok?",
    answer: "Shiera 100% Aman dan Legal. Kami menggunakan Graph API Resmi dari Meta (Instagram & Facebook), TikTok Content Posting API, LinkedIn API, YouTube API, dan X API resmi. Tidak ada risk akun terkena banned karena tidak ada scraping ilegal."
  },
  {
    question: "Bagaimana cara kerja Free Trial 3 Hari?",
    answer: "Anda mendapatkan akses langsung ke paket Starter Trial selama 3 hari dengan kuota 6 postingan (2 post/hari). Pendaftaran sangat mudah dan memerlukan verifikasi OTP WhatsApp aktif untuk mencegah pengiklanan spam."
  },
  {
    question: "Apakah laporan PDF dapat dipasang logo Agency saya sendiri (White-Label)?",
    answer: "Ya! Pada paket Agency dan Studio, fitur Executive PDF Report Generator memungkinkan Anda mengunggah logo agency, mengatur warna brand, dan menghapus nama Shiera sehingga laporan terlihat 100% dibuat oleh agency Anda."
  },
  {
    question: "Metode pembayaran apa saja yang didukung?",
    answer: "Pembayaran diproses secara aman melalui Midtrans Payment Gateway. Kami menerima QRIS (BCA, Mandiri, GoPay, OVO, ShopeePay), Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), dan Kartu Kredit/Debit Visa/Mastercard."
  },
  {
    question: "Bisakah saya mengelola banyak akun klien dalam satu login?",
    answer: "Tentu saja. Fitur Workspace Management memungkinkan Anda mengelompokkan sosial media berdasarkan nama klien atau brand, memberi akses tim secara terpisah, dan membuat link review approval untuk klien."
  }
];

export default function LandingHomePage() {
  const { isAuthenticated } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("ALL SOLUTIONS");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [language, setLanguage] = useState<"ID" | "EN">("ID");

  const filteredFeatures = activeCategory === "ALL SOLUTIONS" 
    ? FEATURES 
    : FEATURES.filter(f => f.category === activeCategory);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-purple-200 selection:text-purple-900">
      
      {/* ── [SECTION 1] Airbnb-Style Top Navigation Header ──────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-20 px-4 sm:px-8 flex items-center justify-between transition-all">
        {/* Brand Logo Left */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-purple-500/20 group-hover:scale-105 transition-all">
              S
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
              Shiera<span className="text-purple-600">.</span>
            </span>
          </Link>
        </div>

        {/* Center Tabs - Airbnb 3 Product Entries with Vector Icons */}
        <nav className="hidden md:flex items-center gap-8">
          <button className="flex items-center gap-2 font-semibold text-sm text-slate-900 border-b-2 border-slate-900 pb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Scheduler</span>
          </button>
          <button className="flex items-center gap-2 font-semibold text-sm text-slate-500 hover:text-slate-900 transition-colors pb-1 relative">
            <Users className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            <span>KOL Campaigns</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-wider">
              NEW
            </span>
          </button>
          <button className="flex items-center gap-2 font-semibold text-sm text-slate-500 hover:text-slate-900 transition-colors pb-1 relative">
            <Newspaper className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
            <span>Media Publishers</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-bold uppercase tracking-wider">
              NEW
            </span>
          </button>
        </nav>

        {/* Right Utilities */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/pricing" className="hidden sm:inline-block text-xs font-semibold text-slate-600 hover:text-purple-600 transition-colors">
            Untuk Agency
          </Link>

          {/* Language Switcher */}
          <button 
            onClick={() => setLanguage(l => l === "ID" ? "EN" : "ID")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded-full transition-all border border-slate-200/60"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language}</span>
          </button>

          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              className="px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-full hover:bg-slate-100 transition-all">
                Login
              </Link>
              <Link 
                href="/login"
                className="px-4 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Mulai Gratis
              </Link>
            </>
          )}
        </div>
      </header>


      {/* ── [SECTION 2] Hero Section with Floating Search Pill ──────────────── */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        
        {/* Social Proof Pill Bar */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium shadow-xs">
          <div className="flex items-center text-slate-900">
            <Star className="w-4 h-4 fill-slate-900 text-slate-900" />
            <span className="font-bold ml-1">4.95 / 5.0</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Dipercaya oleh 500+ Digital Agency &amp; Media Publisher Indonesia</span>
        </div>

        {/* Main Headline H1 */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight leading-[1.15]">
            Kelola Semua Sosmed, Campaign KOL, &amp; Kompetitor Dalam{" "}
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Satu Command Center
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Platform All-in-One hemat waktu untuk Digital Agency &amp; Media Publisher. Publikasi konten multi-channel, pantau performa influencer, dan buat laporan otomatis.
          </p>
        </div>

        {/* Floating Search Pill Component (Airbnb Global Search Capsule) */}
        <div className="max-w-4xl mx-auto pt-4">
          <div className="bg-white rounded-full border border-slate-200 shadow-lg shadow-slate-200/60 p-2 sm:p-3 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 hover:shadow-xl transition-all">
            
            {/* Segment 1: Client Workspace */}
            <div className="flex-1 w-full text-left px-5 py-2 md:border-r border-slate-200 hover:bg-slate-50/80 rounded-full cursor-pointer transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Mau posting ke mana?</div>
                <div className="text-xs text-slate-500 truncate">Pilih Klien / Workspace Klien</div>
              </div>
            </div>

            {/* Segment 2: Social Channels */}
            <div className="flex-1 w-full text-left px-5 py-2 md:border-r border-slate-200 hover:bg-slate-50/80 rounded-full cursor-pointer transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4 text-purple-600" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Channel sosmed apa?</div>
                <div className="text-xs text-slate-500 truncate">Instagram, TikTok, FB, LinkedIn, X, YT</div>
              </div>
            </div>

            {/* Segment 3: Solution Type */}
            <div className="flex-1 w-full text-left px-5 py-2 hover:bg-slate-50/80 rounded-full cursor-pointer transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Tipe Solusi</div>
                <div className="text-xs text-slate-500 truncate">Scheduler, KOL, Competitor Spy</div>
              </div>
            </div>

            {/* Search Orb Button (Electric Purple) */}
            <div className="w-full md:w-auto flex justify-end shrink-0 pl-2">
              <Link 
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="w-full md:w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2 px-4 md:px-0 shadow-md shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Search className="w-5 h-5" />
                <span className="md:hidden text-xs font-bold">Cari Solusi Sekarang</span>
              </Link>
            </div>
          </div>
        </div>

      </section>


      {/* ── [SECTION 3] Category Pill Strip (Interactive Vector Filters) ────── */}
      <section className="border-y border-slate-200/80 bg-slate-50/50 py-4 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto overflow-x-auto no-scrollbar flex items-center gap-2 sm:gap-3 py-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                  isActive
                    ? "bg-purple-100 text-purple-700 border-2 border-purple-600 shadow-xs font-bold"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-purple-600" : "text-slate-500"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>


      {/* ── [SECTION 4] Feature Showcase Grid (Airbnb Property Card Layout) ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Platform Features</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-['Outfit'] tracking-tight mt-2">
              Fitur Lengkap Dirancang Khusus Untuk Skala Agency
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            Setiap fitur dibangun dengan filosofi efisiensi tinggi, antarmuka bersih, dan integrasi API sosial media resmi.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feat) => {
            const Icon = feat.visualIcon;
            const isFav = favorites[feat.id];

            return (
              <div 
                key={feat.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Visual Image / Mockup Plate Aspect Ratio 4:3 */}
                <div className={`relative aspect-[4/3] bg-gradient-to-br ${feat.visualBg} p-6 flex flex-col justify-between overflow-hidden border-b border-slate-100`}>
                  
                  {/* Top Left Badge */}
                  <div className="flex items-center justify-between z-10">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${feat.badgeColor}`}>
                      {feat.badge}
                    </span>

                    {/* Wishlist Heart Button (Airbnb style) */}
                    <button
                      onClick={(e) => toggleFavorite(feat.id, e)}
                      className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-xs transition-all hover:scale-110 active:scale-90 border border-slate-200/50"
                      title="Simpan Fitur"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-purple-600 text-purple-600" : "text-slate-600"}`} />
                    </button>
                  </div>

                  {/* Center Visual Mockup Graphic */}
                  <div className="my-auto flex flex-col items-center justify-center text-center space-y-2 group-hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border border-slate-100">
                      <Icon className={`w-8 h-8 ${feat.iconColor}`} />
                    </div>
                    <span className="text-xs font-bold text-slate-800 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full border border-slate-200/60 shadow-2xs">
                      {feat.visualTag}
                    </span>
                  </div>

                  {/* Bottom Platforms Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap z-10">
                    {feat.platforms.map((p) => (
                      <span key={p} className="text-[10px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                        {p}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Card Content Copy */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg font-['Outfit'] group-hover:text-purple-600 transition-colors">
                        {feat.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {feat.meta}
                    </p>
                  </div>

                  {/* Metric Tag Highlight */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Highlight</span>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-purple-600" />
                      <span>{feat.metric}</span>
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </section>


      {/* ── [SECTION 5] Airbnb Rating Display with Laurel Wreaths ──────────── */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
          
          {/* Laurel Wreath Vector SVG + Rating Display 64px */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-4">
              <LaurelWreathLeft className="text-purple-400 w-8 h-12" />
              <span className="text-5xl sm:text-7xl font-extrabold tracking-tight font-['Outfit'] text-white">
                4.95
              </span>
              <LaurelWreathRight className="text-purple-400 w-8 h-12" />
            </div>

            <div className="flex items-center justify-center gap-1 text-purple-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-5 h-5 fill-purple-400 text-purple-400" />
              ))}
            </div>

            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-purple-300 flex items-center justify-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>GUEST &amp; AGENCY FAVORITE</span>
            </p>
          </div>

          {/* Headline Statement */}
          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-3xl mx-auto leading-tight font-['Outfit']">
            &ldquo;Platform SMM Paling Stabil, Hemat Waktu, &amp; Lengkap Di Indonesia&rdquo;
          </h2>

          {/* Testimonial Quote */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md max-w-2xl mx-auto text-left space-y-4">
            <p className="text-sm sm:text-base text-slate-300 italic leading-relaxed">
              &ldquo;Shiera menghemat 70% waktu operasional agency kami. Dulu bikin laporan 15 klien butuh waktu 3 hari penuh, sekarang selesai dalam 5 menit otomatis!&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                BP
              </div>
              <div>
                <p className="text-sm font-bold text-white">Budi Pratama</p>
                <p className="text-xs text-purple-300">Managing Director @ Creative Media Agency</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── [SECTION 6] Client Approval Portal ─────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit mx-auto">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Client Collaboration</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
            Dapatkan Approval Klien Lebih Cepat Tanpa File Berantakan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tidak ada lagi revisi via WhatsApp chat yang tercecer. Kirim link preview profesional yang dapat langsung di-approve oleh klien.
          </p>
        </div>

        {/* 3 Step Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">1. Bagikan Link Review</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kirim link preview terlindungi kata sandi tanpa meminta klien untuk membuat akun terlebih dahulu.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">2. Klien Cek &amp; Comment</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Klien dapat melihat tampilan visual presisi feed sosial media asli dan meninggalkan catatan revisi per post.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">3. Auto-Schedule Tayang</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Konten yang telah disetujui (&quot;Approved&quot;) langsung masuk ke antrean tayang otomatis tanpa perbaikan manual.
            </p>
          </div>
        </div>
      </section>


      {/* ── [SECTION 7] Airbnb Reservation Card Style Pricing Matrix ────────── */}
      <section id="pricing" className="py-20 bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-100 px-3 py-1 rounded-full border border-purple-200 flex items-center gap-1.5 w-fit mx-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Transparan &amp; Tanpa Biaya Tersembunyi</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Pilih Paket Sesuai Kebutuhan Post Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Semua paket sudah termasuk <strong>Unlimited Akun Sosial Media</strong> dan dukungan 10+ platform. Pembayaran praktis via Midtrans (QRIS, GoPay, VA, Credit Card).
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {PRICING_PLANS.map((plan) => (
              <div 
                key={plan.tier}
                className={`relative flex flex-col rounded-3xl bg-white p-6 border-2 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? "border-purple-600 shadow-xl shadow-purple-500/10" 
                    : "border-slate-200/90 shadow-xs hover:shadow-lg"
                }`}
              >
                {/* Floating Top Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${plan.badgeBg}`}>
                    {plan.badge}
                  </span>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="font-bold text-xl text-slate-900 font-['Outfit']">{plan.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{plan.highlight}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{plan.price}</span>
                    <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                  </div>

                  {/* Post Quota Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-lg font-bold text-slate-900 font-['Outfit']">{plan.posts}</p>
                    <p className="text-[11px] text-slate-500">{plan.postsDetail}</p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2.5 pt-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-auto">
                  <Link
                    href="/pricing"
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${plan.buttonStyle}`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── [SECTION 8] Frequently Asked Questions (FAQ) ──────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
            Pertanyaan Yang Sering Diajukan (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Segala yang perlu Anda ketahui tentang keamanan API, lisensi, dan pembayaran.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div 
                key={index}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>


      {/* ── [SECTION 9] Final Footer & CTA ───────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 text-white text-center px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Mulai Hemat Waktu Sekarang
          </span>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] tracking-tight leading-tight">
            Tingkatkan Efisiensi Agency Anda Hingga 10x Lipat
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan 500+ Digital Agency &amp; Media Publisher di Indonesia yang mengelola media sosial tanpa stres.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              Mulai Free Trial 3 Hari Sekarang
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
            >
              Login ke Dashboard
            </Link>
          </div>

          <p className="text-xs text-slate-400 pt-2 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tanpa Kartu Kredit • Batal Kapan Saja • Support WA Fast Response</span>
          </p>
        </div>
      </section>


      {/* ── Footer Light Band (Airbnb Footer Style) ────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200">
          
          <div className="space-y-3">
            <span className="text-lg font-bold text-slate-900 font-['Outfit']">Shiera.</span>
            <p className="text-slate-500 leading-relaxed">
              Platform Social Media Management #1 untuk Digital Agency, Media Publisher, dan Brand di Indonesia.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Produk &amp; Fitur</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><a href="#features" className="hover:text-purple-600 transition-colors">Multi-Channel Scheduler</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">KOL Campaign Tracker</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">RSS Auto Publisher</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">Competitor Intelligence</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Agency &amp; Solutions</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">White-Label PDF Reports</a></li>
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">Client Approval Portal</a></li>
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">Harga Paket Agency</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Dukungan</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><Link href="/login" className="hover:text-purple-600 transition-colors">Bantuan WhatsApp</Link></li>
              <li><Link href="/pricing" className="hover:text-purple-600 transition-colors">Verifikasi WA OTP</Link></li>
              <li><Link href="/login" className="hover:text-purple-600 transition-colors">Dokumentasi API</Link></li>
            </ul>
          </div>

        </div>

        {/* Legal Bottom Band */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 Shiera Inc. Designed with Airbnb Visual Elegance in Shiera Electric Purple.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Indonesia (IDR)</span>
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
