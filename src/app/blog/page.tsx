import { HorizontalAd } from "@/src/components/ads";

export default function BlogPage() {
  const blogPosts = [
    {
      title: "PUBG Mobile Tournament Strategies: Mastering the Battle Royale",
      excerpt:
        "Learn advanced strategies for dominating PUBG Mobile tournaments, from early game positioning to final circle tactics.",
      date: "December 15, 2024",
      category: "Strategy",
    },
    {
      title: "Understanding K/D Ratios in Competitive BGMI",
      excerpt:
        "Deep dive into kill/death ratio calculations and how they impact tournament scoring in professional BGMI competitions.",
      date: "December 10, 2024",
      category: "Analytics",
    },
    {
      title: "Building the Perfect PUBG Mobile Tournament Team",
      excerpt:
        "Essential tips for forming a competitive team, role assignments, and communication strategies for tournament success.",
      date: "December 5, 2024",
      category: "Team Building",
    },
    {
      title: "Tournament Format Guide: Classic vs Custom Matches",
      excerpt:
        "Comprehensive comparison of different tournament formats and which works best for various competition types.",
      date: "November 28, 2024",
      category: "Tournament Management",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-200 mb-6">
            PUBGMI Tournament Blog
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Expert insights, strategies, and guides for PUBG Mobile and BGMI
            tournament management and competitive gaming.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {blogPosts.map((post, index) => (
            <article
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-sm font-medium rounded-full">
                    {post.category}
                  </span>
                  <time className="text-sm text-slate-500 dark:text-slate-400">
                    {post.date}
                  </time>
                </div>

                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <button className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
                  Read More →
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Ad Placement - After Blog Posts */}
        <div className="mt-12 mb-8">
          <HorizontalAd />
        </div>

        <div className="text-center mt-16">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Stay Updated
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Get the latest tournament strategies, platform updates, and
              competitive gaming insights delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
