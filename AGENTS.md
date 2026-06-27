# Aetros (cosmic-bloom) — Agent notes

## Development workflow

1. Schema changes → new file in `supabase/migrations/` (never edit old migrations)
2. Run `npx supabase db push` or apply SQL in Supabase Dashboard
3. Regenerate types if needed: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`
4. `npm run dev` for local development
5. `npm run build` before deploy

## Environment

Required in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

See `.env.example`.

## Architecture

| Layer | Path |
|-------|------|
| Routes | `src/routes/` |
| Lib | `src/lib/` |
| Supabase | `src/integrations/supabase/` |
| Migrations | `supabase/migrations/` |

## Git

- Do not force-push `main` unless explicitly requested
- Keep commits focused; do not commit `.env`
