"use client";

import React, { useState } from "react";
import { Folder, FolderPlus, FolderInput, X, Check } from "lucide-react";

interface MoveToFolderModalProps {
  isOpen: boolean;
  itemCount: number;
  availableFolders: string[];
  isLoading?: boolean;
  onMove: (targetFolder: string) => void;
  onClose: () => void;
}

export default function MoveToFolderModal({
  isOpen,
  itemCount,
  availableFolders,
  isLoading = false,
  onMove,
  onClose,
}: MoveToFolderModalProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>(availableFolders[0] || "General");
  const [customFolder, setCustomFolder] = useState<string>("");
  const [isCreatingCustom, setIsCreatingCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirmMove = () => {
    const target = isCreatingCustom && customFolder.trim() ? customFolder.trim() : selectedFolder;
    if (!target) return;
    onMove(target);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-7 shadow-2xl border border-white/80 space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
              <FolderInput className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-['Outfit']">
                Move {itemCount} Asset{itemCount > 1 ? "s" : ""}
              </h3>
              <p className="text-xs text-slate-500">
                Select target folder under root <code className="font-mono text-purple-700 font-bold">AgencyOS/</code>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folder Selection Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Destination Folder</span>
            <button
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isCreatingCustom ? "Use Existing" : "Create New"}</span>
            </button>
          </div>

          {isCreatingCustom ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter new folder name (e.g. Campaigns, Social)..."
                value={customFolder}
                onChange={(e) => setCustomFolder(e.target.value)}
                className="w-full glass-input rounded-2xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none border border-purple-300"
                autoFocus
              />
              <p className="text-[11px] text-slate-400">Folder will be saved as AgencyOS/{customFolder || "[Folder]"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableFolders.map((f) => {
                const isSelected = selectedFolder === f;
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFolder(f)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-purple-50 text-purple-800 border-purple-300 shadow-xs"
                        : "bg-white/60 text-slate-700 border-slate-200/80 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-4 h-4 shrink-0 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                      <span className="truncate">{f}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirmMove}
            disabled={isLoading || (isCreatingCustom && !customFolder.trim())}
            className={`px-5 py-2.5 rounded-2xl gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-purple-500/25 transition-all ${
              isLoading || (isCreatingCustom && !customFolder.trim()) ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {isLoading ? "Moving..." : "Move File(s)"}
          </button>
        </div>

      </div>
    </div>
  );
}
