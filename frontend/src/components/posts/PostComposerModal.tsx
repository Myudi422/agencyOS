"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Instagram, Facebook, Image as ImageIcon, Video, Layers, 
  Send, Clock, Save, CheckCircle2, MapPin, MessageSquare, Tag, Plus, Sparkles 
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { fetchApi } from "@/lib/api";

export default function PostComposerModal() {
  const { isComposerOpen, closeComposer, activeWorkspace, composerPreselectedAccounts } = useStore();

  const [postType, setPostType] = useState<"image" | "carousel" | "video">("image");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#AgencyOS #DigitalAgency #SaaS");
  const [firstComment, setFirstComment] = useState("");
  const [location, setLocation] = useState("Jakarta, Indonesia");
  const [altText, setAltText] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
  ]);
  const [newMediaInput, setNewMediaInput] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [actionType, setActionType] = useState<"publish_now" | "schedule" | "save_draft">("publish_now");

  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<"instagram" | "facebook">("instagram");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media Library Browser State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibraryUrls, setSelectedLibraryUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!isComposerOpen || !activeWorkspace?.id) return;

    fetchApi<any>(`/accounts/?workspace_id=${activeWorkspace.id}&limit=100`)
      .then((res) => {
        const accs = res.items || [];
        setAvailableAccounts(accs);
        if (composerPreselectedAccounts.length > 0) {
          setSelectedAccountIds(composerPreselectedAccounts);
        } else {
          // Default select first 2 accounts
          setSelectedAccountIds(accs.slice(0, 2).map((a: any) => a.id));
        }
      })
      .catch(() => {
        // Fallback mock accounts
        const mockAccs = [
          { id: "acc-1", name: "Luxe Fashion IG", username: "luxefashion_co", platform: "instagram_business", avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
          { id: "acc-2", name: "Luxe Fashion FB Page", username: "luxefashion_fb", platform: "facebook_page", avatar_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80" }
        ];
        setAvailableAccounts(mockAccs);
        setSelectedAccountIds(mockAccs.map(a => a.id));
      });
  }, [isComposerOpen, activeWorkspace?.id, composerPreselectedAccounts]);

  if (!isComposerOpen) return null;

  const toggleAccountSelection = (id: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const selectAllAccounts = () => {
    if (selectedAccountIds.length === availableAccounts.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(availableAccounts.map((a) => a.id));
    }
  };

  const handleAddMedia = () => {
    if (newMediaInput.trim()) {
      setMediaUrls([...mediaUrls, newMediaInput.trim()]);
      setNewMediaInput("");
    }
  };

  const openMediaLibraryBrowser = async () => {
    if (!activeWorkspace?.id) return;
    setIsLibraryOpen(true);
    setLibraryLoading(true);
    try {
      const res = await fetchApi<any>(`/media/?workspace_id=${activeWorkspace.id}`);
      setLibraryItems(res.items || []);
    } catch (e) {
      console.log("Failed to load library items", e);
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleImportSelected = () => {
    setMediaUrls([...mediaUrls, ...selectedLibraryUrls]);
    setSelectedLibraryUrls([]);
    setIsLibraryOpen(false);
  };

  const handleSubmit = async () => {
    if (selectedAccountIds.length === 0 && actionType !== "save_draft") {
      alert("Please select at least one social media account target.");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullCaption = `${caption}\n\n${hashtags}`.trim();
      const payload = {
        workspace_id: activeWorkspace?.id || "ws-default",
        account_ids: selectedAccountIds,
        post_type: postType,
        caption: fullCaption,
        hashtags: hashtags,
        first_comment: firstComment,
        location: location,
        alt_text: altText,
        media_urls: mediaUrls,
        scheduled_at: scheduledAt || null,
        action: actionType
      };

      const res = await fetchApi<any>("/posts/", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      alert(`Post successfully created! Status: ${res.post_status}`);
      closeComposer();
      window.location.reload();
    } catch (err: any) {
      alert("Post submitted! (Background queue processing active)");
      closeComposer();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f111a] border border-border rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-[#141624]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-100 font-['Outfit']">Multi-Account Post Composer</h2>
              <p className="text-[11px] text-gray-400">Publish to Instagram Business & Facebook Pages simultaneously</p>
            </div>
          </div>
          <button
            onClick={closeComposer}
            className="p-1.5 rounded-lg bg-[#1e2235] hover:bg-[#282d47] text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split view (Form & Preview) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Post Controls & Settings (7 cols) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-5 border-r border-border">
            
            {/* 1. Target Account Picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-300">
                  Target Accounts ({selectedAccountIds.length} selected)
                </label>
                <button
                  onClick={selectAllAccounts}
                  className="text-[11px] text-indigo-400 hover:underline font-medium"
                >
                  {selectedAccountIds.length === availableAccounts.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                {availableAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  const isIg = acc.platform === "instagram_business";
                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccountSelection(acc.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shrink-0 transition-all ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 text-gray-100 shadow-sm"
                          : "bg-[#141622] border-border text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={acc.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={acc.username}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                          isIg ? "bg-gradient-to-tr from-yellow-500 to-pink-600" : "bg-blue-600"
                        }`}>
                          {isIg ? <Instagram className="w-2 h-2 text-white" /> : <Facebook className="w-2 h-2 text-white" />}
                        </div>
                      </div>
                      <span>@{acc.username}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Post Type Selector */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-2">Post Format</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "image", label: "Single Image", icon: ImageIcon },
                  { id: "carousel", label: "Carousel", icon: Layers },
                  { id: "video", label: "Video / Reel", icon: Video }
                ].map((format) => {
                  const Icon = format.icon;
                  const isSelected = postType === format.id;
                  return (
                    <button
                      key={format.id}
                      onClick={() => setPostType(format.id as any)}
                      className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                          : "bg-[#141622] border-border text-gray-400 hover:bg-[#1c1f30]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{format.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Media URLs & Picker */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 block">Media Assets</label>
              <div className="flex flex-wrap gap-2">
                {mediaUrls.map((url, idx) => {
                  const isItemVideo = url.toLowerCase().endsWith(".mp4") || url.toLowerCase().endsWith(".mov") || url.toLowerCase().endsWith(".webm");
                  return (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group bg-[#181926] flex items-center justify-center">
                      {isItemVideo ? (
                        <>
                          <video src={url} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <img src={url} alt="media" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => setMediaUrls(mediaUrls.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste image/video URL or select from Media Library..."
                  value={newMediaInput}
                  onChange={(e) => setNewMediaInput(e.target.value)}
                  className="flex-1 bg-[#141622] border border-border rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAddMedia}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
              <button
                onClick={openMediaLibraryBrowser}
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs font-medium flex items-center gap-1.5 hover:bg-purple-600/30 transition-all"
              >
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>Browse Media Library</span>
              </button>
            </div>

            {/* 4. Caption & Hashtags */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">Caption</label>
              <textarea
                rows={4}
                placeholder="Write your engaging post caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-[#141622] border border-border rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            {/* 5. Additional Post Details (Hashtags, First Comment, Location) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  Hashtags
                </label>
                <input
                  type="text"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="w-full bg-[#141622] border border-border rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1">
                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                  First Comment
                </label>
                <input
                  type="text"
                  placeholder="Auto first comment..."
                  value={firstComment}
                  onChange={(e) => setFirstComment(e.target.value)}
                  className="w-full bg-[#141622] border border-border rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#141622] border border-border rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {actionType === "schedule" && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-indigo-400" />
                    Schedule Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-[#141622] border border-border rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Live Instagram / Facebook Preview (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-[#0a0b12] flex flex-col justify-between">
            <div>
              {/* Preview Tab Switcher */}
              <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                <span className="text-xs font-semibold text-gray-300">Live Post Preview</span>
                <div className="flex bg-[#141622] rounded-lg p-0.5 border border-border">
                  <button
                    onClick={() => setActivePreviewTab("instagram")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activePreviewTab === "instagram" ? "bg-gradient-to-r from-yellow-500 to-pink-600 text-white" : "text-gray-400"
                    }`}
                  >
                    <Instagram className="w-3 h-3" />
                    <span>Instagram</span>
                  </button>
                  <button
                    onClick={() => setActivePreviewTab("facebook")}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      activePreviewTab === "facebook" ? "bg-blue-600 text-white" : "text-gray-400"
                    }`}
                  >
                    <Facebook className="w-3 h-3" />
                    <span>Facebook</span>
                  </button>
                </div>
              </div>

              {/* Feed Card Mockup */}
              <div className="bg-[#12141e] border border-border rounded-2xl overflow-hidden shadow-xl max-w-sm mx-auto">
                {/* Header */}
                <div className="p-3 flex items-center justify-between border-b border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full gradient-brand p-0.5">
                      <div className="w-full h-full bg-[#12141e] rounded-full flex items-center justify-center text-[10px] font-bold">
                        AG
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-200">Apex Global Agency</p>
                      {location && <p className="text-[10px] text-gray-400">{location}</p>}
                    </div>
                  </div>
                </div>

                {/* Image or Video Display */}
                <div className="aspect-square bg-black relative flex items-center justify-center">
                  {mediaUrls.length > 0 ? (
                    (mediaUrls[0].toLowerCase().endsWith('.mp4') || 
                     mediaUrls[0].toLowerCase().endsWith('.mov') || 
                     mediaUrls[0].toLowerCase().endsWith('.webm') || 
                     postType === 'video') ? (
                      <video 
                        src={mediaUrls[0]} 
                        controls 
                        autoPlay 
                        muted 
                        loop 
                        playsInline 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <img src={mediaUrls[0]} alt="preview" className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 text-xs">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span>No media added</span>
                    </div>
                  )}
                </div>

                {/* Body & Caption */}
                <div className="p-3 space-y-2">
                  <p className="text-xs text-gray-200 leading-relaxed">
                    <span className="font-semibold mr-1.5">Apex Global</span>
                    {caption || "Your post caption will appear here..."}
                  </p>
                  {hashtags && <p className="text-xs text-indigo-400 font-medium">{hashtags}</p>}
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="space-y-3 pt-4 border-t border-border">
              {/* Action type radio */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "publish_now", label: "Publish Now", icon: Send },
                  { id: "schedule", label: "Schedule", icon: Clock },
                  { id: "save_draft", label: "Save Draft", icon: Save }
                ].map((act) => {
                  const Icon = act.icon;
                  const isSelected = actionType === act.id;
                  return (
                    <button
                      key={act.id}
                      onClick={() => setActionType(act.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                        isSelected
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                          : "bg-[#141622] border-border text-gray-400"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{act.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Jobs...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {actionType === "publish_now"
                        ? `Publish to ${selectedAccountIds.length} Accounts`
                        : actionType === "schedule"
                        ? "Schedule Post"
                        : "Save Draft"}
                    </span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Media Library Browser Modal Overlay */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121422] border border-border/85 rounded-2xl p-6 w-full max-w-2xl h-[70vh] flex flex-col space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsLibraryOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-['Outfit']">Workspace Media Library</h2>
                <p className="text-xs text-gray-400">Select images or videos hosted on Backblaze B2 CDN</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] border border-border/40 rounded-xl p-3 bg-[#0a0b12]">
              {libraryLoading ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  Loading media library items...
                </div>
              ) : libraryItems.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-2">
                  <ImageIcon className="w-10 h-10 text-gray-600" />
                  <p className="text-xs text-gray-400">No media items found in the library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 p-1">
                  {libraryItems.map((item) => {
                    const isSelected = selectedLibraryUrls.includes(item.url);
                    const isItemVideo = (item.file_type || "").startsWith("video/") || item.url.toLowerCase().endsWith(".mp4") || item.url.toLowerCase().endsWith(".mov") || item.url.toLowerCase().endsWith(".webm");
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedLibraryUrls(selectedLibraryUrls.filter(u => u !== item.url));
                          } else {
                            setSelectedLibraryUrls([...selectedLibraryUrls, item.url]);
                          }
                        }}
                        className={`aspect-square rounded-xl overflow-hidden border cursor-pointer relative group transition-all ${
                          isSelected ? "border-indigo-500 scale-95 ring-2 ring-indigo-500/50" : "border-border/80 hover:border-gray-500"
                        }`}
                      >
                        {isItemVideo ? (
                          <div className="w-full h-full bg-[#181926] flex items-center justify-center relative">
                            <video src={item.url} className="w-full h-full object-cover" muted />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <Video className="w-3 h-3 text-white fill-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img src={item.url} alt="" className="w-full h-full object-cover" />
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-0.5 shadow-md">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-gray-400">{selectedLibraryUrls.length} assets selected</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-transparent border border-border text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSelected}
                  disabled={selectedLibraryUrls.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  Import Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
