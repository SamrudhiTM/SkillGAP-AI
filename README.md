## Resume Intelligence Platform

This project analyzes a user's resume with a free LLM, fetches real-time job recommendations from multiple sources, computes top skill gaps, and recommends courses/certifications.

### Backend (Express + TypeScript)

- `backend/` contains an Express API:
  - `POST /resume/extract` — upload resume file (`file`) and parse via Groq Llama 3.1.
  - `POST /jobs/recommend` — input `{ skills, location?, role?, limit? }`, returns real-time jobs from multiple sources:
    - **APIs**: JSearch (RapidAPI), Adzuna (free tier)
    - **Scraping**: Reed.co.uk, We Work Remotely (RSS), Indeed.com, Google Jobs
    - **Fallback**: Generated sample jobs with realistic skill requirements
  - `POST /skills/gap` — input `{ resumeSkills, jobs, topN? }`, returns top 5 gaps with `high/medium/low` priority.
  - `POST /courses/recommend` — input `{ gaps }`, returns free courses and certifications per skill from Coursera, FreeCodeCamp, edX, Microsoft Learn, and Google Digital Garage (all free resources).

Environment variables (create a `.env` file in `backend/`):

```bash
PORT=4000
NODE_ENV=development

# Required: Groq API for resume parsing
GROQ_API_KEY=your_groq_api_key_here

# Optional: Job APIs (will fallback to scraping if not provided)
JSEARCH_API_KEY=your_rapidapi_jsearch_key_here
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here
ADZUNA_COUNTRY=gb

# Optional: Udemy courses (only if you want paid course options)
UDEMY_CLIENT_ID=your_udemy_client_id_here
UDEMY_CLIENT_SECRET=your_udemy_client_secret_here
```

**Job Sources (Real-time):**
- **APIs**: JSearch (RapidAPI), Adzuna (sandbox)
- **Scraping**: Reed.co.uk, We Work Remotely (RSS), Indeed.com, Google Jobs
- **Fallback**: Sample jobs with realistic skill requirements

**Course Sources (Free only):**
- Coursera (free audit), FreeCodeCamp (certifications), edX (free courses)
- Microsoft Learn (free training), Google Digital Garage (free courses)

**Note:** The app works without any API keys (except Groq for resume parsing). It will scrape real jobs from multiple sources and show skill gaps and course recommendations.

Install and run backend:

```bash
cd backend
npm install
npm run dev
```

### Frontend (React + Vite)

- `frontend/` contains a single-page React app:
  - Upload resume → shows parsed profile and skills.
  - Automatically fetches jobs, skill gaps, and course recommendations.
  - Displays jobs grid, prioritized gaps, and courses categorized as free/paid/certification.

Configure API base URL (optional) in `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

Install and run frontend:

```bash
cd frontend
npm install
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`) in your browser.


