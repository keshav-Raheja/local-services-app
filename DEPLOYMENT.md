# Deployment Guide - Local Services App

## Backend Deployment (Render)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Grant access to your GitHub account

### Step 2: Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Select **"Deploy an existing Git repository"**
3. Find and select `local-services-app` repository
4. Configure:
   - **Name**: `local-services-api`
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/server.js`
5. Click **"Advanced"** and set environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key
   - `ALLOWED_ORIGINS`: https://your-frontend-url.vercel.app (add after deploying frontend)
   - `PORT`: 5000

6. Click **"Create Web Service"**
7. Wait for deployment (2-3 minutes)
8. Copy the deployed URL (e.g., `https://local-services-api.onrender.com`)

### Step 3: Update Backend Code (Optional)
After frontend deployment, update `backend/.env` with the frontend URL:
```
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,http://localhost:3000
```

---

## Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Grant access to your GitHub account

### Step 2: Deploy Frontend
1. Click **"Add New..."** → **"Project"**
2. Select `local-services-app` repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: `.next`

4. Click **"Add Environment Variables"**:
   - `NEXT_PUBLIC_API_URL`: Set to your Render backend URL (e.g., `https://local-services-api.onrender.com/api`)

5. Click **"Deploy"**
6. Wait for deployment (2-3 minutes)
7. Copy your Vercel URL (e.g., `https://your-app-name.vercel.app`)

### Step 3: Update Backend CORS
Go back to Render dashboard:
1. Click on `local-services-api` service
2. Go to **Settings** → **Environment**
3. Update `ALLOWED_ORIGINS`: Add your Vercel URL
4. Click **"Save"** - service will redeploy automatically

---

## Verify Deployment

1. Visit your Vercel frontend URL
2. Try signing up, creating a booking, or any API action
3. If you see errors, check:
   - Browser console (F12) for frontend errors
   - Render logs: Dashboard → Service → Logs for backend errors

---

## Optional: Custom Domain

**Frontend (Vercel)**:
- Go to Project Settings → Domains
- Add your domain
- Follow the DNS instructions

**Backend (Render)**:
- Go to Service Settings → Domains  
- Add your domain
- Update `ALLOWED_ORIGINS` in environment variables

---

## Troubleshooting

### CORS Errors
- Make sure `ALLOWED_ORIGINS` includes your Vercel frontend URL
- Check `NEXT_PUBLIC_API_URL` in Vercel environment variables

### MongoDB Connection Issues
- Verify `MONGO_URI` is correct
- Check MongoDB Atlas allows Render's IP (set Network Access to 0.0.0.0)

### Build Failures
- Check Render/Vercel logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation: `cd backend && npm run build` locally

---

## Performance Tips
1. Add database indexes for frequently queried fields
2. Implement pagination for list endpoints
3. Use caching headers for static assets
4. Monitor costs on Render and Vercel dashboards
