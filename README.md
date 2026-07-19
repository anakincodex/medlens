# MedLens AI

**An AI-powered second opinion and patient history reconstruction system.**

MedLens AI helps doctors quickly understand a patient's medical history by
analyzing multiple reports (blood tests, prescriptions, discharge summaries,
scan reports) and generating a timeline, risk flags, and a one-page handoff
summary — all in under a minute.

## 🚀 Live Demo
👉 [Try MedLens AI](https://medlens-ai-next-m6mi.vercel.app/login)


All backend logic (extraction, analysis, trends, knowledge graph, RAG Q&A,
PDF export) now runs as Next.js API routes — no separate Python server
required.

## What It Does

Given multiple patient reports (PDF or text), MedLens AI:

1. **Extracts structured data** from each report (diagnoses, lab values,
   medications, allergies) using LLM-based extraction
2. **Builds a Health Timeline** showing how the patient's condition evolved
   across visits
3. **Generates a Patient Summary** (conditions, current medications,
   allergies)
4. **Detects Risk Flags** — cross-document inconsistencies, missed
   follow-ups, worsening trends, medication concerns
5. **Computes Lab Trends algorithmically** — e.g. HbA1c rising from
   5.9% → 6.8% → 7.4% across visits, detected via direct numeric comparison
   (no AI)
6. **Builds a Knowledge Graph** linking the patient to conditions,
   medications, and allergies
7. **Answers follow-up questions** via RAG (Retrieval-Augmented Generation)
   — retrieves relevant report excerpts and cites sources
8. **Generates a one-page Doctor Handoff Summary**, downloadable as a PDF

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **AI/LLM**: Groq API by default, with Gemini fallback for compatibility
- **RAG retrieval**: In-memory TF-IDF + cosine similarity document store
  (a dependency-light replacement for the original ChromaDB +
  sentence-transformers setup — see `lib/documentStore.ts`)
- **PDF extraction**: `pdf-parse`
- **PDF export**: `pdfkit`
- **UI**: Tailwind CSS, Radix UI, Framer Motion, Lucide Icons

## API Routes

### `POST /api/process`

Upload multiple reports (`.txt` or `.pdf`) as multipart form-data
(field name: `files`).

Returns:

```json
{
  "extracted_reports": [...],
  "analysis": {
    "patient_summary": { "age": ..., "conditions": [...], "current_medications": [...], "allergies": [...] },
    "timeline": [{ "date": "YYYY-MM", "event": "..." }],
    "risk_flags": [{ "severity": "high/medium/low", "flag": "...", "explanation": "..." }]
  },
  "doctor_summary": "plain text one-page summary",
  "trends": [{ "test": "...", "history": [...], "direction": "increasing/decreasing/stable", "change": ... }],
  "knowledge_graph": { "nodes": [...], "edges": [...] }
}
```

### `POST /api/ask`

Body: `{ "question": "..." }`

Returns: `{ "answer": "...", "sources": ["filename1", ...] }`

RAG-based Q&A — retrieves relevant excerpts from the most recently processed
reports and answers with source citations.

### `POST /api/export-pdf`

Body: `{ "doctor_summary": "..." }`

Returns a downloadable PDF of the doctor handoff summary.

## Setup & Running Locally

### Prerequisites

If Node.js is not installed yet, install it first. npm is included with Node.js,
so you do not install npm separately.

On Windows with Winget:

```powershell
winget install OpenJS.NodeJS.LTS
node -v
npm -v
```

If you prefer the Node version manager for Windows, install `nvm-windows`
and then install Node.js through it:

```powershell
nvm install lts
nvm use lts
node -v
npm -v
```

1. Install dependencies:

  ```bash
  npm install
  ```

2. Create a `.env.local` file in the project root with these values:

  ```env
  GROQ_API_KEY=your_groq_key
  GEMINI_API_KEY=your_gemini_key
  NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```

  You can get a Groq API key from the Groq console.
  Keep `GEMINI_API_KEY` only if you want Gemini as a fallback.
  The Supabase values are required for login, logout, and saving analysis
  results.

3. Start the development server:

  ```bash
  npm run dev
  ```

4. Open the app in your browser:

  ```text
  http://localhost:3000
  ```

5. Sign up or log in at `/login`, then use the navbar to move between pages.
  Upload reports from `/upload` to generate a dashboard result.

## Run in Production

To test the production build locally:

```bash
npm run build
npm run start
```

Then open `http://localhost:3000`.

## Sample Data

`sample_data/` contains 3 synthetic patient reports (2022–2025) demonstrating
a hypertension → prediabetes → diabetes → kidney function decline
progression, used to showcase timeline generation and risk detection.

Try uploading files one by one or all three from `/upload` to see the full pipeline run.

## Pages

| Route         | Description                          |
| ------------- | ------------------------------------ |
| `/`           | Landing page                          |
| `/upload`     | Upload medical documents              |
| `/processing` | Animated AI processing screen         |
| `/dashboard`  | Full results dashboard + RAG Q&A + PDF export |

## Project Structure

```
medlens-ai/
├── app/
│   ├── api/
│   │   ├── process/route.ts      # extraction -> analysis -> trends -> KG -> summary
│   │   ├── ask/route.ts          # RAG Q&A
│   │   └── export-pdf/route.ts   # doctor summary -> PDF
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css
│   ├── upload/page.tsx           # Upload page
│   ├── processing/page.tsx       # AI processing screen
│   └── dashboard/page.tsx        # Results dashboard
├── components/
│   └── layout/Navbar.tsx
├── lib/
│   ├── ai.ts                     # Groq-first AI client with Gemini fallback
│   ├── prompts.ts                # Extraction / analysis / summary / RAG prompts
│   ├── extractText.ts            # PDF/text extraction
│   ├── trends.ts                 # Algorithmic lab trend detection
│   ├── knowledgeGraph.ts         # Patient knowledge graph builder
│   ├── documentStore.ts          # In-memory TF-IDF RAG store
│   └── utils.ts
├── types/index.ts
├── sample_data/
└── (config files)
```

## Notes on the Port from FastAPI

- `call_ai()` → `lib/ai.ts` (`callAI` / `callAIForJSON`), same model fallback
  list and code-fence stripping behavior.
- `extract_text_from_file()` → `lib/extractText.ts`.
- `compute_trends()` / `parse_date_safe()` → `lib/trends.ts`.
- `build_knowledge_graph()` → `lib/knowledgeGraph.ts`.
- ChromaDB + sentence-transformers → `lib/documentStore.ts` (in-memory
  TF-IDF/cosine similarity; resets on server restart, same as the original
  in-memory Chroma client).
- ReportLab PDF generation → `pdfkit` in `app/api/export-pdf/route.ts`, with
  equivalent header/bullet/paragraph formatting rules.
 
 
