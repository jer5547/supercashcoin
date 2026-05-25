name: Update meme coin data

on:
  schedule:
    # Runs every hour, at minute 7 (offset to avoid GitHub's busy times)
    - cron: '7 * * * *'
  workflow_dispatch:  # Lets you run it manually from the Actions tab

# Avoid overlapping runs stepping on each other (a manual run firing while the
# scheduled one is mid-flight is what causes the non-fast-forward push failure).
concurrency:
  group: update-coins
  cancel-in-progress: false

permissions:
  contents: write   # Required for the bot to push the updated JSON

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repo
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch latest coin data
        run: node update-coins.js

      - name: Commit and push if data changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add meme-coins.json
          if git diff --staged --quiet; then
            echo "No changes to commit."
          else
            git commit -m "chore: refresh meme coin data"
            # Rebase our fresh commit on top of anything that landed since checkout,
            # so an advanced remote can't cause a non-fast-forward rejection.
            git pull --rebase --autostash origin "${GITHUB_REF_NAME}"
            git push
          fi