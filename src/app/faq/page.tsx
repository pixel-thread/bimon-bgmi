"use client";

import { useState } from "react";
import { HorizontalAd } from "@/src/components/ads";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create a tournament on the PUBGMI platform?",
          answer:
            "To create a tournament, you need admin access to the platform. Contact our support team to set up your tournament with custom rules, team limits, and scoring systems.",
        },
        {
          question: "What are the system requirements for participants?",
          answer:
            "Participants need a stable internet connection, PUBG Mobile or BGMI installed, and access to our web platform. It works on all modern browsers and devices.",
        },
        {
          question: "How many players can participate in a tournament?",
          answer:
            "Our platform supports tournaments from 16 teams (64 players) up to 100+ teams (400+ players), depending on your configuration.",
        },
      ],
    },
    {
      category: "Tournament Rules & Scoring",
      questions: [
        {
          question: "How is the K/D ratio calculated?",
          answer:
            "K/D ratio = total kills ÷ total deaths. Stats are tracked per player and updated in real time during matches.",
        },
        {
          question: "What happens if a player disconnects during a match?",
          answer:
            "If a player disconnects, they can rejoin if the game allows. Missed eliminations still count. Organizers may review cases individually.",
        },
        {
          question: "How are team rankings determined?",
          answer:
            "Team rankings use placement points + elimination points. The scoring system can be customized per tournament.",
        },
        {
          question: "Can tournament rules be customized?",
          answer:
            "Yes, organizers can customize match duration, zone settings, weapons, team sizes, and scoring systems.",
        },
      ],
    },
    {
      category: "Team Management",
      questions: [
        {
          question: "How do I register my team for a tournament?",
          answer:
            "Team captains register through the platform by entering team details and confirming all members. Substitutes can also be added if allowed.",
        },
        {
          question: "Can I change team members after registration?",
          answer:
            "Roster changes are allowed before the tournament starts (depending on rules). After it begins, changes are usually restricted.",
        },
        {
          question: "What info is required for registration?",
          answer:
            "You’ll need team name, captain contact, IGN for each player, and any IDs/screenshots requested by the organizer.",
        },
      ],
    },
    {
      category: "Technical Support",
      questions: [
        {
          question:
            "What should I do if I encounter technical issues during a tournament?",
          answer:
            "Contact support immediately and provide screenshots if possible. Organizers can review match data and apply adjustments.",
        },
        {
          question: "How do I report cheating or rule violations?",
          answer:
            "Use the reporting system or contact organizers directly with evidence. Reports are reviewed and acted on promptly.",
        },
        {
          question: "Is my personal data secure?",
          answer:
            "Yes. All personal data is encrypted, securely stored, and only used for tournament participation. It is never shared without consent.",
        },
      ],
    },
    {
      category: "Platform Features",
      questions: [
        {
          question: "Can I view live tournament statistics?",
          answer:
            "Yes, live stats include kills, rankings, and match results. They’re updated automatically for players and spectators.",
        },
        {
          question: "How do I access my tournament history?",
          answer:
            "Your full tournament history is available in your player profile, including stats, teams, and past performances.",
        },
        {
          question: "Can spectators follow the tournament?",
          answer:
            "Yes. Public tournaments allow spectators to follow live scores, and many include live streaming integration.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our PUBG Mobile and BGMI
            tournament management platform.
          </p>
        </div>

        {/* Ad Placement - After Header */}
        <div className="mb-12">
          <HorizontalAd />
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 pb-2 border-b-2 border-indigo-600">
                {category.category}
              </h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const globalIndex = categoryIndex * 100 + questionIndex;
                  const isOpen = openItems.includes(globalIndex);

                  return (
                    <div
                      key={questionIndex}
                      className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 pr-4">
                          {faq.question}
                        </h3>
                        <svg
                          className={`w-5 h-5 text-slate-500 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                            }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-4">
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Ad Placement - Before Contact */}
        <div className="mt-12">
          <HorizontalAd />
        </div>

        {/* Contact Section */}
        <div className="mt-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Can't find the answer you're looking for? Our support team is here
            to help with tournament management, technical issues, or platform
            features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Contact Support
            </a>
            <a
              href="/community"
              className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              Join Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
