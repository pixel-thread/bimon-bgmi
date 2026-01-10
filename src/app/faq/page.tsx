"use client";

import { useState } from "react";
import Link from "next/link";

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
          question: "How do I join a tournament?",
          answer:
            "Create an account, add UC balance, then vote 'IN' on upcoming tournaments. Once voting closes, teams are formed and you're ready to play!",
        },
        {
          question: "What do I need to participate?",
          answer:
            "You need a PUBG Mobile or BGMI account, UC balance for entry fees, and access to our WhatsApp group for room details.",
        },
        {
          question: "How much does it cost to join?",
          answer:
            "Entry fees vary per tournament (typically ₹30-50). The fee is deducted from your UC balance when you participate.",
        },
      ],
    },
    {
      category: "Teams & Voting",
      questions: [
        {
          question: "How are teams formed?",
          answer:
            "Teams are formed randomly to balance skill levels. Pros get paired with newer players for fair matches. You can also form your own team with friends.",
        },
        {
          question: "What are the voting options (IN, OUT, SOLO)?",
          answer:
            "IN = Join with a random team. SOLO = Play solo (20% tax on winnings). OUT = Skip this tournament.",
        },
        {
          question: "Can I pick my own teammates?",
          answer:
            "Yes! You can form custom teams with friends instead of random pairing. Contact admins to set this up.",
        },
        {
          question: "What team modes are available?",
          answer:
            "Solo (1 player), Duo (2 players), Trio (3 players), or Squad (4 players) depending on the tournament.",
        },
      ],
    },
    {
      category: "UC & Prizes",
      questions: [
        {
          question: "How do I add UC balance?",
          answer:
            "Contact admins to add UC balance to your account. Balance is used for entry fees and you receive winnings as UC.",
        },
        {
          question: "How are prizes distributed?",
          answer:
            "Entry fees form the prize pool. 1st, 2nd, and 3rd place teams win UC prizes based on the pool size.",
        },
        {
          question: "What is Solo Tax?",
          answer:
            "If you vote SOLO, 20% of your winnings is taxed. 60% goes to players who lost the most this season, 40% goes to the next tournament's bonus pool.",
        },
        {
          question: "What is Repeat Winner Tax?",
          answer:
            "If you win multiple tournaments in a row (2+ wins in last 6 tournaments), you pay 10-30% tax to ensure fair distribution.",
        },
      ],
    },
    {
      category: "Matches & Rules",
      questions: [
        {
          question: "How do I get room ID and password?",
          answer:
            "Room details are shared in our WhatsApp groups before each match. Make sure you're in the group!",
        },
        {
          question: "What happens if I disconnect during a match?",
          answer:
            "Rejoin if possible. Your stats (kills) still count. Contact admins if you have connection issues.",
        },
        {
          question: "How are scores calculated?",
          answer:
            "Scores are based on team placement and individual kills. Check the leaderboard for real-time standings.",
        },
      ],
    },
    {
      category: "Account & Support",
      questions: [
        {
          question: "How do I check my stats?",
          answer:
            "Go to your profile to see your K/D ratio, wins, tournament history, and UC balance.",
        },
        {
          question: "How do I report an issue?",
          answer:
            "Contact admins through WhatsApp or use the Contact page. Include screenshots if possible.",
        },
        {
          question: "Is my data secure?",
          answer:
            "Yes. Your personal data is encrypted and only used for tournament participation. We never share it without consent.",
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
            Find answers about joining tournaments, teams, UC prizes, and more.
          </p>
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

        {/* Contact Section */}
        <div className="mt-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Can&apos;t find what you&apos;re looking for? Reach out to us!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Contact Us
            </Link>
            <Link
              href="/tournament/rules"
              className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
            >
              View Rules
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
