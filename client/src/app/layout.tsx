import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/SocketContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { GameProvider } from "@/context/GameContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Nam Thar Thau Falful | Multiplayer Nepali Game",
  description: "Play the classic Nepali childhood game online with friends in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="min-h-screen flex flex-col bg-background text-text-primary">
        <SocketProvider>
          <PlayerProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </PlayerProvider>
        </SocketProvider>
      </body>
    </html>
  );
}
