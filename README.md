# Pull That Up, Jamie\!

## 🎙️ Project Description

**Pull That Up, Jamie\!** is a web-based search engine dedicated to exploring transcripts from *The Joe Rogan Experience* (JRE) podcast.

The project's goal is to design and implement two distinct Information Retrieval (IR) models—the **Boolean Model** and the **Vectorial Model**—to allow users to find precise, time-stamped passages within the vast collection of Joe Rogan's discussions.

The system uses a client-server architecture:

  * **Backend (Python):** Handles data preparation and index creation.
  * **Frontend (React/Vite):** Provides the user interface and runs the search logic.

> **⚠️ Important Data Notice:** To maintain a lightweight repository, the processed search index files (`boolean_index.json` and `vector_data.json`) are **not included** in this repo. You must generate them locally by running the included Python script before launching the app. See the **Installation Instructions** below.

## 🎯 Chosen IR Models and Justification

The search engine implements two distinct models, offering the user a choice between absolute precision and semantic relevance.

| Model | Implementation | Justification and Role |
| :--- | :--- | :--- |
| **1. Boolean Model** | **Strict Inverted Index.** Search is based on the presence/absence of keywords (uses a simple **OR** logic in the current implementation). | **Precision.** Ideal for searches based on exact terms (e.g., *Elon Musk* or *DMT*). |
| **2. Vectorial Model** | **Dual Implementation (TF-IDF and Cosine Similarity).** | **Semantic Relevance.** Ideal for natural language queries (e.g., *What are the ethical concerns of developing AI?*). |
| **→ TF-IDF (Weighting)** | Term Frequency-Inverse Document Frequency (TF-IDF) weights are calculated on the fly in the frontend. | Simple VSM representation, emphasizing the importance of rare terms. |
| **→ Cosine Similarity** | Uses **Sentence Embeddings** pre-calculated by the `all-MiniLM-L6-v2` model (via Python). Cosine similarity is computed in the frontend between the query vector and the document vectors. | Advanced VSM representation, capturing the true **semantic meaning** of the text. |

## 🛠️ Architecture and Technologies

| Component | Technology(s) | Role |
| :--- | :--- | :--- |
| **Indexing / Data Preparation** | Python, `SentenceTransformer` (`all-MiniLM-L6-v2` model) | The `preprocess.py` script segments transcripts into **chunks of 3 lines**, creates the Boolean Index (`boolean_index.json`), and pre-calculates Sentence Embeddings for the Vectorial Index (`vector_data.json`). |
| **User Interface** | React 18 (Vite), JavaScript | Manages the display, user interaction, and executes search logic by loading and querying the static indices. |
| **Data Storage** | Static JSON files | Indices are stored in the `/public/data` folder for direct access by the React application without a separate server API. |

## ⚙️ Installation Instructions

This guide assumes you have **Python (3.8+)** and **Node.js (18+)** installed.

### Step 1: Backend Setup & Index Generation (Crucial)

Since the index files are too large for GitHub, you **must** run the preprocessing script first to generate the necessary data for the search engine.

1.  **Clone the Repository:**

    ```bash
    git clone [YOUR_REPO_URL]
    cd joerogan-search-engine
    ```

2.  **Verify Directory Structure:**
    Ensure you have a `raw_data` folder containing your transcript text files (`.txt`).
    *(If the folder is empty, place your transcript files there. They must follow the format: Title on line 2, URL on line 3, followed by timestamped text).*

3.  **Install Python Dependencies:**

    ```bash
    pip install -r requirements.txt
    ```


4.  **Run the Preprocessing Script:**
    This step generates `boolean_index.json` and `vector_data.json`.

    ```bash
    python preprocess.py
    ```

    ✅ *Wait for the success message: "Preprocessing done."*

### Step 2: Frontend Launch (Web Application)

1.  **Install Node.js Dependencies (within the project root):**

    ```bash
    npm install
    ```

2.  **Start the React Application:**

    ```bash
    npm run dev
    ```

3.  Open your browser to the address provided (usually `http://localhost:5173`) to acces+-s the search engine.

## 🧭 Usage Guide with Examples

The interface allows you to easily switch between the two IR models.

### 1\. Model Selection

Use the dropdown menu at the top of the page to choose your search method.

### 2\. Boolean Model Queries

Select `Boolean`. Search is based on the simple presence of keywords in the document chunks.

| Query Example | Functionality |
| :--- | :--- |
| `dmt machine elves` | Finds all documents containing **DMT OR machine OR elves**. |
| `aliens ufo area 51` | Finds documents discussing any of these terms. |

### 3\. Vectorial Model Queries (Semantic)

Select `Vectorial`. You can then choose between **TF-IDF** (more focused on important keywords) or **Cosine Similarity** (more focused on the deep meaning of the sentence).

| Query Example | Method | Expected Result |
| :--- | :--- | :--- |
| `is it right to use advanced robots in combat` | `Cosine Similarity` | Will find passages about the ethics of war or technology, even if the exact words "robot" or "combat" are not used. |
| `a story about that time when joe got hurt` | `TF-IDF` | Will find documents containing the terms "story," "joe," and "hurt" with high weights. |

### 4\. Viewing Results

Each result card displays:

  * The title of the episode.
  * The exact timestamp (HH:MM:SS) where the quote begins.
  * The relevant segment of text (the chunk).

**Key Feature:** Clicking on the result text or thumbnail will open a new YouTube tab and start playback of the video at the **exact timestamp** (`&t=${startTime}s`).

## 🖼️ Screenshots

(homePage.png)

(searchResult.png)

---

## 🤝 Contribution

This project is currently for personal learning and demonstration purposes. Feedback and suggestions for improving the logic or design are always welcome!
