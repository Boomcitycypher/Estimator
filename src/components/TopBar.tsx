'use client';
import Link from 'next/link';

export default function TopBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14"
      style={{ backgroundColor: '#0e1a2b' }}
    >
      <Link href="/" className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: '#c8501a' }}
        >
          R&G
        </div>
        <span className="text-white font-bold text-lg tracking-wide">R&amp;G IMPORTS</span>
      </Link>
      <span className="text-gray-400 text-xs">Barbados</span>
    </header>
  );
}
