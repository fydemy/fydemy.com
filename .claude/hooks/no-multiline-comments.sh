#!/bin/sh
# Fydemy policy: no MULTI-LINE code comments. Single-line comments are fine.
# Inspects ONLY new content, never old_string, so removing one is never blocked.
payload=$(cat)
new=$(printf '%s' "$payload" | sed 's/.*"new_string"[[:space:]]*://; s/.*"content"[[:space:]]*://')

printf '%s' "$payload" | grep -qE '\.(ts|tsx|js|jsx|mjs|cjs|css)"' || exit 0

deny() {
  printf '%s' "{\"hookSpecificOutput\":{\"hookEventName\":\"PreToolUse\",\"permissionDecision\":\"deny\",\"permissionDecisionReason\":\"Fydemy style: no multi-line comments. $1 Use one line, or move the detail to the README. See CLAUDE.md.\"}}"
  exit 0
}

# A block-comment continuation line (\n then optional space then *).
printf '%s' "$new" | grep -qE '\\n[[:space:]]*\*' && deny "New content has a multi-line block comment."
printf '%s' "$new" | grep -qE '//[^"]*\\n[[:space:]]*//' && deny "New content has two consecutive line comments."
exit 0
