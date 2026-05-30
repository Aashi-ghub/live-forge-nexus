# E-Cell CGC — Live frontend

Simple frontend for hosting an event livestream with lightweight registration.

**Quick start**

- Prerequisites: Node.js (LTS). Some packages recommend Node >= 22, but Node 18+/20+ will generally work.
- Install dependencies:

```bash
npm install
```

- Start dev server:

```bash
npm run dev
```

Open http://localhost:8080/ in your browser.

**Files of interest**

- `src/routes/index.tsx`: landing page — collects name and email, then navigates to `/livestream`.
- `src/components/RegistrationForm.tsx`: form that stores `ecell_email` and `ecell_name` in localStorage and inserts a registration row in Supabase.
- `src/routes/livestream.tsx`: livestream view — shows a poster image when the stream URL isn't set, and a "Join livestream" button that opens YouTube.
- `src/routes/admin.tsx`: admin dashboard — lists registrations and lets admins set the embed URL.

**Poster image**
Place your session poster at `public/assets/image.png` so it's served at `/assets/image.png` (used when no embed URL is configured).

**Supabase**
- Database tables used: `registrations`, `livestream_config`, `qa_messages`, `user_roles`.
- Check `supabase/config.toml` and `src/integrations/supabase` for client setup.

**Notes**
- The registration flow now only collects name + email (no gating). After submitting, users are redirected to `/livestream` and can click "Join livestream" to open the YouTube watch page.
- Admins still manage the embed URL from the admin panel; approved/unapproved flags are retained for audit but don't gate viewing.

If you want, I can add the poster image file, wire an environment example, or prepare a small deployment section.
