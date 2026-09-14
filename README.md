# Quantax Investor Deck

Investor-facing web deck prepared for deployment on Netlify.

## Deck contents

The deck is the condensed 8-slide investor snapshot (16:9):

| # | Slide |
|---|-------|
| 1 | Quantax — Invoice. Comply. Pay less tax. |
| 2 | Why now — a forced market reset |
| 3 | Why Quantax — a tax execution layer for the SME |
| 4 | Proof — traction and what the round must prove |
| 5 | Ideal customer |
| 6 | Business model |
| 7 | Competition |
| 8 | The round — financing terms **(protected)** |

## Two entry points

- `/` (`public/index.html`) — public deck, slides 1–7. Behind an email capture that
  logs the lead to Supabase.
- `/investor/` (`public/investor/index.html`) — full deck, slides 1–8. Behind an email
  allowlist enforced by the `authorize_quantax_v2` Supabase function.

## How slide 8 is protected

Slides 1–7 are public assets — they are the public deck. Slide 8 carries the financing
terms, so it is not served as a static file at all:

- It lives in `protected/`, **outside the publish directory** (`public/`), so Netlify
  never exposes it at a guessable URL.
- `public/investor/index.html` requests it by `POST /api/slide8` with the visitor's email.
- `netlify/functions/slide8.mjs` checks that email against `deck_v2_allowlist` using the
  **service role key**, held as a Netlify environment variable and never sent to the
  browser. It returns the image bytes on a match and `403` otherwise.

So the image is only obtainable by someone who knows an allowlisted email. Tampering with
`sessionStorage` to unlock the viewer UI no longer reveals the slide.

Scope of the protection, stated plainly: it is as strong as the allowlist itself. Anyone
holding an allowlisted email — or an authorized viewer who saves and forwards the image —
can still pass the slide on. It stops URL guessing and casual scraping, not redistribution.

## Deployment

### 1. Supabase

Run `supabase_v2_access.sql` in the Supabase SQL editor. It creates:

- `deck_v2_allowlist` — the investor allowlist.
- `authorize_quantax_v2(email, user_agent)` — gate check that also records a lead;
  granted to `anon` (called from the browser).
- `is_quantax_v2_allowed(email)` — read-only check with no lead logging, used per image
  request; granted to `service_role` only, so the allowlist cannot be probed from the
  browser.

Also expected: the `deck_access_leads` table used by the public gate.

Suggested columns:
- `id uuid default gen_random_uuid() primary key`
- `email text not null`
- `deck_id text`
- `source text`
- `user_agent text`
- `created_at timestamptz default now()`

Enable RLS and allow anonymous inserts only.

Authorize an investor:

```sql
insert into public.deck_v2_allowlist (email, note)
values ('investor@example.com', 'Investor name / firm')
on conflict (email) do update set active = true, note = excluded.note;
```

### 2. Netlify environment variables

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | Service role key. Without it `/api/slide8` returns `503` and slide 8 never loads. Never commit it or expose it to the client. |
| `SUPABASE_URL` | no | Defaults to the current project URL. |

### 3. Build settings

`netlify.toml` now sets `publish = "public"` and `functions = "netlify/functions"`, which
**overrides the publish directory configured in the Netlify UI**. No framework build is
required. The `included_files` entry bundles `protected/` with the function; the folder is
not published.

The Supabase project URL and anon key used by the two gates are still configured inline in
`public/index.html` and `public/investor/index.html`.
