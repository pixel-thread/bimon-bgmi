// "use client";

// import { useState, useEffect } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/src/components/ui/card";
// import { Button } from "@/src/components/ui/button";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "@/src/components/ui/tabs";
// import { Badge } from "@/src/components/ui/badge";
// import {
//   ArrowLeft,
//   RotateCcw,
//   Trophy,
//   Users,
//   GamepadIcon,
//   AlertTriangle,
//   Clock,
//   Target,
// } from "lucide-react";
// import Link from "next/link";
// import { gameScoreService } from "@/src/lib/gameScoreService";
// import MemoryGame from "@/src/components/games/memory-game/MemoryGame";
// import { toast } from "sonner";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   deleteDoc,
//   doc,
//   updateDoc,
// } from "firebase/firestore";
// import { db } from "@/src/lib/firebase";

// interface LeaderboardEntry {
//   playerName: string;
//   score: number;
//   timestamp?: Date;
//   moves?: number;
//   time?: number;
// }

// interface GameStats {
//   totalPlayers: number;
//   totalGamesPlayed: number;
//   highestScore: number;
//   averageScore: number;
//   averageMoves: number;
//   averageTime: number;
// }

// interface PlayerStats {
//   playerName: string;
//   gamesPlayed: number;
//   highestScore: number;
//   averageScore: number;
//   averageMoves: number;
//   averageTime: number;
//   lastPlayed?: Date;
// }

// const AdminMemoryGameContent = () => {
//   const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
//   const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
//   const [stats, setStats] = useState<GameStats | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [resetting, setResetting] = useState(false);

//   // Load leaderboard and stats
//   const loadData = async () => {
//     setLoading(true);
//     try {
//       // Load leaderboard
//       const leaderboardData = await gameScoreService.getLeaderboard(
//         "memory-game",
//         50,
//       );
//       setLeaderboard(leaderboardData);

//       // Calculate stats and player statistics
//       const scoresRef = collection(db, "gameScores");
//       const q = query(scoresRef, where("gameId", "==", "memory-game"));
//       const querySnapshot = await getDocs(q);

//       const scores: number[] = [];
//       const moves: number[] = [];
//       const times: number[] = [];
//       const players = new Set<string>();
//       const playerData = new Map<
//         string,
//         {
//           scores: number[];
//           moves: number[];
//           times: number[];
//           name: string;
//           lastPlayed?: Date;
//         }
//       >();

//       querySnapshot.docs.forEach((doc) => {
//         const data = doc.data();
//         if (data.score > 0) {
//           scores.push(data.score);
//           players.add(data.playerId);

//           // Track additional metrics
//           if (data.moves) moves.push(data.moves);
//           if (data.time) times.push(data.time);

//           // Track player-specific data
//           if (!playerData.has(data.playerId)) {
//             playerData.set(data.playerId, {
//               scores: [],
//               moves: [],
//               times: [],
//               name: data.playerName,
//               lastPlayed: data.timestamp?.toDate(),
//             });
//           }

//           const player = playerData.get(data.playerId)!;
//           player.scores.push(data.score);
//           if (data.moves) player.moves.push(data.moves);
//           if (data.time) player.times.push(data.time);

//           // Update last played if this game is more recent
//           const gameDate = data.timestamp?.toDate();
//           if (
//             gameDate &&
//             (!player.lastPlayed || gameDate > player.lastPlayed)
//           ) {
//             player.lastPlayed = gameDate;
//           }
//         }
//       });

//       // Calculate overall game stats
//       const gameStats: GameStats = {
//         totalPlayers: players.size,
//         totalGamesPlayed: scores.length,
//         highestScore: scores.length > 0 ? Math.max(...scores) : 0,
//         averageScore:
//           scores.length > 0
//             ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
//             : 0,
//         averageMoves:
//           moves.length > 0
//             ? Math.round(moves.reduce((a, b) => a + b, 0) / moves.length)
//             : 0,
//         averageTime:
//           times.length > 0
//             ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
//             : 0,
//       };

//       // Calculate player-specific stats
//       const playerStatsData: PlayerStats[] = Array.from(playerData.entries())
//         .map(([playerId, data]) => {
//           const playerScores = data.scores;
//           const playerMoves = data.moves;
//           const playerTimes = data.times;

//           return {
//             playerName: data.name,
//             gamesPlayed: playerScores.length,
//             highestScore: Math.max(...playerScores),
//             averageScore: Math.round(
//               playerScores.reduce((a, b) => a + b, 0) / playerScores.length,
//             ),
//             averageMoves:
//               playerMoves.length > 0
//                 ? Math.round(
//                     playerMoves.reduce((a, b) => a + b, 0) / playerMoves.length,
//                   )
//                 : 0,
//             averageTime:
//               playerTimes.length > 0
//                 ? Math.round(
//                     playerTimes.reduce((a, b) => a + b, 0) / playerTimes.length,
//                   )
//                 : 0,
//             lastPlayed: data.lastPlayed,
//           };
//         })
//         .sort((a, b) => b.gamesPlayed - a.gamesPlayed); // Sort by games played descending

//       setStats(gameStats);
//       setPlayerStats(playerStatsData);
//     } catch (error) {
//       console.error("Error loading data:", error);
//       toast.error("Failed to load game data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset all scores
//   const resetAllScores = async () => {
//     if (
//       !confirm(
//         "Are you sure you want to delete ALL Memory Game scores? This action cannot be undone!",
//       )
//     ) {
//       return;
//     }

//     if (
//       !confirm(
//         "This will permanently delete all player scores and reset the leaderboard. Type 'DELETE' if you're absolutely sure.",
//       )
//     ) {
//       return;
//     }

//     setResetting(true);
//     try {
//       // Delete all game scores for memory-game from gameScores collection
//       const scoresRef = collection(db, "gameScores");
//       const q = query(scoresRef, where("gameId", "==", "memory-game"));
//       const querySnapshot = await getDocs(q);

//       const deletePromises = querySnapshot.docs.map((docSnapshot) =>
//         deleteDoc(doc(db, "gameScores", docSnapshot.id)),
//       );

//       await Promise.all(deletePromises);

//       // Also clear high scores from players collection
//       const playersRef = collection(db, "players");
//       const playersQuery = query(playersRef);
//       const playersSnapshot = await getDocs(playersQuery);

//       const updatePromises = playersSnapshot.docs
//         .map(async (playerDoc) => {
//           const playerData = playerDoc.data();
//           if (playerData.gameScores?.["memory-game"]) {
//             // Remove memory-game scores from player's gameScores
//             const updatedGameScores = { ...playerData.gameScores };
//             delete updatedGameScores["memory-game"];

//             return updateDoc(doc(db, "players", playerDoc.id), {
//               gameScores: updatedGameScores,
//               updatedAt: new Date(),
//             });
//           }
//           return null;
//         })
//         .filter(Boolean);

//       if (updatePromises.length > 0) {
//         await Promise.all(updatePromises);
//       }

//       toast.success(
//         `Successfully deleted ${deletePromises.length} score records and cleared player high scores`,
//       );

//       // Reload data
//       await loadData();
//     } catch (error) {
//       console.error("Error resetting scores:", error);
//       toast.error("Failed to reset scores");
//     } finally {
//       setResetting(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   return (
//     <div className="min-h-screen bg-background">
//       <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
//         {/* Header */}
//         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
//             <Link href="/admin/games">
//               <Button variant="outline" size="sm">
//                 <ArrowLeft className="h-4 w-4 mr-2" />
//                 Back to Games
//               </Button>
//             </Link>
//             <div className="flex-1">
//               <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
//                 <GamepadIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
//                 Memory Game Admin
//               </h1>
//               <p className="text-muted-foreground mt-1 text-sm sm:text-base">
//                 Manage game settings, scores, and player data
//               </p>
//             </div>
//           </div>
//           <Button
//             onClick={loadData}
//             disabled={loading}
//             variant="outline"
//             size="sm"
//             className="w-full sm:w-auto"
//           >
//             <RotateCcw
//               className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
//             />
//             Refresh Data
//           </Button>
//         </div>

//         {/* Stats Cards */}
//         {stats && (
//           <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-xs sm:text-sm font-medium">
//                   Total Players
//                 </CardTitle>
//                 <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg sm:text-2xl font-bold">
//                   {stats.totalPlayers}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-xs sm:text-sm font-medium">
//                   Games Played
//                 </CardTitle>
//                 <GamepadIcon className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg sm:text-2xl font-bold">
//                   {stats.totalGamesPlayed}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-xs sm:text-sm font-medium">
//                   Highest Score
//                 </CardTitle>
//                 <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg sm:text-2xl font-bold">
//                   {stats.highestScore}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-xs sm:text-sm font-medium">
//                   Average Score
//                 </CardTitle>
//                 <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-lg sm:text-2xl font-bold">
//                   {stats.averageScore}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* Main Content Tabs */}
//         <Tabs defaultValue="management" className="space-y-4 sm:space-y-6">
//           <TabsList className="grid w-full grid-cols-4">
//             <TabsTrigger value="management" className="text-xs sm:text-sm">
//               Management
//             </TabsTrigger>
//             <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">
//               Leaderboard
//             </TabsTrigger>
//             <TabsTrigger value="statistics" className="text-xs sm:text-sm">
//               Player Stats
//             </TabsTrigger>
//             <TabsTrigger value="game" className="text-xs sm:text-sm">
//               Test Game
//             </TabsTrigger>
//           </TabsList>

//           {/* Management Tab */}
//           <TabsContent value="management" className="space-y-4 sm:space-y-6">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
//                   <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
//                   Dangerous Actions
//                 </CardTitle>
//                 <CardDescription className="text-xs sm:text-sm">
//                   These actions permanently modify game data
//                 </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="p-3 sm:p-4 border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 rounded-lg">
//                   <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 text-sm sm:text-base">
//                     Reset All Scores
//                   </h4>
//                   <p className="text-xs sm:text-sm text-red-600 dark:text-red-300 mb-3">
//                     This will permanently delete all player scores and reset the
//                     leaderboard. Current data: {stats?.totalGamesPlayed || 0}{" "}
//                     games from {stats?.totalPlayers || 0} players.
//                   </p>
//                   <Button
//                     onClick={resetAllScores}
//                     disabled={resetting}
//                     variant="destructive"
//                     size="sm"
//                     className="w-full"
//                   >
//                     <RotateCcw
//                       className={`h-4 w-4 mr-2 ${
//                         resetting ? "animate-spin" : ""
//                       }`}
//                     />
//                     {resetting ? "Resetting..." : "Reset All Scores"}
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Leaderboard Tab */}
//           <TabsContent value="leaderboard">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
//                   <span className="text-base sm:text-lg">
//                     Current Leaderboard
//                   </span>
//                   <Badge variant="secondary" className="text-xs">
//                     {leaderboard.length} Players
//                   </Badge>
//                 </CardTitle>
//                 <CardDescription className="text-xs sm:text-sm">
//                   Top scores from all players
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <div className="text-center py-8">
//                     <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary rounded-full mx-auto"></div>
//                     <p className="mt-2 text-muted-foreground text-sm">
//                       Loading leaderboard...
//                     </p>
//                   </div>
//                 ) : leaderboard.length > 0 ? (
//                   <div className="space-y-2">
//                     {leaderboard.map((entry, index) => (
//                       <div
//                         key={index}
//                         className="flex items-center justify-between p-2 sm:p-3 rounded-lg border bg-card"
//                       >
//                         <div className="flex items-center gap-2 sm:gap-3">
//                           <Badge
//                             variant={index < 3 ? "default" : "secondary"}
//                             className="text-xs"
//                           >
//                             #{index + 1}
//                           </Badge>
//                           <span className="font-medium text-sm sm:text-base truncate">
//                             {entry.playerName}
//                           </span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <span className="font-bold text-base sm:text-lg">
//                             {entry.score}
//                           </span>
//                           {entry.timestamp && (
//                             <span className="text-xs text-muted-foreground hidden sm:inline">
//                               {entry.timestamp.toLocaleDateString()}
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-muted-foreground">
//                     <Trophy className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
//                     <p className="text-sm sm:text-base">
//                       No scores recorded yet
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Player Statistics Tab */}
//           <TabsContent value="statistics">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
//                   <span className="text-base sm:text-lg">
//                     Player Statistics
//                   </span>
//                   <Badge variant="secondary" className="text-xs">
//                     {playerStats.length} Players
//                   </Badge>
//                 </CardTitle>
//                 <CardDescription className="text-xs sm:text-sm">
//                   How many times each player has played the game
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 {loading ? (
//                   <div className="text-center py-8">
//                     <div className="animate-spin h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary rounded-full mx-auto"></div>
//                     <p className="mt-2 text-muted-foreground text-sm">
//                       Loading player statistics...
//                     </p>
//                   </div>
//                 ) : playerStats.length > 0 ? (
//                   <div className="space-y-2">
//                     {playerStats.map((player, index) => (
//                       <div
//                         key={index}
//                         className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-card gap-2 sm:gap-0"
//                       >
//                         <div className="flex items-center gap-2 sm:gap-3">
//                           <Badge variant="outline" className="text-xs">
//                             #{index + 1}
//                           </Badge>
//                           <div>
//                             <span className="font-medium text-sm sm:text-base block">
//                               {player.playerName}
//                             </span>
//                             {player.lastPlayed && (
//                               <span className="text-xs text-muted-foreground">
//                                 Last played:{" "}
//                                 {player.lastPlayed.toLocaleDateString()}
//                               </span>
//                             )}
//                           </div>
//                         </div>
//                         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm">
//                           <div className="flex items-center gap-1">
//                             <GamepadIcon className="h-3 w-3 text-muted-foreground" />
//                             <span className="font-semibold">
//                               {player.gamesPlayed}
//                             </span>
//                             <span className="text-muted-foreground">games</span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <Trophy className="h-3 w-3 text-muted-foreground" />
//                             <span className="font-semibold">
//                               {player.highestScore}
//                             </span>
//                             <span className="text-muted-foreground">best</span>
//                           </div>
//                           <div className="flex items-center gap-1">
//                             <span className="text-muted-foreground">avg:</span>
//                             <span className="font-semibold">
//                               {player.averageScore}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-muted-foreground">
//                     <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
//                     <p className="text-sm sm:text-base">
//                       No player data available
//                     </p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </TabsContent>

//           {/* Test Game Tab */}
//           <TabsContent value="game" className="p-0">
//             <div className="w-full">
//               <div className="mb-4 p-4 bg-muted/50 rounded-lg">
//                 <h3 className="font-semibold text-sm sm:text-base mb-2">
//                   Full Game Experience
//                 </h3>
//                 <p className="text-xs sm:text-sm text-muted-foreground">
//                   This shows exactly how players see the game - no borders or
//                   modifications
//                 </p>
//               </div>
//               <MemoryGame />
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// };

// export default function AdminMemoryGamePage() {
//   return <AdminMemoryGameContent />;
// }
