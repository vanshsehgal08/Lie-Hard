import express from "express";
import cors from "cors";
import { PORT, SELF_URL } from "./config.js";
import { registerRoutes } from "./routes.js";

const allowedOrigins = [
  "http://localhost:3000", // dev frontend
  "https://lie-hard.vercel.app", // deployed frontend
  "https://wit-link.vercel.app", // old frontend (keeping for backward compatibility)
];

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

registerRoutes(app);

// For Vercel serverless, we don't need to listen on a port
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

// Self pinging for health check (only in production)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    fetch(SELF_URL)
      .then((res) => {
        if (res.ok) {
          console.log(`Self-ping at ${new Date()}`);
        } else {
          console.error(`Self-ping failed with status ${res.status}`);
        }
      })
      .catch((err) => {
        console.error(`Self-ping error:`, err.message);
      });
  }, 13 * 60 * 1000);
}

// Export for Vercel
export default app;
