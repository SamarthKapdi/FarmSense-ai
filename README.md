# FarmSense AI

FarmSense AI is a production-ready crop intelligence platform for disease detection, multilingual farming advice, and field activity tracking. The system uses Gemini 2.5 Flash for image-based disease analysis and Groq-hosted Llama 3.1 for the chatbot layer, with a Spring Boot backend and a React frontend designed for Render and Vercel deployment.

## Overview

FarmSense AI helps farmers upload crop photos, receive a structured disease assessment, and continue with treatment guidance in their language. The platform also includes analytics, scan history, notifications, role-based admin views, and lightweight health/debug surfaces for deployment monitoring.

## Architecture

```text
React Frontend (Vercel)
        |
        |  HTTPS / REST
        v
Spring Boot API (Render)
        |
        |  PostgreSQL / JWT / Actuator
        v
PostgreSQL Database

External AI Services:
- Gemini 2.5 Flash for crop image analysis
- Groq Llama 3.1 for KrishiGPT chat and treatment plans
```

## AI Stack

- Gemini 2.5 Flash handles disease detection from uploaded images.
- Groq Llama 3.1 handles natural-language agronomy guidance.
- Responses are parsed and sanitized server-side before being returned to the frontend.
- API keys are injected only through environment variables.

## Key Features

- Crop disease detection with image upload and structured results.
- KrishiGPT chatbot with multilingual support.
- User dashboard, scan history, and activity analytics.
- Admin dashboard with health, infrastructure, and configuration views.
- Production-safe health endpoints for uptime and AI configuration checks.

## Screenshots

Add your final demo screenshots here:

- Landing page
- Disease detection flow
- KrishiGPT chat
- Admin dashboard
- Mobile responsive view

## Local Development

### Prerequisites

- Java 21+
- Maven 3.9+
- Node.js 18+ or 20+
- PostgreSQL 16+

### Backend

```bash
cp .env.example .env
mvn clean spring-boot:run
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## Environment Variables

### Backend

- `PORT` - backend port on Render, defaults to `8080`
- `SPRING_PROFILES_ACTIVE` - use `prod` in production
- `DB_URL` - PostgreSQL JDBC URL
- `DB_USER` - database username
- `DB_PASS` - database password
- `JWT_SECRET` - JWT signing key
- `WEATHER_API_KEY` - optional weather service key
- `GEMINI_API_KEY` - Gemini hosted API key
- `GEMINI_MODEL` - defaults to `gemini-2.5-flash`
- `GROQ_API_KEY` - Groq hosted API key
- `GROQ_MODEL` - defaults to `llama-3.1-8b-instant`
- `FRONTEND_URL` - Vercel frontend URL for CORS

### Frontend

- `REACT_APP_API_BASE_URL` - backend API base URL for CRA builds
- `VITE_API_BASE_URL` - backend API base URL for Vite-based deployments

## Render Deployment

1. Create a new Render Web Service from this repository.
2. Set the runtime to Docker.
3. Add the backend environment variables listed above.
4. Point `DB_URL`, `DB_USER`, and `DB_PASS` at your managed PostgreSQL database.
5. Set `FRONTEND_URL` to your Vercel URL.
6. Use `/actuator/health` as the health check path.

## Vercel Deployment

1. Create a Vercel project from the `frontend/` directory.
2. Set `REACT_APP_API_BASE_URL` or `VITE_API_BASE_URL` to the Render backend URL plus `/api`.
3. Deploy the frontend and confirm requests resolve against the hosted backend.

## Demo Flow

1. Open the landing page.
2. Register or log in as a farmer.
3. Upload a crop image for disease detection.
4. Review the Gemini result and treatment guidance.
5. Ask KrishiGPT a follow-up question.
6. Show the history, analytics, and admin health screens.

## Production Notes

- No Ollama, ngrok, or localhost AI dependencies remain in the production path.
- Hosted AI providers are configured only through environment variables.
- Health endpoints are available at `/api/health` and `/api/health/ai`.
- The app is designed to work with Render for the backend and Vercel for the frontend.

## Checklist

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for deployment, API key, verification, and demo-day checklists.

## License

MIT
