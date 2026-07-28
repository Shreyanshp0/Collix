# Agent Rules — Scope & Code Discipline

Follow these rules for every task in this codebase. If a rule conflicts
with completing the task "fully," follow the rule and flag the conflict
instead of silently expanding scope.

## Scope
1. Modify only the files strictly required for the requested change.
   Do not touch, refactor, or "clean up" unrelated files.
2. Do not create new files, modules, utilities, wrappers, or config
   unless explicitly asked for. If you think a new file is genuinely
   needed, stop and ask first — don't create it and explain after.
3. Do not add abstractions, generalized helpers, or "future-proofing"
   for cases not in the current request. Solve exactly what was asked,
   nothing broader.
4. If a request seems ambiguous, ask a clarifying question instead of
   filling the gap with extra structure or assumptions.

## Size
5. Prefer the smallest diff that correctly solves the task. If a
   change is touching more than ~2-3 files or looks like it's growing
   past what the request implied, stop and report back before
   continuing.
6. Do not rewrite an entire file when a targeted edit (specific
   function/block) will do.
7. No speculative error handling, config options, or edge-case
   branches beyond what the task actually requires.

## Context & memory
8. Do not assume prior context beyond what's in this session or in
   the provided spec/architecture file. If something about the
   existing codebase is unclear, look it up or ask — don't infer or
   invent it.
9. Treat any existing working code (explicitly marked as done) as
   off-limits unless the task specifically calls for changing it.
10. State clearly which files you changed and why, in 1-2 lines. No
    need to restate the whole codebase's structure back.

## Verification
11. After making a change, state how it should be tested/run — don't
    just assert "this works."
12. If you're unsure whether something is correct, say so explicitly
    rather than presenting a guess as fact.

## When in doubt
13. Smaller and asking is always preferred over larger and assuming.
