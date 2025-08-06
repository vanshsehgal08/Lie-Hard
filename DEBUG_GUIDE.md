# Debug Guide for Room Joining Issues

## Current Issues
- WebSocket connection failing with 400 error
- "Room does not exist" error when trying to join
- Socket disconnection issues

## Debugging Steps

### 1. Test Backend Connection
Visit: `https://lie-hard-backend.vercel.app/api/test`

Expected response:
```json
{
  "status": "OK",
  "message": "Backend is working",
  "redis": "Connected" or "Using fallback",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Check Environment Variables
In your backend project settings, verify:
- `REDIS_URL` is set correctly
- `NEXT_PUBLIC_SOCKET_URL` is set to `https://lie-hard-backend.vercel.app`

### 3. Check Browser Console
Look for these logs:
- `SocketContext: Socket connected successfully`
- `SetGamePage: handleMakeRoom called`
- `SetGamePage: Emitting make-room`
- `Make room request by [playerName]`
- `Room created successfully: [roomId]`

### 4. Check Vercel Logs
In your backend project:
1. Go to **Deployments**
2. Click on latest deployment
3. Check **Functions** logs for:
   - Redis connection errors
   - Socket connection errors
   - Room creation/joining logs

### 5. Test Room Creation
1. Open browser console
2. Create a room
3. Look for success logs
4. Try to join the room with the same code

### 6. Common Issues & Solutions

#### Issue: WebSocket 400 Error
**Cause:** CORS or connection issues
**Solution:** Updated CORS configuration in backend

#### Issue: "Room does not exist"
**Cause:** Redis connection failing or room not being saved
**Solution:** 
- Check Redis connection
- Verify environment variables
- Check if fallback to in-memory is working

#### Issue: Socket disconnection
**Cause:** Serverless function timeout or Redis connection issues
**Solution:**
- Improved Redis connection handling
- Added fallback to in-memory storage

## Testing Commands

### Test Redis Connection
```bash
# Check if Redis URL is accessible
curl -I your_redis_url
```

### Test Backend Health
```bash
curl https://lie-hard-backend.vercel.app/health
```

### Test Room API
```bash
curl https://lie-hard-backend.vercel.app/api/test
```

## Expected Behavior After Fixes

1. **Room Creation:**
   - Click "Create Room" → Room created successfully
   - Room ID displayed and user redirected to game

2. **Room Joining:**
   - Enter room code → Successfully joined
   - No "Room does not exist" errors

3. **Persistence:**
   - Room stays active for 10+ seconds
   - Multiple players can join same room

## If Issues Persist

1. **Check Vercel Logs** for specific error messages
2. **Test with different browsers/devices**
3. **Verify environment variables are set correctly**
4. **Try creating a new room and immediately joining it** 