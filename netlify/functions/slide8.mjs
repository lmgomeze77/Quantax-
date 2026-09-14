// Serves the protected round slide (slide 8) only to allowlisted investor emails.
//
// The image lives in /protected, outside the publish directory, so Netlify never
// serves it as a static asset. The allowlist check runs here with the Supabase
// service role key, which is never exposed to the browser.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jpecmcplicwhmtfnbpdi.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// included_files places /protected next to the bundled function at the task root.
const SLIDE_CANDIDATES = [
  join(process.cwd(), 'protected', 'slide_08.png'),
  new URL('../../protected/slide_08.png', import.meta.url).pathname,
];

let slideBytes;

async function loadSlide() {
  if (slideBytes) return slideBytes;
  let lastError;
  for (const path of SLIDE_CANDIDATES) {
    try {
      slideBytes = await readFile(path);
      return slideBytes;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

async function isAllowed(email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/is_quantax_v2_allowed`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_email: email }),
  });
  if (!res.ok) throw new Error(`allowlist check failed: ${res.status}`);
  return (await res.json()) === true;
}

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }
  if (!SERVICE_ROLE_KEY) {
    return new Response('Access service is not configured.', { status: 503 });
  }

  let email;
  try {
    ({ email } = await req.json());
  } catch {
    return new Response('Bad Request', { status: 400 });
  }
  if (typeof email !== 'string' || !email.trim()) {
    return new Response('Bad Request', { status: 400 });
  }

  let allowed;
  try {
    allowed = await isAllowed(email.trim().toLowerCase());
  } catch {
    return new Response('Access service is unavailable.', { status: 503 });
  }
  if (!allowed) {
    return new Response('Not authorized.', { status: 403 });
  }

  return new Response(await loadSlide(), {
    status: 200,
    headers: {
      'content-type': 'image/png',
      'cache-control': 'private, no-store',
    },
  });
};

export const config = { path: '/api/slide8' };
