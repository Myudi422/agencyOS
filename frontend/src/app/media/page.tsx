"use client";

import React, { useState, useEffect } from "react";
import { 
  Image as ImageIcon, UploadCloud, Folder, Tag, Star, 
  Search, Grid, List as ListIcon, Plus, Eye, CheckCircle2, Sparkles, 
  Layers, RefreshCw, Trash2, CheckSquare, Square, FolderPlus, X, Play, FolderInput 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { confirmModal } from "@/store/useConfirmStore";
import { fetchApi } from "@/lib/api";
import { uploadFilesInBackground } from "@/lib/uploadManager";
import GlassConfirmModal from "@/components/common/GlassConfirmModal";
import MoveToFolderModal from "@/components/media/MoveToFolderModal";

export default function MediaPage() {
  const { activeWorkspace, openComposer } = useStore();
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [folders, setFolders] = useState<string[]>(["General", "Reels", "Ads"]);
  const [selectedFolder, setSelectedFolder] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [previewMedia, setPreviewMedia] = useState<any | null>(null);

  // Folder creation state
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Multi-select for bulk action
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  const [moveModal, setMoveModal] = useState<{
    isOpen: boolean;
    mediaIds: string[];
  }>({
    isOpen: false,
    mediaIds: [],
  });

  const [isProcessingModal, setIsProcessingModal] = useState(false);

  const isVideo = (media: any) => {
    if (!media) return false;
    const fileType = media.file_type || "";
    const filename = media.filename || "";
    return fileType.startsWith("video/") || filename.match(/\.(mp4|mov|webm|avi|mkv)$/i);
  };

  const loadMedia = async () => {
    try {
      const folderParam = selectedFolder === "All" ? "" : `&folder=${encodeURIComponent(selectedFolder)}`;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetchApi<any>(`/media/?workspace_id=${activeWorkspace?.id || "ws-default"}${folderParam}${searchParam}`);
      setMediaItems(res.items || []);
      
      const serverFolders: string[] = res.folders || [];
      setFolders((prev) => {
        const merged = Array.from(new Set([...["General", "Reels", "Ads"], ...serverFolders, ...prev]));
        return merged.filter((f) => f.toLowerCase() !== "all");
      });
    } catch (err) {
      console.error("Failed to load media", err);
    }
  };

  useEffect(() => {
    loadMedia();
    setSelectedMediaIds([]);
  }, [activeWorkspace?.id, selectedFolder, search]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const targetFolder = selectedFolder === "All" ? "General" : selectedFolder;
    uploadFilesInBackground(
      e.target.files,
      activeWorkspace?.id || "ws-default",
      targetFolder,
      () => loadMedia()
    );
    e.target.value = "";
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const raw = newFolderName.trim();
    const cleanName = raw.charAt(0).toUpperCase() + raw.slice(1);
    if (!folders.includes(cleanName)) {
      setFolders([...folders, cleanName]);
    }
    setSelectedFolder(cleanName);
    setNewFolderName("");
    setShowNewFolderInput(false);
  };

  // --- Glassmorphic Delete & Move Actions ---

  const handleDeleteSingle = (mediaId: string, filename: string) => {
    confirmModal({
      title: "Delete Media Asset",
      message: `Are you sure you want to permanently delete '${filename}' from Backblaze B2 storage and database?`,
      variant: "danger",
      confirmText: "Delete Asset",
      onConfirm: async () => {
        try {
          await fetchApi(`/media/${mediaId}`, { method: "DELETE" });
          toast.success("Media asset permanently deleted from Backblaze B2 & database.");
          loadMedia();
        } catch (err: any) {
          toast.error(`Delete error: ${err.message || err}`);
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedMediaIds.length === 0) return;
    confirmModal({
      title: "Bulk Delete Assets",
      message: `Are you sure you want to delete ${selectedMediaIds.length} selected asset(s) from Backblaze B2 storage and database?`,
      variant: "danger",
      confirmText: `Delete ${selectedMediaIds.length} File(s)`,
      onConfirm: async () => {
        try {
          await fetchApi("/media/bulk-delete", {
            method: "POST",
            body: JSON.stringify({ media_ids: selectedMediaIds })
          });
          toast.success(`${selectedMediaIds.length} media asset(s) deleted.`);
          setSelectedMediaIds([]);
          loadMedia();
        } catch (err: any) {
          toast.error(`Bulk delete error: ${err.message || err}`);
        }
      },
    });
  };

  const handleDeleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (folderName === "All") return;
    confirmModal({
      title: `Delete Folder '${folderName}'`,
      message: `Are you sure you want to delete folder '${folderName}' and permanently purge all media files inside it from Backblaze B2 & database?`,
      variant: "danger",
      confirmText: "Delete Folder & Files",
      onConfirm: async () => {
        try {
          await fetchApi(`/media/folder?folder=${encodeURIComponent(folderName)}&workspace_id=${activeWorkspace?.id || "ws-default"}`, { method: "DELETE" });
          toast.success(`Folder '${folderName}' and all items purged.`);
          setFolders((prev) => prev.filter((f) => f !== folderName));
          if (selectedFolder === folderName) setSelectedFolder("All");
          loadMedia();
        } catch (err: any) {
          toast.error(`Delete folder error: ${err.message || err}`);
        }
      },
    });
  };

  const handleOpenMoveModal = (mediaIds: string[]) => {
    if (mediaIds.length === 0) return;
    setMoveModal({
      isOpen: true,
      mediaIds: mediaIds,
    });
  };

  const handleExecuteMove = async (targetFolder: string) => {
    setIsProcessingModal(true);
    try {
      await fetchApi("/media/bulk-move", {
        method: "POST",
        body: JSON.stringify({
          media_ids: moveModal.mediaIds,
          target_folder: targetFolder,
        }),
      });

      toast.success(`Moved ${moveModal.mediaIds.length} item(s) to folder '${targetFolder}'.`);
      if (!folders.includes(targetFolder)) {
        setFolders((prev) => [...prev, targetFolder]);
      }
      setSelectedMediaIds([]);
      loadMedia();
    } catch (err: any) {
      toast.error(`Move error: ${err.message || err}`);
    } finally {
      setIsProcessingModal(false);
      setMoveModal({ isOpen: false, mediaIds: [] });
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

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncB2 = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchApi<any>(`/media/sync-b2?workspace_id=${activeWorkspace?.id || "ws-default"}`, { method: "POST" });
      toast.success(`Backblaze B2 Sync complete! Synced ${res.synced_count || 0} file(s).`);
      loadMedia();
    } catch (err: any) {
      toast.error(`Sync error: ${err.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner - White Clean Glassmorphism */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl glass-panel relative overflow-hidden shadow-sm">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold tracking-wide uppercase border border-purple-200">
              Backblaze B2 S3 Storage
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-['Outfit'] gradient-text">
            Media Storage Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
            High performance cloud object storage connected directly to Backblaze B2 bucket <code className="font-mono text-purple-700 font-bold">ccgnimex</code> under root prefix <code className="font-mono text-purple-700 font-bold">AgencyOS/</code>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 z-10 shrink-0">
          <button
            onClick={handleSyncB2}
            disabled={isSyncing}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-purple-50/80 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-2 shadow-xs transition-all"
            title="Scan & Sync Backblaze B2 Bucket"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-purple-600" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync B2"}</span>
          </button>

          <label className="py-3 px-5 rounded-2xl gradient-brand text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media</span>
            <input type="file" multiple onChange={handleFileUpload} className="hidden" accept="image/*,video/*" />
          </label>
        </div>
      </div>

      {/* Main Grid Layout: Folder Navigation & Asset Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Folders & Filters (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-3xl glass-card space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-purple-600" />
                  <span>Folders</span>
                </h3>
                <p className="text-[10px] text-slate-400">Scoped under AgencyOS/</p>
              </div>

              <button 
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                className="p-1 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors"
                title="Create New Folder"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>

            {showNewFolderInput && (
              <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                <input 
                  type="text" 
                  placeholder="Folder name..." 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none border border-purple-300"
                  autoFocus
                />
                <button 
                  onClick={handleCreateFolder}
                  className="py-1.5 px-3 rounded-xl gradient-brand text-white text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>
            )}

            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder("All")}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                  selectedFolder === "All"
                    ? "bg-purple-100/80 text-purple-900 shadow-xs border border-purple-200"
                    : "text-slate-600 hover:bg-slate-100/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>All Media</span>
                </div>
                <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded-full border border-slate-200">
                  {mediaItems.length}
                </span>
              </button>

              {folders.map((f) => {
                const isSelected = selectedFolder === f;
                const isDefaultFolder = ["General", "Reels", "Ads"].includes(f);
                return (
                  <div key={f} className="group relative flex items-center">
                    <button
                      onClick={() => setSelectedFolder(f)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-purple-100/80 text-purple-900 shadow-xs border border-purple-200"
                          : "text-slate-600 hover:bg-slate-100/60"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                        <span className="truncate">{f}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isDefaultFolder && (
                          <button
                            onClick={(e) => handleDeleteFolder(f, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title={`Delete Folder '${f}'`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Asset Grid (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Action & Filter Bar */}
          <div className="p-4 rounded-3xl glass-card flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search assets by filename..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-800 focus:outline-none border border-slate-200/80"
              />
            </div>

            {mediaItems.length > 0 && (
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  {selectedMediaIds.length === mediaItems.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{selectedMediaIds.length === mediaItems.length ? "Deselect All" : "Select All"}</span>
                </button>

                {selectedMediaIds.length > 0 && (
                  <>
                    <button
                      onClick={() => handleOpenMoveModal(selectedMediaIds)}
                      className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FolderInput className="w-3.5 h-3.5" />
                      <span>Move ({selectedMediaIds.length})</span>
                    </button>

                    <button
                      onClick={handleBulkDelete}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete ({selectedMediaIds.length})</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Media Grid */}
          {mediaItems.length === 0 ? (
            <div className="p-12 rounded-3xl glass-card text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">No Media Assets Uploaded</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click the "Upload Media" button above to upload images & videos to your workspace vault.
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
                    className={`group relative rounded-2xl glass-card overflow-hidden aspect-square flex flex-col justify-between transition-all ${
                      isSelected ? "border-purple-500 ring-2 ring-purple-400/40" : ""
                    }`}
                  >
                    {/* Media Display: Image vs Video */}
                    {isVid ? (
                      <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
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
                      className="absolute top-2 left-2 z-10 p-1 rounded-lg bg-black/60 backdrop-blur-sm text-white hover:text-purple-300 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-white opacity-80" />
                      )}
                    </button>

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between pl-7">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 font-bold border border-purple-500/30">
                          {m.folder}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleOpenMoveModal([m.id])} 
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:text-purple-300"
                            title="Move to Folder"
                          >
                            <FolderInput className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setPreviewMedia(m)} 
                            className="p-1.5 rounded-lg bg-black/60 text-white hover:text-purple-300"
                            title="Preview Media"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSingle(m.id, m.filename)} 
                            className="p-1.5 rounded-lg bg-rose-600/60 text-white hover:bg-rose-600"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white truncate">{m.filename}</p>
                        <button
                          onClick={() => openComposer()}
                          className="w-full py-1.5 rounded-xl gradient-brand text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow-sm"
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

      {/* Preview Modal */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-6 w-full max-w-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 font-['Outfit']">{previewMedia.filename}</h3>
              <button onClick={() => setPreviewMedia(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center max-h-[65vh]">
              {isVideo(previewMedia) ? (
                <video 
                  src={previewMedia.url} 
                  controls 
                  autoPlay 
                  className="w-full max-h-[65vh] object-contain rounded-2xl" 
                />
              ) : (
                <img 
                  src={previewMedia.url} 
                  alt={previewMedia.filename} 
                  className="w-full max-h-[65vh] object-contain rounded-2xl" 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Glassmorphic Move To Folder Modal */}
      <MoveToFolderModal
        isOpen={moveModal.isOpen}
        itemCount={moveModal.mediaIds.length}
        availableFolders={folders}
        isLoading={isProcessingModal}
        onMove={handleExecuteMove}
        onClose={() => setMoveModal({ isOpen: false, mediaIds: [] })}
      />

    </div>
  );
}
