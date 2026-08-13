"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, MessageCircle, Lock, Eye, Server, UserCheck, HelpCircle } from "lucide-react";

export default function PrivacyPolicyPage() {
  const waNumber = "6289654728249";
  const waUrl = `https://wa.me/${waNumber}?text=Halo%20Tim%20Shiera,%20saya%20ingin%20bertanya%20mengenai%20Kebijakan%20Privasi%20Data`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 px-4 sm:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-purple-600 p-1.5 flex items-center justify-center shadow-md">
            <img src="/logo.png" alt="Shiera Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 font-['Outfit']">
            Shiera<span className="text-purple-600">.</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-purple-600 bg-slate-100 hover:bg-purple-50 px-3.5 py-2 rounded-full transition-all border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        
        {/* Banner Title */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Perlindungan Data &amp; Privasi
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-['Outfit'] tracking-tight">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Terakhir Diperbarui: 13 Agustus 2026 • Komitmen kami dalam melindungi kerahasiaan &amp; token akses akun Anda.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8 text-xs sm:text-sm text-slate-700 leading-relaxed">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">1</span>
              Informasi Yang Kami Kumpulkan
            </h2>
            <p>
              Saat Anda menggunakan Shiera, kami mengumpulkan informasi yang diperlukan untuk mengoperasikan layanan penjadwalan dan manajemen akun sosial media:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Data Akun Pendaftaran:</strong> Nama, alamat email, nomor telepon/WhatsApp untuk verifikasi OTP.</li>
              <li><strong>Access Token OAuth Sosmed:</strong> Kunci enkripsi akses akun yang diberikan saat Anda menghubungkan Instagram, TikTok, Facebook, LinkedIn, YouTube, X, atau Bluesky.</li>
              <li><strong>Aset Media &amp; Konten:</strong> Gambar, video, caption, dan jadwal postingan yang Anda unggah ke sistem.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">2</span>
              Pengamanan Token Akses &amp; Enkripsi Data
            </h2>
            <p>
              Keamanan token akses Anda adalah prioritas tertinggi kami. Kunci enkripsi token OAuth disimpan dalam database terenkripsi berstandar industri (AES-256) dan tidak pernah disimpan dalam bentuk plain-text. Shiera tidak pernah meminta kata sandi (password) akun sosial media Anda secara langsung.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">3</span>
              Tujuan Penggunaan Data
            </h2>
            <p>Informasi yang dikumpulkan digunakan secara eksklusif untuk:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li>Mengeksekusi penayangan otomatis konten yang Anda jadwalkan ke platform tujuan.</li>
              <li>Mengumpulkan metric analitik performa (reach, impresi, engagement) untuk laporan PDF Anda.</li>
              <li>Memberikan rekomendasi AI Agent &amp; auto-caption sesuai pilar konten brand Anda.</li>
              <li>Mengirimkan notifikasi status publikasi dan pembaharuan layanan via WhatsApp / Email.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">4</span>
              Pembagian Data Kepada Pihak Ketiga
            </h2>
            <p>
              Shiera <strong>TIDAK PERNAH SEWA ATAU MENJUAL</strong> data pribadi atau token akses Anda kepada pihak ketiga atau pengiklan mana pun. Data hanya dikirimkan ke endpoint Official Graph API resmi (Meta, TikTok, Google, LinkedIn, X) untuk memproses postingan Anda, serta ke gateway pembayaran resmi Midtrans untuk memproses transaksi.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2 border-b border-slate-100 pb-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">5</span>
              Hak Pengguna &amp; Penghapusan Data (Data Deletion)
            </h2>
            <p>
              Anda berhak secara penuh untuk memutuskan koneksi akun sosial media Anda kapan saja melalui halaman Accounts Management. Saat Anda menghapus akun sosmed dari Shiera, seluruh token akses terkait akan langsung dicabut dan dihapus secara permanen dari server kami.
            </p>
          </section>

          {/* Support WA Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-800 text-white space-y-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="font-bold text-base font-['Outfit'] flex items-center justify-center sm:justify-start gap-2">
                <HelpCircle className="w-5 h-5 text-purple-200" />
                <span>Ada Pertanyaan Mengenai Keamanan Privasi?</span>
              </h3>
              <p className="text-xs text-purple-100">
                Hubungi tim Customer Support &amp; Compliance kami langsung via WhatsApp.
              </p>
            </div>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-white text-purple-900 font-bold text-xs hover:bg-purple-50 transition-all flex items-center gap-2 shrink-0 shadow-md"
            >
              <MessageCircle className="w-4 h-4 text-purple-600" />
              <span>WA +62 896-5472-8249</span>
            </a>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400">
          <p>© 2026 Shiera Inc. PT. Digital Inter Nusa. All rights reserved.</p>
        </div>

      </main>

    </div>
  );
}
