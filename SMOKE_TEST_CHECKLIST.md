# FarmSense AI — Smoke Test Checklist

## Pre-Deployment Smoke Tests

### Backend Deployment (Render)

- [ ] **Docker Build**
  - [ ] `docker build -t farmsense-ai .` builds successfully
  - [ ] Docker image size is < 500MB
  - [ ] Container starts without errors
  - [ ] Port 8080 is accessible

- [ ] **Environment Variables**
  - [ ] All required env vars are set in Render dashboard
  - [ ] `GEMINI_API_KEY` is valid and set
  - [ ] `GROQ_API_KEY` is valid and set
  - [ ] `JWT_SECRET` is a strong random value
  - [ ] `DB_URL` points to correct Neon database
  - [ ] `FRONTEND_URL` matches deployed Vercel domain

- [ ] **Database Connectivity**
  - [ ] PostgreSQL connection succeeds
  - [ ] Schema migrations run automatically
  - [ ] Tables are created properly
  - [ ] Health check passes: `GET /api/health` returns HTTP 200

### Frontend Deployment (Vercel)

- [ ] **Build & Deployment**
  - [ ] `npm run build` in `frontend/` directory succeeds
  - [ ] Build artifacts are present in `frontend/build/`
  - [ ] Vercel deployment preview builds successfully
  - [ ] No build warnings or errors

- [ ] **Environment Variables**
  - [ ] `REACT_APP_API_BASE_URL` or `VITE_API_BASE_URL` points to Render backend
  - [ ] API base URL format is correct: `https://your-render-domain.onrender.com/api`
  - [ ] No localhost URLs in production build

---

## Functional Smoke Tests

### Disease Detection Flow

1. **Upload Image**
   - [ ] Open landing page
   - [ ] Register as a test farmer or login
   - [ ] Navigate to disease detection tab
   - [ ] Click upload or drag-and-drop test image
   - [ ] Image preview displays correctly
   - [ ] Image is optimized (< 512px)

2. **AI Analysis**
   - [ ] Click "Analyze" button
   - [ ] Loading spinner appears
   - [ ] Progress bar shows upload progress
   - [ ] Request completes within 60 seconds
   - [ ] Disease detection result appears

3. **Result Display**
   - [ ] Disease name is displayed
   - [ ] Confidence score is shown (0-100)
   - [ ] Severity level is shown (mild/moderate/severe)
   - [ ] Treatment options are displayed
   - [ ] Prevention steps are listed
   - [ ] Yield impact is shown

### KrishiGPT Chatbot

1. **Chat Interface**
   - [ ] Chat window loads without errors
   - [ ] Welcome message is displayed in correct language
   - [ ] Message input field is functional
   - [ ] Quick question buttons are clickable

2. **Sending Questions**
   - [ ] Type a question and press Enter or click send
   - [ ] Typing indicator appears while AI responds
   - [ ] Response appears within 30 seconds
   - [ ] Markdown formatting renders correctly

3. **Multilingual Support**
   - [ ] Change language to Hindi, Tamil, or other supported language
   - [ ] Welcome message changes to selected language
   - [ ] AI responses are in selected language
   - [ ] Quick questions update to selected language

4. **Voice Input (Optional)**
   - [ ] Click microphone button
   - [ ] Voice input activates (browser permission required)
   - [ ] Speech recognition works (Chrome/Edge)
   - [ ] Transcribed text appears in input field

### History & Analytics

1. **Scan History**
   - [ ] Navigate to History page
   - [ ] Previous scans are listed
   - [ ] Scan dates/times are correct
   - [ ] Disease names are clickable
   - [ ] Pagination works if multiple scans exist

2. **Analytics Dashboard**
   - [ ] Navigate to Analytics page
   - [ ] Charts load without errors
   - [ ] Data displays correctly (crop distribution, disease trends)
   - [ ] Export functionality works (if implemented)

### Admin Dashboard

1. **Health Status**
   - [ ] Navigate to Admin → System Health
   - [ ] `/api/health` endpoint status shows green
   - [ ] Database status shows UP
   - [ ] AI services (Gemini, Groq) show CONFIGURED
   - [ ] Uptime is displayed correctly

2. **Service Status**
   - [ ] All service badges show correct status
   - [ ] Green for operational, red for offline
   - [ ] Gemini Vision status is correct
   - [ ] Groq Chat status is correct

3. **Configuration**
   - [ ] Admin can view current AI model settings
   - [ ] Gemini model is `gemini-1.5-flash`
   - [ ] Groq model is `llama3-8b-8192`

---

## API Endpoint Tests

### Health Endpoints

```bash
# Test basic health
curl -X GET https://your-backend.onrender.com/api/health

# Expected response:
{
  "success": true,
  "data": {
    "status": "UP",
    "database": "UP",
    "uptimeSeconds": 3600,
    "uptimeHuman": "1h 00m 00s",
    "timestamp": "2026-05-12T...",
    "geminiConfigured": true,
    "groqConfigured": true
  }
}
```

```bash
# Test AI health
curl -X GET https://your-backend.onrender.com/api/health/ai

# Expected response:
{
  "success": true,
  "data": {
    "status": "UP",
    "database": "UP",
    "uptimeSeconds": 3600,
    "uptimeHuman": "1h 00m 00s",
    "timestamp": "2026-05-12T...",
    "geminiConfigured": true,
    "groqConfigured": true,
    "aiStack": {
      "vision": "gemini-1.5-flash",
      "chat": "llama3-8b-8192"
    }
  }
}
```

### Disease Detection API

```bash
# Upload test image for disease detection
curl -X POST https://your-backend.onrender.com/api/farm/detect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@test-crop.jpg" \
  -F "crop=Tomato" \
  -F "language=en"

# Expected response:
{
  "success": true,
  "data": {
    "disease": "Early Blight",
    "confidence": 85,
    "severity": "moderate",
    "organicTreatment": ["Apply neem oil"],
    "chemicalTreatment": ["Chlorothalonil"],
    "isHealthy": false,
    "timestamp": "2026-05-12T..."
  }
}
```

### KrishiGPT Chat API

```bash
# Ask a question to KrishiGPT
curl -X POST https://your-backend.onrender.com/api/farm/ask \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I prevent early blight?",
    "crop": "Tomato",
    "language": "en",
    "imageBase64": null
  }'

# Expected response:
{
  "success": true,
  "data": {
    "answer": "To prevent early blight on tomatoes, ensure proper spacing for air circulation, remove lower leaves, water at the base, and apply preventive fungicides during wet seasons. Regular crop rotation is also recommended."
  }
}
```

---

## Error Scenario Tests

### Network Errors

- [ ] **AI Service Unreachable**
  - [ ] Temporarily disable internet or block API
  - [ ] App shows user-friendly error message
  - [ ] Retry button is offered
  - [ ] No stack traces visible to user

- [ ] **Database Connection Lost**
  - [ ] Stop PostgreSQL connection temporarily
  - [ ] `/api/health` returns DATABASE DOWN
  - [ ] User cannot save scan history
  - [ ] Recovery works when connection restores

### Invalid Input

- [ ] **Empty Image Upload**
  - [ ] Upload 0-byte file
  - [ ] Validation error is shown
  - [ ] User is prompted to try again

- [ ] **Oversized Image**
  - [ ] Upload image > 10MB
  - [ ] Warning message is shown
  - [ ] File is rejected

- [ ] **Invalid Language Code**
  - [ ] Send request with unsupported language
  - [ ] Defaults to English gracefully
  - [ ] No crashes occur

---

## Performance Tests

- [ ] **Response Time**
  - [ ] `/api/health` responds in < 500ms
  - [ ] Disease detection completes in < 60 seconds
  - [ ] KrishiGPT response comes in < 30 seconds
  - [ ] Frontend page loads in < 3 seconds

- [ ] **Concurrent Users**
  - [ ] 5 simultaneous users uploading images
  - [ ] No rate limiting or errors
  - [ ] All requests complete successfully

- [ ] **Mobile Performance**
  - [ ] App loads on mobile device (iOS/Android)
  - [ ] Touch interactions are responsive
  - [ ] Upload works on mobile
  - [ ] Chat is usable on small screen

---

## Security Tests

- [ ] **JWT Validation**
  - [ ] Request without token is rejected (401)
  - [ ] Request with invalid token is rejected (401)
  - [ ] Request with expired token is rejected (401)
  - [ ] Valid token allows access (200)

- [ ] **API Key Protection**
  - [ ] Gemini/Groq API keys are not exposed in client
  - [ ] Keys are not logged in frontend console
  - [ ] Keys are not visible in browser network tab

- [ ] **CORS Protection**
  - [ ] Requests from unauthorized origins are blocked
  - [ ] Requests from Vercel domain are allowed
  - [ ] Requests from localhost are blocked (in production)

- [ ] **Input Sanitization**
  - [ ] XSS payload in chat is safely displayed
  - [ ] SQL injection in filters is handled safely
  - [ ] File upload validation prevents malicious files

---

## Post-Deployment Verification

- [ ] **Monitoring**
  - [ ] Render dashboard shows green health status
  - [ ] Vercel deployment shows success
  - [ ] No errors in application logs

- [ ] **Database**
  - [ ] Neon dashboard shows active connection
  - [ ] Database queries are executing quickly
  - [ ] No connection pool exhaustion

- [ ] **Analytics**
  - [ ] Can view first scan in admin dashboard
  - [ ] Activity log records scan event
  - [ ] Notification system works (if SSE enabled)

---

## Sign-Off

- [ ] All smoke tests passed ✅
- [ ] No critical issues found ✅
- [ ] Ready for demo day ✅

**Date:** ******\_\_\_******  
**Tester:** ******\_\_\_******  
**Environment:** Production / Staging
