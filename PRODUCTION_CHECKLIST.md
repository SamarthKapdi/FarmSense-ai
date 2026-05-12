# FarmSense AI Production Checklist

## Deployment Checklist

- Backend builds successfully with `mvn clean compile`.
- Frontend builds successfully with `npm run build` inside `frontend/`.
- Render environment variables are configured.
- Vercel environment variables are configured.
- PostgreSQL connection string is set and verified.
- `FRONTEND_URL` matches the deployed Vercel domain.
- Health checks return OK in production.

## API Key Setup Checklist

- `GEMINI_API_KEY` is set in Render.
- `GROQ_API_KEY` is set in Render.
- `JWT_SECRET` is set to a strong random value.
- `WEATHER_API_KEY` is set if weather features are used.
- No AI secrets are committed to the repository.

## Production Verification Checklist

- `/api/health` returns database and uptime status.
- `/api/health/ai` returns Gemini and Groq configuration status.
- Disease detection works with a live image upload.
- KrishiGPT responds with the hosted Groq model.
- The frontend uses the deployed backend base URL.
- No Ollama, ngrok, or localhost AI references remain in the shipped app.

## Demo-Day Checklist

- Open the landing page on mobile and desktop.
- Demonstrate one disease detection flow end to end.
- Ask KrishiGPT a multilingual farming question.
- Show history, analytics, and admin health views.
- Be ready to point to Render and Vercel deployment settings.
- Keep the API keys private during the demo.
