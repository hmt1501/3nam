#!/usr/bin/env bash
# Commit mọi thay đổi và push lên GitHub để workflow Pages build lại.
cd "$(dirname "$0")/.." || exit 0
git diff --quiet HEAD -- 2>/dev/null && [ -z "$(git ls-files --others --exclude-standard)" ] && exit 0

git add -A
git commit -q -m "Auto deploy: $(date '+%Y-%m-%d %H:%M:%S')" || exit 0
if git push -q origin main 2>/dev/null; then
  echo '{"systemMessage": "Đã push lên GitHub — Pages sẽ cập nhật sau ~1 phút: https://hmt1501.github.io/3nam/"}'
else
  echo '{"systemMessage": "Auto deploy: commit xong nhưng push thất bại, kiểm tra git push."}'
fi
