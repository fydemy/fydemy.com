#!/bin/sh
# Fails on MULTI-LINE comments in tracked source: a block comment spanning more
# than one line, or two consecutive line comments. Single-line comments of
# either style are fine. Backstop for edits the PreToolUse hook cannot see.
status=0
files=$(git ls-files '*.ts' '*.tsx' '*.js' '*.jsx' '*.mjs' '*.cjs' '*.css' \
  | grep -v -e 'generated/' -e 'node_modules/' -e 'components/ui/' -e 'next-env.d.ts' -e 'next-image-env.d.ts' || true)

for f in $files; do
  # Block comment opening a line without closing on that same line.
  open=$(awk '/^[[:space:]]*\/\*/ && !/\*\// { print NR }' "$f")
  for line in $open; do echo "multi-line block comment: $f:$line"; status=1; done

  # Two consecutive line comments.
  dup=$(awk '/^[[:space:]]*\/\//{n++; if(n==2) print NR; next}{n=0}' "$f")
  for line in $dup; do echo "consecutive line comments: $f:$line"; status=1; done
done

[ "$status" -eq 0 ] && echo "comment style OK ($(echo "$files" | wc -w) files)"
exit "$status"
