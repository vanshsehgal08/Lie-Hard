# Vercel Socket.IO Debugging Guide

## Current Issues
- Socket.IO connection failing with "xhr poll error" and "xhr post error"
- Client-side exceptions on lie-hard.vercel.app
- Socket disconnection issues

## Root Cause
Vercel serverless functions have limitations with WebSocket connections. The solution is to use **polling only** instead of WebSocket upgrades.

## Changes Made

### 1. Backend Changes
- **Socket.IO Configuration**: Changed to use `transports: ["polling"]` only
- **Disabled WebSocket upgrades**: Set `allowUpgrades: false`
- **Updated Vercel config**: Added Socket.IO route handling

### 2. Frontend Changes
- **Socket.IO Configuration**: Changed to use `transports: ["polling"]` only
- **Disabled upgrades**: Set `upgrade: false`
- **Reduced reconnection attempts**: From Infinity to 5

## Testing Steps

### 1. Test Backend Health
```bash
curl https://lie-hard-backend.vercel.app/health
```

### 2. Test Socket.IO Endpoint
```bash
curl https://lie-hard-backend.vercel.app/api/socket-test
```

### 3. Test Redis Connection
```bash
curl https://lie-hard-backend.vercel.app/api/test
```

### 4. Browser Testing
1. Open browser console
2. Visit https://lie-hard.vercel.app
3. Enter a name and submit
4. Look for these logs:
   - `SocketContext: Socket connected successfully`
   - No more "xhr poll error" or "xhr post error"

## Expected Behavior After Fixes

### ✅ Working:
- Socket connection using polling
- Room creation and joining
- No more client-side exceptions
- Stable connection without disconnections

### ❌ Not Working (Expected):
- WebSocket upgrades (disabled for Vercel compatibility)
- Real-time WebSocket connections

## Alternative Solutions

If polling still doesn't work, consider:

### Option 1: Use a Different Backend
- Deploy backend to Railway, Render, or Heroku
- These platforms support WebSocket connections better

### Option 2: Use HTTP API Instead
- Replace Socket.IO with REST API calls
- Use polling for real-time updates

### Option 3: Use Vercel Edge Functions
- Deploy Socket.IO to Vercel Edge Functions
- Better WebSocket support

## Environment Variables to Verify

**Backend:**
```
REDIS_URL=redis://default:WTuZ3QXlBiKrTiUEyEg0i59i3ZBJOkZj@redis-11722.crce206.ap-south-1-1.ec2.redns.redis-cloud.com:11722
```

**Frontend:**
```
NEXT_PUBLIC_SOCKET_URL=https://lie-hard-backend.vercel.app
```

## Deployment Steps

1. **Push changes to GitHub**
2. **Vercel will auto-deploy**
3. **Test the connection**
4. **Check Vercel logs for any errors**

## Troubleshooting

### If still getting errors:
1. **Check Vercel logs** for specific error messages
2. **Verify environment variables** are set correctly
3. **Test with different browsers**
4. **Try clearing browser cache**

### If polling doesn't work:
1. **Consider moving backend to Railway/Render**
2. **Use HTTP API with polling instead**
3. **Implement server-sent events (SSE)**

## Performance Notes

- **Polling is slower** than WebSocket but more reliable on Vercel
- **Higher latency** but should work consistently
- **More HTTP requests** but acceptable for game use case 