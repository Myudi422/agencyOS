"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Image as ImageIcon, Video, Layers, 
  Send, Clock, Save, CheckCircle2, Sparkles, Folder, Check, Calendar,
  Youtube, MessageSquare, Instagram as InstagramIcon, Twitter, Facebook as FacebookIcon, Share2, 
  Eye, Edit3, Settings2, Link as LinkIcon, AlertCircle, Plus, Play, RefreshCw, AlertTriangle,
  ChevronLeft, ChevronRight, UploadCloud, Info
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "@/store/useToastStore";
import { fetchApi } from "@/lib/api";

const PLATFORM_BADGES: Record<string, { name: string; color: string; bg: string }> = {
  instagram: { name: "Instagram", color: "from-amber-500 via-pink-500 to-purple-600", bg: "bg-pink-100 text-pink-700 border-pink-200" },
  instagram_business: { name: "Instagram", color: "from-amber-500 via-pink-500 to-purple-600", bg: "bg-pink-100 text-pink-700 border-pink-200" },
  facebook: { name: "Facebook", color: "from-blue-600 to-indigo-700", bg: "bg-blue-100 text-blue-700 border-blue-200" },
  facebook_page: { name: "Facebook", color: "from-blue-600 to-indigo-700", bg: "bg-blue-100 text-blue-700 border-blue-200" },
  x: { name: "X (Twitter)", color: "from-slate-700 to-slate-900", bg: "bg-slate-100 text-slate-700 border-slate-200" },
  tiktok: { name: "TikTok", color: "from-cyan-500 to-pink-500", bg: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  tiktok_business: { name: "TikTok Business", color: "from-cyan-600 to-purple-600", bg: "bg-purple-100 text-purple-700 border-purple-200" },
  youtube: { name: "YouTube", color: "from-red-600 to-red-800", bg: "bg-red-100 text-red-700 border-red-200" },
  pinterest: { name: "Pinterest", color: "from-red-500 to-rose-700", bg: "bg-rose-100 text-rose-700 border-rose-200" },
  linkedin: { name: "LinkedIn", color: "from-sky-600 to-blue-800", bg: "bg-sky-100 text-sky-700 border-sky-200" },
  bluesky: { name: "Bluesky", color: "from-sky-400 to-blue-500", bg: "bg-sky-100 text-sky-700 border-sky-200" },
  threads: { name: "Threads", color: "from-zinc-700 to-zinc-900", bg: "bg-slate-100 text-slate-800 border-slate-200" },
};

const AccountPlatformIcon = ({ platform, className = "w-3.5 h-3.5" }: { platform: string; className?: string }) => {
  const p = (platform || "").toLowerCase();
  if (p.includes("instagram")) {
    return <InstagramIcon className={`${className} text-pink-600`} />;
  }
  if (p.includes("facebook")) {
    return <FacebookIcon className={`${className} text-blue-600`} />;
  }
  if (p === "x" || p.includes("twitter")) {
    return <Twitter className={`${className} text-slate-800`} />;
  }
  if (p.includes("tiktok")) {
    return <Video className={`${className} text-cyan-500`} />;
  }
  if (p.includes("youtube")) {
    return <Youtube className={`${className} text-red-600`} />;
  }
  if (p.includes("pinterest")) {
    return <Share2 className={`${className} text-rose-600`} />;
  }
  if (p.includes("linkedin")) {
    return <Share2 className={`${className} text-sky-600`} />;
  }
  if (p.includes("threads")) {
    return <MessageSquare className={`${className} text-zinc-800`} />;
  }
  if (p.includes("bluesky")) {
    return <Share2 className={`${className} text-sky-500`} />;
  }
  return <Share2 className={`${className} text-purple-600`} />;
};

const FieldTooltip = ({ text }: { text: string }) => (
  <span className="relative inline-flex items-center ml-1 group cursor-help z-20">
    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-purple-600 transition-colors" />
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-52 p-2 bg-slate-900/95 text-white text-[10px] rounded-xl shadow-xl z-50 pointer-events-none leading-normal font-normal normal-case">
      {text}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95" />
    </span>
  </span>
);

export default function PostComposerModal() {
  const { isComposerOpen, closeComposer, activeWorkspace, composerPreselectedAccounts } = useStore();

  // Mobile View Switcher (Editor vs Preview)
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  const [postType, setPostType] = useState<"image" | "carousel" | "video">("image");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("#Shiera #SocialMedia #Marketing");
  const [mediaUrls, setMediaUrls] = useState<string[]>([
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80"
  ]);
  const [newMediaInput, setNewMediaInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [actionType, setActionType] = useState<"publish_now" | "schedule" | "save_draft">("publish_now");

  // Live Feed Preview Carousel Slide Index & Aspect Ratio
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [previewAspect, setPreviewAspect] = useState<"1:1" | "4:5" | "16:9" | "9:16">("1:1");

  // Video / Reels Cover Thumbnail Setup (SocialPostMediaDto)
  const [reelsThumbnailUrl, setReelsThumbnailUrl] = useState("");
  const [reelsThumbnailTimestampMs, setReelsThumbnailTimestampMs] = useState<number | "">(2000);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [showThumbnailInPreview, setShowThumbnailInPreview] = useState(false);

  // Platform Customization Tab
  const [activePlatformTab, setActivePlatformTab] = useState<string>("instagram");

  // Media Library Picker Modal State & Storage Usage
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [libraryMedia, setLibraryMedia] = useState<any[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>({
    used_mb: 0,
    limit_mb: 100,
    percentage: 0,
    is_overflow: false
  });

  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Platform Configurations (PostForMe InstagramConfigurationDto Schema)
  const [instaPlacement, setInstaPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [instaShareToFeed, setInstaShareToFeed] = useState<boolean>(true);
  const [instaLocation, setInstaLocation] = useState<string>("");
  const [instaCollaborators, setInstaCollaborators] = useState<string>("");
  const [instaAudioName, setInstaAudioName] = useState<string>("");
  const [instaTrialReelType, setInstaTrialReelType] = useState<"" | "manual" | "performance">("");


  const [youtubeTitle, setYoutubeTitle] = useState("");
  const [youtubeDescription, setYoutubeDescription] = useState("");
  const [youtubePrivacy, setYoutubePrivacy] = useState<"public" | "private" | "unlisted">("public");
  const [youtubeCategory, setYoutubeCategory] = useState("Entertainment");
  const [youtubeMadeForKids, setYoutubeMadeForKids] = useState(false);
  const [youtubeSyntheticContent, setYoutubeSyntheticContent] = useState(false);
  const [youtubeEmbeddable, setYoutubeEmbeddable] = useState(true);
  const [youtubePublicStatsViewable, setYoutubePublicStatsViewable] = useState(true);
  const [youtubeLicense, setYoutubeLicense] = useState<"youtube" | "creativeCommon">("youtube");
  const [youtubeDefaultLanguage, setYoutubeDefaultLanguage] = useState("id");
  const [youtubeTags, setYoutubeTags] = useState("");
  const [youtubeRecordingDate, setYoutubeRecordingDate] = useState("");
  const [youtubePublishAt, setYoutubePublishAt] = useState("");

  const [threadsTopic, setThreadsTopic] = useState("");
  const [threadsReplyControl, setThreadsReplyControl] = useState("anyone");
  const [threadsPlacement, setThreadsPlacement] = useState<"timeline" | "reels">("timeline");

  const [tiktokPrivacy, setTiktokPrivacy] = useState<"PUBLIC_TO_EVERYONE" | "MUTUAL_FOLLOW_FRIENDS" | "FOLLOWER_OF_CREATOR" | "SELF_ONLY">("PUBLIC_TO_EVERYONE");
  const [tiktokAllowComment, setTiktokAllowComment] = useState(true);
  const [tiktokAllowDuet, setTiktokAllowDuet] = useState(true);
  const [tiktokAllowStitch, setTiktokAllowStitch] = useState(true);
  const [tiktokAutoAddMusic, setTiktokAutoAddMusic] = useState(true);
  const [tiktokDiscloseBrandedContent, setTiktokDiscloseBrandedContent] = useState(false);
  const [tiktokDiscloseYourBrand, setTiktokDiscloseYourBrand] = useState(false);
  const [tiktokIsAiGenerated, setTiktokIsAiGenerated] = useState(false);
  const [tiktokIsDraft, setTiktokIsDraft] = useState(false);

  const [xPollQuestion, setXPollQuestion] = useState("");
  const [xPollOptions, setXPollOptions] = useState<string[]>(["Option 1", "Option 2"]);

  const [facebookPlacement, setFacebookPlacement] = useState<"timeline" | "reels" | "stories">("timeline");
  const [facebookLocation, setFacebookLocation] = useState("");
  const [facebookCollaborators, setFacebookCollaborators] = useState("");
  const [facebookSetCaptionForEachImage, setFacebookSetCaptionForEachImage] = useState(true);
  const [facebookCta, setFacebookCta] = useState("NONE");
  const [facebookLink, setFacebookLink] = useState("");

  const [pinterestTitle, setPinterestTitle] = useState("");
  const [pinterestLink, setPinterestLink] = useState("");
  const [pinterestBoardIds, setPinterestBoardIds] = useState("");

  const [linkedinTitle, setLinkedinTitle] = useState("");
  const [linkedinAudience, setLinkedinAudience] = useState("PUBLIC");
  const [linkedinResharePostId, setLinkedinResharePostId] = useState("");

  const [blueskyAltText, setBlueskyAltText] = useState("");
  const [blueskyContentWarning, setBlueskyContentWarning] = useState("NONE");

  // Helper to check if media is video
  const isVideoMedia = (media: any) => {
    if (!media) return false;
    const urlStr = typeof media === "string" ? media : (media.url || media.filename || media.original_filename || "");
    if (!urlStr) return false;
    const cleanPath = urlStr.split("?")[0].split("#")[0].toLowerCase();
    const fileType = (typeof media === "object" ? media.file_type || media.media_type || media.type || "" : "").toLowerCase();

    if (fileType.startsWith("video/")) return true;
    if (cleanPath.match(/\.(mp4|mov|webm|avi|mkv|m4v|3gp|flv|ogv)$/i)) return true;
    if (urlStr.startsWith("blob:") && (fileType.includes("video") || urlStr.includes("video"))) return true;
    if (urlStr.toLowerCase().includes("video") || urlStr.toLowerCase().includes("reel")) return true;
    return false;
  };

  // Check Platform Compatibility
  const checkPlatformCompatibility = (platform: string) => {
    const p = platform.toLowerCase();
    const mediaCount = mediaUrls.length;
    const isVid = mediaCount > 0 && mediaUrls.some(u => isVideoMedia({ url: u }));

    // YouTube constraints: ONLY supports video uploads (no multi-image carousel, no single image)
    if (p.includes("youtube")) {
      if (postType === "carousel" || mediaCount > 1) {
        return { compatible: false, reason: "YouTube only supports single Video/Reel posts" };
      }
      if (postType === "image" && (!isVid || mediaCount === 0)) {
        return { compatible: false, reason: "YouTube requires a Video file for posting" };
      }
    }

    return { compatible: true, reason: "" };
  };

  // Auto-switch post format based on media attachments
  useEffect(() => {
    if (mediaUrls.length > 1) {
      setPostType("carousel");
    } else if (mediaUrls.length === 1 && isVideoMedia({ url: mediaUrls[0] })) {
      setPostType("video");
    }
  }, [mediaUrls]);

  // Adjust preview slide index if out of range
  useEffect(() => {
    if (previewSlideIndex >= mediaUrls.length) {
      setPreviewSlideIndex(Math.max(0, mediaUrls.length - 1));
    }
  }, [mediaUrls, previewSlideIndex]);

  // Auto-deselect incompatible accounts when postType or media changes
  useEffect(() => {
    setSelectedAccountIds((prev) => {
      return prev.filter((accId) => {
        const acc = availableAccounts.find((a) => a.id === accId);
        if (!acc) return true;
        const check = checkPlatformCompatibility(acc.platform);
        return check.compatible;
      });
    });
  }, [postType, mediaUrls, availableAccounts]);

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    fetchApi<any>(`/accounts/?workspace_id=${activeWorkspace.id}&limit=100`)
      .then((res) => {
        const accs = res.items || [];
        setAvailableAccounts(accs);
        if (composerPreselectedAccounts && composerPreselectedAccounts.length > 0) {
          setSelectedAccountIds(composerPreselectedAccounts);
        } else {
          setSelectedAccountIds(accs.map((a: any) => a.id));
        }
      })
      .catch((err) => {
        console.log("Using composer fallback accounts", err);
        const fallbackAccs = Object.keys(PLATFORM_BADGES).map((p, idx) => ({
          id: `acc-composer-${idx}`,
          platform: p,
          username: `${p}_agency`,
          avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`
        }));
        setAvailableAccounts(fallbackAccs);
        setSelectedAccountIds(fallbackAccs.map(a => a.id));
      });
  }, [activeWorkspace?.id, composerPreselectedAccounts]);

  const loadMediaLibrary = async () => {
    setIsLoadingLibrary(true);
    const targetWsId = activeWorkspace?.id || "ws-default";
    try {
      let data = await fetchApi<any>(`/media/?workspace_id=${targetWsId}`);
      let items = data?.items || (Array.isArray(data) ? data : []);
      if (data?.storage) {
        setStorageInfo(data.storage);
      }

      if (items.length === 0) {
        try {
          await fetchApi(`/media/sync-b2?workspace_id=${targetWsId}`, { method: "POST" });
          data = await fetchApi<any>(`/media/?workspace_id=${targetWsId}`);
          items = data?.items || (Array.isArray(data) ? data : []);
          if (data?.storage) setStorageInfo(data.storage);
        } catch (syncErr) {
          console.log("B2 auto sync notice:", syncErr);
        }
      }

      setLibraryMedia(items);
    } catch (err) {
      console.error("Media library fetch error", err);
      setLibraryMedia([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleDirectUploadInModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingMedia(true);
    const targetWsId = activeWorkspace?.id || "ws-default";
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("workspace_id", targetWsId);
    formData.append("folder", "General");
    formData.append("file", file);

    try {
      const res = await fetchApi<any>("/media/", {
        method: "POST",
        body: formData
      });

      if (res?.url) {
        toast.success(`Berhasil mengunggah '${file.name}' langsung ke Backblaze B2!`);
        if (res.storage) {
          setStorageInfo(res.storage);
          if (res.storage.overflow_warning) {
            toast.warning(res.storage.overflow_warning);
          }
        }
        setMediaUrls((prev) => [...prev, res.url]);
        loadMediaLibrary();
      }
    } catch (err: any) {
      toast.error(`Gagal upload: ${err.message || err}`);
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const uploadViaB2Fallback = async (file: File, workspaceId: string) => {
    const formData = new FormData();
    formData.append("workspace_id", workspaceId);
    formData.append("folder", "General");
    formData.append("file", file);

    const res = await fetchApi<any>("/media/", {
      method: "POST",
      body: formData
    });

    if (res?.url) {
      toast.success(`Berhasil mengunggah '${file.name}'!`);
      setMediaUrls((prev) => [...prev, res.url]);
    }
  };

  const handlePostForMeUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);
    const targetWsId = activeWorkspace?.id || "ws-default";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contentType = file.type || (file.name.endsWith(".mp4") ? "video/mp4" : "image/jpeg");

      try {
        // Step 1: Request signed upload URL from PostForMe API (POST /v1/media/create-upload-url)
        const res = await fetchApi<any>("/posts/media/create-upload-url", {
          method: "POST",
          body: JSON.stringify({ content_type: contentType })
        });

        if (res?.upload_url && res?.media_url) {
          if (res.upload_url.includes("simulated")) {
            await uploadViaB2Fallback(file, targetWsId);
          } else {
            // Step 2: Upload file directly to signed upload_url using PUT
            const putRes = await fetch(res.upload_url, {
              method: "PUT",
              headers: {
                "Content-Type": contentType
              },
              body: file
            });

            if (putRes.ok || putRes.status === 200 || putRes.status === 204) {
              // Step 3: Append media_url to post media attachments
              setMediaUrls((prev) => [...prev, res.media_url]);
              toast.success(`Berhasil upload '${file.name}'!`);
            } else {
              await uploadViaB2Fallback(file, targetWsId);
            }
          }
        } else {
          await uploadViaB2Fallback(file, targetWsId);
        }
      } catch (err: any) {
        console.warn("PostForMe signed upload fallback to B2:", err);
        await uploadViaB2Fallback(file, targetWsId);
      }
    }

    setIsUploadingMedia(false);
  };


  const openMediaPicker = () => {
    setIsMediaPickerOpen(true);
    loadMediaLibrary();
  };

  const toggleMediaSelectionFromLibrary = (url: string) => {
    setMediaUrls((prev) => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  // Schedule Preset Helpers
  const setSchedulePreset = (hoursFromNow: number) => {
    const target = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const hours = String(target.getHours()).padStart(2, "0");
    const minutes = String(target.getMinutes()).padStart(2, "0");
    setScheduledAt(`${year}-${month}-${day}T${hours}:${minutes}`);
  };

  if (!isComposerOpen) return null;

  const toggleAccountSelection = (acc: any) => {
    const check = checkPlatformCompatibility(acc.platform);
    if (!check.compatible) {
      toast.warning(`${acc.platform.toUpperCase()} Disabled: ${check.reason}`);
      return;
    }

    setSelectedAccountIds((prev) =>
      prev.includes(acc.id) ? prev.filter((item) => item !== acc.id) : [...prev, acc.id]
    );
  };

  const selectAllAccounts = () => {
    const compatibleAccs = availableAccounts.filter(a => checkPlatformCompatibility(a.platform).compatible);
    if (selectedAccountIds.length === compatibleAccs.length) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(compatibleAccs.map((a) => a.id));
    }
  };

  const addMediaUrl = () => {
    if (!newMediaInput.trim()) return;
    setMediaUrls((prev) => [...prev, newMediaInput.trim()]);
    setNewMediaInput("");
  };

  const removeMediaUrl = (index: number) => {
    setMediaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addXPollOption = () => {
    if (xPollOptions.length < 4) {
      setXPollOptions((prev) => [...prev, `Option ${prev.length + 1}`]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAccountIds.length === 0) {
      toast.warning("Please select at least one compatible social channel.");
      return;
    }
    if (!caption.trim() && mediaUrls.length === 0) {
      toast.warning("Please provide either a caption or at least one media URL.");
      return;
    }

    setIsSubmitting(true);

    // Format hashtags (max 5) and merge directly into caption
    const tagsArray = hashtags.trim().split(/\s+/).filter(h => h.length > 0).slice(0, 5);
    const hashtagsFormatted = tagsArray.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
    const fullCaption = caption.trim() + (hashtagsFormatted ? `\n\n${hashtagsFormatted}` : "");

    const mediaThumbnails: Record<string, any> = {};
    if (reelsThumbnailUrl.trim() || reelsThumbnailTimestampMs !== "") {
      mediaThumbnails["0"] = {
        thumbnail_url: reelsThumbnailUrl.trim() || null,
        thumbnail_timestamp_ms: reelsThumbnailTimestampMs !== "" ? Number(reelsThumbnailTimestampMs) : null
      };
    }

    const platformConfigs: Record<string, any> = {
      media_thumbnails: Object.keys(mediaThumbnails).length > 0 ? mediaThumbnails : null,
      instagram: {
        placement: postType === "video" ? "reels" : instaPlacement,
        share_to_feed: postType === "video" ? instaShareToFeed : false,
        location: instaLocation.trim() || null,
        collaborators: instaCollaborators ? instaCollaborators.split(",").map(s => s.trim().replace(/^@/, "")).filter(Boolean) : null,
        audio_name: instaAudioName.trim() || null,
        trial_reel_type: postType === "video" ? (instaTrialReelType || null) : null
      },
      youtube: {
        title: youtubeTitle.trim() || (caption ? caption.slice(0, 80) : "Social Video Post"),
        description: youtubeDescription.trim() || null,
        privacy_status: youtubePrivacy,
        category_id: youtubeCategory || null,
        made_for_kids: youtubeMadeForKids,
        contains_synthetic_media: youtubeSyntheticContent,
        embeddable: youtubeEmbeddable,
        public_stats_viewable: youtubePublicStatsViewable,
        license: youtubeLicense,
        default_language: youtubeDefaultLanguage.trim() || null,
        tags: youtubeTags ? youtubeTags.split(",").map(t => t.trim()).filter(Boolean) : null,
        recording_date: youtubeRecordingDate.trim() || null,
        publish_at: youtubePrivacy === "private" && youtubePublishAt ? new Date(youtubePublishAt).toISOString() : null,
        localizations: null
      },
      tiktok: {
        privacy_status: tiktokPrivacy === "PUBLIC_TO_EVERYONE" ? "public" : tiktokPrivacy === "SELF_ONLY" ? "private" : "follower",
        allow_comment: tiktokAllowComment,
        allow_duet: tiktokAllowDuet,
        allow_stitch: tiktokAllowStitch,
        auto_add_music: tiktokAutoAddMusic,
        disclose_branded_content: tiktokDiscloseBrandedContent,
        disclose_your_brand: tiktokDiscloseYourBrand,
        is_ai_generated: tiktokIsAiGenerated,
        is_draft: tiktokIsDraft
      },
      facebook: {
        placement: postType === "video" && facebookPlacement === "timeline" ? "reels" : facebookPlacement,
        location: facebookLocation.trim() || null,
        collaborators: facebookCollaborators ? facebookCollaborators.split(",").map(s => s.trim().replace(/^@/, "")).filter(Boolean) : null,
        set_caption_for_each_image: facebookSetCaptionForEachImage
      },
      x: {
        poll: xPollQuestion ? { duration_minutes: 1440, options: xPollOptions.filter(o => o.trim()), reply_settings: "following" } : null,
        reply_settings: "following"
      },
      pinterest: {
        title: pinterestTitle.trim() || (caption ? caption.slice(0, 50) : null),
        link: pinterestLink.trim() || null,
        board_ids: pinterestBoardIds ? pinterestBoardIds.split(",").map(b => b.trim()).filter(Boolean) : null
      },
      threads: {
        placement: postType === "video" && threadsPlacement === "timeline" ? "reels" : threadsPlacement
      },
      linkedin: {
        reshare_post_id: linkedinResharePostId.trim() || null
      }
    };

    const payload = {
      workspace_id: activeWorkspace?.id || "ws-default",
      account_ids: selectedAccountIds,
      target_account_ids: selectedAccountIds,
      post_type: postType,
      caption: fullCaption,
      hashtags: hashtagsFormatted,
      media_urls: mediaUrls,
      scheduled_at: actionType === "schedule" ? scheduledAt : null,
      action: actionType,
      publish_now: actionType === "publish_now",
      platform_configurations: platformConfigs
    };

    try {
      await fetchApi("/posts/", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      toast.success(
        actionType === "publish_now"
          ? "Post published instantly across channels!"
          : actionType === "schedule"
          ? "Post berhasil dijadwalkan!"
          : actionType === "save_draft"
          ? "Draft saved successfully!"
          : "Post berhasil dikirim ke antrian publishing!"
      );
      setIsSubmitting(false);
      closeComposer();
    } catch (err: any) {
      console.error("Post submit error:", err);
      toast.error(`Gagal membuat post: ${err.message || err}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 animate-fadeIn overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-5xl my-auto max-h-[96vh] sm:max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-slate-900">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl gradient-brand flex items-center justify-center shadow-md shadow-purple-500/25 shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight font-['Outfit']">
                Shiera Post Composer
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">Unified Publishing Across All 10 Social Media Platforms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile View Switcher Tabs */}
            <div className="flex lg:hidden items-center bg-slate-200/70 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMobileTab("editor")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  mobileTab === "editor" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileTab("preview")}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                  mobileTab === "preview" ? "bg-white text-purple-700 shadow-xs" : "text-slate-600"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            </div>

            <button
              onClick={closeComposer}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-500 hover:text-purple-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Main Form Editor Column */}
          <div className={`lg:col-span-7 p-4 sm:p-6 overflow-y-auto space-y-5 border-r border-slate-200/80 ${
            mobileTab === "editor" ? "block" : "hidden lg:block"
          }`}>
            
            {/* 1. Target Account Selection - Responsive Wrapped Desktop Container */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Target Channels</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-extrabold">
                    {selectedAccountIds.length} Selected
                  </span>
                </label>
                <button
                  onClick={selectAllAccounts}
                  className="text-[11px] text-purple-600 hover:underline font-semibold cursor-pointer"
                >
                  Select All Compatible
                </button>
              </div>

              {/* Flex Wrap Container for Desktop & Touch-Scroll for Mobile */}
              <div className="flex flex-wrap items-center gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
                {availableAccounts.map((acc) => {
                  const isSelected = selectedAccountIds.includes(acc.id);
                  const compat = checkPlatformCompatibility(acc.platform);
                  const badgeInfo = PLATFORM_BADGES[acc.platform] || { name: acc.platform, color: "", bg: "bg-purple-100 text-purple-700 border-purple-200" };
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => toggleAccountSelection(acc)}
                      title={!compat.compatible ? compat.reason : `@${acc.username} (${badgeInfo.name})`}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border font-medium shrink-0 transition-all cursor-pointer ${
                        !compat.compatible
                          ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/20"
                          : "bg-white border-slate-200 text-slate-700 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50/50 shadow-2xs"
                      }`}
                    >
                      {/* Avatar with Platform Icon Overlay */}
                      <div className="relative shrink-0">
                        <img
                          src={acc.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                          alt={acc.username}
                          className={`w-6 h-6 rounded-full object-cover border-2 ${isSelected ? "border-white/40" : "border-slate-100"} ${!compat.compatible ? "grayscale" : ""}`}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <AccountPlatformIcon platform={acc.platform} className="w-2 h-2" />
                        </div>
                      </div>

                      {/* Username & tiny platform label */}
                      <div className="flex flex-col items-start leading-tight max-w-[80px]">
                        <span className="font-semibold text-[10px] truncate w-full">@{acc.username}</span>
                        <span className={`text-[7.5px] font-extrabold uppercase leading-none ${
                          isSelected ? "text-white/70" : "text-slate-400"
                        }`}>
                          {badgeInfo.name}
                        </span>
                      </div>

                      {!compat.compatible ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 ml-0.5" />
                      ) : isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white ml-0.5" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Format Selection with Smart Constraints */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Post Format</label>
                {mediaUrls.length > 1 && (
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                    Auto-locked to Carousel (Multi-Media)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { 
                    id: "image", 
                    label: "Single Image", 
                    icon: ImageIcon,
                    disabled: mediaUrls.length > 1,
                    reason: "Disabled: Multiple media items attached"
                  },
                  { 
                    id: "carousel", 
                    label: "Carousel", 
                    icon: Layers,
                    disabled: false
                  },
                  { 
                    id: "video", 
                    label: "Video / Reel", 
                    icon: Video,
                    disabled: mediaUrls.length > 1,
                    reason: "Disabled: Multiple media items attached"
                  }
                ].map((format) => {
                  const Icon = format.icon;
                  const isSelected = postType === format.id;
                  return (
                    <button
                      key={format.id}
                      type="button"
                      disabled={format.disabled}
                      onClick={() => !format.disabled && setPostType(format.id as any)}
                      title={format.disabled ? format.reason : format.label}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        format.disabled
                          ? "bg-slate-100 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "bg-purple-50 border-purple-300 text-purple-900 font-bold shadow-2xs cursor-pointer"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                      <span>{format.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Caption Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">Post Caption</label>
                <span className="text-[10px] text-slate-400 font-mono">{caption.length} characters</span>
              </div>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Write your post caption here..."
                className="w-full glass-input rounded-2xl p-3 text-xs focus:outline-none resize-none"
              />
            </div>

            {/* 4. Hashtags (Maksimal 5 - otomatis digabung ke Caption saat dikirim) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center">
                  <span>Hashtags (Maksimal 5 Hashtag)</span>
                  <FieldTooltip text="Ketik hingga 5 hashtag (pisahkan dengan spasi). Hashtag akan otomatis digabungkan di bagian bawah Caption saat posting dikirim." />
                </label>
                {(() => {
                  const tagCount = hashtags.trim().split(/\s+/).filter(h => h.length > 0).length;
                  return (
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      tagCount > 5 ? "bg-rose-100 text-rose-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {tagCount} / 5 Hashtags
                    </span>
                  );
                })()}
              </div>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => {
                  const val = e.target.value;
                  const tags = val.trim().split(/\s+/).filter(h => h.length > 0);
                  if (tags.length <= 5 || !val.endsWith(" ")) {
                    setHashtags(val);
                  } else {
                    toast.warning("Maksimal 5 hashtag diperbolehkan.");
                  }
                }}
                placeholder="#Shiera #SocialMedia #Marketing #Agency #Post"
                className="w-full glass-input rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Hashtag ini akan dimasukkan langsung di akhir teks Caption.
              </p>
            </div>

            {/* 5. Attached Media & Direct Upload Dropzone */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-800">Media Attachments</label>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    {mediaUrls.length} File{mediaUrls.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openMediaPicker}
                  className="py-1.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5" />
                  Media Vault
                </button>
              </div>

              {/* Ruang Upload Langsung Berukuran Besar (Large Upload Dropzone) */}
              <label
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handlePostForMeUploadFiles(e.dataTransfer.files);
                  }
                }}
                className={`relative border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-purple-500 bg-purple-50/80 ring-4 ring-purple-500/10 scale-[0.99]"
                    : "border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/40"
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => e.target.files && handlePostForMeUploadFiles(e.target.files)}
                  className="hidden"
                  disabled={isUploadingMedia}
                />

                {isUploadingMedia ? (
                  <div className="py-2 flex flex-col items-center gap-2 text-purple-700">
                    <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                    <p className="text-xs font-bold">Mengunggah media ke cloud...</p>
                    <p className="text-[10px] text-slate-400">Menyalin file ke server media</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Unggah File Media Langsung
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik atau Seret &amp; Lepas Gambar (JPG, PNG) atau Video (MP4) di sini
                    </p>
                  </>
                )}
              </label>

              {/* Attached Media Thumbnails */}
              {mediaUrls.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                  {mediaUrls.map((url, idx) => {
                    const isVid = postType === "video" || isVideoMedia({ url });
                    return (
                      <div key={idx} className="relative group shrink-0">
                        {isVid ? (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-black flex items-center justify-center">
                            <video src={url} preload="metadata" muted className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <Play className="w-3.5 h-3.5 fill-white text-white" />
                            </div>
                          </div>
                        ) : (
                          <img src={url} alt="media" className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaUrl(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-1 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compact Add URL Option Toggle */}
              <div className="pt-1">
                {!showUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="text-[11px] text-slate-500 hover:text-purple-600 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <LinkIcon className="w-3 h-3 text-slate-400" />
                    <span>+ Atau tambah media via Direct URL</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <input
                      type="text"
                      value={newMediaInput}
                      onChange={(e) => setNewMediaInput(e.target.value)}
                      placeholder="Paste image/video URL (https://...)"
                      className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white border border-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addMediaUrl();
                        setShowUrlInput(false);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Add URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Video / Reels Cover Thumbnail Setup */}
            {(postType === "video" || mediaUrls.some(u => isVideoMedia({ url: u }))) && (
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-900 flex items-center">
                    <span>Video / Reels Cover Thumbnail</span>
                    <FieldTooltip text="Upload atau tempel URL gambar sampul untuk thumbnail video Reels. Anda dapat mengatur Tampilan Thumbnail di panel Live Preview." />
                  </label>
                  {reelsThumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => { setReelsThumbnailUrl(""); setShowThumbnailInPreview(false); }}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      ✕ Hapus Cover
                    </button>
                  )}
                </div>

                {/* Upload + URL — same pattern as media attachment */}
                {!reelsThumbnailUrl ? (
                  <div className="space-y-2">
                    {/* Dropzone */}
                    <label
                      className={`relative border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        isUploadingThumbnail
                          ? "border-purple-400 bg-purple-50/80 cursor-wait"
                          : "border-purple-300 hover:border-purple-500 bg-white hover:bg-purple-50/40"
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isUploadingThumbnail}
                        onChange={async (e) => {
                          if (!e.target.files || e.target.files.length === 0) return;
                          setIsUploadingThumbnail(true);
                          const file = e.target.files[0];
                          const contentType = file.type || "image/jpeg";
                          try {
                            // Use PostForMe signed upload URL (same as main media)
                            const res = await fetchApi<any>("/posts/media/create-upload-url", {
                              method: "POST",
                              body: JSON.stringify({ content_type: contentType })
                            });
                            if (res?.upload_url && res?.media_url && !res.upload_url.includes("simulated")) {
                              const putRes = await fetch(res.upload_url, {
                                method: "PUT",
                                headers: { "Content-Type": contentType },
                                body: file
                              });
                              if (putRes.ok || putRes.status === 200 || putRes.status === 204) {
                                setReelsThumbnailUrl(res.media_url);
                                setShowThumbnailInPreview(true);
                                toast.success(`Cover thumbnail '${file.name}' berhasil diunggah!`);
                              } else {
                                throw new Error("Upload gagal");
                              }
                            } else if (res?.media_url) {
                              // Simulated / fallback: use B2
                              const fd = new FormData();
                              fd.append("workspace_id", activeWorkspace?.id || "ws-default");
                              fd.append("folder", "Thumbnails");
                              fd.append("file", file);
                              const b2Res = await fetchApi<any>("/media/", { method: "POST", body: fd });
                              if (b2Res?.url) {
                                setReelsThumbnailUrl(b2Res.url);
                                setShowThumbnailInPreview(true);
                                toast.success(`Cover thumbnail '${file.name}' berhasil diunggah!`);
                              }
                            }
                          } catch (err: any) {
                            toast.error(`Gagal upload thumbnail: ${err.message || err}`);
                          } finally {
                            setIsUploadingThumbnail(false);
                            e.target.value = "";
                          }
                        }}
                      />
                      {isUploadingThumbnail ? (
                        <div className="py-1 flex flex-col items-center gap-2 text-purple-700">
                          <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                          <p className="text-xs font-bold">Mengunggah thumbnail...</p>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-1.5 shadow-xs">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-800">Upload Cover Image</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Klik atau seret JPG / PNG ke sini</p>
                        </>
                      )}
                    </label>

                    {/* URL Fallback — same style as media attachment */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">atau tempel URL</span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        id="thumbnail-url-input"
                        type="text"
                        placeholder="https://.../cover.jpg"
                        className="flex-1 glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white border border-purple-200"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val) { setReelsThumbnailUrl(val); setShowThumbnailInPreview(true); }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("thumbnail-url-input") as HTMLInputElement;
                          const val = el?.value.trim();
                          if (val) { setReelsThumbnailUrl(val); setShowThumbnailInPreview(true); }
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs shrink-0"
                      >
                        Set Cover
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Thumbnail set — show preview row */
                  <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-purple-200">
                    <img
                      src={reelsThumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-16 h-12 rounded-lg object-cover border border-purple-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-800">Cover Thumbnail Set ✓</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{reelsThumbnailUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. Scheduling Controls when Schedule Selected */}
            {actionType === "schedule" && (
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-purple-900">Schedule Date &amp; Time</h4>
                  </div>
                  <span className="text-[10px] text-purple-700 font-mono">Asia/Jakarta (WIB)</span>
                </div>

                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border-purple-200 bg-white"
                />

                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => setSchedulePreset(1)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 text-[10px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedulePreset(24)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 text-[10px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setSchedulePreset(48)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 text-[10px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    In 2 Days
                  </button>
                </div>
              </div>
            )}

            {/* 7. Platform Specific Customization Grid */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-purple-600" />
                  Platform Specific Options
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">Click platform below</span>
              </div>

              {/* Wrapped Platform Grid Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-1 border-b border-slate-100 pb-3">
                {[
                  { id: "instagram", label: "Instagram", icon: InstagramIcon, color: "text-pink-600" },
                  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-600" },
                  { id: "threads", label: "Threads", icon: MessageSquare, color: "text-zinc-800" },
                  { id: "tiktok", label: "TikTok", icon: Video, color: "text-cyan-600" },
                  { id: "x", label: "X (Twitter)", icon: Twitter, color: "text-slate-800" },
                  { id: "facebook", label: "Facebook", icon: FacebookIcon, color: "text-blue-600" },
                  { id: "pinterest", label: "Pinterest", icon: Share2, color: "text-rose-600" },
                  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-sky-600" },
                  { id: "bluesky", label: "Bluesky", icon: Share2, color: "text-sky-500" }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activePlatformTab === tab.id;
                  const compat = checkPlatformCompatibility(tab.id);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivePlatformTab(tab.id)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                        !compat.compatible
                          ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                          : isActive
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-purple-300"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : tab.color}`} />
                      <span className="truncate">{tab.label}</span>
                      {!compat.compatible && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Platform Dynamic Form Panels */}
              <div className="pt-2">
                {activePlatformTab === "instagram" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Post Placement</span>
                          <FieldTooltip text="Pilih lokasi penerbitan di Instagram: Timeline Feed (foto/video beranda), Reels (video pendek vertikal), atau Stories (tayang 24 jam)." />
                        </label>
                        <select
                          value={postType !== "video" && instaPlacement === "reels" ? "timeline" : instaPlacement}
                          onChange={(e) => setInstaPlacement(e.target.value as any)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="timeline">Timeline Feed (Post biasa)</option>
                          <option value="reels" disabled={postType !== "video"}>
                            {postType !== "video" ? "Instagram Reels (Khusus Video)" : "Instagram Reels"}
                          </option>
                          <option value="stories">Instagram Stories (24 Jam)</option>
                        </select>
                        {postType !== "video" && (
                          <p className="text-[10px] text-amber-600 mt-1">
                            *Format {postType === "carousel" ? "Carousel Foto" : "Foto Single"} diterbitkan ke Feed/Stories (Reels khusus video).
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Tag Location (Lokasi)</span>
                          <FieldTooltip text="Tambahkan penanda lokasi kota/tempat pada postingan kamu untuk meningkatkan penemuan konten lokal (Local SEO)." />
                        </label>
                        <input
                          type="text"
                          value={instaLocation}
                          onChange={(e) => setInstaLocation(e.target.value)}
                          placeholder="misal: Jakarta, Indonesia atau Bali"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Collaborators (Kolaborator)</span>
                          <FieldTooltip text="Undang akun Instagram lain (e.g. @brand, @influencer) agar postingan tayang bersamaan di kedua profil." />
                        </label>
                        <input
                          type="text"
                          value={instaCollaborators}
                          onChange={(e) => setInstaCollaborators(e.target.value)}
                          placeholder="@username1, @username2"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Reels Original Audio Name</span>
                          <FieldTooltip text="Beri nama trek suara original pada video Reels kamu agar pengguna lain bisa mengidentifikasi/menggunakan audio kamu." />
                        </label>
                        <input
                          type="text"
                          value={instaAudioName}
                          onChange={(e) => setInstaAudioName(e.target.value)}
                          placeholder="misal: Original Sound - Brand Name"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Trial Reel Type (Uji Coba Konten)</span>
                          <FieldTooltip text="Uji coba Reels ke non-followers dulu tanpa muncul di profil kamu. Khusus format Video Reels." />
                        </label>
                        <select
                          value={postType !== "video" ? "" : instaTrialReelType}
                          disabled={postType !== "video"}
                          onChange={(e) => setInstaTrialReelType(e.target.value as any)}
                          className={`w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none ${
                            postType !== "video" ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60" : "bg-white cursor-pointer"
                          }`}
                        >
                          <option value="">Standard Post (Bukan Trial)</option>
                          <option value="manual">Trial Reel (Manual Graduation)</option>
                          <option value="performance">Trial Reel (Performance Auto Graduation)</option>
                        </select>
                        {postType !== "video" && (
                          <p className="text-[10px] text-slate-400 mt-0.5">*Trial Reel khusus untuk format Video.</p>
                        )}
                      </div>

                      <div className="flex flex-col justify-end">
                        <label className={`flex items-center gap-2 text-xs font-medium ${
                          postType !== "video" ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"
                        }`}>
                          <input
                            type="checkbox"
                            checked={postType === "video" ? instaShareToFeed : false}
                            disabled={postType !== "video"}
                            onChange={(e) => setInstaShareToFeed(e.target.checked)}
                            className="rounded border-slate-300 text-pink-600 focus:ring-pink-500 cursor-pointer disabled:opacity-50"
                          />
                          <span>Tampilkan Reels di Grid Utama Profil (Share to Feed)</span>
                        </label>
                        <p className="text-[10px] text-slate-400 mt-0.5 pl-5">
                          {postType !== "video" ? "*Share to Feed khusus untuk Video Reels." : "Jika di-uncheck, video Reels hanya ada di tab khusus Reels."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}



                {activePlatformTab === "youtube" && (
                  <div className="space-y-3 animate-fadeIn">
                    {!checkPlatformCompatibility("youtube").compatible && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>YouTube disabled: Multi-image carousel posts are not supported on YouTube.</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Video Title (Required for YouTube)</label>
                        <input
                          type="text"
                          value={youtubeTitle}
                          onChange={(e) => setYoutubeTitle(e.target.value)}
                          placeholder="Title for YouTube video..."
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Default Language Tag</label>
                        <input
                          type="text"
                          value={youtubeDefaultLanguage}
                          onChange={(e) => setYoutubeDefaultLanguage(e.target.value)}
                          placeholder="e.g. id, en, es"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Video Description Override</label>
                      <textarea
                        rows={2}
                        value={youtubeDescription}
                        onChange={(e) => setYoutubeDescription(e.target.value)}
                        placeholder="Khusus deskripsi YouTube (Opsional, bawaan menggunakan caption utama)"
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Privacy Status</label>
                        <select
                          value={youtubePrivacy}
                          onChange={(e) => setYoutubePrivacy(e.target.value as any)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="public">Public</option>
                          <option value="unlisted">Unlisted</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Category</label>
                        <select
                          value={youtubeCategory}
                          onChange={(e) => setYoutubeCategory(e.target.value)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="Entertainment">Entertainment</option>
                          <option value="Education">Education</option>
                          <option value="Tech">Science &amp; Tech</option>
                          <option value="Gaming">Gaming</option>
                          <option value="People">People &amp; Blogs</option>
                          <option value="Music">Music</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">License</label>
                        <select
                          value={youtubeLicense}
                          onChange={(e) => setYoutubeLicense(e.target.value as any)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="youtube">Standard YouTube License</option>
                          <option value="creativeCommon">Creative Commons</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tags (Pisahkan dengan koma)</label>
                        <input
                          type="text"
                          value={youtubeTags}
                          onChange={(e) => setYoutubeTags(e.target.value)}
                          placeholder="e.g. tutorial, vlog, trending"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Tanggal Perekaman (YYYY-MM-DD)</label>
                        <input
                          type="date"
                          value={youtubeRecordingDate}
                          onChange={(e) => setYoutubeRecordingDate(e.target.value)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {youtubePrivacy === "private" && (
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Waktu Publikasi Terjadwal (Publish At for Private Video)</label>
                        <input
                          type="datetime-local"
                          value={youtubePublishAt}
                          onChange={(e) => setYoutubePublishAt(e.target.value)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={youtubeMadeForKids}
                          onChange={(e) => setYoutubeMadeForKids(e.target.checked)}
                          className="rounded border-slate-300 text-red-600 cursor-pointer"
                        />
                        <span>Made for Kids (CoPPA Compliant)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={youtubeSyntheticContent}
                          onChange={(e) => setYoutubeSyntheticContent(e.target.checked)}
                          className="rounded border-slate-300 text-red-600 cursor-pointer"
                        />
                        <span>Contains Altered or AI Synthetic Content</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={youtubeEmbeddable}
                          onChange={(e) => setYoutubeEmbeddable(e.target.checked)}
                          className="rounded border-slate-300 text-red-600 cursor-pointer"
                        />
                        <span>Izinkan Video Di-embed di Web Lain</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={youtubePublicStatsViewable}
                          onChange={(e) => setYoutubePublicStatsViewable(e.target.checked)}
                          className="rounded border-slate-300 text-red-600 cursor-pointer"
                        />
                        <span>Statistik Video Publik Dapat Dilihat</span>
                      </label>
                    </div>
                  </div>
                )}

                {activePlatformTab === "threads" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Threads Placement</label>
                        <select
                          value={threadsPlacement}
                          onChange={(e) => setThreadsPlacement(e.target.value as any)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="timeline">Timeline Feed</option>
                          <option value="reels">Threads Video Reels</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Topic / Tag</label>
                        <input
                          type="text"
                          value={threadsTopic}
                          onChange={(e) => setThreadsTopic(e.target.value)}
                          placeholder="#TechTrends or Topic..."
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Who can reply?</label>
                      <select
                        value={threadsReplyControl}
                        onChange={(e) => setThreadsReplyControl(e.target.value)}
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="anyone">Anyone</option>
                        <option value="follows">Profiles you follow</option>
                        <option value="mentioned">Mentioned only</option>
                      </select>
                    </div>
                  </div>
                )}

                {activePlatformTab === "tiktok" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Who can view this video?</label>
                      <select
                        value={tiktokPrivacy}
                        onChange={(e) => setTiktokPrivacy(e.target.value as any)}
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="PUBLIC_TO_EVERYONE">Everyone (Public)</option>
                        <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                        <option value="SELF_ONLY">Private (Only Me)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokAllowComment}
                          onChange={(e) => setTiktokAllowComment(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Allow Comments</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokAllowDuet}
                          onChange={(e) => setTiktokAllowDuet(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Allow Duets</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokAllowStitch}
                          onChange={(e) => setTiktokAllowStitch(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Allow Stitch</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokAutoAddMusic}
                          onChange={(e) => setTiktokAutoAddMusic(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Auto-Add Music (Photo posts)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokDiscloseBrandedContent}
                          onChange={(e) => setTiktokDiscloseBrandedContent(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Disclose Branded Content</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokDiscloseYourBrand}
                          onChange={(e) => setTiktokDiscloseYourBrand(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Disclose Your Brand</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokIsAiGenerated}
                          onChange={(e) => setTiktokIsAiGenerated(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Flag as AI-Generated Content</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tiktokIsDraft}
                          onChange={(e) => setTiktokIsDraft(e.target.checked)}
                          className="rounded border-slate-300 text-cyan-600 cursor-pointer"
                        />
                        <span>Save as TikTok Draft (Finish in App)</span>
                      </label>
                    </div>
                  </div>
                )}

                {activePlatformTab === "x" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Poll Question (Optional)</label>
                      <input
                        type="text"
                        value={xPollQuestion}
                        onChange={(e) => setXPollQuestion(e.target.value)}
                        placeholder="Ask your audience a question..."
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    {xPollQuestion && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-slate-600 block">Poll Choices</label>
                        {xPollOptions.map((opt, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const val = e.target.value;
                              setXPollOptions(prev => prev.map((o, i) => i === idx ? val : o));
                            }}
                            placeholder={`Option ${idx + 1}`}
                            className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                          />
                        ))}
                        {xPollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={addXPollOption}
                            className="text-xs text-purple-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Choice Option
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activePlatformTab === "facebook" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Facebook Placement</span>
                          <FieldTooltip text="Pilih lokasi terbit di Facebook: Timeline Feed, Video Reels, atau Facebook Stories." />
                        </label>
                        <select
                          value={facebookPlacement}
                          onChange={(e) => setFacebookPlacement(e.target.value as any)}
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none bg-white cursor-pointer"
                        >
                          <option value="timeline">Timeline Feed</option>
                          <option value="reels">Facebook Reels</option>
                          <option value="stories">Facebook Stories</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                          <span>Tag Location (Page ID)</span>
                          <FieldTooltip text="Page ID lokasi Facebook yang ingin di-tag pada postingan gambar/video." />
                        </label>
                        <input
                          type="text"
                          value={facebookLocation}
                          onChange={(e) => setFacebookLocation(e.target.value)}
                          placeholder="Page ID lokasi (e.g. 102938475)"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                        <span>Collaborators Page IDs (Khusus Video Reels)</span>
                        <FieldTooltip text="Daftar Page ID Facebook yang diundang sebagai kolaborator Video Reel (pisahkan koma)." />
                      </label>
                      <input
                        type="text"
                        value={facebookCollaborators}
                        onChange={(e) => setFacebookCollaborators(e.target.value)}
                        placeholder="Page ID 1, Page ID 2"
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={facebookSetCaptionForEachImage}
                          onChange={(e) => setFacebookSetCaptionForEachImage(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 cursor-pointer"
                        />
                        <span>Sertakan Caption di Setiap Gambar Carousel (Set caption for each image)</span>
                      </label>
                    </div>
                  </div>
                )}

                {activePlatformTab === "pinterest" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pin Title (Overrides Post Title)</label>
                        <input
                          type="text"
                          value={pinterestTitle}
                          onChange={(e) => setPinterestTitle(e.target.value)}
                          placeholder="Title for Pinterest pin..."
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Destination Link URL</label>
                        <input
                          type="text"
                          value={pinterestLink}
                          onChange={(e) => setPinterestLink(e.target.value)}
                          placeholder="https://yourbrand.com/item"
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Pinterest Board IDs (Pisahkan koma jika lebih dari satu)</label>
                      <input
                        type="text"
                        value={pinterestBoardIds}
                        onChange={(e) => setPinterestBoardIds(e.target.value)}
                        placeholder="board_id_1, board_id_2"
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activePlatformTab === "linkedin" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Article Headline / Title</label>
                      <input
                        type="text"
                        value={linkedinTitle}
                        onChange={(e) => setLinkedinTitle(e.target.value)}
                        placeholder="Headline for LinkedIn..."
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center mb-1">
                        <span>Reshare LinkedIn UGC Post ID (Optional)</span>
                        <FieldTooltip text="ID Postingan UGC LinkedIn yang ingin di-reshare. Caption postingan ini akan menjadi komentar reshare." />
                      </label>
                      <input
                        type="text"
                        value={linkedinResharePostId}
                        onChange={(e) => setLinkedinResharePostId(e.target.value)}
                        placeholder="urn:li:share:123456789 atau Post ID"
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {activePlatformTab === "bluesky" && (
                  <div className="space-y-3 animate-fadeIn">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Alt Text for Images</label>
                      <input
                        type="text"
                        value={blueskyAltText}
                        onChange={(e) => setBlueskyAltText(e.target.value)}
                        placeholder="Describe images for accessibility..."
                        className="w-full glass-input rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Live Feed Preview */}
          <div className={`lg:col-span-5 p-4 sm:p-6 bg-slate-50/80 overflow-y-auto space-y-4 ${
            mobileTab === "preview" ? "block" : "hidden lg:block"
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Feed Preview</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Rasio:</span>
                {(["1:1", "4:5", "16:9", "9:16"] as const).map(aspect => (
                  <button
                    key={aspect}
                    type="button"
                    onClick={() => setPreviewAspect(aspect)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      previewAspect === aspect ? "bg-purple-600 text-white shadow-xs" : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {aspect}
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail Toggle Control directly inside Live Feed Preview */}
            {(postType === "video" || isVideoMedia({ url: mediaUrls[previewSlideIndex] || mediaUrls[0] }) || reelsThumbnailUrl) && (
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-purple-50 border border-purple-200 shadow-2xs">
                <span className="text-[11px] font-extrabold text-purple-900 font-['Outfit']">Tampilan Thumbnail:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (!reelsThumbnailUrl) {
                      toast.info("Silakan atur atau unggah Cover Thumbnail terlebih dahulu di form editor.");
                      return;
                    }
                    setShowThumbnailInPreview(p => !p);
                  }}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    showThumbnailInPreview
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {showThumbnailInPreview ? (
                    <>
                      <span>🖼 Full Thumbnail</span>
                      <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">ON</span>
                    </>
                  ) : (
                    <>
                      <span>▶ Tanpa Thumbnail (Video)</span>
                      <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-mono">OFF</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Live Feed Card Preview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  A
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Agency Brand Channel</p>
                  <p className="text-[10px] text-slate-400">Just now</p>
                </div>
              </div>

              {/* Multi-Media Interactive Carousel & Video Feed Preview with Dynamic Aspect Ratio */}
              {mediaUrls.length > 0 ? (
                <div className="relative group rounded-xl overflow-hidden border border-slate-100 shadow-2xs bg-black/5 flex items-center justify-center">
                  {/* Active Slide Rendering with Dynamic Aspect Ratio */}
                  {(() => {
                    const currentUrl = mediaUrls[previewSlideIndex] || mediaUrls[0];
                    const isVid = postType === "video" || isVideoMedia({ url: currentUrl });

                    if (isVid) {
                      if (showThumbnailInPreview && reelsThumbnailUrl) {
                        return (
                          <div className="relative w-full overflow-hidden bg-black flex items-center justify-center">
                            <img
                              src={reelsThumbnailUrl}
                              alt="Full Cover Thumbnail"
                              className={`w-full object-cover ${
                                previewAspect === "1:1" ? "aspect-square max-h-72" :
                                previewAspect === "4:5" ? "aspect-[4/5] max-h-80" :
                                previewAspect === "16:9" ? "aspect-[16/9] max-h-56" : "aspect-[9/16] max-h-[380px]"
                              }`}
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                              <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl">
                                <Play className="w-5 h-5 fill-white ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-purple-900/90 text-white text-[9px] font-bold backdrop-blur-md shadow-md border border-purple-500/30">
                              🖼 Full Cover Thumbnail
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="relative w-full bg-black flex items-center justify-center">
                          <video
                            src={currentUrl}
                            controls
                            preload="metadata"
                            playsInline
                            className={`w-full object-cover bg-black ${
                              previewAspect === "1:1" ? "aspect-square max-h-72" :
                              previewAspect === "4:5" ? "aspect-[4/5] max-h-80" :
                              previewAspect === "16:9" ? "aspect-[16/9] max-h-56" : "aspect-[9/16] max-h-[380px]"
                            }`}
                          />
                        </div>
                      );
                    }

                    return (
                      <img
                        src={currentUrl}
                        alt={`Preview slide ${previewSlideIndex + 1}`}
                        className={`w-full object-cover ${
                          previewAspect === "1:1" ? "aspect-square max-h-72" :
                          previewAspect === "4:5" ? "aspect-[4/5] max-h-80" :
                          previewAspect === "16:9" ? "aspect-[16/9] max-h-56" : "aspect-[9/16] max-h-[380px]"
                        }`}
                      />
                    );
                  })()}

                  {/* Multi-Media Carousel Controls & Badges */}
                  {mediaUrls.length > 1 && (
                    <>
                      {/* Counter Badge */}
                      <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-slate-900/75 backdrop-blur-md text-white text-[10px] font-bold font-mono shadow-sm">
                        {previewSlideIndex + 1} / {mediaUrls.length}
                      </div>

                      {/* Previous Slide Button */}
                      {previewSlideIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIndex(prev => Math.max(0, prev - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-md"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      )}

                      {/* Next Slide Button */}
                      {previewSlideIndex < mediaUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setPreviewSlideIndex(prev => Math.min(mediaUrls.length - 1, prev + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/60 hover:bg-slate-900/90 text-white flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer shadow-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* Pagination Indicator Dots */}
                      <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
                        {mediaUrls.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewSlideIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                              previewSlideIndex === idx ? "bg-white scale-125 shadow-sm" : "bg-white/50 hover:bg-white/80"
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full h-36 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span>No media attached</span>
                </div>
              )}

              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {caption || "Your post caption preview will appear here in real-time..."}
              </p>
              {hashtags && <p className="text-xs text-purple-600 font-semibold">{hashtags}</p>}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-slate-200/80 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[
              { id: "publish_now", label: "Publish Now", icon: Send },
              { id: "schedule", label: "Schedule", icon: Clock },
              { id: "save_draft", label: "Draft", icon: Save }
            ].map((act) => {
              const Icon = act.icon;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setActionType(act.id as any)}
                  className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    actionType === act.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{act.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="py-2.5 px-6 rounded-2xl gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/35 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : actionType === "schedule" ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Schedule Post</span>
              </>
            ) : actionType === "save_draft" ? (
              <>
                <Save className="w-4 h-4" />
                <span>Save Draft</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Post Now</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Internal Glassmorphic Media Library Picker Modal */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/90">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                  <Folder className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 font-['Outfit']">Media Vault &amp; Direct Upload</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Backblaze B2 Direct Cloud Storage Per-User Folder</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct Upload Button */}
                <label className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer">
                  <UploadCloud className={`w-3.5 h-3.5 ${isUploadingMedia ? "animate-bounce" : ""}`} />
                  <span>{isUploadingMedia ? "Uploading B2..." : "Upload Ke B2"}</span>
                  <input
                    type="file"
                    onChange={handleDirectUploadInModal}
                    className="hidden"
                    accept="image/*,video/*"
                    disabled={isUploadingMedia}
                  />
                </label>

                <button
                  type="button"
                  onClick={loadMediaLibrary}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
                  title="Resync with Backblaze B2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLibrary ? "animate-spin" : ""}`} />
                  <span>Sync B2</span>
                </button>
                
                <button
                  onClick={() => setIsMediaPickerOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Storage Usage Bar Header */}
            <div className="px-4 sm:px-6 py-2.5 bg-purple-50/60 border-b border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-purple-900">User Storage Cap (100MB):</span>
                <span className={`text-[11px] font-extrabold font-mono ${storageInfo.is_overflow ? "text-rose-600" : "text-purple-700"}`}>
                  {storageInfo.used_mb || 0} MB / 100 MB ({storageInfo.percentage || 0}%)
                </span>
                {storageInfo.is_overflow && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Temp Overflow Active
                  </span>
                )}
              </div>

              {/* Visual Storage Progress Bar */}
              <div className="w-full sm:w-48 h-2 rounded-full bg-purple-200/80 overflow-hidden shrink-0">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    storageInfo.is_overflow ? "bg-rose-500" : storageInfo.percentage > 80 ? "bg-amber-500" : "bg-purple-600"
                  }`}
                  style={{ width: `${Math.min(100, storageInfo.percentage || 0)}%` }}
                />
              </div>
            </div>

            {/* Media Items Grid */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
              {isLoadingLibrary ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                  <p>Fetching files from Backblaze B2 storage...</p>
                </div>
              ) : libraryMedia.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 space-y-3">
                  <UploadCloud className="w-8 h-8 text-purple-400 mx-auto" />
                  <p className="font-semibold text-slate-700">Belum ada media di Backblaze B2 storage user ini.</p>
                  <label className="inline-flex py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold items-center gap-2 cursor-pointer shadow-md">
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload File Pertama ke B2</span>
                    <input
                      type="file"
                      onChange={handleDirectUploadInModal}
                      className="hidden"
                      accept="image/*,video/*"
                    />
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {libraryMedia.map((item) => {
                    const isSelected = mediaUrls.includes(item.url);
                    const isVid = isVideoMedia(item);
                    return (
                      <div
                        key={item.id || item.url}
                        onClick={() => toggleMediaSelectionFromLibrary(item.url)}
                        className={`group relative rounded-2xl border cursor-pointer overflow-hidden transition-all ${
                          isSelected 
                            ? "border-purple-600 ring-2 ring-purple-500/30 bg-purple-50" 
                            : "border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        {isVid ? (
                          <div className="relative w-full h-24 sm:h-28 bg-slate-900 flex items-center justify-center overflow-hidden">
                            <video
                              src={item.url}
                              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform"
                              muted
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                                <Play className="w-4 h-4 fill-white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={item.url || item.thumbnail_url}
                            alt={item.filename || item.original_filename || "Media Asset"}
                            className="w-full h-24 sm:h-28 object-cover group-hover:scale-105 transition-transform"
                          />
                        )}

                        <div className="p-2 bg-white/90 text-[10px]">
                          <p className="font-bold text-slate-800 truncate">{item.filename || item.original_filename || "Asset"}</p>
                          <p className="text-slate-400 capitalize">{isVid ? "Video/MP4" : (item.file_type || item.media_type || "Image")}</p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-semibold">
                {mediaUrls.length} media attached to post
              </span>
              <button
                onClick={() => setIsMediaPickerOpen(false)}
                className="py-2 px-5 rounded-xl gradient-brand text-white font-semibold text-xs shadow-md shadow-purple-500/25 cursor-pointer"
              >
                Done Selecting
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
