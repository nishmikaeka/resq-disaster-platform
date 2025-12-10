# ResQ – Real-time Emergency Response Platform for Sri Lanka
<div align="center">

![ResQ – Real-time Emergency Response Platform](apps/web/public/screenshot.png)

**When floods or landslides hit — every second counts.**  
**ResQ connects victims with nearby volunteers in minutes.**

[![Vercel](https://img.shields.io/badge/live-vercel-000000.svg?style=for-the-badge&logo=vercel)](https://resq-disaster-platform-web.vercel.app)
[![GitHub](https://img.shields.io/github/stars/nishmikaeka/resq-disaster-platform?style=social)](https://github.com/nishmikaeka/resq-disaster-platform)

</div>

### How it works (4 taps)

**Victim**  
→ Logs in → taps the big red + → drops pin (auto or draggable) + adds photos → sends SOS

**Volunteer**  
→ Opens app → instantly sees exact victim location on live map  
→ Taps “I’m going” → victim gets SMS: “Help is on the way! Nuran is coming.”

→ Once safe → incident closed

No overwhelmed hotlines. No waiting. Just real people saving real people.

### Features

- Real-time incident visibility (10 km radius)
- Draggable Mapbox pins with PostGIS geospatial queries
- Instant Twilio SMS alerts to victims
- Image/video uploads (Cloudinary)
- Role-based dashboards (Victim / Volunteer)
- Fully responsive dark UI with Tailwind CSS

### Tech Stack (Turborepo monorepo)

- **Frontend** – Next.js 16 (App Router), React, Tailwind CSS, Mapbox GL JS
- **Backend** – NestJS, PostgreSQL + PostGIS (Neon), Prisma
- **Real-time & Alerts** – Twilio SMS
- **Media** – Cloudinary
- **Auth** – NextAuth.js + Google OAuth
- **Deploy** – Vercel (frontend) + Railway (backend)

### Built for Sri Lanka’s floods

Open-source and ready for the next disaster.

## How to Run Locally (5 minutes)

```bash
# 1. Clone & enter the project
git clone https://github.com/nishmikaeka/resq-disaster-platform.git
cd resq-disaster-platform

# 2. Install dependencies (Turborepo monorepo)
npm install

# 3. Set up environment variables
# Copy example files
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# Fill these required keys (get free accounts):

# ── apps/web/.env.local ─────────────────────
NEXTAUTH_SECRET=your-super-long-random-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001/api
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# ── apps/api/.env ───────────────────────────
DATABASE_URL=your_neon_postgres_url
BACKEND_URL=http://localhost:3001
JWT_SECRET=same-as-nextauth-secret-above
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

#start frontend-- apps/web
npm run dev
#start backend-- apps/api
npm start run:dev

#Services you need (all free tiers available)

Neon.tech → PostgreSQL + PostGIS
Mapbox → Maps
Cloudinary → Image uploads
Twilio → SMS alerts (free trial)
Google OAuth → Google Cloud Console
```

### Project Structure (quick note)
![Folder Structure](apps/web/public/folderStructure.png)

### Want to help?

- Volunteer → sign up on the live app
- Developer → fork, improve, add Sinhala/Tamil translations, push notifications, AI triage

Star · Fork · Share  
Together we can make sure no one waits alone again.

#ResQ #SriLanka #TechForGood #OpenSource #FullStack #NextJS #NestJS #PostGIS #Twilio
