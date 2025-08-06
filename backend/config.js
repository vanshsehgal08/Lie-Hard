import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 3001;
export const SELF_URL = process.env.SELF_URL || "https://lie-hard.onrender.com/health";
export const LOCAL_URL = `http://localhost:${PORT}/health`;

import { GoogleGenAI } from "@google/genai";
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
