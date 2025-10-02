import os
import csv
import requests
from bs4 import BeautifulSoup
import re
import json

# Use raw string or forward slashes
csv_file = r"./SB_publication_PMC.csv"

# Output folders
text_dir = "text"
tables_dir = "tables_data"
os.makedirs(text_dir, exist_ok=True)
os.makedirs(tables_dir, exist_ok=True)

images_data = {}

# Open CSV safely
with open(csv_file, newline='', encoding="utf-8-sig") as f:  # utf-8-sig removes BOM
    reader = csv.DictReader(f)
    for i, row in enumerate(reader, start=1):
        title = row.get("Title", "").strip()
        link = row.get("Link", "").strip()

        if not title or not link:
            print(f"[WARN] Skipping row {i}, missing Title or Link")
            continue

        print(f"[INFO] Fetching ({i}): {title}")
        try:
            resp = requests.get(link, headers={"User-Agent": "Mozilla/5.0"})
            resp.raise_for_status()
        except Exception as e:
            print(f"[ERROR] Could not fetch {title}: {e}")
            continue
        
        soup = BeautifulSoup(resp.text, "html.parser")
        
        # Extract PMC ID from link
        pmc_match = re.search(r"(PMC\d+)", link)
        if pmc_match:
            file_name = pmc_match.group(1)  # e.g. "PMC4136787"
        else:
            # fallback if no PMC found
            file_name = re.sub(r"[^a-zA-Z0-9]+", "_", title)[:50]
            
        images_data[file_name] = {}

        # Extract only <section aria-label="Article content">
        section = soup.find("section", {"aria-label": "Article content"})
        if not section:
            print(f"[WARN] No article content found for {title}")
            continue

        # Clean and process text
        text_lines = []
        table_idx = 0
        img_id = 0

        for elem in section.descendants:
            if elem.name in ["p", "h1", "h2", "h3", "h4", "h5", "h6"]:
                line = elem.get_text(strip=True)

                # Remove [xx] patterns
                line = re.sub(r"\[\d+\]", "", line)

                if line:
                    text_lines.append(line)

            elif elem.name == "img":
                img_id += 1
                text_lines.append(f"[Img{img_id:03d}]")
                if "src" in elem.attrs:
                    images_data[file_name][f"Img{img_id:03d}"] = elem["src"]
                else:
                    images_data[file_name][f"Img{img_id:03d}"] = "Image Link Not Found"

            elif elem.name == "table":
                table_idx += 1
                table_id = f"table{table_idx:03d}"
                caption = elem.find("caption")
                headers = [th.get_text(strip=True) for th in elem.find_all("th")]

                if caption:
                    text_lines.append(caption.get_text(strip=True))
                if headers:
                    text_lines.append(", ".join(headers))

                # Convert table to CSV 
                rows = []
                for tr in elem.find_all("tr"):
                    cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                    if cells:
                        rows.append(cells)

                table_csv_path = os.path.join(tables_dir,f"{file_name}_{table_id}.csv")
                with open(table_csv_path, "w", newline="", encoding="utf-8") as tf:
                    writer = csv.writer(tf)
                    writer.writerows(rows)

                # # Still save raw HTML if you want 
                # with open(os.path.join(tables_dir,f"{file_name}_{table_id}.html"), "w", encoding="utf-8") as tf:
                #     tf.write(str(elem))

                text_lines.append(table_id)

        

        text_path = os.path.join(text_dir, f"{file_name}.txt")
        with open(text_path, "w", encoding="utf-8") as tf:
            tf.write("\n".join(text_lines))

# Save images data
with open("images_data.json", "w", encoding="utf-8") as jf:
    json.dump(images_data, jf, indent=2)

print("[DONE] All papers processed.")
