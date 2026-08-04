---
name: token-efficient
description: Optimize agent behavior for lower token usage, faster responses, and tighter context handling.
---

# Workflow: token-efficient

1. Interpret the request and decide whether the task needs full context or only a narrow slice.
2. Search narrowly and read only the files necessary to solve the task.
3. Prefer existing patterns, targeted edits, and minimal explanation.
4. If the request is ambiguous, ask one short clarifying question.
5. Verify the result with the smallest relevant check before reporting completion.
