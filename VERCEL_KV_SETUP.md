# Vercel KV Setup for Lie Hard Game

## Problem
Vercel serverless functions are stateless and don't maintain in-memory data between requests. This causes rooms to disappear after 5-10 seconds.

## Solution: Vercel KV (Redis)

### Step 1: Install Vercel KV
1. Go to your Vercel dashboard
2. Select your **backend project** (`lie-hard-backend`)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis)
6. Choose a name (e.g., `lie-hard-kv`)
7. Select a region close to your users
8. Click **Create**

### Step 2: Get Connection Details
1. After creating the KV database, go to **Settings**
2. Copy the connection details:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### Step 3: Set Environment Variables
In your **backend project** settings, add these environment variables:
```
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

### Step 4: Deploy
1. Push your changes to GitHub
2. Vercel will automatically redeploy with the new KV storage

## How It Works

### Development (Local)
- Uses in-memory storage (Map)
- No external dependencies
- Fast and simple

### Production (Vercel)
- Uses Vercel KV (Redis)
- Persistent storage across serverless function instances
- Automatic fallback to in-memory if KV is not available

## Benefits
- ✅ Rooms persist across serverless function restarts
- ✅ Multiple players can join and stay connected
- ✅ No more "Room doesn't exist" errors
- ✅ Automatic cleanup after 1 hour (configurable)

## Testing
After deployment:
1. Create a room
2. Join with multiple devices
3. Wait 10+ seconds
4. Room should still exist and be accessible

## Troubleshooting
- If KV is not set up, the app will fall back to in-memory storage (development mode)
- Check Vercel logs for any KV connection errors
- Ensure all environment variables are set correctly 