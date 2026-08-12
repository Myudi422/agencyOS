"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DEFAULT_TOUR_STEPS, TourStep } from "./tourSteps";
import { Sparkles, ChevronRight, ChevronLeft, X, CheckCircle2, HelpCircle } from "lucide-react";

const STORAGE_KEY = "agencyos_tour_completed_v1";

export function startAppTour() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("agencyos-start-tour"));
  }
}

export default function AppTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = DEFAULT_TOUR_STEPS;
  const currentStep = steps[currentStepIndex];

  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 250);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    // Check auto start on first visit
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setCurrentStepIndex(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleStartEvent = () => {
      setIsOpen(true);
      setCurrentStepIndex(0);
    };
    window.addEventListener("agencyos-start-tour", handleStartEvent);
    return () => window.removeEventListener("agencyos-start-tour", handleStartEvent);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateTargetRect();
      window.addEventListener("resize", updateTargetRect);
      window.addEventListener("scroll", updateTargetRect, true);
      return () => {
        window.removeEventListener("resize", updateTargetRect);
        window.removeEventListener("scroll", updateTargetRect, true);
      };
    }
  }, [isOpen, currentStepIndex, updateTargetRect]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  const padding = 8;

  // Compute popover position safely for desktop & mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  let popoverStyle: React.CSSProperties = {
    position: "fixed",
    zIndex: 9999,
  };

  if (isMobile) {
    popoverStyle = {
      ...popoverStyle,
      bottom: "20px",
      left: "16px",
      right: "16px",
      width: "calc(100vw - 32px)",
    };
  } else if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const preferTop = spaceBelow < 260 && targetRect.top > 260;

    if (currentStep.position === "right" && targetRect.right + 340 < window.innerWidth) {
      popoverStyle.left = `${targetRect.right + 16}px`;
      popoverStyle.top = `${Math.max(16, targetRect.top)}px`;
    } else if (currentStep.position === "left" && targetRect.left - 340 > 0) {
      popoverStyle.left = `${targetRect.left - 340}px`;
      popoverStyle.top = `${Math.max(16, targetRect.top)}px`;
    } else if (preferTop) {
      popoverStyle.bottom = `${window.innerHeight - targetRect.top + 16}px`;
      popoverStyle.left = `${Math.max(16, Math.min(targetRect.left, window.innerWidth - 340))}px`;
    } else {
      popoverStyle.top = `${targetRect.bottom + 16}px`;
      popoverStyle.left = `${Math.max(16, Math.min(targetRect.left, window.innerWidth - 340))}px`;
    }
    popoverStyle.width = "340px";
  } else {
    // Fallback center position
    popoverStyle = {
      ...popoverStyle,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "340px",
    };
  }

  return (
    <div className="relative z-[9999]">
      {/* Dark Overlay with Spotlight Cutout */}
      {targetRect ? (
        <div className="fixed inset-0 z-[9998] pointer-events-none transition-all duration-300">
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={targetRect.left - padding}
                  y={targetRect.top - padding}
                  width={targetRect.width + padding * 2}
                  height={targetRect.height + padding * 2}
                  rx="16"
                  ry="16"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.7)"
              mask="url(#spotlight-mask)"
            />
          </svg>
          {/* Glowing Border around highlighted element */}
          <div
            className="absolute rounded-2xl border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300 pointer-events-none"
            style={{
              left: `${targetRect.left - padding}px`,
              top: `${targetRect.top - padding}px`,
              width: `${targetRect.width + padding * 2}px`,
              height: `${targetRect.height + padding * 2}px`,
            }}
          />
        </div>
      ) : (
        <div className="fixed inset-0 z-[9998] bg-slate-900/70 backdrop-blur-xs" />
      )}

      {/* Popover Card */}
      <div
        style={popoverStyle}
        className="p-5 sm:p-6 rounded-3xl bg-white border border-purple-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs">
              {currentStepIndex + 1}
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
              Panduan AgencyOS ({currentStepIndex + 1}/{steps.length})
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tutup Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-extrabold text-slate-900 font-['Outfit']">
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleComplete}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Lewati Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all active:scale-95"
            >
              <span>{isLastStep ? "Selesai" : "Lanjut"}</span>
              {isLastStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
