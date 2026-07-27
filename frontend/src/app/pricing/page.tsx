"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CreditCard, Zap, Crown, Rocket, Building2, ChevronRight, Check } from "lucide-react";

const PLANS = [
  {
    tier: "trial",
    name: "Starter Trial",
    price: "$0",
    period: "3 hari",
    posts: "6 posts",
    postsDetail: "2 posts/hari",
    icon: Zap,
    color: "from-slate-500 to-slate-700",
    iconBg: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    badge: "Card Link Required",
    features: [
      "6 posts total (2 post/hari)",
      "Tautkan kartu kredit saja ($0)",
      "Unlimited social accounts",
      "Semua 10+ platform didukung",
      "Batal kapan saja",
    ],
  },
  {
    tier: "creator",
    name: "Creator",
    price: "$3",
    period: "/bulan",
    posts: "50 posts",
    postsDetail: "~1.6 post/hari",
    icon: Rocket,
    color: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
    badge: null,
    features: [
      "50 posts/bulan",
      "Unlimited social accounts",
      "Semua 10+ platform",
      "Scheduling & media library",
      "Auto-renewal bulanan",
    ],
  },
  {
    tier: "agency",
    name: "Agency",
    price: "$19",
    period: "/bulan",
    posts: "300 posts",
    postsDetail: "~10 post/hari",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100 text-purple-600",
    border: "border-purple-300",
    badge: "Most Popular",
    features: [
      "300 posts/bulan",
      "Unlimited social accounts",
      "Multi-client management",
      "Semua 10+ platform",
      "Scheduling & media library",
      "Priority queue engine",
      "Auto-renewal bulanan",
    ],
  },
  {
    tier: "studio",
    name: "Studio",
    price: "$49",
    period: "/bulan",
    posts: "1.000 posts",
    postsDetail: "~33 post/hari",
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    badge: "Best Value",
    features: [
      "1.000 posts/bulan",
      "Unlimited social accounts",
      "Unlimited clients",
      "Semua 10+ platform",
      "Full media library",
      "API access & priority support",
      "Auto-renewal bulanan",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();

  const handleSelectPlan = async (tier: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAdmin) {
      router.push("/");
      return;
    }

    // Redirect to checkout
    try {
      const stored = localStorage.getItem("agencyos-auth");
      const token = stored ? JSON.parse(stored)?.state?.idToken : null;

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_BASE}/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          plan_tier: tier,
          success_url: `${window.location.origin}/billing/success?plan=${tier}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.checkout_url;
      } else {
        const err = await res.json();
        alert(err.detail || "Gagal membuat checkout. Hubungi admin.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error. Coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 py-16 px-4">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold">
          <CreditCard className="w-3.5 h-3.5" />
          Pilih Paket Kamu
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
          Semua paket,{" "}
          <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
            unlimited akun
          </span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
          Tidak ada batasan jumlah akun sosial media. Bedanya hanya di kuota post per periode.
          Makin besar kebutuhan, makin besar kuota.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isPopular = plan.badge === "Most Popular";
          return (
            <div
              key={plan.tier}
              className={`relative flex flex-col rounded-3xl border-2 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                isPopular ? "border-purple-400 shadow-purple-100/80" : plan.border
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-md ${
                  isPopular ? "bg-gradient-to-r from-purple-500 to-violet-600" : "bg-gradient-to-r from-amber-500 to-orange-500"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${plan.iconBg} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-['Outfit']">{plan.name}</h3>
                    <p className="text-xs text-slate-400">{plan.postsDetail}</p>
                  </div>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 font-['Outfit']">{plan.price}</span>
                  <span className="text-sm text-slate-400">{plan.period}</span>
                </div>

                {/* Post quota highlight */}
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${plan.color} text-white text-center`}>
                  <p className="text-lg font-bold font-['Outfit']">{plan.posts}</p>
                  <p className="text-xs opacity-80">post per periode</p>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-5 pt-0 mt-auto">
                <button
                  id={`plan-cta-${plan.tier}`}
                  onClick={() => handleSelectPlan(plan.tier)}
                  className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isPopular
                      ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                  }`}
                >
                  <span>{isAuthenticated ? "Pilih Paket" : "Mulai Sekarang"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div className="text-center mt-10 space-y-2">
        <p className="text-xs text-slate-400">
          💳 Pembayaran aman via Stripe · Sandbox/test mode aktif
        </p>
        <p className="text-xs text-slate-400">
          Tidak ada contract. Bisa cancel kapan saja. API cost kami $0.01/post, margin kami terbuka.
        </p>
      </div>
    </div>
  );
}
