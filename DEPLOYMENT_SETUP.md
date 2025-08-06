# Lie Hard Game - Deployment Setup

## Environment Variables Setup

### Frontend (.env.local)
Create a `.env.local` file in the `frontend` directory with:

```env
# For Production (Vercel)
NEXT_PUBLIC_SOCKET_URL=https://lie-hard-backend.vercel.app

# For Local Development
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Backend (.env)
Create a `.env` file in the `backend` directory with:

```env
# For Production (Vercel)
SELF_URL=https://lie-hard-backend.vercel.app/health
GEMINI_API_KEY=your_gemini_api_key_here

# For Local Development
# SELF_URL=http://localhost:3001/health
```

## Vercel Deployment

### Frontend (https://lie-hard.vercel.app)
1. Connect your GitHub repository to Vercel
2. Set the following environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SOCKET_URL`: `https://lie-hard-backend.vercel.app`

### Backend (https://lie-hard-backend.vercel.app)
1. Deploy the backend folder to Vercel
2. Set the following environment variables in Vercel dashboard:
   - `SELF_URL`: `https://lie-hard-backend.vercel.app/health`
   - `GEMINI_API_KEY`: Your Gemini API key

## Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm start
```

## Current Configuration

- **Frontend URL**: https://lie-hard.vercel.app
- **Backend URL**: https://lie-hard-backend.vercel.app
- **Socket Connection**: Automatically configured for both localhost and production

## Troubleshooting

1. **Socket Connection Issues**: Check that the `NEXT_PUBLIC_SOCKET_URL` is correctly set
2. **CORS Errors**: Backend is configured to allow both localhost:3000 and lie-hard.vercel.app
3. **Environment Variables**: Make sure to set them in Vercel dashboard for production 