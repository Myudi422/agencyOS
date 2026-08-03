"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { CreditCard, Zap, Crown, Rocket, Building2, ChevronRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { fetchApi } from "@/lib/api";
import WaVerifyModal from "@/components/billing/WaVerifyModal";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: any) => void;
    };
  }
}

const TIER_UI_META: Record<string, any> = {
  trial: {
    icon: Zap,
    color: "from-slate-500 to-slate-700",
    iconBg: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    badge: "Gratis 3 Hari",
  },
  creator: {
    icon: Rocket,
    color: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
    badge: null,
  },
  agency: {
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100 text-purple-600",
    border: "border-purple-300",
    badge: "Paling Populer",
  },
  studio: {
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    badge: "Terbaik",
  },
};

const DEFAULT_PLANS = [
  {
    tier: "trial",
    name: "Starter Trial",
    price: "Rp 0",
    period: "3 hari",
    posts: "6 posts",
    postsDetail: "2 posts/hari",
    icon: Zap,
    color: "from-slate-500 to-slate-700",
    iconBg: "bg-slate-100 text-slate-600",
    border: "border-slate-200",
    badge: "Gratis 3 Hari",
    features: [
      "6 posts total (2 post/hari)",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant support analisa, brainstorm & brief",
      "KOL Manager & Deliverable Tracker",
      "Competitor Spy & Executive PDF Report",
      "Wajib verifikasi WhatsApp",
    ],
  },
  {
    tier: "creator",
    name: "Creator",
    price: "Rp 49.000",
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
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant support analisa, brainstorm & brief",
      "KOL Manager & Deliverable Tracker",
      "Competitor Spy & Executive PDF Report",
    ],
  },
  {
    tier: "agency",
    name: "Agency",
    price: "Rp 299.000",
    period: "/bulan",
    posts: "300 posts",
    postsDetail: "~10 post/hari",
    icon: Crown,
    color: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100 text-purple-600",
    border: "border-purple-300",
    badge: "Paling Populer",
    features: [
      "300 posts/bulan",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant support analisa, brainstorm & brief",
      "KOL Manager & Deliverable Tracker",
      "Competitor Spy & Executive PDF Report",
    ],
  },
  {
    tier: "studio",
    name: "Studio",
    price: "Rp 749.000",
    period: "/bulan",
    posts: "1.000 posts",
    postsDetail: "~33 post/hari",
    icon: Building2,
    color: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100 text-amber-600",
    border: "border-amber-200",
    badge: "Terbaik",
    features: [
      "1.000 posts/bulan",
      "Unlimited akun sosmed",
      "Multi-client management",
      "Semua 10+ platform",
      "AI Assistant support analisa, brainstorm & brief",
      "KOL Manager & Deliverable Tracker",
      "Competitor Spy & Executive PDF Report",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  // WA Verify Modal state
  const [showWaModal, setShowWaModal] = useState(false);
  const [pendingTrialClaim, setPendingTrialClaim] = useState(false);

  // Fetch live active plans from backend API
  useEffect(() => {
    fetchApi("/billing/plans")
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((p) => {
            const ui = TIER_UI_META[p.tier] || TIER_UI_META.creator;
            const priceStr = p.price_idr ? `Rp ${Number(p.price_idr).toLocaleString("id-ID")}` : "Rp 0";
            const periodStr = p.tier === "trial" ? `${p.duration_days} hari` : "/bulan";
            const postsStr = `${Number(p.post_quota).toLocaleString("id-ID")} posts`;
            const dailyApprox = (p.post_quota / (p.duration_days || 30)).toFixed(1);
            const postsDetail = p.tier === "trial" ? `2 posts/hari` : `~${dailyApprox} post/hari`;

            const fallbackFeatures = DEFAULT_PLANS.find(dp => dp.tier === p.tier)?.features || [];

            return {
              tier: p.tier,
              name: p.name,
              price: priceStr,
              period: periodStr,
              posts: postsStr,
              postsDetail: postsDetail,
              icon: ui.icon,
              color: ui.color,
              iconBg: ui.iconBg,
              border: ui.border,
              badge: ui.badge,
              features: p.features && p.features.length > 0 ? p.features : fallbackFeatures,
            };
          });
          setPlans(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // ── Checkout for paid plans ──────────────────────────────────────────────
  const doCheckout = async (tier: string) => {
    setLoadingTier(tier);
    try {
      const data: any = await fetchApi("/billing/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan_tier: tier,
          finish_url: `${window.location.origin}/billing/success?plan=${tier}`,
        }),
      });

      if (data?.is_trial && data?.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }

      if (data?.snap_token) {
        if (typeof window !== "undefined" && window.snap) {
          window.snap.pay(data.snap_token, {
            onSuccess: function (result: any) {
              console.log("Midtrans success:", result);
              router.push(`/billing/success?plan=${tier}&order_id=${data.order_id}`);
            },
            onPending: function (result: any) {
              console.log("Midtrans pending:", result);
              const orderId = result?.order_id || data?.order_id;
              router.push(`/billing/success?plan=${tier}&order_id=${orderId}`);
            },
            onError: function (result: any) {
              console.error("Midtrans error:", result);
              alert("Pembayaran gagal atau dibatalkan. Silakan coba lagi.");
            },
            onClose: function () {
              console.log("Midtrans modal closed");
            },
          });
        } else if (data?.snap_url) {
          window.location.href = data.snap_url;
        } else {
          alert("Gagal memuat sistem pembayaran Midtrans. Coba muat ulang halaman.");
        }
      } else {
        alert("Gagal membuat checkout session.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Gagal memproses pembayaran. Coba lagi.");
    } finally {
      setLoadingTier(null);
    }
  };

  // ── Handle plan click ────────────────────────────────────────────────────
  const handleSelectPlan = async (tier: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (isAdmin) {
      router.push("/");
      return;
    }

    // Trial: wajib lewat WA OTP dulu
    if (tier === "trial") {
      setPendingTrialClaim(true);
      setShowWaModal(true);
      return;
    }

    // Paid plan: langsung checkout
    await doCheckout(tier);
  };

  // ── Setelah WA OTP sukses → lanjut claim trial ───────────────────────────
  const handleWaVerified = async () => {
    setShowWaModal(false);
    setPendingTrialClaim(false);
    await doCheckout("trial");
  };

  return (
    <>
      {/* WA Verify Modal */}
      <WaVerifyModal
        isOpen={showWaModal}
        onClose={() => {
          setShowWaModal(false);
          setPendingTrialClaim(false);
        }}
        onVerified={handleWaVerified}
      />

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
            Pembayaran aman & praktis via <strong>Midtrans (QRIS, GoPay, ShopeePay, VA & Card)</strong>.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.badge === "Paling Populer";
            const isLoading = loadingTier === plan.tier || (pendingTrialClaim && plan.tier === "trial");
            const isTrial = plan.tier === "trial";

            return (
              <div
                key={plan.tier}
                className={`relative flex flex-col rounded-3xl border-2 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  isPopular ? "border-purple-400 shadow-purple-100/80" : plan.border
                }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-white shadow-md ${
                      isPopular
                        ? "bg-gradient-to-r from-purple-500 to-violet-600"
                        : isTrial
                        ? "bg-gradient-to-r from-green-500 to-emerald-600"
                        : "bg-gradient-to-r from-amber-500 to-orange-500"
                    }`}
                  >
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
                    <span className="text-2xl font-extrabold text-slate-900 font-['Outfit']">{plan.price}</span>
                    <span className="text-xs text-slate-400">{plan.period}</span>
                  </div>

                  {/* Post quota highlight */}
                  <div className={`p-3 rounded-2xl bg-gradient-to-r ${plan.color} text-white text-center`}>
                    <p className="text-lg font-bold font-['Outfit']">{plan.posts}</p>
                    <p className="text-xs opacity-80">post per periode</p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((f: string) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* WA Verification badge untuk trial */}
                  {isTrial && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium bg-emerald-50 rounded-xl px-3 py-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Wajib verifikasi WhatsApp</span>
                    </div>
                  )}
                </div>

                <div className="p-5 pt-0 mt-auto">
                  <button
                    id={`plan-cta-${plan.tier}`}
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 ${
                      isPopular
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40"
                        : isTrial
                        ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300/40 hover:shadow-xl hover:shadow-green-400/50"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <span>{isAuthenticated ? "Pilih Paket" : "Mulai Sekarang"}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-10 space-y-2">
          <p className="text-xs text-slate-400">
            🇮🇩 Pembayaran aman via <strong>Midtrans Payment Gateway</strong> (QRIS, GoPay, ShopeePay, Virtual Account, & Credit Card)
          </p>
          <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Free trial memerlukan verifikasi nomor WhatsApp aktif. Satu nomor WA, satu akun.
          </p>
          <p className="text-xs text-slate-400">
            Tidak ada kontrak mengikat. Bisa batal kapan saja.
          </p>
        </div>
      </div>
    </>
  );
}
