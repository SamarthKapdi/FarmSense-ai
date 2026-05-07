<div align="center">

<img src="https://readme-typing-svg.herokuapp.com?font=Orbitron&size=40&pause=1000&color=52B788&center=true&vCenter=true&width=600&lines=🌾+FarmSense+AI;A+Crop+Doctor+in+Every;Farmer's+Pocket" alt="FarmSense AI" />

<br/>

[![Java](https://img.shields.io/badge/Java-26-FF6B35?style=for-the-badge&logo=openjdk&logoColor=white)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.5-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring_AI-1.0.0--M6-6DB33F?style=for-the-badge&logo=spring&logoColor=white)](https://spring.io/projects/spring-ai)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Ollama](https://img.shields.io/badge/Ollama-LLaMA_3-7C3AED?style=for-the-badge)](https://ollama.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-FB015B?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![License](https://img.shields.io/badge/License-MIT-52B788?style=for-the-badge)](LICENSE)

<br/>

**FarmSense AI** puts an AI-powered crop doctor in every farmer's pocket. Instant disease detection, multilingual AI chatbot, and complete analytics dashboard — all powered by on-device AI with zero cloud costs.

<br/>

[🚀 Quick Start](#-quick-start) · [✨ Features](#-features) · [🏗️ Architecture](#-architecture) · [📡 API Docs](#-api-endpoints) · [🌐 Languages](#-supported-languages)

---

</div>

## 🎯 The Problem

<div align="center">

| Statistic                                    | Impact                       |
| -------------------------------------------- | ---------------------------- |
| 🌾 **140M+** farming families in India       | Most lack access to experts  |
| 💸 **₹90,000 Crore** annual crop loss        | Due to undetected diseases   |
| 📱 **500M+** smartphone users in rural India | Potential to reach instantly |
| ⏱️ **Every hour** of delay                   | Increases yield loss by ~3%  |

</div>

Most farmers can't afford agronomists. Crop diseases spread faster than help arrives. FarmSense AI bridges this gap — **instant AI diagnosis, in your language, on your phone.**

---

## ✨ Features

<div align="center">

| Feature                     | Details                                                         |
| --------------------------- | --------------------------------------------------------------- |
| 📸 **AI Disease Detection** | Upload photo → instant diagnosis with confidence score          |
| 💬 **KrishiGPT Chatbot**    | Ask anything in Hindi, Tamil, Telugu, Marathi, Punjabi, English |
| 🔐 **JWT Authentication**   | Secure register/login, BCrypt-hashed passwords                  |
| 📊 **Activity Dashboard**   | Full analytics — scans, chats, disease breakdown, charts        |
| 🌐 **6 Indian Languages**   | Native script support for all major farming regions             |
| 📱 **Mobile-First Design**  | Dark green premium UI built for smartphones                     |
| 🏠 **100% On-Device AI**    | All AI via Ollama — zero cloud API costs                        |
| 🛡️ **Treatment Plans**      | Organic, chemical, and preventive 7-day plans                   |
| 📋 **Scan History**         | Every detection saved, searchable, expandable                   |
| 👤 **User Dashboard**       | Personal stats, activity feed, analytics charts                 |

</div>

---

## 🏗️ Architecture

```
┌─────────────────────────┐        ┌──────────────────────────────────┐
│   React 18 + Tailwind   │◄──────►│       Spring Boot 3.4.5          │
│   Port: 3000            │  REST  │       Java 26 · Port: 8080        │
│   Mobile-first UI       │  JWT   │       Spring AI · Spring Security │
└─────────────────────────┘        └──────────┬──────────┬────────────┘
                                              │          │
                              ┌───────────────┘          └──────────────┐
                              ▼                                         ▼
                 ┌────────────────────┐                    ┌───────────────────┐
                 │   PostgreSQL 16     │                    │     Ollama        │
                 │   Port: 5432        │                    │   LLaMA 3 (8B)   │
                 │   5 Tables          │                    │   Port: 11434     │
                 └────────────────────┘                    └───────────────────┘
```

### Data Flow

```
Farmer captures crop photo
       ↓
React frontend (mobile-first)
       ↓
Spring Boot REST API (JWT-secured)
       ↓
Spring AI Vision (Ollama) ──→ Result + Confidence + Yield Loss
       ↓
Spring AI → Ollama LLaMA 3 + LLaMA 3.2 Vision ──→ Treatment Plan (3 types)
       ↓
PostgreSQL ──→ Save to user history + activity log
       ↓
Dashboard → Analytics + Charts
```

---

## 🛠️ Tech Stack

<div align="center">

| Layer           | Technology             | Version      | Purpose                  |
| --------------- | ---------------------- | ------------ | ------------------------ |
| **Runtime**     | Java                   | 26           | Backend runtime          |
| **Framework**   | Spring Boot            | 3.4.5        | REST API server          |
| **AI/LLM**      | Spring AI + Ollama     | 1.0.0-M6     | LLM integration          |
| **AI Model**    | LLaMA 3                | 8B Q4_0      | Disease analysis + chat  |
| **Security**    | Spring Security + JJWT | 6.2 / 0.12.3 | JWT auth, BCrypt         |
| **Database**    | PostgreSQL             | 16.13        | Persistent storage       |
| **ORM**         | Hibernate + JPA        | 6.4          | Database mapping         |
| **Frontend**    | React                  | 18           | UI framework             |
| **Styling**     | Tailwind CSS           | 3            | Utility-first CSS        |
| **Build**       | Maven                  | 3.9.15       | Backend build tool       |
| **Package**     | npm                    | 11.9.0       | Frontend package manager |
| **Translation** | LibreTranslate         | Latest       | Multilingual (optional)  |

</div>

---

## 📋 Prerequisites

Before running FarmSense AI, ensure you have:

```bash
✅ Java 26         → https://adoptium.net/
✅ Maven 3.9.15    → https://maven.apache.org/
✅ Node.js 24.14.0 → https://nodejs.org/
✅ npm 11.9.0      → https://www.npmjs.com/
✅ PostgreSQL 16.13→ https://www.postgresql.org/download/
✅ Ollama 0.23.0   → https://ollama.com/download
```

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/SamarthKapdi/FarmSense-ai.git
cd farmsense-ai
```

### 2️⃣ Setup Database

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE farmsense;"
```

### 3️⃣ Pull AI Model (one-time, ~4.5GB)

```bash
ollama pull llama3
ollama pull llama3.2-vision
```

### 4️⃣ Configure Application

Edit `src/main/resources/application.properties`:

```properties
# Update if your PostgreSQL password is different
spring.datasource.password=YOUR_POSTGRES_PASSWORD
```

### 5️⃣ Start All Services

Open **3 separate terminals**:

**Terminal 1 — AI Model Server:**

```bash
ollama serve
# (Skip if Ollama is already running as a service)
```

**Terminal 2 — Backend (Spring Boot):**

```bash
cd farmsense-ai
mvn clean spring-boot:run
# ✅ Wait for: "Started FarmSenseApplication in X seconds"
```

**Terminal 3 — Frontend (React):**

```bash
cd farmsense-ai/frontend
npm install
npm start
# ✅ Opens at http://localhost:3000 (or the next available port if 3000 is busy)
```

### 6️⃣ Open the App

🌐 **[http://localhost:3000](http://localhost:3000)**

> Register with your email → set a password → start detecting crop diseases instantly!

> Dev profile users: `demo@farmsense.com / farm1234` and `admin@farmsense.com / admin1234`

---

## 📱 App Screens

<div align="center">

| Screen                    | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| 🏠 **Landing Page**       | Animated landing with floating particles, features, CTA |
| 📝 **Register**           | Name + email + password with strength meter             |
| 🔐 **Login**              | Email + password with show/hide toggle                  |
| 📸 **Disease Detection**  | Upload crop photo → AI diagnosis with confidence ring   |
| 💬 **KrishiGPT**          | Multilingual AI chat with quick-question chips          |
| 🛡️ **Treatment Tabs**     | Organic / Chemical / Preventive plans                   |
| 📊 **Activity Dashboard** | Stats, scan history, chat history, analytics charts     |
| 📋 **Scan History**       | Expandable cards with full diagnosis details            |

</div>

---

## 📡 API Endpoints

### 🔐 Authentication (Public)

| Method | Endpoint             | Description                                    |
| ------ | -------------------- | ---------------------------------------------- |
| `POST` | `/api/auth/register` | Register new account → returns JWT immediately |
| `POST` | `/api/auth/login`    | Login with email + password → returns JWT      |
| `GET`  | `/api/auth/me`       | Get current user info (requires Bearer token)  |

### 🌾 Farm Detection (🔒 Requires JWT)

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| `POST` | `/api/farm/detect`         | Upload image → disease detection result |
| `POST` | `/api/farm/ask`            | Ask KrishiGPT a farming question        |
| `POST` | `/api/farm/treatment-plan` | Generate 7-day treatment plan           |
| `GET`  | `/api/farm/history/me`     | Get authenticated user's scan history   |
| `GET`  | `/api/farm/stats/me`       | Get authenticated user's scan stats     |
| `GET`  | `/api/farm/health`         | Health check (public)                   |

### 🌦️ Weather & Farm Profiles

| Method   | Endpoint                   | Description                     |
| -------- | -------------------------- | ------------------------------- |
| `GET`    | `/api/weather?city=Mumbai` | Weather data and disease alerts |
| `GET`    | `/api/farm-profile`        | List saved farm profiles        |
| `POST`   | `/api/farm-profile`        | Create a farm profile           |
| `PUT`    | `/api/farm-profile/{id}`   | Update a farm profile           |
| `DELETE` | `/api/farm-profile/{id}`   | Delete a farm profile           |

### 💬 Chat (🔒 Requires JWT)

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| `POST` | `/api/farm/ask` | Chat with KrishiGPT |

### 👤 User Data (🔒 Requires JWT)

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| `GET`  | `/api/user/stats`             | Personal statistics summary |
| `GET`  | `/api/user/activities`        | Paginated activity feed     |
| `GET`  | `/api/user/activities/recent` | Latest 10 activities        |
| `GET`  | `/api/user/chat-history`      | Full chat history           |
| `GET`  | `/api/user/scan-history`      | Full scan history           |
| `GET`  | `/api/user/profile`           | User profile details        |

> All protected endpoints require: `Authorization: Bearer <jwt_token>`

---

## 🗄️ Database Schema

```sql
users              → id, fullName, email, passwordHash, emailVerified, role, createdAt, lastLoginAt
detection_reports  → id, farmerId, cropName, diseaseName, confidence, severity, yieldLoss, timestamp
chat_history       → id, userId, question, answer, crop, language, timestamp
user_activities    → id, userId, activityType, description, metadata, timestamp
```

---

## 🔐 Authentication Flow

```
POST /api/auth/register                POST /api/auth/login
{ fullName, email, password }    OR    { email, password }
            ↓                                   ↓
    BCrypt hash password           Verify BCrypt hash
            ↓                                   ↓
      Save to DB                    Update lastLoginAt
            ↓                                   ↓
  Generate JWT (7 days)            Generate JWT (7 days)
            ↓                                   ↓
   { token, userId, ... }          { token, userId, ... }
            ↓
  Frontend stores in React state
            ↓
  All API calls: Authorization: Bearer <token>
```

---

## 🌾 Detected Diseases

<div align="center">

| Disease               | Affected Crops  | Severity | Avg Yield Loss |
| --------------------- | --------------- | -------- | -------------- |
| Early Blight          | Tomato, Potato  | Moderate | 20–40%         |
| Late Blight           | Tomato, Potato  | Severe   | 40–80%         |
| Leaf Rust             | Wheat, Barley   | Severe   | 30–50%         |
| Rice Blast            | Rice, Millet    | Severe   | 50–90%         |
| Fusarium Wilt         | Tomato, Cotton  | Severe   | 30–100%        |
| Powdery Mildew        | Wheat, Mango    | Moderate | 15–25%         |
| Brown Spot            | Rice, Millet    | Moderate | 10–30%         |
| Downy Mildew          | Mustard, Grapes | Moderate | 20–50%         |
| Anthracnose           | Mango, Chili    | Moderate | 20–40%         |
| Bacterial Leaf Streak | Rice, Wheat     | Moderate | 10–30%         |
| Healthy Crop          | All             | —        | 0%             |

</div>

---

## 🌐 Supported Languages

<div align="center">

| Code | Language   | Region                    | Script   |
| ---- | ---------- | ------------------------- | -------- |
| `en` | 🇬🇧 English | All India                 | Latin    |
| `hi` | 🇮🇳 Hindi   | North India               | देवनागरी |
| `ta` | 🇮🇳 Tamil   | Tamil Nadu                | தமிழ்    |
| `te` | 🇮🇳 Telugu  | Andhra Pradesh, Telangana | తెలుగు   |
| `mr` | 🇮🇳 Marathi | Maharashtra               | देवनागरी |
| `pa` | 🇮🇳 Punjabi | Punjab, Haryana           | ਗੁਰਮੁਖੀ  |

</div>

---

## 🏗️ Project Structure

```
farmsense-ai/
├── pom.xml
├── src/main/java/com/farmsense/
│   ├── FarmSenseApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── JwtAuthFilter.java
│   │   ├── CorsConfig.java
│   │   ├── GlobalExceptionHandler.java
│   │   └── SpringAIConfig.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── DetectionController.java
│   │   ├── ChatController.java
│   │   ├── WeatherController.java
│   │   ├── FarmProfileController.java
│   │   └── UserController.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── JwtService.java
│   │   ├── DiseaseDetectionService.java
│   │   ├── KrishiGPTService.java
│   │   ├── ActivityService.java
│   │   ├── UserStatsService.java
│   │   ├── WeatherService.java
│   │   ├── TranslationService.java
│   │   └── FarmProfileService.java
│   ├── model/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── DetectionReport.java
│   │   │   ├── ChatHistory.java
│   │   │   ├── UserActivity.java
│   │   │   └── FarmProfile.java
│   │   └── dto/
│   └── repository/
└── frontend/
       └── src/
              ├── App.jsx
              ├── context/
              │   └── AuthContext.jsx
              ├── pages/
              │   ├── LandingPage.jsx
              │   ├── LoginPage.jsx
              │   ├── RegisterPage.jsx
              │   └── ActivityPage.jsx
              ├── components/
              │   ├── ImageUploader.jsx
              │   ├── ResultsDashboard.jsx
              │   ├── TreatmentTabs.jsx
              │   ├── KrishiGPTChat.jsx
              │   └── HistoryPage.jsx
              └── services/
                     ├── authApi.js
                     ├── userApi.js
                     └── api.js
```

---

## ⚠️ Troubleshooting

<div align="center">

| Error                            | Cause                     | Fix                                                          |
| -------------------------------- | ------------------------- | ------------------------------------------------------------ |
| `Port 8080 already in use`       | Old backend still running | `netstat -ano \| findstr :8080` then `taskkill /PID <id> /F` |
| `database "farmsense" not found` | DB not created            | `psql -U postgres -c "CREATE DATABASE farmsense;"`           |
| `Connection refused: 11434`      | Ollama not running        | Run `ollama serve`                                           |
| `Model llama3 not found`         | Model not pulled          | Run `ollama pull llama3` and `ollama pull llama3.2-vision`   |
| `Port 3000 in use`               | Another React app running | Kill it or let CRA choose the next port                      |
| KrishiGPT not responding         | Ollama not up             | Check `http://localhost:11434`                               |
| Blank screen after login         | JWT expired or null       | Clear browser storage, re-login                              |

</div>

---

---

## 📸 Screenshots

> *Add application screenshots here to showcase the beautiful UI!*

<div align="center">
  <img src="https://via.placeholder.com/800x400?text=Dashboard+Screenshot" alt="Dashboard" width="800"/>
  <br/>
  <em>Main Analytics Dashboard</em>
</div>

<br/>

<div align="center">
  <img src="https://via.placeholder.com/400x800?text=Mobile+UI+Screenshot" alt="Mobile UI" width="300"/>
  <img src="https://via.placeholder.com/400x800?text=KrishiGPT+Chat+Screenshot" alt="Chat UI" width="300"/>
  <br/>
  <em>Mobile-First Responsive Interface</em>
</div>

---

## 🚀 Deployment Guide (Free Tier Architecture)

FarmSense AI can be deployed completely for free using the following stack:

- **Frontend**: [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/)
- **Backend**: [Render](https://render.com/) (Web Service)
- **Database**: [Neon](https://neon.tech/) (Serverless Postgres) or [Supabase](https://supabase.com/)
- **AI Model (Ollama)**: Local/Self-hosted (Requires GPU/RAM, typically not free) or a low-cost VPS (e.g. Hetzner, DigitalOcean)

### Step 1: Database (Neon)
1. Create a free PostgreSQL instance on Neon.tech.
2. Copy the connection string.

### Step 2: Backend (Render)
1. Create a new Web Service on Render connected to your GitHub repo.
2. Set the Environment to `Docker` or `Java`.
3. Build Command: `mvn clean package -DskipTests`
4. Start Command: `java -jar target/farmsense-0.0.1-SNAPSHOT.jar`
5. Add Environment Variables:
   - `SPRING_PROFILES_ACTIVE`: `prod`
   - `DB_URL`: `jdbc:postgresql://<neon-url>/farmsense?sslmode=require`
   - `DB_USER`: `<db-username>`
   - `DB_PASS`: `<db-password>`
   - `JWT_SECRET`: `<secure-random-32-byte-string>`
   - `WEATHER_API_KEY`: `<openweathermap-key>`
   - `OLLAMA_URL`: `<url-to-your-ollama-instance>`

### Step 3: Frontend (Vercel)
1. Import the repository into Vercel.
2. Set Framework Preset to `Create React App`.
3. Set the Root Directory to `frontend`.
4. Add Environment Variable:
   - `REACT_APP_API_BASE_URL`: `<your-render-backend-url>/api`
5. Deploy!

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: Add amazing feature'`
4. **Push**: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License, Author & Credits

```text
MIT License — Free to use, modify, and distribute.
```

<div align="center">

**Built with ❤️ by [Samarth Kapdi](https://github.com/SamarthKapdi)**

| Technology                                        | Credit                             |
| ------------------------------------------------- | ---------------------------------- |
| [Spring AI](https://spring.io/projects/spring-ai) | LLM integration framework          |
| [Ollama](https://ollama.com/)                     | Local AI model serving             |
| [LLaMA 3](https://ai.meta.com/llama/)             | Open-source language model by Meta |
| [React](https://react.dev/)                       | UI framework by Meta               |
| [Tailwind CSS](https://tailwindcss.com/)          | Utility-first CSS framework        |

---

### 🌾 Built for 140 Million+ Indian Farming Families

_"Technology should serve those who feed the nation."_

⭐ **Star this repo if FarmSense AI can help Indian farmers!** ⭐

</div>
