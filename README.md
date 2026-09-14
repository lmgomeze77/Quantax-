# Quantax Investor Deck

Investor-facing web deck prepared for deployment on Netlify.

## Deck contents

The deck is the condensed 8-slide investor snapshot (`slide_01.png` … `slide_08.png`, 16:9):

| # | Slide |
|---|-------|
| 1 | Quantax — Invoice. Comply. Pay less tax. |
| 2 | Why now — a forced market reset |
| 3 | Why Quantax — a tax execution layer for the SME |
| 4 | Proof — traction and what the round must prove |
| 5 | Ideal customer |
| 6 | Business model |
| 7 | Competition |
| 8 | The round — financing terms |

## Two entry points

- `/` (`index.html`) — public deck, slides 1–7. Behind an email capture that logs the
  lead to Supabase. **Slide 8 is deliberately excluded**: it carries the financing terms.
- `/investor/` (`investor/index.html`) — full deck, slides 1–8 including the round slide.
  Behind an email whitelist enforced by the `authorize_quantax_v2` Supabase function
  (see `supabase_v2_access.sql`).

Both pages read the shared slide images from the repository root.

## Deployment

Configure the Supabase project URL and anon key in `index.html` and `investor/index.html`
before deployment.

Expected table for the public gate: `deck_access_leads`.

Suggested columns:
- `id uuid default gen_random_uuid() primary key`
- `email text not null`
- `deck_id text`
- `source text`
- `user_agent text`
- `created_at timestamptz default now()`

Enable RLS and allow anonymous inserts only.

## Netlify

Static site: no framework build is required when deploying the unpacked site. The publish directory is the repository root.
