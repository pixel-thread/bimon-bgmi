import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Guides - PUBGMI Tournament Management",
  description:
    "Comprehensive guides for PUBG Mobile and BGMI tournament management, team strategies, and platform usage.",
};

const guides = [
  {
    title: "Getting Started with Tournament Management",
    description:
      "Learn the basics of setting up and managing PUBG Mobile tournaments on our platform.",
    topics: [
      "Creating your first tournament",
      "Setting up team registration",
      "Configuring scoring rules",
      "Managing tournament brackets",
    ],
    difficulty: "Beginner",
    readTime: "10 min",
  },
  {
    title: "Team Registration and Management",
    description:
      "Complete guide to team registration, player management, and roster changes.",
    topics: [
      "Team registration process",
      "Adding and removing players",
      "Managing substitutes",
      "Team verification requirements",
    ],
    difficulty: "Beginner",
    readTime: "8 min",
  },
  {
    title: "Understanding K/D Statistics",
    description:
      "Deep dive into kill/death ratio calculations and performance analytics.",
    topics: [
      "K/D ratio calculation methods",
      "Individual vs team statistics",
      "Performance tracking over time",
      "Using stats for team improvement",
    ],
    difficulty: "Intermediate",
    readTime: "12 min",
  },
  {
    title: "Tournament Formats and Rules",
    description:
      "Explore different tournament formats and how to configure rules for fair play.",
    topics: [
      "Single elimination tournaments",
      "Round-robin formats",
      "Swiss system tournaments",
      "Custom scoring systems",
    ],
    difficulty: "Intermediate",
    readTime: "15 min",
  },
  {
    title: "Advanced Analytics and Reporting",
    description:
      "Leverage advanced features for detailed tournament analysis and reporting.",
    topics: [
      "Real-time match tracking",
      "Performance heat maps",
      "Export tournament data",
      "Custom report generation",
    ],
    difficulty: "Advanced",
    readTime: "20 min",
  },
  {
    title: "Mobile Gaming Best Practices",
    description:
      "Tips and strategies for competitive PUBG Mobile and BGMI gameplay.",
    topics: [
      "Optimal device settings",
      "Network optimization",
      "Team communication strategies",
      "Practice routines for improvement",
    ],
    difficulty: "Intermediate",
    readTime: "18 min",
  },
];

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "Beginner":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "Intermediate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "Advanced":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Tournament Management Guides
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Comprehensive guides to help you master PUBG Mobile and BGMI
              tournament management, from basic setup to advanced analytics.
            </p>
          </div>

          {/* Guides Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => (
              <div
                key={guide.title}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Guide Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                        guide.difficulty
                      )}`}
                    >
                      {guide.difficulty}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {guide.readTime}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {guide.description}
                  </p>
                </div>

                {/* Topics List */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    What you'll learn:
                  </h4>
                  <ul className="space-y-1">
                    {guide.topics.map((topic) => (
                      <li
                        key={topic}
                        className="text-sm text-slate-600 dark:text-slate-400 flex items-start"
                      >
                        <span className="text-indigo-500 mr-2">•</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Read Guide Button */}
                <Link
                  href="/contact"
                  className="w-full inline-block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Request Guide Access
                </Link>
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-8">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
                Need personalized help?
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Our guides don't cover what you need? Get in touch with our
                support team for personalized assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
