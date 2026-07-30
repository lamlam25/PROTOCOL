# PROTOCOL36

PROTOCOL36 is a bilingual public accountability, rehabilitation, justice, and historical archive platform for Bangladesh's July 2024 mass uprising.

## Access Model

- **Citizen portal:** citizens authenticate by email magic link before submitting victim or representative evidence. A verified link opens the protected evidence uploader. Public records, budgets, case progress, JulyStories, and the timeline remain readable without an account.
- **Admin portal:** approved administrators authenticate through the separate admin magic-link page. Role checks protect every admin route and allow review, approval, or rejection of submitted evidence.

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl, Supabase Auth/Postgres/RLS, client-side ELA/OCR/dHash forensics, a FastAPI/Transformers AI-image screening service, IPFS adapters, Solidity, Ethers, Polygon Amoy, Recharts, and Leaflet.

## Local Setup

1. Copy `.env.example` to `.env.local` and add the Supabase keys.
2. Apply the Supabase migrations.
3. Create or promote an admin with `npm run seed:admin`.
4. Install the AI checker with `python -m pip install -r services/ai_checker/requirements.txt`.
5. Start the AI checker with `npm run ai:dev`.
6. In another terminal, start the app with `npm run dev`.
7. Open `http://localhost:3000`.

## Magic Links

The callback supports both PKCE authorization codes and SSR-safe token hashes. For local Supabase, the configured template is [supabase/templates/protocol-magic-link.html](supabase/templates/protocol-magic-link.html).

For a hosted Supabase project:

1. Set **Authentication > URL Configuration > Site URL** to the deployed `NEXT_PUBLIC_SITE_URL`.
2. Add `https://your-domain.example/**` to **Additional Redirect URLs**.
3. In **Authentication > Email Templates > Magic Link**, use a link with this target:

```html
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
```

This lets the server verify the one-time token and write the session cookie even when the email opens outside the browser that requested the link. Citizen login permits account creation and redirects successful authentication to the evidence uploader. Admin login disables account creation and the callback rejects users without an admin profile.

## AI Image Screening

The browser requests an initial image or representative-video-frame assessment while preparing evidence. For original images, the submission API repeats the check against the stored file before saving the forensic record, so a browser cannot replace the score. Likely-AI and inconclusive results are review flags, not proof; the admin must still assess provenance and context.

Set `AI_CHECKER_URL` and `AI_CHECKER_SHARED_SECRET` in both the web and Python service environments in production. Keep the FastAPI service private; the default secret is for local development only. The first inference downloads the configured model and can take several minutes.

## Checks

```bash
npm run typecheck
npm run lint
npm run i18n:check
npm run i18n:check-keys
npm run test:ai
npm run build
```
