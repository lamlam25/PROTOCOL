# PROTOCOL36 AI Image Checker

Private FastAPI inference service used by the authenticated evidence workflow.
It classifies image evidence with `dima806/ai_vs_real_image_detection` and
returns a risk signal for administrator review.

```powershell
python -m pip install -r services/ai_checker/requirements.txt
$env:AI_CHECKER_SHARED_SECRET="replace-with-a-long-random-secret"
python -m uvicorn app:app --app-dir services/ai_checker --host 127.0.0.1 --port 8001
```

The first analysis downloads and caches the model. Set
`AI_CHECKER_PRELOAD=1` to load it during service startup.

This result is not proof of authenticity. The model card documents concept
drift as image generators evolve, so PROTOCOL36 stores the score and requires
human review for suspicious or inconclusive files.
