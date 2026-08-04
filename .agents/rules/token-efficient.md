---
trigger: always_on
description: Use when handling coding, debugging, refactoring, or repository questions while minimizing token usage and context cost.
---

## Token-efficient Copilot behavior

Follow these rules for every coding task unless the user explicitly asks for exhaustive detail.

- Start with the smallest useful context. Prefer targeted file reads, precise searches, and existing project knowledge before broad scanning.
- Use the most specific search possible. Avoid reading whole folders or large files unless necessary.
- Ask one focused clarification question when the task is ambiguous instead of exploring many possible paths.
- Prefer short, direct answers. Do not repeat the full conversation or restate obvious context.
- For debugging, identify the smallest reproduction or failing path first, then inspect only the relevant code and logs.
- For implementation, make one small change at a time and verify it before proposing more edits.
- When multiple files are relevant, summarize them briefly and avoid dumping large code blocks.
- Reuse existing patterns in the codebase instead of inventing new structures.
- For architecture or codebase questions, start with project graph/context tools such as Graphify before reading many raw files.
- Keep responses concise, actionable, and structured with bullet points rather than long prose.

Priority order:
1. Understand the request precisely.
2. Gather the minimal context needed.
3. Propose the smallest correct action.
4. Verify before claiming success.
