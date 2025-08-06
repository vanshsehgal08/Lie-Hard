import { Inter, Poppins, Orbitron } from "next/font/google";

import "./globals.css";
import { SocketProvider } from "@/contexts/SocketContext";
import { Toaster } from "sonner";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: 'swap',
});

const orbitron = Orbitron({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: 'swap',
});

export const metadata = {
  title: "Lie Hard - Premium Social Bluffing Game",
  description: "Experience the ultimate social bluffing game with premium graphics and real-time multiplayer action.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable} ${orbitron.variable}`}>
      <body className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900`}>
        <SocketProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster 
            richColors 
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              },
            }}
          />
        </SocketProvider>
      </body>
    </html>
  );
}
