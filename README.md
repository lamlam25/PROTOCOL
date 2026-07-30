# PROTOCOL36

PROTOCOL36 is a bilingual public accountability, rehabilitation, justice, and historical archive platform for Bangladesh's July 2024 mass uprising.

## Access Model

- **Citizen portal:** citizens create an email-and-password account before submitting victim or representative evidence. Registration is server-side, rate-limited, and opens the protected evidence uploader without depending on an email provider. Public records, budgets, case progress, JulyStories, and the timeline remain readable without an account.
- **Admin portal:** approved administrators authenticate through the separate password login page. Role checks protect every admin route and allow review, approval, or rejection of submitted evidence.

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

## Authentication

Password authentication is the operational default for citizens and administrators. Citizen registration is handled by a same-origin, rate-limited server endpoint; it creates only `citizen` accounts. Administrators must be explicitly created or promoted with:

```bash
npm run seed:admin -- administrator@example.com
```

Email-link infrastructure can be restored later without changing protected routes. The callback still supports PKCE authorization codes and SSR-safe token hashes, and the local Supabase template remains at [supabase/templates/protocol-magic-link.html](supabase/templates/protocol-magic-link.html).

Citizen email addresses are not ownership-verified while SMTP is unavailable. Do not use the email field alone as legal proof of a submitter's identity; evidence provenance and contact details still require administrator review.

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
