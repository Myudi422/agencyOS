"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Calendar, Users, Newspaper, Search, Heart, Star, Sparkles, 
  ChevronDown, ArrowRight, Hash, TrendingUp, FileText, Bot,
  Check, LayoutGrid, FileBarChart, LineChart, Zap, Building2, Share2, ShieldCheck,
  Sliders, Award, MessageCircle, User, Store, Briefcase, Clock, CheckCircle, Target
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { fetchApi } from "@/lib/api";

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
  { id: "AI ASSISTANT", label: "AI Assistant", icon: Sparkles },
  { id: "KOL MANAGEMENT", label: "KOL Campaigns", icon: Users },
  { id: "REPORT & ANALYTICS", label: "Report PDF", icon: FileBarChart },
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
    id: "ai_assistant",
    category: "AI ASSISTANT",
    badge: "AI Powered",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    title: "AI Assistant Support Analisa & Brainstorm",
    meta: "Analisis statistik akun otomatis, brainstorming ide konten viral, serta buat caption & brief postingan dalam hitungan detik.",
    metric: "Instant Strategy",
    visualBg: "from-purple-500/10 via-indigo-500/5 to-slate-100",
    visualIcon: Sparkles,
    visualTag: "Shiera AI Co-Pilot",
    iconColor: "text-purple-600",
    platforms: ["AI Analisa", "Brainstorm Ide", "Content & Brief"]
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
    id: "reports",
    category: "REPORT & ANALYTICS",
    badge: "1-Click Export",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    title: "Executive PDF Report Generator",
    meta: "Generate laporan bulanan berlogo Anda dalam format PDF siap kirim hanya dengan satu klik.",
    metric: "White-Label Ready",
    visualBg: "from-indigo-500/10 via-purple-500/5 to-slate-100",
    visualIcon: FileText,
    visualTag: "PDF Report Engine",
    iconColor: "text-indigo-600",
    platforms: ["PDF Report", "Custom Logo", "White Label"]
  },
  {
    id: "approval_portal",
    category: "SCHEDULER",
    badge: "Client Portal",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
    title: "Client Approval & Media Library",
    meta: "Bagikan link persetujuan postingan profesional ke klien tanpa login dan kelola galeri aset media terpusat.",
    metric: "Fast Approval",
    visualBg: "from-sky-500/10 via-blue-500/5 to-slate-100",
    visualIcon: Briefcase,
    visualTag: "Client Portal",
    iconColor: "text-sky-600",
    platforms: ["Approval Link", "Media Storage", "Multi-Client"]
  },
  {
    id: "ai_agent",
    category: "AI ASSISTANT",
    badge: "Auto Pilot",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    title: "Autonomous AI Agent & Content Briefing",
    meta: "AI Agent otomatis yang memahami persona brand, menghasilkan draf ide & brief konten harian, serta siap transfer ke composer.",
    metric: "Auto Daily Draft",
    visualBg: "from-purple-500/10 via-pink-500/5 to-slate-100",
    visualIcon: Bot,
    visualTag: "Shiera AI Agent",
    iconColor: "text-purple-600",
    platforms: ["Auto Brief", "Content Pillars", "Auto Draft"]
  }
];

// Target Audience - "Untuk Siapa Shiera Dirancang?"
const TARGET_AUDIENCE = [
  {
    icon: User,
    iconBg: "bg-purple-100 text-purple-600",
    badge: "Bebas Capek Upload",
    title: "Content Creator & Personal Brand",
    description: "Stop buang 2 jam setiap hari hanya untuk upload ulang postingan satu per satu ke Reels, Shorts, TikTok, & Feed. Buat sekali, jadwalkan untuk sebulan penuh.",
    tag: "Hemat 10+ Jam/Minggu"
  },
  {
    icon: Store,
    iconBg: "bg-emerald-100 text-emerald-600",
    badge: "Fokus Jualan",
    title: "Pemilik Bisnis & Online Shop (UMKM)",
    description: "Jaga konsistensi posting promosi di semua akun sosmed tanpa harus bayar admin mahal. Konten promosi tayang otomatis sesuai jam ramai pembeli.",
    tag: "Tanpa Admin Tambahan"
  },
  {
    icon: Briefcase,
    iconBg: "bg-sky-100 text-sky-600",
    badge: "Multi-Client Engine",
    title: "Digital Agency & Social Media Manager",
    description: "Kelola puluhan akun sosmed klien dalam workspace terpisah, minta approval klien via 1 link praktis, dan buat laporan bulanan PDF dalam 5 detik.",
    tag: "Client Approval Portal"
  },
  {
    icon: Target,
    iconBg: "bg-amber-100 text-amber-600",
    badge: "Efisiensi Marketing",
    title: "Social Media Specialist & Tim Marketing",
    description: "Atur brief campaign influencer, analisis performa statistik sosmed secara real-time, serta optimasi strategi konten dalam satu platform.",
    tag: "All-in-One Growth Toolkit"
  }
];

const DEFAULT_PRICING_PLANS = [
  {
    tier: "trial",
    badge: "Gratis 3 Hari",
    badgeBg: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white",
    name: "Starter Trial",
    price: "Rp 0",
    period: "3 hari",
    posts: "30 posts",
    postsDetail: "",
    color: "from-slate-500 to-slate-700",
    iconBg: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    features: [
      "30 posts total",
      "Gratis tanpa biaya (Rp 0)",
      "Unlimited akun sosmed",
      "Semua platform didukung",
      "Berlaku 3 hari",
    ],
    buttonText: "Mulai Trial",
    buttonStyle: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20",
    popular: false
  },
  {
    tier: "creator",
    badge: null,
    badgeBg: "",
    name: "Creator",
    price: "Rp 49.000",
    period: "/bulan",
    posts: "50 posts",
    postsDetail: "",
    color: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
    features: [
      "50 posts/bulan",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant & AI Agent Briefing Otomatis",
      "KOL Manager & Deliverable Tracker",
      "Executive PDF Report Generator",
    ],
    buttonText: "Pilih Creator",
    buttonStyle: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300",
    popular: false
  },
  {
    tier: "agency",
    badge: "Paling Populer",
    badgeBg: "bg-gradient-to-r from-purple-500 to-violet-600 text-white",
    name: "Agency",
    price: "Rp 299.000",
    period: "/bulan",
    posts: "300 posts",
    postsDetail: "",
    color: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100 text-purple-600",
    border: "border-purple-300 shadow-purple-100/80",
    features: [
      "300 posts/bulan",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant & AI Agent Briefing Otomatis",
      "KOL Manager & Deliverable Tracker",
      "Executive PDF Report Generator",
    ],
    buttonText: "Pilih Agency",
    buttonStyle: "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40",
    popular: true
  },
  {
    tier: "studio",
    badge: "Terbaik",
    badgeBg: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    name: "Studio",
    price: "Rp 749.000",
    period: "/bulan",
    posts: "1.000 posts",
    postsDetail: "",
    color: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    features: [
      "1.000 posts/bulan",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant & AI Agent Briefing Otomatis",
      "KOL Manager & Deliverable Tracker",
      "Executive PDF Report Generator",
    ],
    buttonText: "Pilih Studio",
    buttonStyle: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300",
    popular: false
  }
];

const FAQS = [
  {
    question: "Bagaimana cara menghubungkan akun sosial media ke Shiera?",
    answer: "Sangat mudah! Di menu Accounts Manager, Anda dapat mengaitkan akun Instagram, TikTok, Facebook, LinkedIn, YouTube, X, & Bluesky via OAuth resmi. Anda juga bisa mengatur Briefing Tone brand dan Auto-Watermark untuk setiap akun."
  },
  {
    question: "Bagaimana cara kerja Multi-Channel Post Composer & AI Auto-Caption?",
    answer: "Composer Shiera memungkinkan Anda menjadwalkan konten ke banyak sosmed sekaligus dalam 1 kali klik. Dilengkapi Shiera AI Co-Pilot yang dapat membuatkan caption menarik, tagar (hashtags), dan penyesuaian format media otomatis per platform."
  },
  {
    question: "Bagaimana Shiera AI Agent bekerja secara otomatis?",
    answer: "Shiera AI Agent mempelajari profil dan briefing brand Anda. Agent akan secara otomatis menghasilkan ide draf & brief konten harian sesuai pilar konten pilihan Anda, yang kemudian dapat ditinjau dan ditransfer langsung ke Composer."
  },
  {
    question: "Bagaimana cara kerja Queue (Antrean) dan Kalender Konten?",
    answer: "Menu Queue memantau status postingan secara real-time (Draft, Scheduled, Processing, Published). Anda juga dapat melihat visualisasi kalender bulanan interaktif dalam zona waktu WIB/UTC untuk memastikan konsistensi postingan."
  },
  {
    question: "Bagaimana cara mengirimkan link persetujuan (Client Approval Portal) ke klien?",
    answer: "Untuk agensi atau tim marketing, Anda dapat membagikan link preview persetujuan profesional kepada klien. Klien dapat melihat tampilan presisi feed dan memberikan approval/catatan revisi tanpa perlu membuat akun."
  },
  {
    question: "Bagaimana fitur Executive PDF Report Generator bekerja?",
    answer: "Menu Statistics & Reports mengagregasi metric engagement, reach, dan impresi dari semua saluran sosmed. Anda dapat meng-generate laporan bulanan format PDF siap kirim dan memasang logo agensi Anda sendiri (White-Label)."
  },
  {
    question: "Apakah Shiera aman dan melanggar API Instagram / TikTok?",
    answer: "Shiera 100% Aman dan Legal. Kami menggunakan Official Graph API dari Meta (Instagram & Facebook), TikTok Content Posting API, LinkedIn API, YouTube API, dan X API resmi tanpa scraping ilegal sehingga akun Anda bebas risiko."
  },
  {
    question: "Metode pembayaran apa saja yang didukung & bagaimana cara klaim Free Trial?",
    answer: "Free Trial 3 Hari dapat diklaim langsung setelah verifikasi nomor WhatsApp aktif. Pembayaran paket langganan diproses secara otomatis & aman via Midtrans Payment Gateway (QRIS, GoPay, ShopeePay, Virtual Account Bank, & Credit Card)."
  }
];

export default function LandingHomePage() {
  const { isAuthenticated } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState("ALL SOLUTIONS");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<any[]>(DEFAULT_PRICING_PLANS);

  // Fetch live pricing from API on landing page
  useEffect(() => {
    fetchApi("/billing/plans")
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p) => {
            const defaultPlan = DEFAULT_PRICING_PLANS.find(dp => dp.tier === p.tier);
            const priceStr = p.price_idr ? `Rp ${Number(p.price_idr).toLocaleString("id-ID")}` : "Rp 0";
            const periodStr = p.tier === "trial" ? `${p.duration_days} hari` : "/bulan";
            const postsStr = `${Number(p.post_quota).toLocaleString("id-ID")} posts`;
            const postsDetail = "";

            return {
              tier: p.tier,
              badge: defaultPlan?.badge || null,
              badgeBg: defaultPlan?.badgeBg || "",
              name: p.name,
              price: priceStr,
              period: periodStr,
              posts: postsStr,
              postsDetail: postsDetail,
              color: defaultPlan?.color || "from-purple-500 to-violet-600",
              iconBg: defaultPlan?.iconBg || "bg-purple-100 text-purple-600",
              border: defaultPlan?.border || "border-purple-300",
              features: p.features && p.features.length > 0 ? p.features : (defaultPlan?.features || []),
              buttonText: defaultPlan?.buttonText || `Pilih ${p.name}`,
              buttonStyle: defaultPlan?.buttonStyle || "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300",
              popular: defaultPlan?.popular || false,
            };
          });

          // Sort from cheapest to most expensive (Trial -> Creator -> Agency -> Studio)
          const tierOrder: Record<string, number> = { trial: 1, creator: 2, agency: 3, studio: 4 };
          mapped.sort((a, b) => (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0));
          setPricingPlans(mapped);
        }
      })
      .catch(() => {});
  }, []);

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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-20 px-4 sm:px-8 flex items-center justify-between relative transition-all">
        {/* Brand Logo Left */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 p-2 flex items-center justify-center shadow-md shadow-purple-500/20 group-hover:scale-105 transition-all">
              <img 
                src="/logo.png" 
                alt="Shiera Logo" 
                className="w-full h-full object-contain brightness-0 invert" 
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 font-['Outfit']">
              Shiera<span className="text-purple-600">.</span>
            </span>
          </Link>
        </div>

        {/* Center Navigation Links (Centered) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 absolute left-1/2 -translate-x-1/2">
          
          {/* Fitur & Solusi Dropdown Popover */}
          <div 
            className="relative"
            onMouseEnter={() => setIsNavDropdownOpen(true)}
            onMouseLeave={() => setIsNavDropdownOpen(false)}
          >
            <button 
              onClick={() => setIsNavDropdownOpen(!isNavDropdownOpen)}
              className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-700 hover:text-purple-600 transition-colors py-2"
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Fitur &amp; Solusi</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isNavDropdownOpen ? "rotate-180 text-purple-600" : ""}`} />
            </button>

            {/* Floating Popover Card */}
            {isNavDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 z-50">
                <a 
                  href="#features" 
                  onClick={() => { setActiveCategory("SCHEDULER"); setIsNavDropdownOpen(false); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50/70 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Multi-Channel Scheduler</div>
                    <div className="text-[11px] text-slate-500">Auto-post ke 10+ platform sosmed.</div>
                  </div>
                </a>

                <a 
                  href="#features" 
                  onClick={() => { setActiveCategory("AI ASSISTANT"); setIsNavDropdownOpen(false); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-purple-50/70 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors flex items-center gap-1.5">
                      <span>AI Agent Center</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 text-[8px] font-bold">AUTO</span>
                    </div>
                    <div className="text-[11px] text-slate-500">Briefing &amp; draf ide harian otomatis.</div>
                  </div>
                </a>

                <a 
                  href="#features" 
                  onClick={() => { setActiveCategory("KOL MANAGEMENT"); setIsNavDropdownOpen(false); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/70 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">KOL Campaigns</div>
                    <div className="text-[11px] text-slate-500">Kelola brief influencer &amp; hitung ROI.</div>
                  </div>
                </a>

                <a 
                  href="#features" 
                  onClick={() => { setActiveCategory("REPORT & ANALYTICS"); setIsNavDropdownOpen(false); }}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-indigo-50/70 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <FileBarChart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Executive PDF Reports</div>
                    <div className="text-[11px] text-slate-500">Laporan bulanan format PDF white-label.</div>
                  </div>
                </a>
              </div>
            )}
          </div>

          <a 
            href="#pricing" 
            className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-700 hover:text-purple-600 transition-colors"
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Paket Harga</span>
          </a>
          <a 
            href="#faq" 
            className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-700 hover:text-purple-600 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-sky-500" />
            <span>FAQ</span>
          </a>
        </nav>

        {/* Right Utilities */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <Link 
              href="/dashboard" 
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 transition-all hover:scale-[1.02]"
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
                className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
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
          <span className="text-slate-600">Solusi Sosmed Auto-Post #1 di Indonesia</span>
        </div>

        {/* Main Headline H1 */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight leading-[1.15]">
            Kelola &amp; Posting Semua Sosmed Dalam 1 Platform,{" "}
            <span className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
              Gak Pake Capek Upload Manual
            </span>
          </h1>
          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Stop buang waktu upload manual. Satu platform untuk auto-post ke 10+ sosmed, AI Assistant strategi &amp; brief, KOL manager, hingga laporan PDF executive otomatis.
          </p>
        </div>

        {/* Floating Search Pill Component (Airbnb Global Search Capsule) */}
        <div className="max-w-4xl mx-auto pt-4">
          <div className="bg-white rounded-3xl md:rounded-full border border-slate-200/90 shadow-xl shadow-slate-200/60 p-3 md:p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-0 hover:shadow-2xl transition-all">
            
            {/* Segment 1: Client / Brand Workspace */}
            <div className="flex-1 text-left px-4 sm:px-5 py-3 md:py-2 border-b md:border-b-0 md:border-r border-slate-100 md:border-slate-200 hover:bg-purple-50/50 rounded-2xl md:rounded-full cursor-pointer transition-all flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl md:rounded-full bg-purple-100/70 group-hover:bg-purple-600 flex items-center justify-center shrink-0 transition-colors">
                <Building2 className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Mau posting ke mana?</div>
                <div className="text-xs text-slate-500 truncate">Pilih Brand / Workspace Klien</div>
              </div>
            </div>

            {/* Segment 2: Social Channels */}
            <div className="flex-1 text-left px-4 sm:px-5 py-3 md:py-2 border-b md:border-b-0 md:border-r border-slate-100 md:border-slate-200 hover:bg-purple-50/50 rounded-2xl md:rounded-full cursor-pointer transition-all flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl md:rounded-full bg-purple-100/70 group-hover:bg-purple-600 flex items-center justify-center shrink-0 transition-colors">
                <Share2 className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Channel sosmed apa?</div>
                <div className="text-xs text-slate-500 truncate">Instagram, TikTok, FB, LinkedIn, X, YT</div>
              </div>
            </div>

            {/* Segment 3: Solution Type */}
            <div className="flex-1 text-left px-4 sm:px-5 py-3 md:py-2 hover:bg-purple-50/50 rounded-2xl md:rounded-full cursor-pointer transition-all flex items-center gap-3.5 group">
              <div className="w-9 h-9 rounded-xl md:rounded-full bg-purple-100/70 group-hover:bg-purple-600 flex items-center justify-center shrink-0 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-900">Tipe Solusi</div>
                <div className="text-xs text-slate-500 truncate">Auto Scheduler, AI Agent, KOL, PDF Report</div>
              </div>
            </div>

            {/* Search Orb Button (Electric Purple) */}
            <div className="w-full md:w-auto shrink-0 md:pl-2 pt-1 md:pt-0">
              <Link 
                href={isAuthenticated ? "/dashboard" : "/login"}
                className="w-full md:w-12 h-12 rounded-2xl md:rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-sm flex items-center justify-center gap-2 px-5 md:px-0 shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <Search className="w-5 h-5" />
                <span className="md:hidden">Cari Solusi Sekarang</span>
              </Link>
            </div>

          </div>
        </div>

      </section>


      {/* ── [NEW SECTION] "Untuk Siapa Shiera Dirancang?" ────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit mx-auto">
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Solusi Untuk Semua Pengguna</span>
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
            Untuk Siapa Shiera Dirancang?
          </h2>
          <p className="text-xs sm:text-base text-slate-600 leading-relaxed">
            Bukan hanya untuk agency besar! Shiera diciptakan untuk <strong>siapa saja yang ingin mengelola sosmed tanpa lelah upload satu per satu</strong> secara manual.
          </p>
        </div>

        {/* 4 Audience Cards in Airbnb Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TARGET_AUDIENCE.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 border-2 border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-slate-900 font-['Outfit'] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-xl border border-purple-100 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-purple-600" />
                    <span>{item.tag}</span>
                  </span>
                </div>
              </div>
            );
          })}
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
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 border-t border-slate-200/80">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit">
              <Sliders className="w-3.5 h-3.5 text-purple-600" />
              <span>Platform Features</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-['Outfit'] tracking-tight mt-2">
              Fitur Canggih Yang Membuat Kerja Sosmed
            </h2>
          </div>
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
        <div className="max-w-6xl mx-auto px-4 text-center space-y-12 relative z-10">
          
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
              <span>DIPERCAYA Creator, Olshop, &amp; Agency</span>
            </p>
          </div>

          {/* Headline Statement */}
          <h2 className="text-2xl sm:text-4xl font-extrabold max-w-3xl mx-auto leading-tight font-['Outfit']">
            &ldquo;Solusi Kelola Sosmed Auto-Post Yang Hemat Waktu &amp; Diandalkan Tim Creative&rdquo;
          </h2>

          {/* 3 Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Kelola 25+ akun sosmed klien sekarang super efisien. Fitur Client Approval link sangat membantu — klien tinggal approve tanpa harus bolak-balik kirim revisi di WhatsApp.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  RA
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Rian Ardiansyah</p>
                  <p className="text-xs text-purple-300">Managing Director, GrowthMedia Agency</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Shiera AI Agent penolong banget! Draf ide konten harian langsung dibuatin sesuai persona brand aku. Sekali setting composer, postingan 1 bulan di Reels &amp; TikTok beres.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  CP
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Clarissa Putri</p>
                  <p className="text-xs text-emerald-300">Content Creator &amp; Lifestyle Influencer</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  &ldquo;Dulu tim kami buang 2 jam sehari cuma buat upload ulang ke 5 sosmed. Dengan auto-scheduler Shiera, kami bisa fokus buat konten promo kreatif &amp; tingkatkan omzet.&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white text-xs shadow-md">
                  HS
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Hendy Setiawan</p>
                  <p className="text-xs text-amber-300">Head of Marketing, LocalBrand Co.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ── [SECTION 6] 3-Step Workflow ──────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 w-fit mx-auto">
            <Clock className="w-3.5 h-3.5 text-purple-600" />
            <span>Alur Kerja Otomatis</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-['Outfit'] tracking-tight">
            Kelola Sosmed Dalam 3 Langkah Mudah &amp; Praktis
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Otomatisasi seluruh proses manajemen media sosial Anda dari perencanaan ide hingga publikasi otomatis.
          </p>
        </div>

        {/* 3 Step Workflow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              1
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">1. Hubungkan Akun Sosmed</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hubungkan akun Instagram, TikTok, Facebook, LinkedIn, YouTube, &amp; X Anda via API resmi dalam hitungan detik.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              2
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">2. Buat &amp; Jadwalkan Konten</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan Multi-Channel Composer &amp; AI Co-Pilot untuk buat caption otomatis, atur media, &amp; tentukan tanggal tayang.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 space-y-4 shadow-xs hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-lg">
              3
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-['Outfit']">3. Auto-Post &amp; Laporan PDF</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistem menayangkan konten secara otomatis 100% tepat waktu dan siap di-export menjadi laporan PDF executive.
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
              <span>Pilihan Paket Fleksibel</span>
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
              Semua Paket, <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Unlimited Akun Sosmed</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              Tidak ada batasan jumlah akun sosial media. Bedanya hanya di kuota post per periode. Pembayaran aman via <strong>Midtrans (QRIS, GoPay, VA &amp; Card)</strong>.
            </p>
          </div>

          {/* Pricing Grid matching https://shiera.web.id/pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <div 
                key={plan.tier}
                className={`relative flex flex-col rounded-3xl border-2 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular ? "border-purple-400 shadow-purple-100/80" : plan.border
                }`}
              >
                {/* Floating Top Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold shadow-md ${plan.badgeBg}`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${plan.iconBg} flex items-center justify-center shrink-0`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base font-['Outfit']">{plan.name}</h3>
                        {plan.postsDetail && <p className="text-xs text-slate-400">{plan.postsDetail}</p>}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{plan.price}</span>
                      <span className="text-xs text-slate-400">{plan.period}</span>
                    </div>

                    {/* Post quota highlight box */}
                    <div className={`p-3 rounded-2xl bg-gradient-to-r ${plan.color} text-white text-center`}>
                      <p className="text-lg font-bold font-['Outfit']">{plan.posts}</p>
                      <p className="text-xs opacity-80">post per periode</p>
                    </div>

                    <ul className="space-y-2">
                      {plan.features.map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 mt-auto">
                    <Link
                      href="/pricing"
                      className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.buttonStyle}`}
                    >
                      <span>{plan.buttonText}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>


      {/* ── [SECTION 8] Frequently Asked Questions (FAQ) ──────────────────── */}
      <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
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
            Bebaskan Diri Dari Rutinitas Upload Sosmed Manual
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ratusan Creator, Olshop, &amp; Agency di Indonesia yang mengelola media sosial tanpa stres.
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

          <div className="text-[11px] sm:text-xs text-slate-300 pt-2 flex flex-wrap items-center justify-center gap-y-2 gap-x-3 text-center">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Tanpa Kartu Kredit</span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Batal Kapan Saja</span>
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Support WA Fast Response</span>
            </span>
          </div>
        </div>
      </section>


      {/* ── Footer Light Band (Airbnb Footer Style) ────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 p-1.5 flex items-center justify-center shadow-sm">
                <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="text-lg font-bold text-slate-900 font-['Outfit']">Shiera<span className="text-purple-600">.</span></span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Platform Social Media Management #1 untuk Creator, Olshop, Digital Agency, dan Brand di Indonesia.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Produk &amp; Fitur</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><a href="#features" className="hover:text-purple-600 transition-colors">Multi-Channel Scheduler</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">AI Agent Autopilot</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">KOL Campaign Tracker</a></li>
              <li><a href="#features" className="hover:text-purple-600 transition-colors">Executive PDF Reports</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Solusi &amp; Layanan</p>
            <ul className="space-y-1.5 text-slate-500">
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">Executive PDF Reports</a></li>
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">Client Approval Portal</a></li>
              <li><a href="#pricing" className="hover:text-purple-600 transition-colors">Pilihan Paket Harga</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-slate-900">Dukungan</p>
            <ul className="space-y-1.5 text-slate-500">
              <li>
                <a 
                  href="https://wa.me/6289654728249?text=Halo%20Tim%20Shiera,%20saya%20butuh%20bantuan" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-purple-600 transition-colors"
                >
                  Bantuan WhatsApp (+62 896-5472-8249)
                </a>
              </li>
              <li><Link href="/privacy" className="hover:text-purple-600 transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-purple-600 transition-colors">Syarat &amp; Ketentuan</Link></li>
            </ul>
          </div>

        </div>

        {/* Legal Bottom Band */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400">
          <p>© 2026 Shiera Inc. PT. Digital Inter Nusa</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>🇮🇩 Indonesia (IDR)</span>
            <Link href="/privacy" className="hover:text-purple-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-purple-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
