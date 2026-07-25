"use client";

import React, { useState, useEffect } from "react";
import { 
  Image as ImageIcon, UploadCloud, Folder, Tag, Star, 
  Search, Grid, List as ListIcon, Plus, Eye, CheckCircle2, Sparkles, 
  Layers, RefreshCw, Trash2, CheckSquare, Square, FolderPlus, X, Play 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function MediaPage() {
  const { activeWorkspace, openComposer } = useStore();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<string[]>(["General", "Campaigns", "Products", "Reels"]);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Folder creation state
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Multi-select for bulk delete
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  const isVideo = (media: any) => {
    if (!media) return false;
    const fileType = media.file_type || "";
    const url = (media.url || media.filename || "").toLowerCase();
    return (
      fileType.startsWith("video/") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm") ||
      url.endsWith(".avi") ||
      url.endsWith(".mkv")
    );
  };

  const loadMedia = () => {
    if (!activeWorkspace?.id) return;
    let url = `/media/?workspace_id=${activeWorkspace.id}`;
    if (selectedFolder !== "All") url += `&folder=${selectedFolder}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    fetchApi<any>(url)
      .then((data) => {
        setMediaItems(data.items || []);
        if (data.folders?.length) {
          const combined = Array.from(new Set([...folders, ...data.folders]));
          setFolders(combined);
        }
      })
      .catch((err) => {
        console.log("Error loading media", err);
      });
  };

  useEffect(() => {
    loadMedia();
    setSelectedMediaIds([]);
  }, [activeWorkspace?.id, selectedFolder, search]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspace_id", activeWorkspace?.id || "ws-default");
    formData.append("folder", selectedFolder === "All" ? "General" : selectedFolder);
    formData.append("tags", JSON.stringify(["uploaded", "b2"]));

    setIsUploading(true);
    try {
      await fetchApi<any>("/media/", {
        method: "POST",
        body: formData,
      });
      alert(`File '${file.name}' successfully uploaded to Backblaze B2 bucket (ccgnimex)!`);
      loadMedia();
    } catch (err: any) {
      alert(`Upload error: ${err.message || err}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const cleanName = newFolderName.trim();
    if (!folders.includes(cleanName)) {
      setFolders([...folders, cleanName]);
    }
    setSelectedFolder(cleanName);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  const handleDeleteSingle = async (mediaId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete '${filename}' from Backblaze B2 storage and database?`)) return;
    try {
      await fetchApi(`/media/${mediaId}`, { method: "DELETE" });
      setSelectedMediaIds(selectedMediaIds.filter(id => id !== mediaId));
      loadMedia();
    } catch (err: any) {
      alert(`Delete error: ${err.message || err}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMediaIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedMediaIds.length} selected files from Backblaze B2 storage?`)) return;
    try {
      await fetchApi("/media/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ media_ids: selectedMediaIds })
      });
      setSelectedMediaIds([]);
      loadMedia();
    } catch (err: any) {
      alert(`Bulk delete error: ${err.message || err}`);
    }
  };

  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds((prev) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedMediaIds.length === mediaItems.length) {
      setSelectedMediaIds([]);
    } else {
      setSelectedMediaIds(mediaItems.map(m => m.id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-['Outfit'] gradient-text">
            Backblaze B2 S3 Media Library
          </h1>
          <p className="text-xs text-gray-400">
            High performance object storage connected to Backblaze B2 bucket <code className="text-indigo-400 font-mono">ccgnimex</code>.
          </p>
        </div>

        <label className={`py-2.5 px-4 rounded-xl gradient-brand text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
          <UploadCloud className={`w-4 h-4 ${isUploading ? "animate-bounce" : ""}`} />
          <span>{isUploading ? "Uploading to Backblaze B2..." : "Upload to Backblaze B2"}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,video/*" disabled={isUploading} />
        </label>
      </div>

      {/* Main Grid Layout: Folder Navigation & Asset Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Folders & Filters (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-2xl glass-card border border-border/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <span>Media Folders</span>
              </h3>
              <button
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                className="p-1 rounded-lg bg-[#141624] hover:bg-[#1c1f32] text-indigo-400 hover:text-indigo-300 transition-colors"
                title="Create New Folder"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Create Folder Input Form */}
            {showNewFolderInput && (
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Folder Name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 bg-[#141624] border border-border rounded-lg px-2.5 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleCreateFolder}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            )}

            <div className="space-y-1">
              {["All", ...folders].map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFolder(f)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedFolder === f
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/40"
                      : "text-gray-400 hover:bg-[#141624]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-3.5 h-3.5 text-gray-400" />
                    <span>{f}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Asset Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Search bar & Bulk Action Bar */}
          <div className="p-3 rounded-2xl glass-card border border-border/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search assets by filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-gray-200 focus:outline-none"
              />
            </div>

            {/* Select All & Bulk Actions */}
            {mediaItems.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="px-2.5 py-1.5 rounded-lg bg-[#141624] hover:bg-[#1c1f30] text-gray-300 border border-border text-xs font-medium flex items-center gap-1.5"
                >
                  {selectedMediaIds.length === mediaItems.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  <span>Select All ({selectedMediaIds.length})</span>
                </button>

                {selectedMediaIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-400 border border-pink-500/30 text-xs font-medium flex items-center gap-1.5 transition-all shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bulk Delete ({selectedMediaIds.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Media Grid */}
          {mediaItems.length === 0 ? (
            <div className="p-12 rounded-2xl glass-card border border-border/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-200">No Media Assets Uploaded Yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Click the "Upload to Backblaze B2" button above to store images & videos in your Backblaze bucket.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaItems.map((m) => {
                const isSelected = selectedMediaIds.includes(m.id);
                const isVid = isVideo(m);
                return (
                  <div 
                    key={m.id} 
                    className={`group relative rounded-2xl glass-card border overflow-hidden aspect-square flex flex-col justify-between transition-all ${
                      isSelected ? "border-indigo-500 ring-2 ring-indigo-500/40" : "border-border/80"
                    }`}
                  >
                    {/* Media Display: Image vs Video */}
                    {isVid ? (
                      <div className="relative w-full h-full bg-black flex items-center justify-center">
                        <video 
                          src={m.url} 
                          className="w-full h-full object-cover" 
                          preload="metadata" 
                          muted 
                          playsInline 
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                          <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-lg">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img src={m.url} alt={m.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    )}

                    {/* Checkbox badge top-left */}
                    <button
                      onClick={() => toggleSelectMedia(m.id)}
                      className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-black/60 backdrop-blur-sm text-gray-300 hover:text-indigo-400 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400 opacity-80" />
                      )}
                    </button>

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between pl-7">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/70 text-indigo-300 border border-indigo-500/30">
                          {m.folder}
                        </span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setPreviewMedia(m)} className="p-1 rounded-lg bg-black/60 text-white hover:text-indigo-400">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteSingle(m.id, m.filename)} className="p-1 rounded-lg bg-pink-600/30 text-pink-400 hover:bg-pink-600/50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-white truncate">{m.filename}</p>
                        <button
                          onClick={() => openComposer()}
                          className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Use in Post</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Preview Modal (Image & Video player) */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f111a] border border-border rounded-2xl p-6 w-full max-w-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-100">{previewMedia.filename}</h3>
              <button onClick={() => setPreviewMedia(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center max-h-[65vh]">
              {isVideo(previewMedia) ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className="w-full max-h-[65vh] object-contain rounded-xl" 
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.filename} 
                  className="w-full max-h-[65vh] object-contain rounded-xl" 
                />
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-border/50">
              <span className="truncate max-w-sm font-mono text-[11px]">B2 Key: {previewMedia.b2_key}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                {previewMedia.folder}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
