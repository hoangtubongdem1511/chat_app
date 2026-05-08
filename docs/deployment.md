# Deployment (Azure App Service + Vercel)

This repo deploys with GitHub Actions:
- **Backend** (`backend/`): Azure App Service (Linux, Node)
- **Frontend** (`frontend/`): Vercel (production)

The workflow is in `.github/workflows/ci-cd.yml` and runs on `push` to `main`.

## 1) Backend: Azure App Service (OIDC from GitHub Actions)

### Create the Web App
Create an **Azure App Service** (Linux) for Node.js.

Recommended configuration:
- Runtime: **Node 20 LTS**
- App Service Plan: Basic or higher (WebSockets / Socket.io reliability improves with non-free SKUs)

### Configure App Service build & start
In the Web App **Configuration**:
- **Application settings**:
  - `SCM_DO_BUILD_DURING_DEPLOYMENT=true` (lets Oryx build on deploy)
  - `NODE_ENV=production`
- **General settings**:
  - **Startup Command**: `npm run start`

### Create an Azure AD app + federated credentials (OIDC)
GitHub Actions authenticates via OIDC (no publish profile).

High-level steps:
1. Create an **App Registration** in Azure AD.
2. Create a **Service Principal** for it (or use the app directly) and assign it permissions:
   - Scope: at least the Resource Group containing the Web App
   - Role: `Contributor` (or narrower if you prefer)
3. Add a **Federated Credential** to the App Registration for your GitHub repo and branch:
   - Subject typically matches: `repo:<OWNER>/<REPO>:ref:refs/heads/main`

### GitHub secrets required
Add these **GitHub repository secrets** (Settings → Secrets and variables → Actions):
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_WEBAPP_NAME`

## 2) Frontend: Vercel (deploy via Vercel CLI)

### Create/import the Vercel project
Import the GitHub repo into Vercel and set:
- **Root Directory**: `frontend/`

### GitHub secrets required
Add these GitHub repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You can find `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` in Vercel Project Settings.

## 3) Production environment variables

### Critical cross-service requirement: shared `JWT_SECRET`
Backend signs JWTs; frontend middleware verifies them. **Use the same `JWT_SECRET` value in both places**.

### Azure App Service (backend) env vars
Set these in Azure Web App → Configuration → Application settings:
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL` (your Vercel production URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (e.g. `https://<azure-app>.azurewebsites.net/auth/google/callback`)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (e.g. `https://<azure-app>.azurewebsites.net/auth/github/callback`)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

### Vercel (frontend) env vars
Set these in Vercel Project Settings → Environment Variables (Production):
- `NEXT_PUBLIC_API_URL` = `https://<azure-app>.azurewebsites.net`
- `JWT_SECRET` (same as backend)
- `NEXTAUTH_URL` = `https://<your-vercel-domain>`
- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_URL`

## 4) OAuth callback URLs
Update your Google/GitHub OAuth apps to use the **Azure** callback URLs:
- `https://<azure-app>.azurewebsites.net/auth/google/callback`
- `https://<azure-app>.azurewebsites.net/auth/github/callback`

The backend then redirects users to:
- `https://<vercel-domain>/auth/callback`

