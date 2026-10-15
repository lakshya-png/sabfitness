# SabFitness — Setup & Deployment Guide

> **App Name:** SabFitness  
> **Tagline:** Your fitness journey. Your goals.

SabFitness is built as an offline-first, installable Progressive Web App (PWA) with Next.js App Router, TypeScript, Tailwind CSS, IndexedDB (Dexie), and Supabase PostgreSQL with Row Level Security (RLS).

---

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js LTS (v20+ or v24)
- npm

### Run Locally
```powershell
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the development server
npm run dev

# 3. Open in browser
http://localhost:3000
```

> **Note on Offline / Local Mode:** SabFitness is architected to work out of the box with zero external dependencies. All workouts, meals, water entries, supplements, measurements, and theme settings persist locally to browser storage and IndexedDB.

---

## 2. Supabase Integration (Optional Cloud Database & Auth)

When you are ready to synchronize data to a hosted PostgreSQL backend with Row Level Security (RLS):

1. **Create a Free Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a free project.
   - In your project settings, copy your **Project URL** and **anon public key**.

2. **Run the Database Migrations:**
   - In your Supabase Dashboard, open the **SQL Editor**.
   - Copy the contents of [`supabase/migrations/001_initial_schema.sql`](file:///c:/Users/mcuwo/OneDrive/Desktop/SabFitness/supabase/migrations/001_initial_schema.sql).
   - Paste and click **Run**. This provisions all tables, constraints, foreign keys, triggers, and comprehensive RLS policies.

3. **Private Storage Setup:**
   - In Supabase, navigate to **Storage**.
   - Create a private bucket named `progress-photos`.
   - Set public access to **False** (private). Row Level Security ensures only authenticated athletes can access their own photos.

4. **Configure Environment Variables:**
   - Edit `.env.local` (or configure in Vercel):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-public-anon-key
   NEXT_PUBLIC_OWNER_ADMIN_EMAIL=your-owner-email@example.com
   ```

---

## 3. Sole Owner Admin Bootstrap

- **Configured Owner Email:** In `.env.local` or your production hosting dashboard, set:
  ```env
  NEXT_PUBLIC_OWNER_ADMIN_EMAIL=your-verified-email@example.com
  ```
- **Access Rule:** Only an authenticated user whose email strictly matches `NEXT_PUBLIC_OWNER_ADMIN_EMAIL` receives Owner Admin privileges.
- **Normal Fitness Features:** The Owner Admin can track workouts, meals, water, supplements, progress photos, and milestones just like any other athlete.
- **Admin Dashboard:** Access via the navigation sidebar or [`/admin`](file:///c:/Users/mcuwo/OneDrive/Desktop/SabFitness/src/app/admin/page.tsx). It includes moderation queues, audit logs, and platform health telemetry.
- **Security Safeguard:** Public signup will **never** elevate an account to Owner Admin.

---

## 4. Progressive Web App (PWA) Installation

- **Desktop (Chrome/Edge):** Click the "Install SabFitness" icon in the browser address bar.
- **Mobile (iOS Safari):** Tap the **Share** button ➔ tap **"Add to Home Screen"**.
- **Mobile (Android Chrome):** Tap the three-dot menu ➔ tap **"Install App"**.
- The service worker caches static assets and the app shell for offline functionality.

---

## 5. Deployment to Vercel (Free Tier)

1. Push your repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and import the repository.
3. In the Environment Variables settings, add:
   - `NEXT_PUBLIC_OWNER_ADMIN_EMAIL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will automatically build and serve the application on a free `*.vercel.app` subdomain.
