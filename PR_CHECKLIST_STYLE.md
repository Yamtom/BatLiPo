# PR Checklist: Style Distribution Gate

## Required before merge

- [ ] Ran `tools/style-audit.ps1`.
- [ ] Attached audit summary to PR description.
- [ ] Grok-like score per changed file is ≤ 20% (or justified).
- [ ] Claude-like score per changed file is ≤ 20% (or justified).
- [ ] ChatGPT-like score per changed file is ≤ 20% (or justified).
- [ ] Gemini-like score per changed file is ≤ 20% (or justified).
- [ ] Human/Team style remains >= 20% in changed files.
- [ ] For .gs changes, repeated assignments/branches were replaced with mapping-based logic where appropriate.
- [ ] For .gs changes, repeated normalization/parsing fragments were consolidated.
- [ ] For .gs changes, public signatures/behavior were preserved (style-only refactor).

## If file is out of range

- [ ] Removed duplicated logic.
- [ ] Replaced generic naming with domain naming.
- [ ] Kept only meaningful validations/guards.
- [ ] Reduced template comments and moved rationale to concise notes.
- [ ] Replaced repetitive imperative updates with declarative map/filter/reduce or mapping tables where clearer.
- [ ] Moved side effects to boundaries and kept core transformations deterministic.
- [ ] Re-ran audit and updated PR note.

## Exception policy

If business-critical hotfix cannot pass range:

- [ ] Add `STYLE-EXCEPTION` section in PR with impacted files and reason.
- [ ] Open follow-up task to refactor within next sprint.
