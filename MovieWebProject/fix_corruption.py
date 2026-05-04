
import os, re

files_to_fix = [
    "src/contexts/MovieContext.jsx",
    "src/contexts/AuthContext.jsx", 
    "src/components/MovieCard.jsx",
]

def fix_markdown_links(text):
    # Replace [something](http://something) with just the raw JS expression
    # Pattern: [word.word](http://word.word) -> word.word
    return re.sub(r'\[([^\]]+)\]\(http[^\)]+\)', r'\1', text)

for path in files_to_fix:
    if not os.path.exists(path):
        print(f"MISSING: {path}")
        continue
    with open(path, "r") as f:
        original = f.read()
    fixed = fix_markdown_links(original)
    if fixed != original:
        with open(path, "w") as f:
            f.write(fixed)
        print(f"FIXED: {path}")
    else:
        print(f"CLEAN: {path}")

print("\nVerifying...")
for path in files_to_fix:
    if os.path.exists(path):
        with open(path) as f:
            content = f.read()
        bad = re.findall(r'\[[^\]]+\]\(http[^\)]+\)', content)
        if bad:
            print(f"STILL CORRUPT in {path}: {bad}")
        else:
            print(f"OK: {path}")
