// "use client";

// import { useState, useEffect } from "react";
// import { Button } from "@/src/components/ui/button";
// import { Card, CardContent } from "@/src/components/ui/card";
// import { Badge } from "@/src/components/ui/badge";

// import { CombinedTeamData, RevealWinner } from "@/src/lib/types";
// import {
//   collection,
//   getDocs,
//   query,
//   where,
//   setDoc,
//   doc,
// } from "firebase/firestore";
// import { db } from "@/src/lib/firebase";
// import { toast } from "sonner";
// import {
//   Trophy,
//   Gift,
//   RotateCcw,
//   Eye,
//   EyeOff,
//   Mail,
//   Phone,
//   AlertTriangle,
// } from "lucide-react";
// import { useAuth } from "@/src/hooks/context/auth/useAuth";
// import { pollService } from "@/src/lib/pollService";
// import { playerAuthService } from "@/src/lib/playerAuthService";

// interface WinnerRevealProps {
//   teams: CombinedTeamData[];
//   tournamentId: string;
//   tournamentTitle: string;
//   seasonId?: string;
//   isAdmin?: boolean;
// }

// export default function WinnerReveal({
//   teams,
//   tournamentId,
//   tournamentTitle,
//   seasonId,
//   isAdmin = false,
// }: WinnerRevealProps) {
//   const [players, setPlayers] = useState<string[]>([]);
//   const [currentWinner, setCurrentWinner] = useState<RevealWinner | null>(null);
//   const [isRevealing, setIsRevealing] = useState(false);
//   const [cardRevealed, setCardRevealed] = useState(false);
//   const [revealResult, setRevealResult] = useState<"winner" | "loser" | null>(
//     null
//   );
//   const [isAnimating, setIsAnimating] = useState(false);
//   const [loserMessage, setLoserMessage] = useState<string>("");
//   const [adminManuallyReset, setAdminManuallyReset] = useState(false);
//   const [winnerVotedInLatestPoll, setWinnerVotedInLatestPoll] = useState<
//     boolean | null
//   >(null);

//   // Get current logged-in player info
//   const { isPlayer, playerUser, isAuthorized } = useAuth();

//   // Check if current player is confirmed (registered in tournament)
//   const isConfirmedPlayer =
//     isPlayer && playerUser && players.includes(playerUser.name);

//   // Extract all confirmed players from teams
//   useEffect(() => {
//     const confirmedPlayers: string[] = [];
//     teams.forEach((team) => {
//       team.players.forEach((player) => {
//         if (player.ign && player.ign.trim()) {
//           confirmedPlayers.push(player.ign);
//         }
//       });
//     });
//     setPlayers(confirmedPlayers);
//   }, [teams]);

//   // Fetch current winner for this tournament
//   useEffect(() => {
//     const fetchCurrentWinner = async () => {
//       try {
//         const winnersQuery = query(
//           collection(db, "revealWinners"),
//           where("tournamentId", "==", tournamentId)
//         );
//         const winnersSnapshot = await getDocs(winnersQuery);
//         const winners = winnersSnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         })) as RevealWinner[];

//         if (winners.length > 0) {
//           const latestWinner = winners.sort(
//             (a, b) =>
//               new Date(b.revealDate).getTime() -
//               new Date(a.revealDate).getTime()
//           )[0];
//           setCurrentWinner(latestWinner);
//         } else {
//           setCurrentWinner(null);
//         }
//       } catch (error) {
//         console.error("Error fetching current winner:", error);
//       }
//     };

//     if (tournamentId) {
//       fetchCurrentWinner();
//       setAdminManuallyReset(false); // Reset manual flag when tournament changes
//     }
//   }, [tournamentId]);

//   // Check if winner voted in latest poll (for admin)
//   useEffect(() => {
//     const checkWinnerVotingStatus = async () => {
//       if (isAdmin && currentWinner) {
//         try {
//           // First, find the player ID by name
//           const playerSuggestions =
//             await playerAuthService.getPlayerSuggestions(
//               currentWinner.winnerName
//             );
//           const matchingPlayer = playerSuggestions.find(
//             (player) =>
//               player.name.toLowerCase() ===
//               currentWinner.winnerName.toLowerCase()
//           );

//           if (!matchingPlayer) {
//             setWinnerVotedInLatestPoll(null);
//             return;
//           }

//           // Get the latest active poll
//           const activePolls = await pollService.getActivePolls();
//           if (activePolls.length > 0) {
//             const latestPoll = activePolls[0];
//             // Check if winner voted in the latest poll using their player ID
//             const hasVoted = await pollService.hasPlayerVoted(
//               latestPoll.id,
//               matchingPlayer.id
//             );
//             setWinnerVotedInLatestPoll(hasVoted);
//           } else {
//             setWinnerVotedInLatestPoll(null); // No active polls
//           }
//         } catch (error) {
//           console.error("Error checking winner voting status:", error);
//           setWinnerVotedInLatestPoll(null);
//         }
//       }
//     };

//     if (isAdmin && currentWinner) {
//       checkWinnerVotingStatus();
//     }
//   }, [isAdmin, currentWinner]);

//   // Auto-reveal card for admins when there's a current winner (unless manually reset)
//   useEffect(() => {
//     if (isAdmin && currentWinner && !cardRevealed && !adminManuallyReset) {
//       setCardRevealed(true);
//       setRevealResult("winner");
//     }
//   }, [isAdmin, currentWinner, cardRevealed, adminManuallyReset]);

//   const selectNewWinner = async () => {
//     if (players.length === 0) {
//       toast.error("No confirmed players found for this tournament");
//       return;
//     }

//     if (isRevealing) return;

//     setIsRevealing(true);

//     try {
//       // Select random winner
//       const randomIndex = Math.floor(Math.random() * players.length);
//       const selectedWinner = players[randomIndex];

//       // Find winner's team
//       const winnerTeam = teams.find((team) =>
//         team.players.some((player) => player.ign === selectedWinner)
//       );

//       const winnerData: Omit<RevealWinner, "id"> = {
//         tournamentId,
//         tournamentTitle,
//         winnerName: selectedWinner,
//         winnerTeam: winnerTeam?.teamName || "Unknown Team",
//         revealDate: new Date().toISOString(),
//         seasonId,
//       };

//       // Save to database
//       await setDoc(doc(db, "revealWinners", tournamentId), winnerData);

//       // Update current winner state
//       setCurrentWinner({ id: tournamentId, ...winnerData });

//       // Reset reveal states and auto-reveal for admin
//       setCardRevealed(true);
//       setRevealResult("winner");
//       setLoserMessage("");
//       setAdminManuallyReset(false);

//       toast.success(`🎉 New winner selected: ${selectedWinner}!`, {
//         duration: 5000,
//       });
//     } catch (error) {
//       console.error("Error selecting winner:", error);
//       toast.error("Failed to select new winner");
//     } finally {
//       setIsRevealing(false);
//     }
//   };

//   const handleCardReveal = async () => {
//     if (cardRevealed || isAnimating) return;

//     setIsAnimating(true);

//     // Simulate card flip animation delay
//     setTimeout(() => {
//       setCardRevealed(true);

//       if (isAdmin) {
//         // Admin sees the actual winner
//         setRevealResult("winner");
//         setAdminManuallyReset(false); // Reset manual flag when admin manually reveals
//         toast.success(
//           `Winner: ${currentWinner?.winnerName || "No winner set"}`,
//           {
//             duration: 5000,
//           }
//         );
//       } else if (isConfirmedPlayer && playerUser) {
//         // Check if current player is the winner
//         const isWinner =
//           currentWinner &&
//           currentWinner.winnerName.toLowerCase() ===
//             playerUser.name.toLowerCase();

//         setRevealResult(isWinner ? "winner" : "loser");

//         if (isWinner) {
//           toast.success("🎉 Congratulations! You are the winner!", {
//             duration: 5000,
//           });
//         } else {
//           // Generate and set the loser message only once
//           setLoserMessage(generateLoserMessage());
//           toast.info("Better luck next time! 🤞", {
//             duration: 3000,
//           });
//         }
//       }

//       setIsAnimating(false);
//     }, 800); // Animation duration
//   };

//   const resetCard = () => {
//     setCardRevealed(false);
//     setRevealResult(null);
//     setIsAnimating(false);
//     setLoserMessage("");
//     setAdminManuallyReset(true);
//   };

//   const generateLoserMessage = () => {
//     const messages = [
//       "Congratulations! You're gay! 🏳️‍🌈 (Just kidding, you're just unlucky)",
//       "Plot twist: You're straight... straight up LOSING! 😂",
//       "The card said 'nah fam, you ain't it' 💀",
//       "Skill issue detected 🤡",
//       "You got ratio'd by a card 📉",
//       "L + ratio + you fell off + the card doesn't like you 💸",
//       "POV: You thought you had main character energy 🎭",
//       "The card said 'this ain't it chief' 🚫",
//       "Imagine losing to RNG... couldn't be me 🤷‍♂️",
//       "You're built different... differently UNLUCKY 🗿",
//       "The card really said 'no cap, you're trash' 🧢",
//       "Bro really thought he was HIM 💀",
//       "You got sent to the shadow realm by a card 👻",
//       "The card chose violence today... against YOU 😈",
//       "Certified bruh moment 🤦‍♂️",
//     ];
//     return messages[Math.floor(Math.random() * messages.length)];
//   };

//   return (
//     <div className="space-y-6 container mx-auto px-4 sm:px-6 lg:px-8 py-6">
//       <div className="text-center">
//         <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
//           <Trophy className="w-6 h-6 text-yellow-500" />
//           Winner Reveal{" "}
//           {isAdmin && <Badge variant="secondary">Admin Mode</Badge>}
//         </h2>
//         {isAdmin && !cardRevealed && (
//           <p className="text-muted-foreground text-sm sm:text-base">
//             Tap to reveal winner from {players.length} tournament players
//           </p>
//         )}
//         {isAdmin && cardRevealed && currentWinner && (
//           <div className="space-y-2">
//             <p className="text-blue-600 dark:text-blue-400 text-sm sm:text-base font-medium">
//               Current Winner: {currentWinner.winnerName} (
//               {currentWinner.winnerTeam})
//             </p>
//             {/* Voting participation status inline for admin */}
//             {winnerVotedInLatestPoll !== null && (
//               <div className="flex items-center justify-center gap-2">
//                 {winnerVotedInLatestPoll ? (
//                   <>
//                     <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
//                     <span className="text-sm font-medium text-green-600 dark:text-green-400">
//                       Participated in latest vote
//                     </span>
//                   </>
//                 ) : (
//                   <>
//                     <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
//                     <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
//                       {currentWinner.winnerName} did not participate in the
//                       latest vote
//                     </span>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//         {isAdmin && cardRevealed && !currentWinner && (
//           <p className="text-orange-600 dark:text-orange-400 text-sm sm:text-base">
//             No winner has been selected yet
//           </p>
//         )}
//         {isConfirmedPlayer && !cardRevealed && (
//           <p className="text-muted-foreground text-sm sm:text-base">
//             Welcome {playerUser?.name}! Tap the card to see if you won!
//           </p>
//         )}
//         {isConfirmedPlayer && cardRevealed && revealResult === "winner" && (
//           <p className="text-green-600 dark:text-green-400 text-sm sm:text-base font-medium">
//             🎉 Congratulations {playerUser?.name}! You are the winner! 🎉
//           </p>
//         )}
//         {isConfirmedPlayer && cardRevealed && revealResult === "loser" && (
//           <p className="text-red-600 dark:text-red-400 text-sm sm:text-base">
//             Sorry {playerUser?.name}, better luck next time!
//           </p>
//         )}
//         {isPlayer && !isConfirmedPlayer && !isAdmin && (
//           <p className="text-muted-foreground text-sm sm:text-base">
//             Only confirmed tournament players can access this feature.
//           </p>
//         )}
//       </div>

//       {/* Admin Controls */}
//       {isAdmin && (
//         <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
//           <Button
//             onClick={selectNewWinner}
//             disabled={isRevealing}
//             variant="outline"
//             className="flex items-center gap-2 w-full sm:w-auto"
//           >
//             <RotateCcw className="w-4 h-4" />
//             {isRevealing ? "Selecting..." : "Select New Winner"}
//           </Button>
//           {cardRevealed && (
//             <Button
//               onClick={resetCard}
//               variant="outline"
//               className="flex items-center gap-2 w-full sm:w-auto"
//             >
//               <Eye className="w-4 h-4" />
//               Reset Card
//             </Button>
//           )}
//         </div>
//       )}

//       {/* Single Reveal Card - Only for confirmed players and admins */}
//       {(isConfirmedPlayer || isAdmin) && (
//         <div className="flex justify-center">
//           <div className="relative">
//             <div
//               className={`w-64 sm:w-80 h-80 sm:h-96 transition-all duration-800 transform-style-preserve-3d ${
//                 cardRevealed ? "rotate-y-180" : ""
//               } ${isAnimating ? "animate-pulse" : ""} ${
//                 !cardRevealed || (!isAdmin && isConfirmedPlayer)
//                   ? "cursor-pointer hover:scale-105 transition-transform duration-200"
//                   : "cursor-default"
//               }`}
//               onClick={!cardRevealed ? handleCardReveal : undefined}
//               style={{
//                 transformStyle: "preserve-3d",
//                 transform: cardRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
//               }}
//             >
//               {/* Card Back */}
//               <div
//                 className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl backface-hidden ${
//                   !cardRevealed ? "block" : "hidden"
//                 }`}
//                 style={{ backfaceVisibility: "hidden" }}
//               >
//                 <div className="w-full h-full bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
//                   {/* Shimmering effect */}
//                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>

//                   {/* Animated circles */}
//                   <div className="absolute inset-0 opacity-30">
//                     <div className="absolute top-8 left-8 w-16 h-16 border-4 border-white/30 rounded-full animate-ping"></div>
//                     <div className="absolute bottom-8 right-8 w-12 h-12 border-4 border-white/30 rounded-full animate-ping animation-delay-1000"></div>
//                     <div className="absolute top-1/2 left-12 w-8 h-8 border-4 border-white/30 rounded-full animate-ping animation-delay-2000"></div>
//                   </div>

//                   {/* Main content */}
//                   <div className="relative z-10 flex flex-col items-center justify-center p-6">
//                     <div className="mb-6 relative">
//                       <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
//                         <Gift className="w-12 h-12 text-white animate-float" />
//                       </div>
//                       {/* Glow effect */}
//                       <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl animate-pulse"></div>
//                     </div>

//                     <h3 className="text-2xl font-bold mb-2 text-center">
//                       Tap to Reveal
//                     </h3>
//                     <p className="text-center text-sm opacity-90">
//                       {isAdmin
//                         ? "See the tournament winner"
//                         : "Discover your fate!"}
//                     </p>
//                   </div>

//                   {/* Floating particles */}
//                   <div className="absolute inset-0 pointer-events-none">
//                     {[...Array(5)].map((_, i) => (
//                       <div
//                         key={i}
//                         className="absolute w-2 h-2 bg-white/40 rounded-full"
//                         style={{
//                           top: `${20 + i * 15}%`,
//                           left: `${10 + i * 20}%`,
//                           animation: `float 3s ease-in-out ${
//                             i * 0.5
//                           }s infinite`,
//                         }}
//                       />
//                     ))}
//                   </div>
//                 </div>
//               </div>

//               {/* Card Front (Revealed) */}
//               <div
//                 className={`absolute inset-0 w-full h-full rounded-2xl shadow-2xl backface-hidden ${
//                   cardRevealed ? "block" : "hidden"
//                 }`}
//                 style={{
//                   backfaceVisibility: "hidden",
//                   transform: "rotateY(180deg)",
//                 }}
//               >
//                 {revealResult === "winner" ? (
//                   <div className="w-full h-full bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
//                     {/* Celebration particles */}
//                     <div className="absolute inset-0">
//                       <div className="absolute top-8 left-8 text-yellow-300 text-2xl animate-bounce">
//                         🎉
//                       </div>
//                       <div className="absolute top-12 right-12 text-yellow-300 text-xl animate-bounce animation-delay-500">
//                         ✨
//                       </div>
//                       <div className="absolute bottom-16 left-12 text-yellow-300 text-lg animate-bounce animation-delay-1000">
//                         🏆
//                       </div>
//                       <div className="absolute bottom-8 right-8 text-yellow-300 text-xl animate-bounce animation-delay-1500">
//                         🎊
//                       </div>
//                     </div>

//                     <Trophy className="w-20 h-20 mb-4 text-yellow-300 animate-pulse" />
//                     <h3 className="text-2xl sm:text-3xl font-bold mb-2">
//                       🎉 WINNER! 🎉
//                     </h3>
//                     {isAdmin && currentWinner && (
//                       <div className="text-center">
//                         <p className="text-lg sm:text-xl font-semibold mb-1">
//                           {currentWinner.winnerName}
//                         </p>
//                         <p className="text-sm sm:text-base opacity-90">
//                           Team: {currentWinner.winnerTeam}
//                         </p>
//                       </div>
//                     )}
//                     {isPlayer && (
//                       <p className="text-center text-base sm:text-lg px-4">
//                         Congratulations {playerUser?.name}!<br />
//                       </p>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="w-full h-full bg-gradient-to-br from-red-400 via-pink-500 to-red-600 rounded-2xl flex flex-col items-center justify-center text-white relative overflow-hidden">
//                     {/* Sad particles */}
//                     <div className="absolute inset-0 opacity-30">
//                       <div className="absolute top-8 left-8 text-2xl animate-bounce">
//                         😅
//                       </div>
//                       <div className="absolute top-12 right-12 text-xl animate-bounce animation-delay-500">
//                         💔
//                       </div>
//                       <div className="absolute bottom-16 left-12 text-lg animate-bounce animation-delay-1000">
//                         😢
//                       </div>
//                       <div className="absolute bottom-8 right-8 text-xl animate-bounce animation-delay-1500">
//                         🤷‍♂️
//                       </div>
//                     </div>

//                     <div className="text-5xl sm:text-6xl mb-4 animate-pulse">
//                       😅
//                     </div>
//                     <h3 className="text-xl sm:text-2xl font-bold mb-2">
//                       Better Luck Next Time!
//                     </h3>
//                     {isPlayer && (
//                       <div className="text-center px-4">
//                         <p className="text-base sm:text-lg mb-2">
//                           Sorry {playerUser?.name}!
//                         </p>
//                         <p className="text-xs sm:text-sm opacity-90">
//                           {loserMessage}
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Message for non-confirmed players */}
//       {isPlayer && !isConfirmedPlayer && !isAdmin && (
//         <Card className="border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
//           <CardContent className="p-6 sm:p-8 text-center">
//             <div className="max-w-md mx-auto space-y-4 sm:space-y-6">
//               <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto">
//                 <Trophy className="w-12 h-12 text-gray-500 dark:text-gray-400" />
//               </div>
//               <div className="space-y-3">
//                 <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">
//                   Not Registered for Tournament
//                 </h3>
//                 <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
//                   Hi {playerUser?.name}! You are not a confirmed player in the{" "}
//                   <span className="font-semibold">{tournamentTitle}</span>{" "}
//                   tournament.
//                 </p>
//                 <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
//                   Only confirmed participants can access the winner reveal
//                   feature. Reach out to the tournament admin to register!
//                 </p>
//               </div>
//               <div className="pt-4">
//                 <Button
//                   variant="outline"
//                   className="flex items-center gap-2 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full sm:w-auto"
//                   onClick={() => window.open("tel:+918837011018", "_blank")}
//                 >
//                   <Phone className="w-4 h-4" />
//                   Contact Admin
//                 </Button>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Current Winner Info - Only show for admin */}

//       {/* No Winner Set - Admin Only */}
//       {!currentWinner && isAdmin && (
//         <Card className="border-2 border-dashed border-orange-200 dark:border-orange-800">
//           <CardContent className="p-8 text-center">
//             <div className="space-y-4">
//               <Trophy className="w-12 h-12 text-orange-400 mx-auto" />
//               <h3 className="text-lg font-semibold">No Winner Selected</h3>
//               <p className="text-muted-foreground">
//                 Click "Select New Winner" to randomly choose a winner from the
//                 tournament players.
//               </p>
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       <style jsx>{`
//         @keyframes float {
//           0%,
//           100% {
//             transform: translateY(0px);
//           }
//           50% {
//             transform: translateY(-10px);
//           }
//         }

//         @keyframes shimmer {
//           0% {
//             transform: translateX(-100%) skewX(-12deg);
//           }
//           100% {
//             transform: translateX(200%) skewX(-12deg);
//           }
//         }

//         .animate-float {
//           animation: float 2s ease-in-out infinite;
//         }

//         .animate-shimmer {
//           animation: shimmer 2s ease-in-out infinite;
//         }

//         .animation-delay-1000 {
//           animation-delay: 1s;
//         }

//         .animation-delay-2000 {
//           animation-delay: 2s;
//         }
//       `}</style>
//     </div>
//   );
// }
