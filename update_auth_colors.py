import os
import glob

auth_dir = 'src/pages/auth'
files = glob.glob(os.path.join(auth_dir, '*.jsx'))

replacements = {
    '#fc8019': '#4A35E8',
    '#e57300': '#3220A8',
    'rgba(252, 128, 25,': 'rgba(74, 53, 232,'
}

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    original_content = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        # Also handle uppercase hex if any
        content = content.replace(old.upper(), new)
        
    if content != original_content:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated colors in {filepath}")

