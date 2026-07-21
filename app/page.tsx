"use client";

import Link from "next/link";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

export default function Home() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Grabs screen size and updates if the phone is rotated
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-pink-50 p-6 md:p-24 overflow-hidden relative">
      
      {windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          colors={['#ffb6c1', '#ff69b4', '#ff1493', '#c71585']}
          gravity={0.05}
        />
      )}

      <div className="z-10 flex flex-col items-center gap-8 md:gap-10 w-full max-w-5xl px-4">
        {/* Text scales from 4xl on phones up to 7xl on desktop */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-pink-600 text-center drop-shadow-sm leading-tight">
          Happy 1st Monthsary<br className="block md:hidden" /> Season 2! 💖
        </h1>
        
        <Link href="/photobooth">
          <button className="px-6 py-4 md:px-8 md:py-4 bg-pink-500 text-white rounded-full font-bold text-xl md:text-2xl hover:bg-pink-600 transition-all shadow-lg hover:scale-105 active:scale-95 text-center w-full max-w-xs md:max-w-md">
            You wanna see your gift? 🎁
          </button>
        </Link>
      </div>
    </main>
  );
}
