# Minecraft AFK Bot Dashboard

A rich web-based dashboard and control panel for managing a Minecraft AFK bot using React, Express, Socket.io, and Mineflayer.

## Deploying to Render.com

You can deploy this application directly to Render.com in one of two ways.

### Option 1: Blueprints (Recommended)
This repository includes a `render.yaml` blueprint configuration file. 
1. Push this codebase to your GitHub or GitLab repository.
2. Log in to **Render.com** and go to **Blueprints**.
3. Click **New Blueprint Instance**.
4. Connect your GitHub/GitLab repository.
5. Render will automatically detect `render.yaml` and set up the Web Service with the correct commands and environment variables. Click **Apply**.

### Option 2: Manual Setup
If you prefer to configure it manually on the Render dashboard:
1. Log in to **Render.com** and click **New > Web Service**.
2. Connect your repository.
3. Configure the settings:
   - **Language/Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run server`
4. Add the following **Environment Variables** in the "Environment" tab:
   - `PORT`: `3000`
   - `NODE_ENV`: `production`

---

## ⚠️ Important note about Render's Free Instance Tier

Render's **Free Web Service** tier will spin down (go to sleep) after **15 minutes of inactivity** (when it receives no HTTP traffic). If the service spins down, **your Minecraft bot will disconnect**.

To keep the bot online 24/7 on Render:
1. **Set up an external pinging service:** Use a free uptime monitoring service like [UptimeRobot](https://uptimerobot.com/) or [Cron-Job.org](https://cron-job.org/) to ping your dashboard's URL (e.g. `https://your-app-name.onrender.com`) every 5 to 10 minutes. This keeps the service awake.
2. **Upgrade to a paid service:** Upgrade the service to Render's **Starter** (or higher) paid tier, which never sleeps.
