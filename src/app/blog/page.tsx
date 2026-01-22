"use client";

import { useState } from "react";
import Link from "next/link";

// Full blog post data with complete articles
const blogPosts = [
  {
    id: "tournament-strategies",
    title: "PUBG Mobile Tournament Strategies: Mastering the Battle Royale",
    excerpt:
      "Learn advanced strategies for dominating PUBG Mobile tournaments, from early game positioning to final circle tactics.",
    date: "December 15, 2024",
    category: "Strategy",
    readTime: "8 min read",
    content: `
## Introduction

Competing in PUBG Mobile tournaments requires more than just good aim. Success comes from understanding the meta, positioning, and team coordination. This guide covers essential strategies that will help you climb the ranks in competitive play.

## Early Game Strategy

### Hot Drop vs Safe Landing

The decision between hot dropping and playing safe depends on your team's confidence and the tournament format:

- **Hot drops** are high-risk, high-reward. You'll either eliminate teams early or get eliminated yourself.
- **Safe landings** allow you to loot up and enter mid-game with full gear, but you may have fewer kills for points.

For point-based tournaments, a balanced approach works best. Land at medium-contested areas where you can secure decent loot and potentially get 1-2 early eliminations.

### Loot Priority

Focus on essentials first:
1. Level 2 or 3 vest and helmet
2. AR + DMR/Sniper combo
3. At least 150 rounds of ammo per weapon
4. Healing items (first aid kits, boosters)
5. Throwables (smokes are essential for rotations)

## Mid Game Positioning

### Zone Awareness

Always be aware of the next zone. Key principles:

- Move early to avoid getting caught in the blue
- Use vehicles when necessary, but abandon them before reaching populated areas
- Take compound positions on the edge of the safe zone

### Map Control

Control key areas that offer:
- High ground advantage
- Multiple exit routes
- Good cover for healing
- Line of sight to common rotation paths

## Late Game Execution

### Final Circles

The final circles are where tournaments are won or lost:

- **Communication is key** - Call out enemy positions constantly
- **Smoke usage** - Save smokes for final rotations
- **Trade kills** - If a teammate goes down, try to trade immediately
- **Patience** - Don't shoot unless you can secure the kill

### Point Calculation

Understand how points work in your tournament:
- Placement points often outweigh kill points
- Know when to play for placement vs. aggression
- A top 3 finish with 5 kills often beats 15 kills with early elimination

## Team Coordination

### Role Assignment

Every squad should have:
- **IGL (In-Game Leader)**: Makes rotation and engagement calls
- **Fragger**: Primary engagement, usually best aimer
- **Support**: Covers flanks, provides trades
- **Scout**: Gathers intel, marks enemies

### Communication

Use clear, concise callouts:
- Use compass directions (e.g., "Enemy 270")
- Call out damage dealt ("Cracked one at 180")
- Announce your movements ("I'm pushing left")

## Conclusion

Tournament success comes from preparation, practice, and teamwork. Focus on one aspect at a time, review your gameplay, and continuously improve. Good luck in your next tournament!
    `,
  },
  {
    id: "kd-ratios",
    title: "Understanding K/D Ratios in Competitive BGMI",
    excerpt:
      "Deep dive into kill/death ratio calculations and how they impact tournament scoring in professional BGMI competitions.",
    date: "December 10, 2024",
    category: "Analytics",
    readTime: "6 min read",
    content: `
## What is K/D Ratio?

K/D (Kill/Death) ratio is one of the most important statistics in competitive BGMI. It measures your effectiveness by dividing your total kills by your total deaths.

**Formula**: K/D Ratio = Total Kills ÷ Total Deaths

For example, if you have 150 kills and 50 deaths, your K/D ratio is 3.0.

## Why K/D Matters in Tournaments

### Skill Indicator

A high K/D ratio indicates:
- Good aim and gunplay mechanics
- Smart positioning and game sense
- Ability to survive while being aggressive
- Consistency across multiple matches

### Team Evaluation

Tournament organizers and teams use K/D to:
- Evaluate potential recruits
- Balance teams in random squad tournaments
- Track player improvement over time
- Identify star performers

## K/D Benchmarks

### Casual vs Competitive

| Player Type | K/D Range | Description |
|------------|-----------|-------------|
| Beginner | 0.5 - 1.0 | Still learning basics |
| Average | 1.0 - 1.5 | Comfortable with mechanics |
| Above Average | 1.5 - 2.5 | Skilled player |
| Competitive | 2.5 - 4.0 | Tournament-ready |
| Pro | 4.0+ | Elite level |

*Note: These benchmarks are for TDM/Arena. Classic mode K/D is typically lower.*

## Improving Your K/D

### Aim Training

- Spend 15-30 minutes daily in training mode
- Practice spray control with different weapons
- Work on quick-scoping and flick shots

### Positioning

- Take fights from advantageous positions
- Use cover effectively
- Avoid being caught in the open

### Game Sense

- Predict enemy rotations
- Know when to engage vs. disengage
- Use audio cues to track enemies

### Weapon Choice

Master meta weapons that suit your playstyle:
- **Close range**: M416, AKM, Groza
- **Mid range**: M416, DP-28, Beryl
- **Long range**: Mini14, SLR, AWM

## K/D in Our Platform

Our tournament platform automatically calculates K/D from match results:

- **Individual K/D**: Your personal performance
- **Team K/D**: Combined team performance
- **Tournament K/D**: Stats from a specific tournament
- **Season K/D**: Cumulative stats for the current season

## Final Thoughts

While K/D is important, it's not everything. In tournaments, placement points often matter more than kills. A player who consistently reaches top 5 with moderate kills may be more valuable than someone who gets many kills but dies early.

Focus on improving all aspects of your game, and your K/D will naturally improve over time.
    `,
  },
  {
    id: "team-building",
    title: "Building the Perfect PUBG Mobile Tournament Team",
    excerpt:
      "Essential tips for forming a competitive team, role assignments, and communication strategies for tournament success.",
    date: "December 5, 2024",
    category: "Team Building",
    readTime: "10 min read",
    content: `
## Introduction

A successful PUBG Mobile tournament team is more than four skilled players. It's about synergy, communication, and understanding each other's strengths and weaknesses.

## Essential Team Roles

### 1. In-Game Leader (IGL)

The IGL is the brain of the team:

**Responsibilities:**
- Make rotation decisions
- Call engagement timings
- Manage team resources
- Keep morale high during tough situations

**Skills needed:**
- Deep game knowledge
- Calm under pressure
- Good communication
- Quick decision-making

### 2. Entry Fragger

The aggressive playmaker:

**Responsibilities:**
- Lead pushes and entries
- Take initial engagements
- Create space for the team
- Finish knocks quickly

**Skills needed:**
- Excellent aim
- Fast reflexes
- Aggressive mentality
- Good movement mechanics

### 3. Support Player

The backbone of the team:

**Responsibilities:**
- Provide cover fire
- Trade kills for teammates
- Carry extra supplies
- Revive and heal teammates

**Skills needed:**
- Good game awareness
- Reliable aim
- Team-first mentality
- Versatility with weapons

### 4. Scout/Sniper

The eyes of the team:

**Responsibilities:**
- Gather intel on enemy positions
- Provide long-range support
- Mark and call out enemies
- Cover rotations with sniper fire

**Skills needed:**
- Patience
- Excellent sniping accuracy
- Good map knowledge
- Communication skills

## Building Team Chemistry

### Practice Together

- Schedule regular practice sessions
- Play at least 10-15 matches weekly together
- Review gameplay as a team
- Identify and work on weaknesses

### Communication

Effective communication wins matches:

**Do:**
- Use short, clear callouts
- Share information proactively
- Acknowledge teammate calls
- Stay calm in hectic situations

**Don't:**
- Talk over each other
- Blame teammates for mistakes
- Flood comms with unnecessary info
- Rage or tilt during games

### Trust and Respect

- Trust your IGL's decisions
- Respect each player's role
- Celebrate wins together
- Learn from losses as a team

## Team Formation Tips

### Finding Teammates

- Play random squads and connect with good players
- Join esports Discord communities
- Participate in local gaming events
- Use our platform's team formation feature

### Trial Periods

Before committing:
- Play 20-30 matches together
- Discuss expectations and commitment
- Test chemistry in high-pressure situations
- Ensure schedule compatibility

## Managing Conflicts

Conflicts are natural. Handle them by:

1. Address issues promptly
2. Focus on the problem, not the person
3. Listen to all perspectives
4. Find compromises
5. Move forward as a team

## Conclusion

Building a tournament-winning team takes time and effort. Focus on finding players whose skills complement each other, invest in building chemistry, and maintain open communication. The best teams aren't always the most skilled—they're the ones that work best together.

Good luck building your championship squad!
    `,
  },
  {
    id: "tournament-formats",
    title: "Tournament Format Guide: Classic vs Custom Matches",
    excerpt:
      "Comprehensive comparison of different tournament formats and which works best for various competition types.",
    date: "November 28, 2024",
    category: "Tournament Management",
    readTime: "7 min read",
    content: `
## Overview

Choosing the right tournament format is crucial for a successful event. This guide covers the most common formats used in PUBG Mobile and BGMI competitions.

## Classic Match Tournaments

### How It Works

Teams compete in standard matchmaking with public players. Scoring is based on:
- Kill points
- Survival time
- Final placement

### Pros
- Easy to organize
- No custom room requirements
- Good for casual tournaments
- Large player pool

### Cons
- Includes random players
- Less competitive environment
- Harder to verify results
- Inconsistent lobbies

### Best For
- Beginner tournaments
- Large-scale community events
- Practice tournaments

## Custom Room Tournaments

### How It Works

Organizers create private rooms with only tournament participants:
- Set specific map and mode
- Control all lobby settings
- Only registered teams can join
- Professional tournament standard

### Pros
- Fully controlled environment
- No random players
- Easier result verification
- True competitive experience

### Cons
- Requires custom room access
- Limited slots per room
- More organization needed
- Time zone coordination

### Best For
- Competitive tournaments
- League play
- Official esports events

## Scoring Systems

### Kill-Based Scoring

| Kills | Points |
|-------|--------|
| Each kill | +1 point |

**Pros:** Rewards aggression
**Cons:** May encourage reckless play

### Placement-Based Scoring

| Placement | Points |
|-----------|--------|
| 1st | 15 |
| 2nd | 12 |
| 3rd | 10 |
| 4th | 8 |
| 5th | 6 |
| 6th-10th | 4 |
| 11th-15th | 2 |
| 16th+ | 0 |

**Pros:** Rewards survival and strategy
**Cons:** Can lead to passive gameplay

### Combined Scoring (Recommended)

Most tournaments use a combination:
- Placement points (as above)
- Kill points (+1 per kill)
- Bonus for Winner Winner Chicken Dinner

This balances aggression with smart play.

## Tournament Structures

### Single Elimination

- Teams eliminated after one loss
- Quick to complete
- High stakes each match

### Double Elimination

- Teams get a second chance through losers bracket
- Fairer for close matches
- Takes longer to complete

### League Format

- All teams play multiple matches
- Points accumulated over time
- Most comprehensive but time-intensive

### Swiss System

- Teams paired based on current standings
- Efficient for large tournaments
- Determines top teams quickly

## Our Platform's Format

We primarily run:

1. **Random Squad Tournaments** - Solo voters are randomly matched into balanced teams
2. **Pre-formed Team Tournaments** - Bring your own squad
3. **Solo Tournaments** - Individual competition

Each tournament clearly states the format, entry fee, and prize structure before voting begins.

## Conclusion

The best format depends on your goals:
- **Casual fun**: Classic matches with kill-based scoring
- **Competitive play**: Custom rooms with combined scoring
- **League seasons**: Multiple rounds with Swiss or league format

Whatever format you choose, ensure rules are clearly communicated to all participants before the tournament begins.
    `,
  },
];

// Category badge colors
const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Strategy: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Analytics: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    "Team Building": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "Tournament Management": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };
  return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
};

// Individual blog post view
function BlogPostView({ post, onBack }: { post: typeof blogPosts[0]; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Blog
      </button>

      <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <time className="text-sm text-slate-500 dark:text-slate-400">{post.date}</time>
            <span className="text-sm text-slate-500 dark:text-slate-400">• {post.readTime}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {post.content.split("\n").map((line, index) => {
            // Parse markdown-like content
            if (line.startsWith("## ")) {
              return (
                <h2 key={index} className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">
                  {line.replace("## ", "")}
                </h2>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h3 key={index} className="text-xl font-semibold text-slate-800 dark:text-slate-100 mt-6 mb-3">
                  {line.replace("### ", "")}
                </h3>
              );
            }
            if (line.startsWith("- **")) {
              const content = line.replace("- **", "").replace("**", ":");
              return (
                <li key={index} className="text-slate-600 dark:text-slate-400 ml-4 list-disc">
                  <strong className="text-slate-800 dark:text-slate-200">{content.split(":")[0]}:</strong>
                  {content.split(":").slice(1).join(":")}
                </li>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <li key={index} className="text-slate-600 dark:text-slate-400 ml-4 list-disc">
                  {line.replace("- ", "")}
                </li>
              );
            }
            if (line.startsWith("1. ") || line.startsWith("2. ") || line.startsWith("3. ") ||
              line.startsWith("4. ") || line.startsWith("5. ")) {
              return (
                <li key={index} className="text-slate-600 dark:text-slate-400 ml-4 list-decimal">
                  {line.replace(/^\d+\. /, "")}
                </li>
              );
            }
            if (line.startsWith("**") && line.endsWith("**")) {
              return (
                <p key={index} className="font-semibold text-slate-800 dark:text-slate-200 mt-4">
                  {line.replace(/\*\*/g, "")}
                </p>
              );
            }
            if (line.startsWith("|")) {
              // Skip markdown tables - could be enhanced
              return null;
            }
            if (line.startsWith("*Note:")) {
              return (
                <p key={index} className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
                  {line}
                </p>
              );
            }
            if (line.trim() === "") {
              return null;
            }
            return (
              <p key={index} className="text-slate-600 dark:text-slate-400 mb-4">
                {line}
              </p>
            );
          })}
        </div>
      </article>

      {/* Related posts */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">More Articles</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {blogPosts
            .filter((p) => p.id !== post.id)
            .slice(0, 2)
            .map((relatedPost) => (
              <div
                key={relatedPost.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.scrollTo(0, 0)}
              >
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(relatedPost.category)}`}>
                  {relatedPost.category}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                  {relatedPost.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {relatedPost.excerpt}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [selectedPost, setSelectedPost] = useState<typeof blogPosts[0] | null>(null);

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-16">
          <BlogPostView post={selectedPost} onBack={() => setSelectedPost(null)} />
        </div>
      </div>
    );
  }

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

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <time>{post.date}</time>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 line-clamp-2">
                  {post.title}
                </h2>

                <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <span className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors inline-flex items-center">
                  Read Article
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter section */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
              Stay Updated
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Follow us for the latest tournament strategies, platform updates, and
              competitive gaming insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tournament/vote"
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Join Tournament
              </Link>
              <Link
                href="/faq"
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                View FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
