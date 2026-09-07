# Quantax Investor Deck

Investor-facing web deck prepared for deployment on Netlify.

## Deployment

The site uses a Supabase email gate before displaying the deck. Configure the Supabase project URL and anon key in `index.html` before deployment.

Expected table: `deck_access_leads`.

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
