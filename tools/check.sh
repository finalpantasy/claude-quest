#!/usr/bin/env bash
# Runs every configured Claude Quest check and writes evidence/last-check.json.
set -eu
cd "$(dirname "$0")/.."
if ! command -v "${PYTHON:-python}" >/dev/null 2>&1; then
  echo 'NOT_RUN: Python unavailable'; exit 3
fi
exec "${PYTHON:-python}" tools/game_check.py run --root .
