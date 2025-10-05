"use client";

import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
              PUBGMI Tournament
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Professional tournament management platform for PUBG Mobile and
              BGMI esports competitions.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/about"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/tournament"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  View Tournament
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Team Management</li>
              <li>K/D Tracking</li>
              <li>Real-time Analytics</li>
              <li>Tournament Scoring</li>
              <li>Player Statistics</li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Legal & Support
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>
                <Link
                  href="/contact"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              © 2024 PUBGMI Tournament Platform. Built for the mobile gaming
              community.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 md:mt-0">
              Not affiliated with PUBG Mobile or BGMI. Independent tournament
              management service.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
