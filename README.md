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

### Want to help?

- Volunteer → sign up on the live app
- Developer → fork, improve, add Sinhala/Tamil translations, push notifications, AI triage

Star · Fork · Share  
Together we can make sure no one waits alone again.

#ResQ #SriLanka #TechForGood #OpenSource #FullStack #NextJS #NestJS #PostGIS #Twilio
