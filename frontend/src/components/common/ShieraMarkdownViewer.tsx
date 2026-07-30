"use client";

import React from "react";

interface ShieraMarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * Clean Markdown Renderer for Shiera AI Reports.
 * Parses headers, bold (**), italics (*), blockquotes (>), lists (* or -), and tables (|)
 * into rich, beautiful HTML elements without raw markdown syntax junk.
 */

export default function ShieraMarkdownViewer({ content, className = "" }: ShieraMarkdownViewerProps) {
  if (!content) return null;

  // Sanitize out raw Gemini Python Code Interpreter blocks
  const sanitizedContent = content
    .replace(/```\w*\?code[^\n]*\n[\s\S]*?```/g, "")
    .replace(/```[^\n]*codereference[^\n]*\n[\s\S]*?```/g, "")
    .replace(/```[^\n]*codestdout[^\n]*\n[\s\S]*?```/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const parseInline = (text: string): React.ReactNode[] => {

    if (!text) return [];
    
    // Process code spans (`code`), bold (**text**), italic (*text*), and code ticks
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        parts.push(
          <code key={keyIdx++} className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-mono text-[11px]">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Bold text: **text**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        parts.push(
          <strong key={keyIdx++} className="font-bold text-slate-900">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic text: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)(\*|_)/);
      if (italicMatch) {
        parts.push(
          <em key={keyIdx++} className="italic text-slate-700">
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Take next chunk of plain text until next formatting character
      const nextSpecial = remaining.search(/[`*_]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special character didn't match rules, consume 1 char
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts;
  };

  // Group lines into blocks (headers, tables, lists, blockquotes, paragraphs)
  const lines = sanitizedContent.split("\n");

  const blocks: React.ReactNode[] = [];
  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip blank lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule: --- or ***
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push(<hr key={blockKey++} className="my-4 border-t border-purple-100" />);
      i++;
      continue;
    }

    // Headers: #, ##, ###
    if (trimmed.startsWith("### ")) {
      blocks.push(
        <h3 key={blockKey++} className="text-sm sm:text-base font-bold text-purple-900 font-['Outfit'] mt-4 mb-2 flex items-center gap-2">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push(
        <h2 key={blockKey++} className="text-base sm:text-lg font-extrabold text-slate-900 font-['Outfit'] border-b border-purple-200/60 pb-2 mt-6 mb-3 flex items-center gap-2">
          {parseInline(trimmed.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push(
        <h1 key={blockKey++} className="text-lg sm:text-xl font-black text-slate-900 font-['Outfit'] mt-6 mb-3">
          {parseInline(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <div key={blockKey++} className="p-4 my-3 rounded-2xl bg-purple-50/80 border-l-4 border-purple-600 text-purple-900 text-xs sm:text-sm font-medium space-y-1 shadow-xs">
          {quoteLines.map((ql, qidx) => (
            <p key={qidx}>{parseInline(ql)}</p>
          ))}
        </div>
      );
      continue;
    }

    // Table: starts with | and contains |
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      // Filter out separator lines like | :--- | :--- |
      const rows = tableLines.filter(row => !row.match(/^\|\s*:?-+:?\s*(\|)/));
      if (rows.length > 0) {
        const headerCells = rows[0]
          .split("|")
          .slice(1, -1)
          .map(cell => cell.trim());
        const bodyRows = rows.slice(1).map(row =>
          row
            .split("|")
            .slice(1, -1)
            .map(cell => cell.trim())
        );

        blocks.push(
          <div key={blockKey++} className="my-4 overflow-x-auto rounded-2xl border border-purple-100 shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-purple-900 text-white font-semibold">
                <tr>
                  {headerCells.map((hCell, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 font-bold uppercase tracking-wider text-[10px]">
                      {parseInline(hCell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 bg-white">
                {bodyRows.map((bRow, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-purple-50/30"}>
                    {bRow.map((cCell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2.5 text-slate-700">
                        {parseInline(cCell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet List: * item or - item
    if (trimmed.match(/^[*,-]\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length) {
        const lineItem = lines[i].trim();
        if (lineItem.match(/^[*,-]\s+/)) {
          listItems.push(lineItem.replace(/^[*,-]\s+/, ""));
          i++;
        } else if (lineItem.startsWith("  ") && listItems.length > 0) {
          // Sub-item indented
          listItems[listItems.length - 1] += "\n" + lineItem.trim();
          i++;
        } else {
          break;
        }
      }

      blocks.push(
        <ul key={blockKey++} className="my-2.5 space-y-1.5 pl-2">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0 mt-1.5" />
              <div className="flex-1 min-w-0 leading-relaxed">
                {parseInline(item)}
              </div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered List: 1. item
    if (trimmed.match(/^\d+\.\s+/)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length) {
        const lineItem = lines[i].trim();
        const numMatch = lineItem.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          listItems.push({ num: numMatch[1], text: numMatch[2] });
          i++;
        } else {
          break;
        }
      }

      blocks.push(
        <ol key={blockKey++} className="my-2.5 space-y-2">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1 min-w-0 leading-relaxed">
                {parseInline(item.text)}
              </div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <p key={blockKey++} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-2">
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  return <div className={`space-y-1 ${className}`}>{blocks}</div>;
}
