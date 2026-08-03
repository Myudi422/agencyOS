"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Image as ImageIcon, Type, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";
import { fetchApi } from "@/lib/api";
import { toast } from "@/store/useToastStore";

interface AccountWatermarkModalProps {
  account: any;
  onClose: () => void;
  onSaved?: () => void;
}

const POSITIONS = [
  { id: "top_left", label: "Top Left" },
  { id: "top_center", label: "Top Center" },
  { id: "top_right", label: "Top Right" },
  { id: "center_left", label: "Center Left" },
  { id: "center", label: "Center" },
  { id: "center_right", label: "Center Right" },
  { id: "bottom_left", label: "Bottom Left" },
  { id: "bottom_center", label: "Bottom Center" },
  { id: "bottom_right", label: "Bottom Right" },
];

export default function AccountWatermarkModal({
  account,
  onClose,
  onSaved,
}: AccountWatermarkModalProps) {
  const existingConfig = account?.watermark_config || {};

  const [mode, setMode] = useState<"text" | "image">(
    existingConfig.default_mode || existingConfig.mode || "text"
  );
  const [textContent, setTextContent] = useState<string>(
    existingConfig.text_content || `@${account?.username || "agencyOS"}`
  );
  const [textColor, setTextColor] = useState<string>(
    existingConfig.text_color || "#ffffff"
  );
  const [imageUrl, setImageUrl] = useState<string>(
    existingConfig.image_url || ""
  );
  const [position, setPosition] = useState<string>(
    existingConfig.position || "bottom_right"
  );
  const [opacity, setOpacity] = useState<number>(
    existingConfig.opacity !== undefined ? Number(existingConfig.opacity) : 0.8
  );
  const [scale, setScale] = useState<number>(
    existingConfig.scale !== undefined ? Number(existingConfig.scale) : 0.2
  );
  const [margin, setMargin] = useState<number>(
    existingConfig.margin !== undefined ? Number(existingConfig.margin) : 20
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        default_mode: mode,
        text_content: textContent,
        text_color: textColor,
        image_url: imageUrl,
        position,
        opacity: Number(opacity),
        scale: Number(scale),
        margin: Number(margin),
      };

      await fetchApi(`/accounts/${account.id}/watermark`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success(`Preset Watermark untuk @${account.username} berhasil disimpan!`);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      toast.info("Gagal menyimpan preset watermark.");
    } finally {
      setIsSaving(false);
    }
  };

  // Compute CSS alignment for Live Canvas Preview
  const getPreviewPositionStyle = () => {
    const styles: React.CSSProperties = { position: "absolute" };
    if (position.includes("top")) styles.top = "12px";
    else if (position.includes("bottom")) styles.bottom = "12px";
    else styles.top = "50%";

    if (position.includes("left")) styles.left = "12px";
    else if (position.includes("right")) styles.right = "12px";
    else styles.left = "50%";

    if (position === "center") styles.transform = "translate(-50%, -50%)";
    else if (position === "top_center" || position === "bottom_center") styles.transform = "translateX(-50%)";
    else if (position === "center_left" || position === "center_right") styles.transform = "translateY(-50%)";

    return styles;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 font-['Outfit']">
                Watermark Preset — @{account.username}
              </h2>
              <p className="text-[11px] text-purple-600 font-semibold">
                Bebas input cookie / manual Photoshop. Otomatis saat compose post.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            💡 <strong>Image-Only:</strong> Watermark saat ini mendukung format <strong>Gambar (JPG, PNG, WebP, Carousel)</strong> untuk menjaga kecepatan server &amp; zero lag.
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Mode Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Tipe Watermark Default</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === "text"
                    ? "bg-white text-purple-700 shadow-xs border border-purple-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Type className="w-4 h-4" />
                <span>Teks (@Handle / Brand)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  mode === "image"
                    ? "bg-white text-purple-700 shadow-xs border border-purple-100"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Logo Gambar (PNG Transparan)</span>
              </button>
            </div>
          </div>

          {/* Mode Content Inputs */}
          {mode === "text" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Konten Teks</label>
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="@brandname atau www.brand.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">Warna Teks</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl border border-slate-200 text-xs bg-white font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="text-[11px] font-bold text-slate-700 block">Logo PNG Transparan (PostForMe Media Storage)</label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... (URL Logo dari PostForMe / CDN)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                />
                
                <label className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all shadow-xs">
                  <input
                    type="file"
                    accept="image/png,image/webp,image/svg+xml"
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const file = e.target.files[0];
                      try {
                        toast.info("Mengunggah logo ke PostForMe storage...");
                        const res = await fetchApi<any>("/posts/media/create-upload-url", {
                          method: "POST",
                          body: JSON.stringify({ content_type: file.type || "image/png" })
                        });
                        if (res?.upload_url && res?.media_url) {
                          await fetch(res.upload_url, {
                            method: "PUT",
                            headers: { "Content-Type": file.type || "image/png" },
                            body: file
                          });
                          setImageUrl(res.media_url);
                          toast.success("Logo PNG berhasil diunggah ke PostForMe Media Storage!");
                        }
                      } catch (err: any) {
                        toast.error("Gagal mengunggah logo: " + (err.message || err));
                      }
                    }}
                    className="hidden"
                  />
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Unggah File Logo</span>
                </label>
              </div>

              <p className="text-[10px] text-slate-400">
                Gunakan file logo berformat PNG transparan. File otomatis disimpan di PostForMe CDN.
              </p>
            </div>
          )}

          {/* Grid Position & Live Canvas Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 9-Point Position Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Posisi Grid (9-Point)</label>
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                      position === pos.id
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-purple-50"
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Live Canvas Preview Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Live Preview Result</label>
              <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 shadow-inner flex items-center justify-center">
                {/* Background Sample Photo */}
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
                  alt="Sample Product"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Rendered Overlay Watermark Preview */}
                <div style={getPreviewPositionStyle()} className="pointer-events-none transition-all duration-200">
                  {mode === "image" && imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Watermark Logo"
                      style={{
                        width: `${scale * 200}px`,
                        opacity: opacity,
                      }}
                      className="object-contain"
                    />
                  ) : (
                    <div
                      style={{
                        color: textColor,
                        opacity: opacity,
                        fontSize: `${Math.max(11, scale * 60)}px`,
                        backgroundColor: `rgba(0,0,0,${opacity * 0.4})`,
                      }}
                      className="px-2 py-0.5 rounded font-bold font-mono tracking-wide backdrop-blur-xs whitespace-nowrap"
                    >
                      {textContent || `@${account?.username || "agencyOS"}`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sliders for Opacity & Scaling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Opasitas (Transparansi)</span>
                <span className="text-purple-600 font-mono">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700">Skala Ukuran Logo/Teks</span>
                <span className="text-purple-600 font-mono">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.4"
                step="0.02"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Menyimpan..." : "Simpan Preset Watermark"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
