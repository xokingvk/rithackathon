# VoltaicIQ — AI Battery Health Analytics Platform

A production-ready scaffold: a static frontend (HTML/Tailwind/JS) talking to a
FastAPI backend that estimates battery state of health (SoH), remaining useful
life (RUL), and charging efficiency.

## Structure

```
battery-platform/
├── frontend/            static site — landing page + dashboard
│   ├── index.html
│   ├── dashboard.html
│   ├── css/style.css
│   └── js/               api.js, components.js, charts.js, main.js, dashboard.js, chatbot.js
└── backend/              FastAPI service
    ├── app/
    │   ├── main.py        app entrypoint
    │   ├── config.py      settings (.env driven)
    │   ├── database.py    SQLAlchemy engine/session
    │   ├── models.py      ORM models
    │   ├── schemas.py     Pydantic request/response models
    │   ├── routers/       battery, dashboard, reports, fleet, chatbot
    │   ├── services/      battery scoring, PDF generation, Groq chat
    │   └── ml/            model_loader.py + models/ (drop .pkl files here)
    ├── requirements.txt
    ├── .env.example
    └── sample_data.csv    example CSV for testing uploads
```

## Backend — run it

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your GROQ_API_KEY
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

Test the upload endpoint with the included sample:
```bash
curl -F "file=@sample_data.csv" -F "battery_id=PACK-0142" http://localhost:8000/api/battery/upload-csv
```

### Go live with your own models

Drop trained models into `backend/app/ml/models/`:
- `soh_model.pkl` — features `[voltage, current, temperature, cycle_count, soc]`
- `rul_model.pkl` — features `[soh, cycle_count, temperature]`
- `charging_model.pkl` — features `[voltage, current, temperature, cycle_count]`

Save each with `joblib.dump(model, path)`. Any estimator exposing `.predict(X)`
works (XGBoost, LightGBM, scikit-learn Pipeline, etc). Until real files are
present, `app/ml/model_loader.py` uses a documented physics-informed heuristic
so every endpoint still returns usable numbers — nothing else needs to change
when you swap the files in.

### Switch to Postgres

Set `DATABASE_URL` in `.env`, e.g.:
```
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/voltaiq
```

### Enable the chatbot

Add your key from https://console.groq.com to `.env`:
```
GROQ_API_KEY=gsk_...
```
Without a key, the chatbot endpoint still responds with a helpful demo message
instead of failing.

## Frontend — run it

Any static file server works, e.g.:
```bash
cd frontend
python3 -m http.server 5500
```
Open http://localhost:5500. The frontend calls the API at
`http://localhost:8000/api` by default — override by setting
`window.__API_BASE__` before `js/api.js` loads (e.g. in a small inline script
in each HTML file) if you deploy the backend elsewhere.

The dashboard falls back to demo data automatically if the backend isn't
reachable, so the UI stays presentable during development.

## Notes

- CORS is wide-open (`CORS_ORIGINS=["*"]`) by default in `config.py` — restrict
  this to your real frontend origin(s) before deploying.
- Generated PDF reports are written to `backend/generated_reports/`.
- SQLite is used out of the box (`backend/voltaiq.db`) — no setup required for local dev.
