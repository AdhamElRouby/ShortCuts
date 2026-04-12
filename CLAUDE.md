# Short Movie Streaming Platform

## Project Overview
University group project (6 members) — an online streaming platform for short movies. Users can browse, watch, rate, comment, subscribe to creators, manage watchlists, and donate.

**Important: This is a group project.** When given a task, implement ONLY that specific feature. For parts owned by other teammates, create placeholder/mock interfaces (stub functions, dummy data, placeholder components) so the code compiles and communicates correctly — but do NOT build out other people's features.

## Tech Stack

### Frontend (`/client`)
- React 18+ with TypeScript (strict mode)
- Vite build tool
- Tailwind CSS + Shadcn/UI components
- Video.js for HLS adaptive streaming
- Axios for API calls
- React Context API for ALL state management (no Redux, no Zustand, no other state libraries)

### Backend (`/server`)
- Express with TypeScript (strict mode)
- Prisma ORM (no raw SQL unless absolutely necessary)
- Node.js runtime

### External Services
- **Supabase Auth** — registration (email + Gmail), login, forgot password. We do NOT store passwords.
- **Supabase PostgreSQL** — database accessed via Prisma. Connection string from Supabase.
- **Cloudinary** — all media: video/image upload, transcoding, HLS adaptive streaming, CDN delivery. Store Cloudinary public IDs and URLs in DB.
- **Stripe** — server-side donation processing (later phase)

## Project Structure
```
/client                         — React frontend (Vite + TS)
  /src
    /api                        — Axios instances and API call functions
    /components                 — Reusable UI components
    /contexts                   — React Context providers (all state management)
    /hooks                      — Custom React hooks
    /lib                        — Utility functions (e.g. Shadcn utils)
    /pages                      — Page-level components / route views
    App.tsx                     — Root component with routing
    main.tsx                    — Entry point
    index.css                   — Global styles / Tailwind directives

/server                         — Express backend (TS + Prisma)
  /src
    /controllers                — Route handler logic
    /db                         — Database client setup
    /errors                     — Custom error classes
    /generated                  — Prisma generated client (do not edit)
    /middleware                 — Express middleware (auth, error handling)
    /routes                     — Express router definitions
    /types                      — TypeScript type definitions
    /utils                      — Utility functions
    index.ts                    — Server entry point
  /prisma
    schema.prisma               — Database schema
    /migrations                 — Prisma migrations
```

## Design & UI Guidelines

### Color Palette & Theme
- **Dark theme** as the primary/only theme
- **Gold accent colors** — use gold/amber tones for highlights, buttons, active states, links
- Dark backgrounds: deep blacks and dark grays (e.g. `#0a0a0a`, `#141414`, `#1a1a1a`, `#222`)
- Gold accents: `#d4a843`, `#c9a227`, `#e6b84f`, `#b8942e` range
- Text: white and light gray on dark backgrounds
- Overall vibe: **cinematic, modern, premium**

### Animations & Transitions
- Smooth page transitions and component mount/unmount animations
- Hover effects on cards, buttons, and interactive elements
- Subtle fade-ins, slide-ins for content loading
- Use CSS transitions and Tailwind's transition utilities
- Keep animations performant — prefer `transform` and `opacity` over layout-triggering properties

## Architecture Decisions

### Auth Flow
1. Frontend uses Supabase JS client for signup/login
2. Every API request sends the Supabase access token in the `Authorization` header
3. Backend middleware verifies the token via Supabase, extracts user ID, attaches to request

### Media Uploads
1. Frontend sends files to Express backend endpoints
2. Backend uploads to Cloudinary via Node SDK
3. Backend stores returned public ID / URL in database

### Adaptive Streaming
- Cloudinary handles transcoding into multiple quality levels
- Frontend Video.js player receives HLS manifest URL constructed from Cloudinary public ID

### Video Thumbnails
- `thumbnail_url` in the video table is nullable
- If creator uploads a custom thumbnail → store its Cloudinary URL
- If null → construct thumbnail from `cloudinary_id` by swapping extension to `.jpg`
- Frontend must have a helper function for this fallback logic

## Database Schema (Prisma)
Tables: `user_profile`, `video`, `rating`, `comment`, `subscription`, `watch_history`, `watchlist`
- `user_profile.id` references Supabase `auth.users.id` (UUID)
- See `/server/prisma/schema.prisma` for full schema

## Conventions

### General
- TypeScript strict mode in both client and server
- Environment variables for ALL secrets (never hardcode)
- Keep code simple and well-organized — teammates with limited web experience will build on this

### Frontend
- All state management through React Context API only
- Use Axios for all HTTP requests (configured instances in `/client/src/api/`)
- Shadcn/UI for UI primitives, customize with Tailwind for dark+gold theme
- Pages in `/pages`, reusable components in `/components`
- For each page or component, create a folder with the same page or component name before creating the corresponding .tsx file
- You can UI libraries when needed

### Backend
- All API routes through Express router files in `/server/src/routes/`
- Business logic in controllers, not in route files
- Prisma for all DB operations
- Auth middleware on all protected routes

### Code Style
- No unnecessary abstractions — keep it simple
- Do not add features beyond what was asked
- When a feature depends on another teammate's work, create a clearly-marked placeholder:
  ```typescript
  // PLACEHOLDER: Replace when [feature] is implemented by [teammate/task]
  ```
