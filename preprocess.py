import os
import json
import re
import urllib.parse as urlparse
from sentence_transformers import SentenceTransformer

# ---------------- CONFIG ----------------
MODEL_NAME = "all-MiniLM-L6-v2"
RAW_DATA_DIR = "raw_data"
OUTPUT_DIR = "public/data"
CHUNK_SIZE = 3
# ---------------------------------------

def timestamp_to_seconds(t):
    h, m, s = t.split(":")
    return int(int(h) * 3600 + int(m) * 60 + float(s))

def clean_text(text):
    return re.sub(r"[^a-z0-9\s]", "", text.lower())

def extract_video_id(url):
    if not url:
        return ""
    
    parsed = urlparse.urlparse(url)
    
    # Handle ?v=VIDEOID format (standard)
    qs = urlparse.parse_qs(parsed.query)
    if "v" in qs and qs["v"]:
        return qs["v"][0]
    
    # Handle /watch/VIDEOID format (malformed in your data)
    path = parsed.path or ""
    if "/watch/" in path:
        return path.split("/watch/")[-1]
    
    # Handle youtu.be/VIDEOID
    if "youtu.be" in parsed.hostname or "":
        return path.lstrip("/")
    
    # Handle /embed/VIDEOID
    if "/embed/" in path:
        return path.split("/embed/")[-1]
    
    return ""

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model = SentenceTransformer(MODEL_NAME)

    all_chunks = []
    boolean_index = {}
    chunk_id = 0

    files = sorted([f for f in os.listdir(RAW_DATA_DIR) if f.endswith(".txt")])

    for file in files:
        with open(os.path.join(RAW_DATA_DIR, file), encoding="utf-8") as f:
            lines = f.readlines()

        title = "Joe Rogan Experience"
        youtube_url = ""

        # Line 2 (index 1) is title, skip first character (#)
        if len(lines) > 1:
            title = lines[1][1:].strip()

        # Line 3 (index 2) is URL, skip first character (#)
        if len(lines) > 2:
            youtube_url = lines[2][1:].strip()

        video_id = extract_video_id(youtube_url)

        chunk = []
        start_time = 0

        for line in lines:
            match = re.match(r"(\d{2}:\d{2}:\d{2}\.\d+)\s+(.*)", line)
            if not match:
                continue

            time_str, text = match.groups()
            if not chunk:
                start_time = timestamp_to_seconds(time_str)

            chunk.append(text)

            if len(chunk) == CHUNK_SIZE:
                full_text = " ".join(chunk)

                obj = {
                    "id": chunk_id,
                    "videoTitle": title,
                    "videoId": video_id,
                    "startTime": start_time,
                    "text": full_text
                }

                all_chunks.append(obj)

                for word in clean_text(full_text).split():
                    boolean_index.setdefault(word, []).append(chunk_id)

                chunk_id += 1
                chunk = []

    print("Generating embeddings...")
    texts = [c["text"] for c in all_chunks]
    embeddings = model.encode(texts, normalize_embeddings=True)

    vector_data = []
    for i, chunk in enumerate(all_chunks):
        vector_data.append({
            "info": chunk,
            "embedding": embeddings[i].tolist()
        })

    with open(f"{OUTPUT_DIR}/boolean_index.json", "w") as f:
        json.dump(boolean_index, f)

    with open(f"{OUTPUT_DIR}/vector_data.json", "w") as f:
        json.dump(vector_data, f)

    print("✅ Preprocessing done.")

if __name__ == "__main__":
    main()
