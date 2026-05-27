#!/bin/bash
# ============================================================
#  BharatIntel — Local Launcher
#  Double-click this file in Finder to start the site.
# ============================================================

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

clear
echo "================================================"
echo "  🇮🇳  BharatIntel — Starting up…"
echo "================================================"
echo ""

# ── 1. Check Node.js ──────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found."
  echo ""
  echo "Please install it from https://nodejs.org (LTS version)"
  echo "then double-click this file again."
  echo ""
  read -p "Press Enter to close…"
  exit 1
fi

NODE_VER=$(node --version)
echo "✓  Node.js $NODE_VER detected"

# ── 2. Install / refresh dependencies ─────────────────────
echo "📦  Installing dependencies (first run takes ~1 min)…"
npm install --legacy-peer-deps --prefer-offline 2>&1 | grep -E "(added|warn|ERR)" | head -10
echo "✓  Dependencies ready"
echo ""

# ── 3. Check for seed articles ───────────────────────────
ARTICLE_COUNT=$(ls data/articles/*.json 2>/dev/null | wc -l | tr -d ' ')
echo "📰  Articles in database: $ARTICLE_COUNT"

if [ "$ARTICLE_COUNT" -lt "10" ]; then
  echo ""
  echo "  ────────────────────────────────────────"
  echo "  Tip: Generate articles from seed events:"
  echo ""
  echo "  # Option A: Use existing india-diplomacy events:"
  echo "  python3 scripts/generate-articles.py"
  echo ""
  echo "  # Option B: Run the daily scraper:"
  echo "  ANTHROPIC_API_KEY=sk-ant-... python3 scripts/daily-pipeline.py"
  echo "  ────────────────────────────────────────"
  echo ""
fi

# ── 4. Launch dev server ──────────────────────────────────
echo "🚀  Starting server at http://localhost:3001"
echo ""
echo "    ┌──────────────────────────────────────┐"
echo "    │  Open your browser and go to:        │"
echo "    │  → http://localhost:3001             │"
echo "    └──────────────────────────────────────┘"
echo ""
echo "  Press Ctrl+C in this window to stop the server."
echo "================================================"
echo ""

sleep 4 && open "http://localhost:3001" &

npm run dev -- --port 3001
