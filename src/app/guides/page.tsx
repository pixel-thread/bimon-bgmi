"use client";

import { useState } from "react";
import Link from "next/link";

// Full guide data with complete content
const guides = [
  {
    id: "getting-started",
    title: "Getting Started with PUBGMI Tournament",
    description:
      "Learn how to join tournaments, add balance, and start competing on our platform.",
    topics: [
      "Creating your account",
      "Adding UC balance",
      "Voting for tournaments",
      "Understanding team formation",
    ],
    difficulty: "Beginner",
    readTime: "5 min",
    content: `
## Welcome to PUBGMI Tournament

This guide will walk you through everything you need to know to start competing in our PUBG Mobile and BGMI tournaments.

## Step 1: Create Your Account

1. **Sign in with Google** - Click the "Sign in with Google" button on the homepage
2. **Complete onboarding** - Enter your in-game name (IGN) and basic information
3. **Verify your profile** - Make sure your IGN matches your actual PUBG Mobile/BGMI account

## Step 2: Add UC Balance

UC (Unknown Cash) is the virtual currency used for tournament entry fees and prizes.

**How to add balance:**
1. Contact our admin via WhatsApp
2. Send the UC amount you want to add
3. Complete the payment as instructed
4. Your balance will be credited to your account

**Minimum recommended balance:** ₹100 (enough for 2-3 tournaments)

## Step 3: Join a Tournament

### Voting System

We use a voting system to gauge interest and form teams:

1. **IN** - Vote IN if you want to join with a random team
2. **SOLO** - Vote SOLO to play alone (20% tax on winnings)
3. **OUT** - Vote OUT to skip this tournament

### When Voting Closes

- Teams are automatically formed based on votes
- Entry fee is deducted from your balance
- Room details are shared in WhatsApp groups

## Step 4: Play the Tournament

1. **Join WhatsApp group** - Room ID and password are shared here
2. **Join the custom room** - Use the credentials provided
3. **Play your best** - Stats are automatically recorded
4. **Check results** - View standings on our platform after the match

## Understanding Prizes

Prizes are distributed based on final standings:
- **1st Place** - Largest share of prize pool
- **2nd Place** - Second largest share
- **3rd Place** - Third share
- **4th-5th Place** - May receive smaller prizes depending on tournament

Entry fees from all participants form the prize pool. The more participants, the bigger the prizes!

## Tips for New Players

- **Start with lower entry fee tournaments** to get familiar with the format
- **Join our WhatsApp group** for announcements and room details
- **Practice regularly** to improve your stats
- **Be on time** - Late players may miss the match
- **Report issues immediately** to administrators

## Need Help?

If you have questions:
- Check our FAQ page
- Contact us through WhatsApp
- Email: bimonlangnongsiej@gmail.com

Good luck and have fun competing!
    `,
  },
  {
    id: "team-formation",
    title: "Team Registration and Formation",
    description:
      "Complete guide to how teams are formed, random pairing, and playing with friends.",
    topics: [
      "Random team pairing explained",
      "Skill-based balancing",
      "Playing with friends",
      "Team communication tips",
    ],
    difficulty: "Beginner",
    readTime: "6 min",
    content: `
## How Teams Are Formed

Our platform uses two methods for team formation: random pairing and pre-formed teams.

## Random Team Pairing

When you vote "IN" for a tournament, our system automatically pairs you with other players.

### How It Works

1. **Collect all IN votes** - System gathers all players who voted IN
2. **Analyze player stats** - K/D ratio, win rate, and experience level
3. **Balance teams** - Mix high and low skill players for fair competition
4. **Form squads** - Create teams of 4 (Squad), 3 (Trio), or 2 (Duo) based on tournament mode

### Why Random Pairing?

- **Fair competition** - No team has an unfair advantage
- **Meet new players** - Expand your gaming network
- **Learn from others** - Play with experienced players
- **Balanced matches** - Every team has a chance to win

## Skill-Based Balancing

Our algorithm considers:

| Factor | Weight | Description |
|--------|--------|-------------|
| K/D Ratio | High | Your kill/death performance |
| Win Rate | Medium | How often you finish top 3 |
| Tournament Experience | Medium | Number of tournaments played |
| Recent Performance | High | Last 5 tournament results |

### The Goal

Each team should have:
- 1 high-skill player (anchor)
- 2 medium-skill players (core)
- 1 developing player (learning)

This creates competitive, unpredictable matches where any team can win!

## Playing with Friends

Want to team up with friends? You have options:

### Option 1: Pre-formed Teams

1. All friends must vote "IN" together
2. Contact admin before voting closes
3. Admin manually groups you together
4. Entry fee is still individual

### Option 2: Create Your Own Team

1. Go to "Team Management" (if available)
2. Create a new team
3. Invite friends by username
4. Register team for tournament

*Note: Pre-formed teams may face slightly different matchmaking to maintain fairness.*

## Solo Play

If you vote "SOLO", you play individually:

**Advantages:**
- Full control of your gameplay
- No team coordination needed
- All kills count for you alone

**Disadvantages:**
- 20% tax on winnings (Solo Tax)
- Harder to reach top placements
- Missing out on team strategy

## Communication Tips for Random Teams

When paired with strangers:

### Before the Match
- Introduce yourself in team chat
- Share your preferred role (fragger, support, sniper)
- Agree on initial landing spot
- Exchange WhatsApp numbers if needed

### During the Match
- Use clear, short callouts
- Share enemy positions (use compass direction)
- Call out when you're pushing or retreating
- Don't blame teammates for mistakes

### After the Match
- Add good teammates as friends
- Discuss what went well/wrong
- Plan to team up again in future

## Team Roles in Squad Matches

### IGL (In-Game Leader)
- Makes strategic decisions
- Calls rotations and engagements
- Usually most experienced player

### Entry Fragger
- Leads pushes
- Takes first contact
- Usually highest K/D player

### Support
- Provides cover fire
- Carries extra meds/throwables
- Revives and heals teammates

### Sniper/Scout
- Gathers intel
- Provides long-range support
- Spots enemies for the team

## Summary

Whether you play with random teammates or friends, communication and teamwork are key to success. Give random pairing a try - you might find your next regular squad mate!
    `,
  },
  {
    id: "stats-tracking",
    title: "Understanding Your Stats and Analytics",
    description:
      "Deep dive into how we calculate K/D ratios, track performance, and what the numbers mean.",
    topics: [
      "K/D ratio calculation",
      "Win rate and placements",
      "Season statistics",
      "Improving your numbers",
    ],
    difficulty: "Intermediate",
    readTime: "8 min",
    content: `
## Stats Overview

Our platform tracks comprehensive statistics to help you understand and improve your gameplay.

## Key Statistics Explained

### K/D Ratio (Kill/Death Ratio)

**Formula:** Total Kills ÷ Total Deaths = K/D Ratio

**Example:**
- You have 45 kills and 15 deaths
- K/D = 45 ÷ 15 = 3.0

**What it means:**
- Below 1.0: You die more than you kill
- 1.0 - 2.0: Average competitive player
- 2.0 - 3.5: Above average
- 3.5+: Excellent performance

*Note: K/D is calculated from tournament matches only, not regular gameplay.*

### Win Rate

**Formula:** (Wins ÷ Total Tournaments) × 100 = Win Rate %

**What counts as a "win":**
- 1st place finish = Win
- Some tournaments count top 3 as wins

**Good benchmarks:**
- 5-10%: Normal (expected if many players compete)
- 10-20%: Very good
- 20%+: Exceptional

### Average Kills Per Match

**Formula:** Total Kills ÷ Total Matches = Avg Kills

This shows your consistency. A player with 2.5 average kills is typically more reliable than one who gets 10 kills one game and 0 the next.

### Placement Points

Our scoring system awards points for survival:

| Placement | Points |
|-----------|--------|
| 1st | 15 |
| 2nd | 12 |
| 3rd | 10 |
| 4th | 8 |
| 5th | 6 |
| 6th | 4 |
| 7th | 2 |
| 8th+ | 1 |

Your average placement score indicates overall performance.

## Season Statistics

Stats are tracked per season:

### Current Season
- Active stats that affect team formation
- Resets when new season starts
- Determines your skill tier

### All-Time Stats
- Cumulative statistics
- Historical performance
- Never resets

### Season Reset

When a new season begins:
- Current stats move to history
- Everyone starts fresh
- Early tournament results set new rankings

## Viewing Your Stats

### Profile Page

Your profile shows:
- Overall K/D ratio
- Total tournaments played
- Win rate percentage
- Recent match history
- UC balance

### Leaderboards

Compare yourself to others:
- Season leaderboard (current standings)
- K/D leaderboard (best fraggers)
- Most tournaments played
- Highest win rate

## Improving Your Stats

### Focus on Survival First

In point-based tournaments, surviving = more points.

**Tips:**
- Don't take unnecessary fights
- Rotate early to safe zones
- Use cover effectively
- Carry enough healing items

### Smart Engagement

Only fight when you have an advantage:
- Higher ground
- Better cover
- Element of surprise
- Numbers advantage

### Consistency Over Big Games

It's better to get 3-5 kills every game than 10 kills one game and 0 the next. Consistency leads to:
- Higher average stats
- Better team formation placement
- More reliable performance

### Review Your Gameplay

After each tournament:
- What went right?
- Where did you die?
- Could you have played safer?
- What would you do differently?

## How Stats Affect Team Formation

Your stats directly impact random team pairing:

1. **High K/D players** are spread across teams
2. **Low K/D players** get paired with anchors
3. **Recent performance** weighs more than old stats
4. **Consistent players** are valued for team balance

This means improving your stats helps your entire team!

## Common Questions

**Q: Why is my K/D different from my game stats?**
A: We only track tournament matches, not casual gameplay.

**Q: How often do stats update?**
A: After each match results are confirmed by admin.

**Q: Can I reset my stats?**
A: Stats reset automatically each season.

**Q: What if my kill wasn't counted?**
A: Contact admin with match details for correction.

## Summary

Stats tell the story of your competitive journey. Focus on steady improvement, learn from each match, and your numbers will naturally improve over time. Good luck!
    `,
  },
  {
    id: "uc-prizes",
    title: "UC Balance, Entry Fees, and Prize Distribution",
    description:
      "Everything about the virtual currency system, how prizes work, and fair distribution rules.",
    topics: [
      "Adding and tracking balance",
      "Entry fee structure",
      "Prize pool calculation",
      "Solo Tax and Repeat Winner Tax",
    ],
    difficulty: "Beginner",
    readTime: "7 min",
    content: `
## Understanding UC Balance

UC (Unknown Cash) is PUBG Mobile's virtual in-game currency. On our platform, we track UC balances for tournament entry and prize distribution.

**Important:** UC on our platform is tracked as virtual credits. Actual UC is transferred to your game account by admins when you withdraw.

## Adding Balance

### How to Add UC Balance

1. **Contact admin** via WhatsApp
2. **Specify amount** you want to add
3. **Make payment** as instructed (UPI/bank transfer)
4. **Balance credited** to your platform account

### Minimum Deposit
Typically ₹50-100 minimum to keep transaction costs low.

### Balance Display
Your current balance shows on:
- Profile page
- Before voting for tournaments
- Tournament confirmation screen

## Entry Fees

### How Entry Fees Work

Each tournament has a set entry fee:
- Displayed on tournament page
- Deducted when you vote "IN" or "SOLO"
- Goes into the prize pool
- Refunded only if tournament is cancelled

### Common Entry Fee Ranges

| Tournament Type | Typical Fee |
|-----------------|-------------|
| Practice/Casual | ₹10-20 |
| Regular | ₹30-50 |
| Premium | ₹50-100 |
| Special Events | ₹100+ |

### What If I Don't Have Enough Balance?

You cannot vote for a tournament if your balance is below the entry fee. Add balance before voting begins!

## Prize Distribution

### How Prize Pool Forms

**Prize Pool = (Entry Fee × Number of Participants) - Platform Fee**

Example:
- Entry fee: ₹30
- Participants: 20
- Platform fee: 10%
- Prize pool: (30 × 20) × 0.90 = ₹540

### Standard Prize Split

| Placement | Share |
|-----------|-------|
| 1st Place | 50% |
| 2nd Place | 30% |
| 3rd Place | 20% |

Using the ₹540 example:
- 1st: ₹270
- 2nd: ₹162
- 3rd: ₹108

*Actual percentages may vary by tournament.*

### Team vs Individual

In team tournaments, prize is split among team members:
- 4-player squad winning ₹400 = ₹100 per player

## Special Taxes

### Solo Tax (20%)

If you vote "SOLO" instead of "IN", you pay a 20% tax on winnings.

**Why Solo Tax exists:**
- Encourages team play
- Balances solo vs squad gameplay
- Creates a bonus pool for future tournaments

**How it works:**
- You win ₹100 in a solo match
- 20% tax = ₹20 deducted
- You receive ₹80
- ₹20 goes to bonus pool

**Where Solo Tax goes:**
- 60% to players who lost the most that season (helps struggling players)
- 40% to next tournament's bonus pool (bigger prizes)

### Repeat Winner Tax (10-30%)

If you win frequently, you pay additional tax.

**Tax rates:**
- 2 wins in last 6 tournaments: 10% tax
- 3 wins in last 6 tournaments: 20% tax
- 4+ wins in last 6 tournaments: 30% tax

**Why this exists:**
- Prevents skill gap exploitation
- Gives other players a chance
- Keeps competition fair and interesting

**Example:**
- You win ₹200
- You have 3 recent wins = 20% tax
- Tax amount: ₹40
- You receive: ₹160
- ₹40 goes to bonus pool

## Bonus Pool

The bonus pool is extra prize money added to tournaments.

### How Bonus Pool Grows
- Solo Tax contributions
- Repeat Winner Tax contributions
- Special admin contributions
- Event sponsorships

### When Bonus Pool Is Used
- Added to specific tournaments
- Announced before tournament begins
- Increases total prize pool

## Withdrawing UC

### How to Withdraw

1. Go to your profile
2. Check available balance
3. Request withdrawal via admin
4. Admin transfers UC to your game account

### Minimum Withdrawal
Usually ₹50-100 minimum.

### Processing Time
Typically within 24-48 hours.

## Balance History

Track all your transactions:
- Tournament entries (deductions)
- Prize winnings (additions)
- Tax deductions
- Admin adjustments
- Withdrawals

## Tips for Managing Balance

1. **Keep buffer balance** - Don't enter with exact tournament fee
2. **Track spending** - Review your balance history
3. **Withdraw regularly** - Don't leave large amounts in platform
4. **Report issues** - If balance seems wrong, contact admin

## Summary

Our UC system is designed to be fair and transparent. Entry fees create the prize pool, taxes ensure healthy competition, and the bonus pool rewards the community. Happy competing!
    `,
  },
  {
    id: "tournament-rules",
    title: "Tournament Rules and Fair Play",
    description:
      "Official rules, code of conduct, and what happens when rules are broken.",
    topics: [
      "Official tournament rules",
      "Fair play requirements",
      "Reporting violations",
      "Consequences for cheating",
    ],
    difficulty: "Intermediate",
    readTime: "6 min",
    content: `
## Tournament Rules

Following rules ensures fair competition for everyone. Please read and understand these before participating.

## General Rules

### Eligibility

- Must have a registered account on our platform
- Must have sufficient UC balance for entry fee
- Must vote before deadline
- Must join room on time

### Timing

- **Voting deadline:** Usually 2 hours before match
- **Room opens:** 15 minutes before start time
- **Match start:** At scheduled time (sharp)
- **Late arrivals:** May not be able to join

### Room Entry

1. Get room ID and password from WhatsApp group
2. Enter credentials exactly as provided
3. Join within 10 minutes of room opening
4. If room is full, contact admin immediately

## Match Rules

### During Match

- **No hacks/cheats** - Automatic ban
- **No teaming** with other teams
- **No stream sniping** if match is streamed
- **No exploiting bugs** in the game
- **Play to win** - No throwing matches

### Disconnections

- Rejoin if possible
- Your kills still count
- If unable to rejoin, stats are calculated up to disconnect
- No refunds for disconnection

### Match End

- Wait for admin to confirm results
- Don't quit immediately after dying
- Report any issues before leaving

## Fair Play Guidelines

### What's Considered Fair Play

✅ Using any in-game weapons/items
✅ Strategic positioning and camping
✅ Using vehicles for rotation
✅ Team coordination and callouts
✅ Third-partying other fights

### What's NOT Allowed

❌ Using hacks or cheats of any kind
❌ Teaming with enemy teams
❌ Account sharing during matches
❌ Exploiting game bugs intentionally
❌ Verbal abuse or harassment

## Cheating and Consequences

### Types of Cheating

1. **Aimbots/Wallhacks** - Software that assists aiming or reveals enemies
2. **Teaming** - Colluding with enemy teams
3. **Account Boosting** - Having someone else play on your account
4. **Result Manipulation** - Faking screenshots or results
5. **Multi-accounting** - Playing in same tournament with multiple accounts

### Consequences

| Offense | Consequence |
|---------|-------------|
| First warning | Warning + match disqualification |
| Second offense | 7-day ban |
| Third offense | Permanent ban |
| Cheating (hacks) | Immediate permanent ban |

### What Happens to Prizes

- Cheater's prize is forfeited
- Prize redistributed to other participants
- If team member cheats, whole team may be disqualified

## Reporting Violations

### How to Report

1. Take screenshot/video evidence
2. Note the match ID and time
3. Identify the player(s) involved
4. Send report to admin via WhatsApp
5. Include all relevant details

### What to Report

- Suspected hacking
- Teaming violations
- Harassment or abuse
- Result manipulation
- Any suspicious behavior

### Investigation Process

1. Admin reviews evidence
2. Match data is analyzed
3. Player gets chance to respond
4. Decision is made and announced
5. Appropriate action is taken

## Disputes

### Disputing Results

If you believe match results are wrong:
1. Report within 24 hours of match end
2. Provide evidence (screenshots, recordings)
3. Admin will review and correct if needed
4. Decision is final after review

### Disputing Ban

If you believe you were wrongly banned:
1. Contact admin via email
2. Explain your case clearly
3. Provide any evidence of innocence
4. Wait for review (may take 48-72 hours)

## Sportsmanship

### Expected Behavior

- Respect all players
- Accept wins and losses gracefully
- Help new players learn
- Report cheaters, don't abuse them
- Be patient with admin decisions

### In Team Chat

- Keep communication positive
- Don't blame teammates
- Focus on improvement
- Encourage your squad

## Updates to Rules

- Rules may be updated occasionally
- Changes announced in WhatsApp group
- Continued participation = acceptance of rules
- Old violations not affected by new rules

## Summary

Fair play makes tournaments enjoyable for everyone. Follow the rules, report violations, and help us maintain a positive competitive environment. If unsure about anything, ask an admin before the match!
    `,
  },
  {
    id: "mobile-optimization",
    title: "Mobile Gaming Optimization Guide",
    description:
      "Tips for optimizing your device, settings, and network for competitive PUBG Mobile gameplay.",
    topics: [
      "Device settings optimization",
      "Network stability tips",
      "Graphics and FPS settings",
      "Battery and overheating",
    ],
    difficulty: "Advanced",
    readTime: "10 min",
    content: `
## Optimizing for Competition

Your device settings can significantly impact your tournament performance. This guide covers essential optimizations.

## Device Settings

### Free Up Resources

Before playing:
1. Close all background apps
2. Clear recent apps memory
3. Disable auto-updates
4. Turn off notifications (Focus/DND mode)
5. Close unnecessary services

### Storage Management

- Keep at least 3-4GB free storage
- Clear PUBG cache periodically
- Delete unused apps
- Move photos/videos to cloud

### RAM Management

- 4GB RAM: Close everything, use low settings
- 6GB RAM: Close major apps, medium settings
- 8GB+ RAM: Comfortable for high settings

## In-Game Graphics Settings

### For Competitive Play

**Recommended settings for most devices:**

| Setting | Recommended |
|---------|-------------|
| Graphics | Smooth |
| Frame Rate | Extreme/Ultra (if available) |
| Style | Colorful |
| Anti-aliasing | Off |
| Shadows | Off |
| Auto-adjust | Off |

### Why Smooth Graphics?

- Higher frame rates
- Less distraction from details
- Easier to spot enemies
- Better battery life
- Reduced overheating

### Frame Rate Priority

Always prioritize frame rate over graphics quality:
- 60 FPS > Pretty graphics
- Stable FPS > High FPS with drops
- Smooth gameplay = better aim

## Sensitivity Settings

### General Guidelines

- Lower sensitivity = more precise
- Higher sensitivity = faster turns
- Find balance that works for you

### Starting Point

| Setting | Suggested Range |
|---------|-----------------|
| Camera | 80-150% |
| ADS | 50-80% |
| Gyroscope | 200-400% |
| Scope 2x | 35-60% |
| Scope 4x | 25-40% |
| Scope 6x | 15-30% |

### Gyroscope

Using gyroscope can improve aim:
- Enable on ADS only (safer)
- Start with low sensitivity
- Practice in training mode
- Gradually increase as comfortable

## Network Optimization

### WiFi vs Mobile Data

**WiFi (Preferred):**
- More stable connection
- Lower ping typically
- No data cap worries

**Mobile Data:**
- Use if WiFi is unstable
- Move to strong signal area
- 4G/5G recommended

### Reducing Ping

1. **Router placement** - Put router close to play area
2. **Ethernet option** - Some phones support USB ethernet
3. **5GHz WiFi** - Use if your router supports it
4. **Close bandwidth users** - Pause downloads, streaming
5. **Gaming mode** - Enable on router if available

### During Tournament

- Don't download anything
- Ask family to limit streaming
- Use flight mode + WiFi only
- Keep backup mobile data ready

### Acceptable Ping Ranges

| Ping | Experience |
|------|------------|
| < 40ms | Excellent |
| 40-80ms | Good |
| 80-120ms | Playable |
| > 120ms | May affect gameplay |

## Battery Optimization

### Before Match

- Charge to 100% or keep plugged in
- Use original charger
- Enable battery saver if needed (may reduce performance)

### During Play

- Reduce brightness (but keep visible)
- Close unnecessary features (Bluetooth if not using)
- Keep device cool

### Battery Issues

If battery drains fast:
- Lower graphics settings
- Reduce frame rate
- Play near charger
- Consider a power bank

## Overheating Prevention

### Why It Matters

Overheating causes:
- Frame drops
- Lag spikes
- Potential crashes
- Device damage over time

### Prevention Tips

1. **Remove case** during gameplay
2. **Play in cool environment** (AC preferred)
3. **Use cooling fan** (clip-on phone coolers)
4. **Take breaks** between matches
5. **Avoid direct sunlight**
6. **Use lower graphics** if phone runs hot

### If Phone Overheats

- Stop playing immediately
- Let it cool for 10-15 minutes
- Lower settings before resuming
- Consider a cooling accessory

## Audio Settings

### For Competition

- Use headphones (wired preferred for zero latency)
- Enable SFX (footsteps are crucial)
- Keep BGM low or off
- Voice chat at comfortable level

### Sound Priorities

1. Footsteps - Most important
2. Gunshots - Direction and distance
3. Vehicles - Hearing approaching enemies
4. Grenades - React to incoming danger

## Control Layout

### Custom Controls

- Customize layout to your grip style
- Size buttons appropriately
- Keep frequently used buttons accessible
- Practice layout in training mode

### Pro Tips

- Use claw grip for more control
- Map gyroscope to scope buttons
- Quick crouch/prone is essential
- Lean buttons help in gunfights

## Pre-Match Checklist

Before every tournament:

☐ Phone charged (>80%)
☐ Strong WiFi connection
☐ Background apps closed
☐ DND mode enabled
☐ Game updated to latest version
☐ Headphones connected
☐ Room in optimal temperature
☐ Charger nearby (just in case)

## Summary

Optimization gives you a competitive edge. The best aim means nothing if your phone lags or overheats at a crucial moment. Take time to set up your device properly, and you'll perform more consistently in tournaments.
    `,
  },
];

// Difficulty badge colors
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

// Individual guide view
function GuideView({ guide, onBack }: { guide: typeof guides[0]; onBack: () => void }) {
  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Guides
      </button>

      <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <header className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(guide.difficulty)}`}>
              {guide.difficulty}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{guide.readTime}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {guide.title}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">{guide.description}</p>
        </header>

        {/* Table of contents */}
        <div className="mb-8 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">In this guide:</h3>
          <ul className="space-y-1">
            {guide.topics.map((topic, index) => (
              <li key={index} className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                <span className="text-indigo-500 mr-2">•</span>
                {topic}
              </li>
            ))}
          </ul>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          {guide.content.split("\n").map((line, index) => {
            // Parse markdown-like content
            if (line.startsWith("## ")) {
              return (
                <h2 key={index} className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">
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
              const parts = line.replace("- **", "").split("**");
              return (
                <li key={index} className="text-slate-600 dark:text-slate-400 ml-4 list-disc">
                  <strong className="text-slate-800 dark:text-slate-200">{parts[0]}</strong>
                  {parts[1]}
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
            if (line.match(/^\d+\. /)) {
              return (
                <li key={index} className="text-slate-600 dark:text-slate-400 ml-4 list-decimal">
                  {line.replace(/^\d+\. /, "")}
                </li>
              );
            }
            if (line.startsWith("**") && line.includes(":**")) {
              const parts = line.replace(/\*\*/g, "").split(":");
              return (
                <p key={index} className="text-slate-600 dark:text-slate-400 mt-2">
                  <strong className="text-slate-800 dark:text-slate-200">{parts[0]}:</strong>
                  {parts.slice(1).join(":")}
                </p>
              );
            }
            if (line.startsWith("✅") || line.startsWith("❌") || line.startsWith("☐")) {
              return (
                <p key={index} className="text-slate-600 dark:text-slate-400 ml-2">
                  {line}
                </p>
              );
            }
            if (line.startsWith("|")) {
              return null; // Skip tables for now
            }
            if (line.startsWith("*") && !line.startsWith("**")) {
              return (
                <p key={index} className="text-sm italic text-slate-500 dark:text-slate-400 mt-2">
                  {line.replace(/^\*/, "").replace(/\*$/, "")}
                </p>
              );
            }
            if (line.trim() === "") {
              return null;
            }
            return (
              <p key={index} className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      </article>

      {/* Related guides */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">More Guides</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {guides
            .filter((g) => g.id !== guide.id)
            .slice(0, 2)
            .map((relatedGuide) => (
              <div
                key={relatedGuide.id}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => window.scrollTo(0, 0)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(relatedGuide.difficulty)}`}>
                    {relatedGuide.difficulty}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{relatedGuide.readTime}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 line-clamp-2">
                  {relatedGuide.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {relatedGuide.description}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function GuidesPage() {
  const [selectedGuide, setSelectedGuide] = useState<typeof guides[0] | null>(null);

  if (selectedGuide) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-16">
          <GuideView guide={selectedGuide} onBack={() => setSelectedGuide(null)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Tournament Guides
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about participating in PUBG Mobile and BGMI
              tournaments on our platform.
            </p>
          </div>

          {/* Guides Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide) => (
              <div
                key={guide.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedGuide(guide)}
              >
                {/* Guide Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}
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
                    What you&apos;ll learn:
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
                <span className="w-full inline-block text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
                  Read Guide
                </span>
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
                Can&apos;t find what you&apos;re looking for? Our team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                >
                  Contact Support
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-lg transition-colors"
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
