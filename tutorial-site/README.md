# TutorHub — Video + PDF Tutorial Site (Full Sample Project)

A deeper, more realistic version of the earlier single-file demo: a real
client/server split with authentication, a database layer, and a Stripe
subscription stub, matching the brainstorm (video tutorials + PDF guides,
Free vs Paid plan).

This is still a **starter/reference implementation**, not production-hardened.
Treat it as the scaffolding to build on, not a finished product.

## Structure

```
tutorial-site/
├── client/                  React app (Vite)
│   └── src/
│       ├── api/client.js        fetch wrapper, attaches JWT
│       ├── context/AuthContext.jsx   login/logout/session state
│       ├── components/          NavBar, ProtectedRoute
│       └── pages/                Home, Courses, Lesson, Pricing,
│                                  Dashboard, Login, Register
├── server/                  Express API
│   └── src/
│       ├── config/db.js         MongoDB connection
│       ├── models/              User, Course, Lesson (Mongoose schemas)
│       ├── middleware/          JWT auth, "requirePaid" plan gate
│       ├── routes/               auth, courses, billing (Stripe)
│       └── index.js             app entry
└── README.md
```

## How the pieces fit together

1. **Auth** — `POST /api/auth/register` and `/login` issue a JWT. The
   client stores it (in memory / httpOnly cookie in production) via
   `AuthContext` and sends it on every request through `api/client.js`.
2. **Plan gating** — `User.plan` is `"free"` or `"paid"`. The
   `requirePaid` middleware blocks access to paid lesson video URLs and
   PDF download links server-side — **never trust the client alone** to
   hide paid content; always re-check on the server, because a curious
   free user can call the API directly.
3. **Course/Lesson data** — stored in MongoDB. Each lesson has a
   `videoUrl` (pointing to your video host, e.g. Mux/Bunny/Cloudflare
   Stream — don't self-host raw files) and a `pdfUrl` (signed URL or
   gated download route), plus an `isFree` flag.
4. **Billing** — `POST /api/billing/create-checkout-session` creates a
   Stripe Checkout session for the Paid plan subscription.
   `POST /api/billing/webhook` listens for
   `checkout.session.completed` / `customer.subscription.deleted` and
   flips `User.plan` accordingly. This webhook is the *only* trustworthy
   source of truth for plan status — don't set `plan: "paid"` directly
   from the client after checkout.

## Running it locally (once you fill in real credentials)

```bash
# server
cd server
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID
npm install
node src/seed.js        # populate sample courses/lessons
npm run dev             # http://localhost:4000

# client
cd client
npm install
npm run dev              # http://localhost:5173
```

Stripe webhooks need a public URL during local dev — use the
`stripe listen --forward-to localhost:4000/api/billing/webhook` CLI
command.

## What's still missing before this is production-ready

- Input validation / rate limiting on the API (e.g. `express-validator`, `express-rate-limit`)
- Email verification & password reset flow
- Real video hosting integration (signed/expiring URLs so paid videos can't be scraped from the free tier)
- File storage for PDFs (S3/Cloudflare R2) with signed download URLs instead of static files
- Tests (unit + integration)
- HTTPS, CORS lockdown, environment-specific config, logging/monitoring
- Legal pages: Terms, Privacy Policy, refund policy (required once you take real payments)
