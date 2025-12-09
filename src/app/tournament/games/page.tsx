"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Gamepad2,
  Brain,
  Zap,
  Target,
  Lock,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  status: "available" | "coming_soon" | "locked";
  difficulty: "Easy" | "Medium" | "Hard";
  playTime: string;
  href?: string;
}

const GAMES: GameInfo[] = [
  {
    id: "memory",
    name: "Memory Match",
    description: "Match pairs of cards to test your memory skills",
    icon: <Brain className="h-6 w-6" />,
    image: "/images/games/memory-game/memory-game.png",
    status: "available",
    difficulty: "Medium",
    playTime: "3-8 min",
    href: "/tournament/games/memory",
  },
  {
    id: "flappy",
    name: "Flappy BGMI",
    description: "Navigate through obstacles in this classic arcade game",
    icon: <Target className="h-6 w-6" />,
    image: "/images/games/flappy-bird/fb-game-background.png",
    status: "coming_soon",
    difficulty: "Hard",
    playTime: "1-3 min",
  },
  {
    id: "snake",
    name: "Snake Rush",
    description: "Classic snake game with a modern twist",
    icon: <Zap className="h-6 w-6" />,
    status: "coming_soon",
    difficulty: "Medium",
    playTime: "3-10 min",
  },
];

export default function GamesPage() {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
            Play Now
          </Badge>
        );
      case "coming_soon":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Coming Soon
          </Badge>
        );
      case "locked":
        return (
          <Badge variant="outline" className="gap-1">
            <Lock className="h-3 w-3" />
            Locked
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl">
          <Gamepad2 className="h-6 w-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Game Arcade</h1>
          <p className="text-sm text-muted-foreground">
            Take a break and have some fun with mini games!
          </p>
        </div>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((game) => {
          const CardWrapper = game.status === "available" && game.href
            ? ({ children }: { children: React.ReactNode }) => (
              <Link href={game.href!} className="block">
                {children}
              </Link>
            )
            : ({ children }: { children: React.ReactNode }) => <>{children}</>;

          return (
            <CardWrapper key={game.id}>
              <Card
                className={`group overflow-hidden transition-all duration-300 ${game.status === "available"
                    ? "hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 cursor-pointer"
                    : "opacity-75"
                  }`}
              >
                {/* Game Image/Preview */}
                <div className="relative h-32 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
                  {game.image ? (
                    <Image
                      src={game.image}
                      alt={game.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="p-4 bg-white/5 rounded-full">{game.icon}</div>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {/* Status badge */}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(game.status)}
                  </div>
                  {/* Game icon */}
                  <div className="absolute bottom-3 left-3 p-2 bg-black/50 backdrop-blur-sm rounded-lg">
                    {game.icon}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">
                        {game.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {game.description}
                      </p>
                    </div>

                    {/* Game Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={getDifficultyColor(game.difficulty)}
                      >
                        {game.difficulty}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {game.playTime}
                      </Badge>
                    </div>

                    {/* Play Button */}
                    {game.status === "available" && (
                      <Button className="w-full gap-2 group-hover:bg-indigo-600 transition-colors">
                        <Gamepad2 className="h-4 w-4" />
                        Play Now
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>
    </div>
  );
}

