# PR Checklist: Style Distribution Gate

## Required before merge
- [ ] Ran `tools/style-audit.ps1`.
- [ ] Attached audit summary to PR description.
- [ ] No file has Grok-like score > 20%.
- [ ] No file has Claude-like score > 20%.
- [ ] ChatGPT-like score per changed file is in 15%–25% (or justified).
- [ ] Gemini-like score per changed file is in 15%–25% (or justified).
- [ ] Human/Team style remains >= 20% in changed files.

## If file is out of range
- [ ] Removed duplicated logic.
- [ ] Replaced generic naming with domain naming.
- [ ] Kept only meaningful validations/guards.
- [ ] Reduced template comments and moved rationale to concise notes.
- [ ] Re-ran audit and updated PR note.

## Exception policy
If business-critical hotfix cannot pass range:
- [ ] Add `STYLE-EXCEPTION` section in PR with impacted files and reason.
- [ ] Open follow-up task to refactor within next sprint.
