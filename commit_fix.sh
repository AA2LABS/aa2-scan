#!/bin/bash
set -e
PROJECT="/Users/jamespitts/Downloads/aa2-scan"
INDEX="$PROJECT/app/(tabs)/index.tsx"

echo "Fixing TAB_HEROES references..."
python3 - << 'PYEOF'
import sys
path = "/Users/jamespitts/Downloads/aa2-scan/app/(tabs)/index.tsx"
with open(path, 'r') as f:
    content = f.read()

replacements = [
    ("tab-care.png",       "tab-care.jpg"),
    ("tab-meat.png",       "tab-meat.jpg"),
    ("tab-scan.png",       "tab-scan.jpg"),
    ("tab-agri.png",       "tab-agri.jpg"),
    ("tab-k9.png",         "tab-k9.jpg"),
    ("tab-grownfolks.png", "tab-grownfolks.jpg"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"  ✅ {old} -> {new}")
    else:
        print(f"  ⚠️  not found: {old}")

with open(path, 'w') as f:
    f.write(content)
print("✅ index.tsx updated")
PYEOF

cd "$PROJECT"
git add -A
git status
git commit -m "Canon v28.2: 6 PNGs to JPEG, AAPT2 fix"
eas build --platform android --profile preview --clear-cache
