# Deployment Guide — Vercel + Hugging Face

> **Architecture**
> - **Frontend** → Vercel (static Vite/React build)
> - **Backend** → Hugging Face Spaces (Docker SDK Space running FastAPI on port 7860)
> - **Database** → MongoDB Atlas (cloud, no changes needed)

---

## Prerequisites

| Tool | Link |
|------|------|
| GitHub account | https://github.com |
| Vercel account | https://vercel.com |
| Hugging Face account | https://huggingface.co |
| MongoDB Atlas cluster | https://cloud.mongodb.com |

---

## Step 1 — Create a Separate Backend Repo for HuggingFace

HuggingFace Spaces requires a dedicated repo (not a subdirectory). Create a new repo containing **only the backend** files.

```bash
# In a NEW empty folder somewhere on your machine:
mkdir suraksha-backend-hf
cd suraksha-backend-hf
git init

# Copy only the backend files:
# - main.py, config.py, database.py, requirements.txt, Dockerfile.hf
# - api/, services/, models/, core/ directories

# Rename Dockerfile.hf → Dockerfile (HF expects a file called "Dockerfile")
# Then:
git add .
git commit -m "Initial backend for HuggingFace"
```

> **Or** use the helper script below to copy the files automatically — see Step 1b.

### Step 1b — Quick Copy Script (run from the project root)

```powershell
# Run this from: c:\Users\hardi\Desktop\new\suraksha-my-work
$dest = "..\suraksha-backend-hf"
New-Item -ItemType Directory -Force $dest

# Copy production files only
Copy-Item backend\main.py       $dest\
Copy-Item backend\config.py     $dest\
Copy-Item backend\database.py   $dest\
Copy-Item backend\requirements.txt $dest\
Copy-Item backend\Dockerfile.hf "$dest\Dockerfile"   # rename!
Copy-Item -Recurse backend\api      $dest\api
Copy-Item -Recurse backend\services $dest\services
Copy-Item -Recurse backend\models   $dest\models
Copy-Item -Recurse backend\core     $dest\core

Write-Host "Backend files copied to $dest"
```

---

## Step 2 — Deploy Backend to HuggingFace Spaces

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. **Space name**: e.g., `suraksha-backend`
3. **SDK**: Select **Docker**
4. **Visibility**: Public (or Private if you have a Pro account)
5. Click **Create Space**

### Link your backend repo to the Space

```bash
cd suraksha-backend-hf

# Add HuggingFace as remote (replace <username> and <space-name>)
git remote add hf https://huggingface.co/spaces/<username>/<space-name>

git push hf main
```

> HuggingFace will auto-detect the `Dockerfile` and start building. First build takes ~10–15 minutes due to sentence-transformers download.

### Step 2b — Set Environment Variables (Secrets) in HF Space

In your HF Space → **Settings** → **Repository secrets**, add:

| Secret Name | Value |
|-------------|-------|
| `MONGODB_URI` | Your Atlas connection string |
| `JWT_SECRET` | A long random string (use `python -c "import secrets; print(secrets.token_urlsafe(64))"`) |
| `GEMINI_API_KEY` | Your Gemini API key |
| `BACKEND_CORS_ORIGINS` | `["https://your-app.vercel.app","http://localhost:5173"]` |
| `ENVIRONMENT` | `production` |
| `DEMO_MODE` | `false` |

> ⚠️ Add `BACKEND_CORS_ORIGINS` **after** you know your Vercel URL (Step 3). You can update it later.

### Step 2c — Get your HF Space URL

Once the Space is running (green status), your backend URL is:
```
https://<username>-<space-name>.hf.space
```
e.g. `https://hardik-suraksha-backend.hf.space`

Test it:
```
https://hardik-suraksha-backend.hf.space/health
```
Should return: `{"status":"ok","version":"4.0.0","database":"connected"}`

---

## Step 3 — Deploy Frontend to Vercel

### Option A — Via Vercel CLI (recommended)

```bash
cd c:\Users\hardi\Desktop\new\suraksha-my-work

# Install Vercel CLI if not already
npm i -g vercel

vercel login
vercel --prod
```

When prompted:
- **Root directory**: `.` (project root — Vercel reads `vercel.json`)
- **Build command**: auto-detected from `vercel.json` ✅
- **Output directory**: auto-detected ✅

### Option B — Via Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo (`Pranavkale11/suraksha-my-work`)
3. **Framework Preset**: Other
4. **Root Directory**: `.`
5. Vercel reads `vercel.json` automatically — build command and output dir are set

### Step 3b — Set Environment Variable in Vercel

In Vercel Dashboard → your project → **Settings** → **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://<username>-<space-name>.hf.space` |

> This is the HuggingFace Space URL from Step 2c.

Then **redeploy** (Vercel → Deployments → Redeploy) so the env var is baked into the build.

---

## Step 4 — Update CORS on HuggingFace

Now that you have the Vercel URL (e.g. `https://suraksha.vercel.app`), go back to your HF Space:

**Settings** → **Repository secrets** → Update `BACKEND_CORS_ORIGINS`:
```json
["https://suraksha.vercel.app","http://localhost:5173"]
```

Then restart the Space (Settings → Restart).

---

## Step 5 — Verify End-to-End

```bash
# 1. Backend health check
curl https://<username>-<space-name>.hf.space/health
# Expected: {"status":"ok","database":"connected"}

# 2. Frontend loads
open https://your-app.vercel.app

# 3. Try login / register a user in the UI
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| HF build fails on `sentence-transformers` | Wait — it downloads ~1.5 GB model on first build |
| CORS error in browser | Check `BACKEND_CORS_ORIGINS` on HF matches Vercel URL exactly |
| `{"database":"disconnected"}` | Check `MONGODB_URI` secret on HF, ensure Atlas IP whitelist allows `0.0.0.0/0` |
| Vercel build fails | Run `cd frontend && npm run build` locally first to catch errors |
| 401 on all API calls | `JWT_SECRET` mismatch — ensure same value used at all times |

---

## MongoDB Atlas — Allow HuggingFace IPs

HuggingFace Spaces have dynamic IPs. In MongoDB Atlas:

1. **Network Access** → **Add IP Address**
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`)
3. Click **Confirm**

> This is acceptable for a hosted app. For strict security, use MongoDB Atlas private endpoints.
