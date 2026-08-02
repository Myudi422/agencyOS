"use client";

import React, { useState, useEffect } from "react";

interface RupiahInputProps {
  value: number | "" | null | undefined;
  onChange: (val: number | "") => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  id?: string;
  showTerbilang?: boolean;
}

export function formatNumberToRupiahString(num: number | "" | null | undefined): string {
  if (num === "" || num === null || num === undefined || isNaN(Number(num))) return "";
  return new Intl.NumberFormat("id-ID").format(Number(num));
}

export function parseRupiahStringToNumber(str: string): number | "" {
  const cleaned = str.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? "" : parsed;
}

export function getTerbilangShort(num: number): string {
  if (!num || isNaN(num)) return "";
  if (num >= 1_000_000_000) {
    const val = num / 1_000_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(1)} Miliar`;
  }
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return `${val % 1 === 0 ? val : val.toFixed(1)} Juta`;
  }
  if (num >= 1_000) {
    const val = num / 1_000;
    return `${val % 1 === 0 ? val : val.toFixed(1)} Ribu`;
  }
  return `${num}`;
}

export default function RupiahInput({
  value,
  onChange,
  placeholder = "0",
  className = "",
  label,
  required = false,
  id,
  showTerbilang = true,
}: RupiahInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value === "" || value === null || value === undefined) {
      setDisplayValue("");
    } else {
      setDisplayValue(formatNumberToRupiahString(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const numericVal = parseRupiahStringToNumber(inputVal);
    onChange(numericVal);
  };

  const numVal = typeof value === "number" ? value : 0;
  const terbilangText = numVal > 0 ? getTerbilangShort(numVal) : "";

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <span className="absolute left-3 font-bold text-xs text-purple-700 select-none bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">
          Rp
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${className}`}
        />
      </div>
      {showTerbilang && numVal > 0 && (
        <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-purple-700 px-0.5">
          <span className="truncate">≈ Rp {formatNumberToRupiahString(numVal)}</span>
          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px] shrink-0 ml-1">
            {terbilangText}
          </span>
        </div>
      )}
    </div>
  );
}
