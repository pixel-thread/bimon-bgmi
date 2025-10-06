'use client';

import { useState, useImperativeHandle, forwardRef, useEffect } from 'react';

export type LeaderboardEntry = { name: string; score: number };
export type LeaderboardHandle = { addScore: (s: number) => void };

const MAX_ENTRIES = 10;
const STORAGE_KEY = 'snake_leaderboard';

const Leaderboard = forwardRef<LeaderboardHandle, {}>((_, ref) => {
  const [list, setList] = useState<LeaderboardEntry[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pending, setPending] = useState<number | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setList(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }, [list]);

  useImperativeHandle(ref, () => ({
    addScore(score: number) {
      setPending(score);
      setShowPrompt(true);
    },
  }));

  const submit = () => {
    if (!pending || !name.trim()) return;
    const entry: LeaderboardEntry = { name: name.trim(), score: pending };
    const newList = [...list, entry].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);
    setList(newList);
    setShowPrompt(false);
    setPending(null);
    setName('');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
      <div className="bg-slate-800/80 border border-white/20 rounded-2xl p-6 w-80 shadow-2xl">
        <h3 className="text-white text-xl font-bold mb-2">Game Over!</h3>
        <p className="text-white/80 mb-4">Your score: <span className="text-green-400 font-bold">{pending}</span></p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          placeholder="Enter your name"
          maxLength={12}
        />
        <div className="mt-4 flex gap-3">
          <button
            onClick={submit}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white py-2 rounded-lg font-semibold transition transform hover:scale-105"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowPrompt(false);
              setPending(null);
              setName('');
            }}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg transition"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
});

Leaderboard.displayName = 'Leaderboard';
export default Leaderboard;