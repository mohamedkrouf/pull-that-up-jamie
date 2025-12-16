import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const RAW_DIR = path.join(ROOT, "raw_data");
const OUT_DIR = path.join(ROOT, "public/data");

fs.mkdirSync(OUT_DIR, { recursive: true });

const booleanIndex = {};
const vectorData = [];

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith(".txt"));

files.forEach((file, idx) => {
  const text = fs.readFileSync(path.join(RAW_DIR, file), "utf-8");
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);

  const id = idx + 1;

  // Boolean index
  words.forEach(w => {
    if (!booleanIndex[w]) booleanIndex[w] = [];
    if (!booleanIndex[w].includes(id)) booleanIndex[w].push(id);
  });

  // Vector data
  vectorData.push({
    info: {
      id,
      text,
      videoTitle: file.replace(".txt", ""),
      startTime: 0,
      videoId: ""
    },
    embedding: words.map(() => Math.random()) // placeholder embedding
  });
});

// Write files
fs.writeFileSync(
  path.join(OUT_DIR, "boolean_index.json"),
  JSON.stringify(booleanIndex)
);

fs.writeFileSync(
  path.join(OUT_DIR, "vector_data.json"),
  JSON.stringify(vectorData)
);

console.log("✅ Data generated successfully");
