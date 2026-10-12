# ADUJI — Video Platform MVP with Supabase starter integration

Responsive React + Vite front-end for a short-video community, with Supabase client wiring, email/password authentication, cloud feed reads, video upload to Supabase Storage, and SQL for profiles, videos, likes, follows and comments.

## 1. Configure Supabase

1. Open your Supabase project and go to **SQL Editor**.
2. Run the entire `supabase/schema.sql` script.
3. In the project settings, confirm that the Data API is enabled.
4. For email/password signup, configure Authentication > URL Configuration with your local and deployed site URLs.

The SQL script creates the tables, row-level security policies, a video storage bucket and an auth-user profile trigger. Review the policies before a public launch. The starter upload flow stores videos in the public `aduji-videos` bucket; do not use it for private content without changing the bucket and access rules.

## 2. Configure local environment

Copy `.env.example` to `.env.local`, then fill in your Supabase project URL and publishable key:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

These are browser-visible client settings. Never use a Supabase `service_role` or `sb_secret_...` key in this frontend, and never commit `.env.local`.

## 3. Run

Requires Node.js 18+ and npm:

```bash
npm install
npm run dev
```

Vite prints a local URL, usually `http://localhost:5173`.

## 4. Deploy with GitHub + Vercel

1. Push this folder to a GitHub repository (keep `.env.local` out of Git).
2. Import the repository in Vercel; framework preset: Vite, build command `npm run build`, output directory `dist`.
3. In Vercel Project Settings > Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for Production, Preview and Development as needed.
4. Deploy, then add the final Vercel URL to Supabase Authentication > URL Configuration and allowed redirect URLs.

Vercel can automatically deploy subsequent pushes from the connected GitHub repository.

## Current capabilities and limitations

- Supabase email/password sign-in, sign-up and password-reset request UI.
- Reads public published video rows from Supabase.
- Authenticated video uploads to Supabase Storage and `videos` table.
- SQL tables and RLS for profiles, videos, likes, follows and comments.
- Local feed interactions and sample cards for visual demonstration.
- The app's sample videos/metrics are illustrative; they are not verified creators or real analytics.
- The recommendation logic is currently a simple front-end demo, not a trained ranking model.
- Real live streaming, persistent comments UI, persistent messaging, full database-backed likes/follows, transcoding, moderation and a production recommendation service are not yet implemented.
- Build was not verified in this environment because package installation timed out. Run `npm install` and `npm run build` before deployment.
