import { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("boolean");
  const [vectorMethod, setVectorMethod] = useState("tfidf");
  const [results, setResults] = useState([]);
  const [booleanIndex, setBooleanIndex] = useState({});
  const [vectorData, setVectorData] = useState([]);
  const [documentFrequency, setDocumentFrequency] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/data/boolean_index.json")
      .then(res => res.json())
      .then(setBooleanIndex)
      .catch(e => console.error("Error loading boolean index:", e));

    fetch("/data/vector_data.json")
      .then(res => res.json())
      .then(data => {
        setVectorData(data);
        // Calculate document frequency for TF-IDF
        const df = {};
        data.forEach(doc => {
          const words = new Set(doc.info.text.toLowerCase().split(/\s+/));
          words.forEach(word => {
            df[word] = (df[word] || 0) + 1;
          });
        });
        setDocumentFrequency(df);
      })
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

  const getQueryEmbedding = (queryText) => {
    // Simple bag-of-words embedding: count word frequencies
    const words = queryText.toLowerCase().split(/\s+/);
    const embedding = {};
    words.forEach(word => {
      embedding[word] = (embedding[word] || 0) + 1;
    });
    return embedding;
  };

  const convertEmbeddingToVector = (embedding, vocabularyMap) => {
    const vector = new Array(Object.keys(vocabularyMap).length).fill(0);
    Object.keys(embedding).forEach(word => {
      if (word in vocabularyMap) {
        vector[vocabularyMap[word]] = embedding[word];
      }
    });
    return vector;
  };

  const calculateTFIDF = (doc, queryWords) => {
    let score = 0;
    const docWords = doc.info.text.toLowerCase().split(/\s+/);
    const totalDocs = vectorData.length;

    queryWords.forEach(queryWord => {
      // Term Frequency: count occurrences in document
      const tf = docWords.filter(w => w === queryWord).length / docWords.length;
      
      // Inverse Document Frequency
      const docsWithWord = documentFrequency[queryWord] || 1;
      const idf = Math.log(totalDocs / docsWithWord);
      
      // TF-IDF score
      score += tf * idf;
    });

    return score;
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
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);

      let scored;

      if (vectorMethod === "tfidf") {
        // TF-IDF scoring
        scored = vectorData.map(v => ({
          ...v.info,
          score: calculateTFIDF(v, queryWords)
        }));
      } else if (vectorMethod === "cosine") {
        // Real cosine similarity with embeddings
        // Create vocabulary map from all embeddings
        const queryEmbedding = getQueryEmbedding(query);
        
        // Build vocabulary from all documents
        const vocabulary = {};
        let vocabIndex = 0;
        vectorData.forEach(doc => {
          doc.embedding.forEach((_, idx) => {
            if (!(idx in vocabulary)) {
              vocabulary[idx] = vocabIndex++;
            }
          });
        });

        // Convert query to vector using document vocabulary
        const queryVector = new Array(vectorData[0]?.embedding.length || 0).fill(0);
        queryWords.forEach(word => {
          // Find which documents contain this word and use those embedding indices
          vectorData.forEach((doc, docIdx) => {
            if (doc.info.text.toLowerCase().includes(word)) {
              // Boost the query vector based on word importance
              for (let i = 0; i < doc.embedding.length; i++) {
                queryVector[i] += doc.embedding[i] * 0.1;
              }
            }
          });
        });

        // Normalize query vector
        let queryMag = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));
        if (queryMag > 0) {
          for (let i = 0; i < queryVector.length; i++) {
            queryVector[i] /= queryMag;
          }
        }

        // Calculate cosine similarity with each document
        scored = vectorData.map(v => {
          const similarity = cosineSimilarity(queryVector, v.embedding);
          return {
            ...v.info,
            score: similarity
          };
        });
      }

      scored.sort((a, b) => b.score - a.score);
      // Only show results that have a positive score
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

    {/* VECTOR METHOD SWITCH (only show when model is vector) */}
    {model === "vector" && (
      <select
        className="vector-method-toggle"
        value={vectorMethod}
        onChange={e => setVectorMethod(e.target.value)}
      >
        <option value="tfidf">TF-IDF</option>
        <option value="cosine">Cosine Similarity</option>
      </select>
    )}

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
