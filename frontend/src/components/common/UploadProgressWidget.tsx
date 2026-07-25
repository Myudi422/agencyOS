"use client";

import React, { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, Trash2, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function UploadProgressWidget() {
  const { uploadTasks, removeUploadTask, clearCompletedUploads } = useStore();
  const [isMinimized, setIsMinimized] = useState(false);

  if (uploadTasks.length === 0) return null;

  const uploadingCount = uploadTasks.filter((t) => t.status === "uploading").length;
  const completedCount = uploadTasks.filter((t) => t.status === "completed").length;
  const errorCount = uploadTasks.filter((t) => t.status === "error").length;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 w-80 sm:w-96 glass-panel rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden transition-all duration-300 select-none">
      {/* Header Bar */}
      <div className="p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          {uploadingCount > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <UploadCloud className="w-4 h-4 text-white" />
          )}
          <span className="text-xs font-bold font-['Outfit']">
            {uploadingCount > 0
              ? `Uploading ${uploadingCount} file${uploadingCount > 1 ? "s" : ""}...`
              : "Upload Queue"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {completedCount > 0 && (
            <button
              onClick={clearCompletedUploads}
              className="p-1 rounded-lg hover:bg-white/20 text-white/90 text-[10px] font-medium flex items-center gap-1 transition-colors"
              title="Clear Completed"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Upload Tasks List */}
      {!isMinimized && (
        <div className="max-h-60 overflow-y-auto p-3 space-y-2.5 bg-white/90">
          {uploadTasks.map((t) => (
            <div key={t.id} className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 truncate flex-1">
                  {t.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600 shrink-0" />}
                  {t.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  {t.status === "error" && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                  <span className="font-semibold text-slate-800 truncate">{t.filename}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-slate-400">{formatSize(t.fileSize)}</span>
                  <button
                    onClick={() => removeUploadTask(t.id)}
                    className="p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-200 rounded-full ${
                      t.status === "completed"
                        ? "bg-emerald-500"
                        : t.status === "error"
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600"
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
                  <span>Folder: AgencyOS/{t.folder}</span>
                  <span className="font-mono">
                    {t.status === "completed" ? "Completed" : t.status === "error" ? "Failed" : `${t.progress}%`}
                  </span>
                </div>
                {t.status === "error" && t.errorMessage && (
                  <p className="text-[10px] text-rose-600 font-medium bg-rose-50 p-1.5 rounded-lg border border-rose-100 mt-1 break-all">
                    {t.errorMessage}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
