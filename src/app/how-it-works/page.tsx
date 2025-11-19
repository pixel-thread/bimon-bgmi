"use client";

import {
  FiUsers,
  FiTarget,
  FiAward,
  FiBarChart,
  FiCheckCircle,
} from "react-icons/fi";
import { GamepadIcon } from "lucide-react";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            How PUBGMI Tournaments Work
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Learn how our platform makes organizing and participating in PUBG
            Mobile and BGMI tournaments simple, fair, and engaging for everyone
            involved.
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
                <FiUsers className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                1. Team Registration
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Teams register with up to 4 players each. Players create
                accounts and join their teams through our secure registration
                system.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <GamepadIcon className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                2. Match Play
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Teams compete in PUBG Mobile or BGMI matches. Each match follows
                standard battle royale format with placement and elimination
                scoring.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiTarget className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                3. Score Tracking
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Administrators input match results including team placement and
                individual player kills. Scores are calculated automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <FiAward className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
                4. Results & Winners
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Live leaderboards show real-time standings. Winners are
                announced with comprehensive statistics and performance
                analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring System */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-8">
            PUBG/BGMI Scoring System
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Placement Points
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Teams earn points based on their final placement in each match.
                Higher placements (like Chicken Dinner - 1st place) earn more
                points than lower placements.
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Example Placement Points:
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• 1st Place (Winner Winner): 15 points</li>
                  <li>• 2nd Place: 12 points</li>
                  <li>• 3rd Place: 10 points</li>
                  <li>• 4th-6th Place: 8 points</li>
                  <li>• 7th-10th Place: 5 points</li>
                  <li>• 11th+ Place: 2 points</li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Elimination Points
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Each player elimination (kill) earns points for the team.
                Individual player kills are tracked separately and contribute to
                both team scores and personal statistics.
              </p>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
                  Kill Point System:
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• Each elimination: 1 point</li>
                  <li>• Individual tracking per player</li>
                  <li>• Team total = sum of all player kills</li>
                  <li>• K/D ratio calculated automatically</li>
                  <li>• 1 death per match (PUBG standard)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* User Roles */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-12">
            User Roles & Permissions
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="bg-red-100 dark:bg-red-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 text-center">
                Super Admin
              </h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-2">
                <li>• Full system access and control</li>
                <li>• Add/remove team administrators</li>
                <li>• Configure tournament settings</li>
                <li>• Access all analytics and reports</li>
                <li>• Manage user permissions</li>
                <li>• System configuration and maintenance</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiBarChart className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 text-center">
                Team Admin
              </h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-2">
                <li>• Edit team scores and match results</li>
                <li>• Input individual player kills</li>
                <li>• View player statistics and balances</li>
                <li>• Participate in tournament voting</li>
                <li>• Access tournament management tools</li>
                <li>• Help with match administration</li>
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
              <div className="bg-green-100 dark:bg-green-900 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <FiUsers className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3 text-center">
                Players
              </h3>
              <ul className="text-slate-600 dark:text-slate-400 space-y-2">
                <li>• View tournament standings and results</li>
                <li>• Check personal statistics and K/D</li>
                <li>• See team performance and rankings</li>
                <li>• Participate in community voting</li>
                <li>• Access match history and analytics</li>
                <li>• View tournament rules and schedules</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Features Breakdown */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Platform Features
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">
                For Tournament Organizers
              </h3>
              <ul className="space-y-2">
                <li>• Real-time match result entry</li>
                <li>• Automated score calculations</li>
                <li>• Comprehensive player analytics</li>
                <li>• Team performance tracking</li>
                <li>• Voting and poll management</li>
                <li>• Winner announcement system</li>
                <li>• Mobile-responsive admin panel</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">
                For Players & Teams
              </h3>
              <ul className="space-y-2">
                <li>• Live tournament leaderboards</li>
                <li>• Individual K/D ratio tracking</li>
                <li>• Match history and statistics</li>
                <li>• Team standings and rankings</li>
                <li>• Community voting participation</li>
                <li>• Performance analytics dashboard</li>
                <li>• Mobile-optimized viewing experience</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 text-center mb-8">
            Getting Started
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                For Tournament Organizers
              </h3>
              <ol className="text-slate-600 dark:text-slate-400 space-y-3">
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    1
                  </span>
                  <span>
                    Contact us to set up your tournament and get super admin
                    access
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    2
                  </span>
                  <span>
                    Configure tournament settings and add team administrators
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    3
                  </span>
                  <span>Set up teams and player registrations</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    4
                  </span>
                  <span>Start your tournament and begin tracking matches</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                For Players & Teams
              </h3>
              <ol className="text-slate-600 dark:text-slate-400 space-y-3">
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    1
                  </span>
                  <span>Register for the tournament through the organizer</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    2
                  </span>
                  <span>Create your player account and join your team</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    3
                  </span>
                  <span>Check tournament rules and match schedules</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                    4
                  </span>
                  <span>Compete in matches and track your performance</span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Ready to Experience Professional Tournament Management?
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            See our platform in action by viewing current tournaments or learn
            more about organizing your own event.
          </p>
          <div className="space-x-4">
            <Link
              href="/tournament"
              className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Live Tournament
            </Link>
            <Link
              href="/about"
              className="inline-block px-8 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
