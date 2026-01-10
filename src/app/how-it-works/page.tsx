"use client";

import { FiUsers, FiShuffle, FiAward } from "react-icons/fi";
import { GamepadIcon, Vote } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            How Our Tournaments Work
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Join our community tournaments with fair team balancing, vote to participate,
            and compete for UC prizes!
          </p>
        </div>

        {/* Tournament Flow */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-12">
            Tournament Process
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Vote className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                1. Vote to Participate
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Vote &quot;IN&quot; to join the upcoming tournament. Entry fee is deducted
                from your UC balance when you participate.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiShuffle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                2. Team Formation
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Get randomly paired with other players (balanced skill mix) or
                form your own team with friends. Solo, Duo, Trio, or Squad modes.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <GamepadIcon className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                3. Match Play
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Compete in PUBG Mobile/BGMI matches. Room ID and password
                shared via our WhatsApp groups.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiAward className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                4. Results & Prizes
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Scores calculated automatically. Winners receive UC prizes.
                Live leaderboard shows real-time standings.
              </p>
            </div>
          </div>
        </div>

        {/* Team Modes */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-8">
            Team Modes
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
              <div className="text-3xl mb-2">👤</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Solo</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">1 Player</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Duo</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">2 Players</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
              <div className="text-3xl mb-2">👥👤</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Trio</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">3 Players</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
              <div className="text-3xl mb-2">👥👥</div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Squad</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">4 Players</p>
            </div>
          </div>
        </div>



        {/* Getting Started */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-8">
            Getting Started
          </h2>
          <div className="max-w-2xl mx-auto">
            <ol className="text-slate-600 dark:text-slate-400 space-y-4">
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5 shrink-0">
                  1
                </span>
                <span className="text-lg">Create your player account and set up your profile</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5 shrink-0">
                  2
                </span>
                <span className="text-lg">Add UC balance to participate in tournaments</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5 shrink-0">
                  3
                </span>
                <span className="text-lg">Vote &quot;IN&quot; on upcoming tournaments to join</span>
              </li>
              <li className="flex items-start">
                <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold mr-4 mt-0.5 shrink-0">
                  4
                </span>
                <span className="text-lg">Get your team, join the match, and compete for prizes!</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Ready to Join the Action?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Check out the current tournament standings or view upcoming matches!
          </p>
          <div className="space-x-4">
            <Link
              href="/tournament"
              className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Tournament
            </Link>
            <Link
              href="/tournament/vote"
              className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Vote Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
