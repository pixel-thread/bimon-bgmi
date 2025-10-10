"use client";

import {
  FiUsers,
  FiAward,
  FiTarget,
  FiBarChart,
  FiShield,
  FiSmartphone,
} from "react-icons/fi";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            About PUBGMI Tournament System
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The premier tournament management platform designed specifically for
            PUBG Mobile and BGMI esports competitions.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <FiAward className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Our Mission
            </h2>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-4xl mx-auto leading-relaxed">
            We empower tournament organizers and gaming communities to run
            professional-quality PUBG Mobile and BGMI tournaments with
            comprehensive statistics tracking, real-time scoring, and engaging
            participant experiences. Our platform bridges the gap between casual
            gaming and competitive esports by providing the tools needed for
            fair, transparent, and exciting tournament management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiUsers className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Team Management
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Organize teams with up to 4 players each, track registrations, and
              manage participant information with our intuitive team management
              system.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiTarget className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              K/D Tracking
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Advanced kill/death ratio tracking that follows PUBG/BGMI
              standards, with automatic death counting and individual player
              performance analytics.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiBarChart className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Real-time Analytics
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Live tournament standings, comprehensive statistics, and
              performance metrics that update in real-time as matches progress.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiShield className="h-12 w-12 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Secure Access Control
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Role-based permissions system with super admins, team
              administrators, and player accounts to ensure proper access
              control and data security.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiSmartphone className="h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Mobile Optimized
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Fully responsive design optimized for mobile devices, perfect for
              tournament participants who primarily game on mobile platforms.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <FiAward className="h-12 w-12 text-yellow-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Tournament Features
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Complete tournament management including voting systems, winner
              announcements, and community engagement features.
            </p>
          </div>
        </div>

        {/* PUBG/BGMI Specific Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white mb-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">
              Built for PUBG Mobile & BGMI
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Our platform is specifically designed for battle royale
              tournaments, understanding the unique scoring systems, team
              dynamics, and competitive formats of PUBG Mobile and BGMI esports.
            </p>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-xl font-semibold mb-3">
                  Tournament Scoring
                </h3>
                <ul className="space-y-2">
                  <li>• Placement points based on final team ranking</li>
                  <li>• Elimination points for each player kill</li>
                  <li>• Combined scoring for total tournament points</li>
                  <li>• Automatic K/D ratio calculations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Game Mechanics</h3>
                <ul className="space-y-2">
                  <li>• 1 death per match per player (PUBG standard)</li>
                  <li>• Individual player kill tracking</li>
                  <li>• Team-based competition format</li>
                  <li>• Match participation tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-8">
            Who We Serve
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Tournament Organizers
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Esports event organizers who need professional tools to manage
                PUBG Mobile and BGMI competitions with accurate scoring and
                comprehensive analytics.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiAward className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Gaming Communities
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                PUBG Mobile and BGMI gaming communities looking to organize
                competitive events and track player performance in a
                professional manner.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiTarget className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Competitive Players
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Serious PUBG Mobile and BGMI players who want to track their
                performance, participate in organized tournaments, and improve
                their competitive skills.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Ready to Organize Your Tournament?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Join the growing community of tournament organizers using our
            platform to run professional PUBG Mobile and BGMI competitions.
          </p>
          <div className="space-x-4">
            <Link
              href="/tournament"
              className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Tournament
            </Link>
            <Link
              href="/auth"
              className="inline-block px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
