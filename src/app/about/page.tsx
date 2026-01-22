"use client";

import {
  FiUsers,
  FiAward,
  FiTarget,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import { Shuffle } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            About PUBGMI Tournament
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            A community-driven tournament platform for PUBG Mobile and BGMI
            players who love fair competition and exciting matches.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <FiAward className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Our Community
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-4xl mx-auto leading-relaxed">
            We bring together PUBG Mobile and BGMI players for regular
            tournaments with fair team balancing. Whether you&apos;re a pro or just
            starting out, our random team pairing ensures everyone gets a
            chance to compete, learn, and have fun together.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <Shuffle className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Fair Team Pairing
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Random team formation mixes skill levels, giving everyone a fair
              chance. Or team up with friends for custom squads.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiTarget className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Stats Tracking
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Track your kills, K/D ratio, and tournament performance over
              time. See how you improve with each match.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiUsers className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Community Voting
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Vote to participate in tournaments. Your vote determines if
              you&apos;re in, and how teams are formed.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiShield className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Fair Play System
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Solo Tax and Repeat Winner Tax ensure fair prize distribution
              and discourage gaming the system.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiSmartphone className="h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Mobile First
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Designed for mobile gamers. Check stats, vote, and track
              tournaments from your phone.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiAward className="h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              UC Prizes
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Win UC (virtual in-game currency) prizes in tournaments. Entry fees
              form the prize pool for top teams. This is skill-based competition,
              not gambling.
            </p>
          </div>
        </div>

        {/* Team Modes Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">
              Tournament Modes
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              We run tournaments in different formats based on player count
              and community preference.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl mb-2">👤</div>
                <h3 className="font-semibold">Solo</h3>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-semibold">Duo</h3>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl mb-2">👥👤</div>
                <h3 className="font-semibold">Trio</h3>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl mb-2">👥👥</div>
                <h3 className="font-semibold">Squad</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Ready to Join?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Check out the current tournament or vote on the next one!
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
