# Deploying ReanPhysics (frontend + backend)

Frontend (client) is already set up to deploy to Cloudflare Workers as a
static SPA (see `client/wrangler.jsonc`). This covers hosting the backend
API on Render, the database on MongoDB Atlas, and file uploads on
Cloudflare R2 -- then wiring all three together.

## 1. MongoDB Atlas (free tier)

1. Go to https://www.mongodb.com/cloud/atlas/register and create an account.
2. Create a free (M0) cluster -- any region close to Cambodia (e.g.
   Singapore) is fine.
3. Under **Database Access**, add a database user with a username/password
   (not your Atlas login).
4. Under **Network Access**, add `0.0.0.0/0` (allow access from anywhere) --
   Render's IPs aren't static, so this is the simplest option for now.
5. Click **Connect > Drivers**, copy the connection string. It looks like:
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Add a database name before the `?`, e.g. `.../reanphysics?retryWrites=...`
7. This full string is your `MONGO_URI`.

## 2. Cloudflare R2 (file storage)

1. In the Cloudflare dashboard, go to **R2 Object Storage** and create a
   bucket (e.g. `reanphysics-uploads`).
2. Open the bucket > **Settings** > enable **Public Development URL**.
   Copy that URL (looks like `https://pub-xxxxxxxx.r2.dev`) -- this is
   `R2_PUBLIC_URL`.
3. Go to **R2 > Manage API tokens** > create a token scoped to this bucket
   with **Object Read & Write** permission. It gives you:
   - Access Key ID -> `R2_ACCESS_KEY_ID`
   - Secret Access Key -> `R2_SECRET_ACCESS_KEY`
4. Your Cloudflare account ID (shown on the R2 overview page, or any
   dashboard sidebar) -> `R2_ACCOUNT_ID`.
5. The bucket name you created -> `R2_BUCKET_NAME`.

For production you'd normally map a custom domain to the bucket instead of
the `.r2.dev` dev URL, but the dev URL is fine to start.

## 3. Render (backend API)

1. Go to https://render.com, sign in, **New > Web Service**.
2. Connect the GitHub repo, set:
   - **Root Directory**: `tutorial-site/server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (fine to start; sleeps after 15 min idle, first
     request after that takes ~30-60s to wake up)
3. Add these environment variables (Render dashboard > Environment):
   ```
   MONGO_URI=<from Atlas, step 1>
   JWT_SECRET=<any long random string>
   CLIENT_URL=<your Cloudflare frontend URL, e.g. https://reanphysics.pages.dev>
   SERVER_URL=<filled in after first deploy -- see step 4>
   R2_ACCOUNT_ID=<from R2, step 2>
   R2_ACCESS_KEY_ID=<from R2, step 2>
   R2_SECRET_ACCESS_KEY=<from R2, step 2>
   R2_BUCKET_NAME=<from R2, step 2>
   R2_PUBLIC_URL=<from R2, step 2>
   ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
   ABA_MERCHANT_ID=<your ABA sandbox/production merchant ID>
   ABA_API_KEY=<your ABA sandbox/production API key>
   ```
   (`PORT` doesn't need to be set -- Render sets it automatically and the
   server already reads `process.env.PORT`.)
4. Deploy. Render gives you a URL like
   `https://reanphysics-api.onrender.com`. Go back into the environment
   variables and set `SERVER_URL` to that exact URL (needed for ABA
   PayWay's callback), then redeploy.

## 4. Point the frontend at the deployed API

The client reads `VITE_API_URL` at **build time** (see
`client/.env.example`). In your Cloudflare Pages/Workers project's build
settings, add an environment variable:

```
VITE_API_URL=https://reanphysics-api.onrender.com/api
```

(use your actual Render URL + `/api`), then trigger a rebuild/redeploy of
the frontend so it picks it up.

## 5. Double-check CORS

`CLIENT_URL` on Render must exactly match the frontend's real deployed
origin (no trailing slash) -- that's what the API's CORS check uses to
decide whether to accept requests from the browser.

## Notes / limits

- Render's free tier spins the server down after 15 minutes of no traffic;
  the first request after that will be slow (cold start) but not broken.
- MongoDB Atlas M0 (free) caps storage at 512MB -- plenty for this project's
  metadata (videos/books/users/purchases are just text+links, not the media
  files themselves).
- Uploaded files (thumbnails, covers, PDFs) go straight to R2, not
  Render's disk, so they survive redeploys/restarts on any plan.
