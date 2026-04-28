import os
import json

base_dir = "Images"
categories = ["Commercial", "Music-Videos", "Fashion", "Brand-Content","Wedding","Pre-Wedding"]

result = []

for category in categories:
    folder_path = os.path.join(base_dir, category)

    if not os.path.exists(folder_path):
        continue

    for file in os.listdir(folder_path):
        if file.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
            result.append({
                "src": f"{category}/{file}",
                "category": category
            })

# sort (optional: newest first based on name)
result = sorted(result, key=lambda x: x["src"], reverse=True)

with open("images.json", "w") as f:
    json.dump(result, f, indent=2)

print("✅ images.json generated successfully!")