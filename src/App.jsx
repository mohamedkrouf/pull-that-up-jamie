import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("boolean");
  const [results, setResults] = useState([]);
  const [booleanIndex, setBooleanIndex] = useState({});
  const [vectorData, setVectorData] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/data/boolean_index.json")
      .then(res => res.json())
      .then(setBooleanIndex)
      .catch(e => console.error("Error loading boolean index:", e));

    fetch("/data/vector_data.json")
      .then(res => res.json())
      .then(setVectorData)
      .catch(e => console.error("Error loading vector data:", e));
  }, []);

  const cosineSimilarity = (a, b) => {
    let dot = 0, ma = 0, mb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      ma += a[i] * a[i];
      mb += b[i] * b[i];
    }
    return dot / (Math.sqrt(ma) * Math.sqrt(mb));
  };

  const handleSearch = () => {
    if (!query) return;

    if (!vectorData || vectorData.length === 0) {
      console.warn("vectorData not loaded yet");
      return;
    }

    if (model === "boolean") {
      const words = query.toLowerCase().split(" ");
      const ids = new Set();

      words.forEach(w => {
        if (booleanIndex[w]) {
          booleanIndex[w].forEach(id => ids.add(id));
        }
      });

      const hits = vectorData
        .filter(v => ids.has(v.info.id))
        .map(v => v.info);

      setResults(hits);
    }

    if (model === "vector") {
      const qWords = query.toLowerCase().split(" ");

      const scored = vectorData.map(v => {
        let score = 0;
        qWords.forEach(w => {
          if (v.info.text.toLowerCase().includes(w)) score++;
        });
        return { ...v.info, score };
      });

      scored.sort((a, b) => b.score - a.score);
      // Only show results that match at least one word
      setResults(scored.filter(r => r.score > 0));
    }

    // Focus back to search input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
      <div className="app">
    <h1>Pull that up, Jamie!</h1>
    {/* TOP RIGHT MODEL SWITCH */}
    <select
      className="model-toggle"
      value={model}
      onChange={e => setModel(e.target.value)}
    >
      <option value="boolean">Boolean</option>
      <option value="vector">Vectorial</option>
    </select>

    {/* LOGO */}
    <img src="/logo.png" alt="Joe Rogan" className="logo" />

    {/* SEARCH BAR */}
     <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        autoFocus
        placeholder="search a podcast"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSearch()}
      />
        <button onClick={handleSearch} className="arrow-btn">→</button>
      </div>

      {results.length > 0 && (
        <p className="result-count">Found {results.length} result{results.length !== 1 ? 's' : ''}</p>
      )}


      <div className="results">
        {results.map(r => (
          <div key={r.id} className="card">
            {r.videoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${r.videoId}&t=${Math.floor(r.startTime)}s`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`https://img.youtube.com/vi/${r.videoId}/hqdefault.jpg`}
                  alt="thumbnail"
                />
              </a>
            ) : (
              <img
                src="/logo.png"
                alt="no thumbnail"
              />
            )}

            <div className="text">
              <h3>{r.videoTitle}</h3>
              <p className="time">
                ⏱ {new Date(r.startTime * 1000).toISOString().substr(11, 8)}
              </p>
              <p className="quote">“{r.text}”</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
