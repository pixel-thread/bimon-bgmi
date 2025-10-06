"use client";

import { GamepadIcon } from "lucide-react";
import { useAuth } from "@/src/hooks/useAuth";
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
import { FiArrowRight } from "react-icons/fi";
import { TournamentLayoutContent } from "@/src/components/TournamentLayoutContent";

const GamesContent = () => {
  const games = [
    {
      id: "flappy-bird",
      title: "Flappy Bird",
      description: "Navigate through pipes in this fun and challenging game",
      color: "from-blue-400 to-cyan-400",
      borderColor: "border-blue-400",
      image: "/images/games/flappy-bird/flappy-bird.png",
    },
    {
      id: "memory-game",
      title: "Memory Game",
      description: "Match pairs of cards to test and improve your memory",
      color: "from-purple-400 to-pink-400",
      borderColor: "border-purple-400",
      image: "/images/games/memory-game/memory-game.png",
    },
    {
      id: "snake",
      title: "Snake Game",
      description:
        "Classic snake game - eat food and grow longer without hitting walls",
      color: "from-green-400 to-emerald-400",
      borderColor: "border-green-400",
      image: "/images/games/snake/snake.png",
      isBeta: true,
    },
    // Add more games here in the future
  ];

  return (
    <TournamentLayoutContent
      title="Games"
      description="Have some fun with these games between matches!"
      icon={GamepadIcon}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            className="group overflow-hidden transition-all hover:shadow-lg h-full flex flex-col relative"
          >
            {game.isBeta && (
              <div className="absolute top-2 right-2 z-10">
                <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                  BETA
                </span>
              </div>
            )}
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
              <Link href={`/tournament/games/${game.id}`}>
                <Button className="w-full group-hover:bg-primary/90 transition-colors">
                  Play Now <FiArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </TournamentLayoutContent>
  );
};

export default GamesContent;
