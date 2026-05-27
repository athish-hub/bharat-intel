#!/bin/bash
# ============================================================
#  BharatIntel — Daily automation script
#  Runs every morning: scrape → generate → push to GitHub
#  Vercel auto-deploys on push.
# ============================================================

PROJECT_DIR="/Users/athishsagarmarchanda/Library/Application Support/Claude/local-agent-mode-sessions/9dc1ba11-e252-4c80-b6fa-4b205a645ec9/287e45e4-b1ea-4b1e-af46-46266c74ed16/local_0fad468f-e12b-4293-a05b-1e051d6c9e5c/outputs/bharat-intel"
LOG_FILE="$PROJECT_DIR/logs/daily-run.log"
PYTHON=$(which python3)
GIT=$(which git)

# Load API key from zshrc if not already set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  source ~/.zshrc 2>/dev/null
fi

mkdir -p "$PROJECT_DIR/logs"

echo "" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"
echo "Run started: $(date)" >> "$LOG_FILE"
echo "======================================" >> "$LOG_FILE"

cd "$PROJECT_DIR" || exit 1

# 1. Run the daily pipeline (scrape + generate)
echo "Running daily pipeline..." >> "$LOG_FILE"
$PYTHON scripts/daily-pipeline.py >> "$LOG_FILE" 2>&1

# 2. Check if any new articles were created
NEW_FILES=$(git status --porcelain data/articles/ | wc -l | tr -d ' ')
echo "New article files: $NEW_FILES" >> "$LOG_FILE"

if [ "$NEW_FILES" -gt "0" ]; then
  echo "Pushing $NEW_FILES new article(s) to GitHub..." >> "$LOG_FILE"
  $GIT add data/articles/
  $GIT commit -m "Daily update: $(date '+%Y-%m-%d') — $NEW_FILES new article(s)"
  $GIT push >> "$LOG_FILE" 2>&1
  echo "Push complete. Vercel deploying." >> "$LOG_FILE"
else
  echo "No new articles today. Nothing to push." >> "$LOG_FILE"
fi

echo "Run finished: $(date)" >> "$LOG_FILE"

# 3. Send admin email summary
if [ "$NEW_FILES" -gt "0" ]; then
  SUBJECT="BharatIntel — $NEW_FILES new article(s) published $(date '+%Y-%m-%d')"
  BODY="Daily pipeline completed.\n\nNew articles: $NEW_FILES\nTime: $(date)\n\nView live site: https://bharat-intel-seven.vercel.app\n\nFull log:\n$(tail -30 $LOG_FILE)"
else
  SUBJECT="BharatIntel — No new articles today $(date '+%Y-%m-%d')"
  BODY="Daily pipeline ran but found no new diplomatic events to publish.\n\nThis is normal on quiet news days.\n\nTime: $(date)\nLog: $LOG_FILE"
fi

echo -e "$BODY" | mail -s "$SUBJECT" athish@pice.one 2>> "$LOG_FILE" || echo "Email send failed (mail not configured)" >> "$LOG_FILE"
