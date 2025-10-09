"use client";

import { GamepadIcon } from "lucide-react";
import AdminNavigation from "@/src/components/AdminNavigation";
import { useAuth } from "@/src/hooks/useAuth";
import { TournamentLoader } from "@/src/components/TournamentLoader";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

const AdminGamesContent = () => {
  const { isAuthLoading: isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return <TournamentLoader />;
  }

  const games = [
    {
      id: "flappy-bird",
      title: "Flappy Bird",
      description: "A fun Flappy Bird game for players",
      color: "from-blue-400 to-cyan-400",
      borderColor: "border-blue-400",
      image: "/images/games/flappy-bird/flappy-bird.png",
    },
    {
      id: "memory-game",
      title: "Memory Game",
      description: "A challenging memory matching game",
      color: "from-purple-400 to-pink-400",
      borderColor: "border-purple-400",
      image: "/images/games/memory-game/memory-game.png",
    },
    {
      id: "snake",
      title: "Snake Game",
      description: "Classic snake game with lives system",
      color: "from-green-400 to-emerald-400",
      borderColor: "border-green-400",
      image: "/images/games/snake/snake.png",
    },
    // Add more games here in the future
  ];

  return (
    <div className="bg-background text-foreground pt-4 px-4 md:pt-8 md:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-slate-800 dark:text-foreground">
              <GamepadIcon className="h-8 w-8 text-indigo-600" />
              Admin - Games
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-muted-foreground">
              Manage tournament games and settings
            </p>
          </div>
        </header>

        <div className="space-y-6 pb-0">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => (
              <Card
                key={game.id}
                className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col"
              >
                <div className="relative h-40 w-full">
                  <Image
                    src={game.image}
                    alt={game.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="text-xl">{game.title}</CardTitle>
                  <CardDescription>{game.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/admin/games/${game.id}`} className="block">
                    <Button className="w-full group-hover:bg-primary/90 transition-colors">
                      Manage Game
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminGamesPage = () => {
  return <AdminGamesContent />;
};

export default AdminGamesPage;
