# Aetros — ESG Community Platform

Bilingual (EN/TH) community platform for ESG impact tracking, knowledge, experts, and rewards.

## Quick start

```bash
npm install
cp .env.example .env   # fill in Supabase URL + publishable key
npm run dev
```

Open http://localhost:5173

## Database migrations

Apply SQL in `supabase/migrations/` to your Supabase project:

```bash
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

Or paste migration files in Supabase Dashboard → SQL Editor.

Migrations to apply (in order):

1. `20260627120000_settings_notifications_delete.sql`
2. `20260627130000_phase3_admin_experts.sql`
3. `20260628100000_global_tier.sql`
4. `20260628110000_global_tier_phase2.sql`

## Email notifications (optional)

Redemption confirmations queue to `notification_outbox`. Deploy the Edge Function and set `RESEND_API_KEY`:

```bash
npx supabase functions deploy send-email
```

## Observability (optional)

Set `VITE_SENTRY_DSN` in `.env` and install `@sentry/browser` for client error tracking.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build (Nitro + Cloudflare) |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Stack

- TanStack Start + Router + Query
- Supabase (Auth, Postgres, Storage, Realtime)
- Tailwind CSS v4
- Vite 8
