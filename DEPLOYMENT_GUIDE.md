# FarmSense AI — Deployment Guide

## Prerequisites

- [ ] Neon PostgreSQL account (free tier available)
- [ ] Gemini API key from Google Cloud
- [ ] Groq API key
- [ ] Render account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] GitHub repository access

---

## Part 1: Database Setup (Neon PostgreSQL)

### 1.1 Create Neon Database

1. Visit https://console.neon.tech
2. Sign up or log in
3. Click **"New Project"**
4. Select **PostgreSQL 16** (default)
5. Choose region closest to your users
6. Click **"Create"**
7. Copy the connection string (you'll need it for Render)

### 1.2 Initialize Schema

```bash
# From your local machine, using the Neon connection string
psql "postgresql://user:password@host/dbname?sslmode=require" < schema.sql
```

**Note:** FarmSense AI uses Flyway for automatic migrations. Once deployed, migrations run automatically.

---

## Part 2: API Keys

### 2.1 Gemini API Key

1. Visit https://aistudio.google.com/app/apikey
2. Click **"Get API Key"**
3. Create a new API key in your Google Cloud project
4. Copy and save it securely (you'll need it for Render)

### 2.2 Groq API Key

1. Visit https://console.groq.com
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy and save it securely (you'll need it for Render)

---

## Part 3: Backend Deployment (Render)

### 3.1 Create Render Web Service

1. Visit https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Select **"Deploy from a Git repository"**
4. Connect your GitHub account
5. Select the **FarmSense-ai** repository
6. Fill in the following:
   - **Name:** `farmsense-ai-backend`
   - **Environment:** Docker
   - **Region:** Select closest to your users
   - **Plan:** Free tier (for testing)

### 3.2 Set Environment Variables

In the Render dashboard, add the following environment variables:

| Variable                 | Value                                                     | Notes                          |
| ------------------------ | --------------------------------------------------------- | ------------------------------ |
| `SPRING_PROFILES_ACTIVE` | `prod`                                                    | Production mode                |
| `DB_URL`                 | `jdbc:postgresql://user:pass@host/dbname?sslmode=require` | From Neon                      |
| `DB_USER`                | `postgres`                                                | From Neon                      |
| `DB_PASS`                | Your password                                             | From Neon                      |
| `JWT_SECRET`             | Generate random 64-char string                            | Use `openssl rand -base64 48`  |
| `GEMINI_API_KEY`         | Your key                                                  | From Google AI Studio          |
| `GEMINI_MODEL`           | `gemini-2.5-flash`                                        | (default)                      |
| `GROQ_API_KEY`           | `gsk_YourGroqApiKeyGoesHere...`                           | **REQUIRED**                   |
| `GROQ_MODEL`             | `llama-3.1-8b-instant`                                    | (default)                      |
| `WEATHER_API_KEY`        | Your key                                                  | Optional - from OpenWeatherMap |
| `FRONTEND_URL`           | `https://your-vercel-domain.vercel.app`                   | Update after Vercel deployment |

### 3.3 Health Check Configuration

1. In Render dashboard, scroll to **"Health Check"**
2. Set **Path:** `/actuator/health`
3. Set **Check interval:** 5 minutes
4. Keep default timeout (5 seconds)

### 3.4 Deploy Backend

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone the repository
   - Build Docker image
   - Start the service
3. Monitor deployment in the **"Events"** tab
4. Once successful, you'll get a URL like `https://farmsense-ai-backend.onrender.com`

### 3.5 Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-render-url.onrender.com/api/health

# Should return 200 OK with status information
```

---

## Part 4: Frontend Deployment (Vercel)

### 4.1 Create Vercel Project

1. Visit https://vercel.com
2. Click **"Import Project"**
3. Select **"Import Git Repository"**
4. Find and select **FarmSense-ai** repository
5. Fill in:
   - **Framework Preset:** React
   - **Root Directory:** `./frontend`

### 4.2 Set Environment Variables

In the Vercel project settings, add:

| Variable                 | Value                                      |
| ------------------------ | ------------------------------------------ |
| `REACT_APP_API_BASE_URL` | `https://your-render-url.onrender.com/api` |
| `VITE_API_BASE_URL`      | `https://your-render-url.onrender.com/api` |

**Important:** Replace `your-render-url` with your actual Render backend URL from Part 3.

### 4.3 Deploy Frontend

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Build React production bundle
   - Deploy to CDN
3. Wait for build to complete
4. Get your frontend URL like `https://farmsense-ai.vercel.app`

### 4.4 Update Backend CORS

Now that you have the Vercel URL, update the Render backend:

1. Go to Render dashboard
2. Edit the **farmsense-ai-backend** service
3. Update `FRONTEND_URL` environment variable with your Vercel URL
4. Click **"Save"**
5. Render will redeploy automatically

---

## Part 5: End-to-End Smoke Tests

### 5.1 Test Backend Health

```bash
curl https://your-render-url.onrender.com/api/health
```

Expected response:

```json
{
  "success": true,
  "data": {
    "status": "UP",
    "database": "UP",
    "geminiConfigured": true,
    "groqConfigured": true,
    "timestamp": "2026-05-12T..."
  }
}
```

### 5.2 Test Frontend Load

1. Open your Vercel URL in a browser
2. Should load landing page
3. Network tab should show requests to your Render backend
4. No localhost URLs should appear

### 5.3 Test Disease Detection Flow

1. Register as a test user
2. Upload a test crop image
3. Select a crop type
4. Click "Analyze"
5. Wait for result
6. Verify disease detection works

### 5.4 Test KrishiGPT Chat

1. After getting a detection result
2. Navigate to chat tab
3. Ask a question about crop diseases
4. Verify response comes from Groq AI
5. Test language switching

---

## Part 6: Monitoring & Maintenance

### 6.1 Render Dashboard

- Check application logs: **"Logs"** tab
- Monitor CPU/Memory usage
- View recent deployments
- Set up alerts for crashes

### 6.2 Vercel Dashboard

- Check deployment logs
- View Analytics tab for traffic
- Monitor build times
- Set up alerts for failures

### 6.3 Neon Database Dashboard

- Monitor connection count
- Check query performance
- View storage usage
- Set up backups

### 6.4 Common Issues & Fixes

**Issue: Backend shows "Gemini not configured"**

- Verify `GEMINI_API_KEY` is set in Render
- Check API key is valid in Google Cloud
- Redeploy after fixing

**Issue: Frontend shows "API connection failed"**

- Verify `REACT_APP_API_BASE_URL` matches Render URL
- Check CORS is not blocking requests
- Verify `FRONTEND_URL` in Render backend

**Issue: Database connection timeout**

- Verify `DB_URL` is correct Neon connection string
- Check Neon database is running
- Verify no connection pool exhaustion (Hikari settings)

**Issue: Slow AI responses**

- Gemini/Groq API throttling is normal
- First request after idle may be slower
- Consider using higher tier plan if persistent

---

## Part 7: Production Best Practices

### 7.1 Security

- [ ] Never commit API keys to Git
- [ ] Use strong JWT_SECRET (min 32 bytes)
- [ ] Enable HTTPS everywhere (automatic on Render/Vercel)
- [ ] Regularly rotate API keys
- [ ] Monitor for unauthorized API usage

### 7.2 Performance

- [ ] Enable Vercel's edge caching for static assets
- [ ] Use Render's auto-scaling (paid plans)
- [ ] Monitor Neon connection pool usage
- [ ] Consider CDN for large image uploads

### 7.3 Reliability

- [ ] Set up email alerts for deployment failures
- [ ] Monitor health endpoints regularly
- [ ] Keep dependencies updated
- [ ] Plan regular database backups
- [ ] Document runbooks for common issues

---

## Rollback Instructions

### If Backend Deployment Fails

1. Go to Render dashboard
2. Click **"Deployments"**
3. Find the previous successful deployment
4. Click **"Rollback"**

### If Frontend Deployment Fails

1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Find the previous successful build
4. Click the three-dot menu and select **"Promote to Production"**

---

## Support & Troubleshooting

For issues, check:

- Application logs in Render/Vercel dashboards
- `/api/health` endpoint for status
- Browser console for frontend errors
- Network tab for failed API calls

---

## Completion Checklist

- [ ] Neon database created and schema initialized
- [ ] Gemini API key obtained and tested
- [ ] Groq API key obtained and tested
- [ ] Render backend deployed and healthy
- [ ] Vercel frontend deployed and healthy
- [ ] Disease detection flow works end-to-end
- [ ] KrishiGPT chat works end-to-end
- [ ] Health endpoints respond correctly
- [ ] CORS properly configured
- [ ] Ready for demo day!
