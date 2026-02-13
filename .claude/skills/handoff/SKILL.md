---
name: handoff
description: Read or update session handoff notes for continuity between Claude Code sessions
argument-hint: [read|update|clear|<notes>]
allowed-tools:
  - Read
  - Edit
  - Write
---

# Session Handoff

Manage handoff notes in `HANDOFF.md` so the next Claude Code session can pick up where we left off.

The handoff file lives at the project root: `HANDOFF.md`

## Behavior

Check `$ARGUMENTS` to determine what to do:

### No arguments or "read" — Show current handoff notes

1. Read `HANDOFF.md`
2. Present a clear summary to the user:
   - What's currently being worked on
   - Any blockers or open questions
   - What the suggested next steps are
3. If the file is empty or has no active notes, say so

### "clear" — Reset the handoff document

Replace `HANDOFF.md` with a clean template:

```markdown
# Handoff Notes

## Active Task
_No active task_

## Notes
_No notes yet_

## Blockers / Open Questions
_None_

## Next Steps
_None_

---
## Log
<!-- Timestamped entries of completed work and milestones -->
```

### "update" or any other text — Update the handoff notes

When the user provides notes or says "update":

1. First read the current `HANDOFF.md`
2. If the user provided specific text after "update", incorporate those notes
3. If the user just said "update" with no details, review the current conversation and summarize:
   - What was worked on this session
   - Current state of the task
   - Any decisions made or problems encountered
   - Suggested next steps
4. Update the relevant sections in `HANDOFF.md`:
   - **Active Task**: What's currently in progress
   - **Notes**: Key context, findings, decisions
   - **Blockers / Open Questions**: Anything unresolved
   - **Next Steps**: What to do next session
5. Add a timestamped entry to the **Log** section at the bottom with a one-line summary

### Writing guidelines

- Keep notes concise but specific — include file paths, branch names, command examples
- Use the Active Task section for the current focus (replace, don't append)
- Use the Notes section for accumulated context (append new findings)
- The Log section is append-only — add new entries at the top of the log
- Log entries format: `- **YYYY-MM-DD** — One-line summary of what was done`
- Never remove Log entries unless the user explicitly asks

## Template

When creating a fresh `HANDOFF.md`, use this structure:

```markdown
# Handoff Notes

## Active Task
_Describe the current task or focus area_

## Notes
- Key context, findings, and decisions

## Blockers / Open Questions
- Anything unresolved that needs attention

## Next Steps
1. What to do next

---
## Log
<!-- Newest entries at the top -->
```
