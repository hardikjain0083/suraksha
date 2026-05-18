# Deployment Guide

This guide provides instructions for deploying SuRaksha MAPS to production platforms like Vercel (Frontend) and Railway (Backend).

## 1. Backend Deployment (Railway)

We recommend Railway for deploying the FastAPI backend because it supports Docker and native Python environments out of the box.

### Prerequisites
- A GitHub repository with your code.
- A Railway account (https://railway.app/).
- A MongoDB Atlas cluster.

### Steps
1. **Create a new Project on Railway**: Select "Deploy from GitHub repo".
2. **Select the repository**: Choose your `suraksha-maps-v4` repository.
3. **Configure the Root Directory**:
   - Go to the project settings in Railway.
   - Set the Root Directory to `/backend`.
4. **Environment Variables**:
   Add the following variables in the Railway dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A strong, randomly generated string.
   - `ENVIRONMENT`: `production`
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend-url.vercel.app"]`
5. **Build Configuration**:
   The repository already includes a `railway.toml` file in the root which sets the build and start commands. Railway will automatically detect this and deploy the application.
6. **Deploy**: Railway will automatically build and deploy. Note your backend URL (e.g., `https://backend-production.up.railway.app`).

## 2. Frontend Deployment (Vercel)

Vercel is an excellent platform for Vite/React applications.

### Prerequisites
- A Vercel account (https://vercel.com/).

### Steps
1. **Create a new Project on Vercel**: Import your `suraksha-maps-v4` repository.
2. **Framework Preset**: Vercel should automatically detect "Vite".
3. **Root Directory**: Set the root directory to `frontend`.
4. **Environment Variables**:
   Add the following variables:
   - `VITE_API_URL`: The URL of your deployed Railway backend (e.g., `https://backend-production.up.railway.app`).
   - `VITE_DEMO_MODE`: `true` (if you want demo mode active).
5. **Deploy**: Click "Deploy". Vercel will build and host your application.

## 3. Post-Deployment
- Update your backend's `BACKEND_CORS_ORIGINS` on Railway to exactly match your generated Vercel URL.
- Test the application by registering a new user and uploading a file.
