# ResQ

ResQ is a disaster-response platform built for Sri Lanka to connect victims and nearby volunteers quickly during floods, landslides, and other emergencies.

Developed as a solo final-year project at the University of Sri Jayawardenapura.

![ResQ – Real-time Emergency Response Platform](apps/web/public/screenshot.png)

[![Live App](https://img.shields.io/badge/live-vercel-000000.svg)](https://resq-disaster-platform-web.vercel.app)
[![GitHub Repo](https://img.shields.io/github/stars/nishmikaeka/resq-disaster-platform?style=social)](https://github.com/nishmikaeka/resq-disaster-platform)

## Table of Contents

- [Motivation](#motivation)
- [What Problem It Solves](#what-problem-it-solves)
- [How It Works](#how-it-works)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Run and Test](#run-and-test)
- [Production Notes](#production-notes)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Credits](#credits)
- [License](#license)

## Motivation

During disasters, emergency hotlines can become overloaded. ResQ was built to provide a direct, map-based path between victims and volunteer responders, reducing response time and coordination friction.

## What Problem It Solves

- Victims can share their exact location, urgency, and media evidence quickly.
- Volunteers can discover nearby active incidents and accept response tasks.
- Victims receive SMS confirmation when help is on the way.

## How It Works

### Victim flow
1. Sign in with Google.
2. Create an incident (title, location, urgency, phone, optional media).
3. Wait for nearby volunteer acceptance.
4. Mark incident as resolved when safe.

### Volunteer flow
1. Sign in and open dashboard.
2. View nearby incidents on map and list.
3. Accept an open incident.
4. Coordinate with victim and complete response.

## Key Features

- Role-based experience for `VICTIM` and `VOLUNTEER`.
- Geospatial discovery with PostgreSQL + PostGIS.
- Live map interaction with draggable markers (Mapbox).
- Incident media upload support (Cloudinary).
- Twilio SMS notification when an incident is accepted.
- Secure cookie-based authentication with token refresh flow.
- Health checks, validation, global error handling, throttling, and cleanup cron.

## Tech Stack

- Frontend: Next.js 16, React 19, Tailwind CSS, Mapbox GL, Axios
- Backend: NestJS 11, Prisma, PostgreSQL (Neon), PostGIS
- Integrations: Google OAuth, Twilio, Cloudinary
- Monorepo: Turborepo + npm workspaces
- Deployment: Vercel (web), Railway (api)

## Architecture Overview

- `apps/web`: UI, incident reporting, dashboards, map experience.
- `apps/api`: auth, incidents, users, health, security, and background jobs.
- `packages/database`: Prisma schema/client generation and migrations.

## Project Structure

![Folder Structure](apps/web/public/folderStructure.png)

## Getting Started

### Prerequisites

- Node.js `>=18`
- npm `>=10`
- PostgreSQL database with PostGIS enabled

### Installation

```bash
git clone https://github.com/nishmikaeka/resq-disaster-platform.git
cd resq-disaster-platform
npm install
```

## Environment Variables

Create:
- `apps/web/.env.local`
- `apps/api/.env`

### `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

### `apps/api/.env`

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your_long_random_session_secret
JWT_SECRET=your_long_random_jwt_secret

DATABASE_URL=your_postgres_connection_string

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/callback/google

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

## Run and Test

### Run both apps from monorepo root

```bash
npm run dev
```

### Run only API

```bash
npm run start:dev --workspace=apps/api
```

### Run only Web

```bash
npm run dev --workspace=apps/web
```

### Run API tests

```bash
npm run test --workspace=apps/api
```

## Production Notes

- Auth uses HttpOnly cookies for access and refresh tokens.
- Global throttling is enabled; avoid excessive duplicate client requests.
- Global validation and exception formatting are enabled.
- Health endpoint is available at `/api/health`.
- Daily cron cleanup removes incidents older than 7 days.
- Use strong secrets for `SESSION_SECRET` and `JWT_SECRET`.

## Roadmap

- Push notifications for responders
- Sinhala/Tamil localization
- AI-assisted triage and prioritization
- Admin dashboard and analytics
- Offline-friendly fallback flows

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit changes with clear messages.
4. Open a pull request with a concise description and test steps.

## Credits

- Project author: Nishmika Ekanayake
- Built for academic research and social impact in disaster-response workflows
- Thanks to the open-source ecosystem around NestJS, Next.js, Prisma, and Mapbox

## License

This project is currently unlicensed (`UNLICENSED`).  
If you plan to open-source it formally, choose a license from [choosealicense.com](https://choosealicense.com/).
