"use client";

import React from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Trophy, Search, Plus, Trash2 } from "lucide-react";
import { useTournamentWinner } from "../hooks/winner/useTournamentWinner";
import { useTournamentStore } from "../store/tournament";

interface WinnersTabProps {
  readOnly?: boolean;
}

export function WinnersTab({ readOnly = false }: WinnersTabProps) {
  const { tournamentId } = useTournamentStore();
  const { data: winner, isFetching: isLoading } = useTournamentWinner({
    seasonId: tournamentId,
  });
  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* <Card className="rounded-xl shadow border border-gray-200 dark:border-white/20 bg-background dark:bg-black text-foreground"> */}
      {/*   <CardContent className="p-4"> */}
      {/*     <div className="pt-6 flex flex-col gap-2 mb-6"> */}
      {/*       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"> */}
      {/*         <div className="flex items-center gap-3"> */}
      {/*           <h2 className="text-2xl font-bold text-foreground tracking-tight"> */}
      {/*             Tournament Winners */}
      {/*           </h2> */}
      {/*           <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground"> */}
      {/*           </span> */}
      {/*         </div> */}
      {/*       </div> */}
      {/*     </div> */}

      {/*     <div className="mb-8"> */}
      {/*       <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"> */}
      {/*         <Trophy className="h-5 w-5 text-yellow-500" /> */}
      {/*         Win Statistics */}
      {/*         <span className="text-sm font-normal text-muted-foreground"> */}
      {/*         </span> */}
      {/*       </h3> */}
      {/*       <div className="overflow-x-auto h-[200px] sm:h-[250px] md:h-[300px] border border-gray-200 dark:border-gray-800 rounded-lg"> */}
      {/*         <table className="w-full text-sm"> */}
      {/*           <thead className="bg-accent text-accent-foreground sticky top-0 z-10"> */}
      {/*             <tr> */}
      {/*               <th className="p-3 text-left">Player</th> */}
      {/*               <th className="p-3 text-left">Times Placed</th> */}
      {/*             </tr> */}
      {/*           </thead> */}
      {/*           <tbody> */}
      {/*             {isLoading ? ( */}
      {/*               <tr> */}
      {/*                 <td */}
      {/*                   colSpan={2} */}
      {/*                   className="p-4 text-center text-muted-foreground" */}
      {/*                 > */}
      {/*                   Loading... */}
      {/*                 </td> */}
      {/*               </tr> */}
      {/*             ) : Object.keys(playerStats).length === 0 ? ( */}
      {/*               <tr> */}
      {/*                 <td */}
      {/*                   colSpan={2} */}
      {/*                   className="p-4 text-center text-muted-foreground" */}
      {/*                 > */}
      {/*                   No statistics available */}
      {/*                 </td> */}
      {/*               </tr> */}
      {/*             ) : ( */}
      {/*               Object.entries(playerStats) */}
      {/*                 .sort(([, countA], [, countB]) => countB - countA) */}
      {/*                 .map(([playerId, count]) => ( */}
      {/*                   <tr */}
      {/*                     key={playerId} */}
      {/*                     className="border-t border-gray-200 dark:border-gray-800 hover:bg-muted/30" */}
      {/*                   > */}
      {/*                     <td className="p-3 font-medium"> */}
      {/*                       {getPlayerName(playerId)} */}
      {/*                     </td> */}
      {/*                     <td className="p-3">{count}</td> */}
      {/*                   </tr> */}
      {/*                 )) */}
      {/*             )} */}
      {/*           </tbody> */}
      {/*         </table> */}
      {/*       </div> */}
      {/*     </div> */}

      {/*     <div> */}
      {/*       <h3 className="text-lg font-semibold mb-3">Tournament Results</h3> */}
      {/*       <div */}
      {/*         ref={resultsContainerRef} */}
      {/*         className="overflow-x-auto h-[250px] sm:h-[300px] md:h-[400px] border border-gray-200 dark:border-gray-800 rounded-lg" */}
      {/*       > */}
      {/*         <table className="w-full text-sm"> */}
      {/*           <thead className="bg-accent text-accent-foreground sticky top-0 z-10"> */}
      {/*             <tr> */}
      {/*               <th className="p-3 text-left">Tournament</th> */}
      {/*               <th className="p-3 text-left">1st Place</th> */}
      {/*               <th className="p-3 text-left">2nd Place</th> */}
      {/*               <th className="p-3 text-center">Actions</th> */}
      {/*             </tr> */}
      {/*           </thead> */}
      {/*           <tbody> */}
      {/*             {isLoading ? ( */}
      {/*               <tr> */}
      {/*                 <td */}
      {/*                   colSpan={4} */}
      {/*                   className="p-4 text-center text-muted-foreground" */}
      {/*                 > */}
      {/*                   Loading... */}
      {/*                 </td> */}
      {/*               </tr> */}
      {/*             ) : tournamentResults.length === 0 ? ( */}
      {/*               <tr> */}
      {/*                 <td */}
      {/*                   colSpan={4} */}
      {/*                   className="p-4 text-center text-muted-foreground" */}
      {/*                 > */}
      {/*                   No results recorded */}
      {/*                 </td> */}
      {/*               </tr> */}
      {/*             ) : ( */}
      {/*               displayedResults.map((result) => ( */}
      {/*                 <tr */}
      {/*                   key={result.id} */}
      {/*                   className="border-t border-gray-200 dark:border-gray-800 hover:bg-muted/30" */}
      {/*                 > */}
      {/*                   <td className="p-3 font-medium"> */}
      {/*                     {result.tournamentTitle} */}
      {/*                   </td> */}
      {/*                   <td className="p-3"> */}
      {/*                     {result.firstPlace */}
      {/*                       .map((id) => getPlayerName(id)) */}
      {/*                       .join(", ")} */}
      {/*                   </td> */}
      {/*                   <td className="p-3"> */}
      {/*                     {result.secondPlace */}
      {/*                       .map((id) => getPlayerName(id)) */}
      {/*                       .join(", ")} */}
      {/*                   </td> */}
      {/*                   <td className="p-3 text-center"> */}
      {/*                     {!readOnly && ( */}
      {/*                       <Button */}
      {/*                         variant="ghost" */}
      {/*                         size="sm" */}
      {/*                         onClick={() => handleDeleteResult(result.id)} */}
      {/*                         className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30" */}
      {/*                       > */}
      {/*                         <Trash2 className="h-4 w-4" /> */}
      {/*                       </Button> */}
      {/*                     )} */}
      {/*                   </td> */}
      {/*                 </tr> */}
      {/*               )) */}
      {/*             )} */}
      {/*             {isLoadingMore && ( */}
      {/*               <tr> */}
      {/*                 <td */}
      {/*                   colSpan={4} */}
      {/*                   className="p-4 text-center text-muted-foreground" */}
      {/*                 > */}
      {/*                   Loading more... */}
      {/*                 </td> */}
      {/*               </tr> */}
      {/*             )} */}
      {/*           </tbody> */}
      {/*         </table> */}
      {/*       </div> */}
      {/*     </div> */}
      {/*   </CardContent> */}
      {/* </Card> */}

      {/* Add Result Dialog */}
      {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}> */}
      {/* <DialogContent className="sm:max-w-md"> */}
      {/* <DialogHeader> */}
      {/* <DialogTitle>Add Tournament Result</DialogTitle> */}
      {/* </DialogHeader> */}
      <div className="space-y-4 py-4">
        {/* <div className="space-y-2"> */}
        {/*   <label className="text-sm font-medium"> */}
        {/*     Tournament <span className="text-red-500">*</span> */}
        {/*   </label> */}
        {/*   <Select */}
        {/*     value={newResult.tournamentId} */}
        {/*     onValueChange={(value) => */}
        {/*       setNewResult({ ...newResult, tournamentId: value }) */}
        {/*     } */}
        {/*     required */}
        {/*     defaultValue={ */}
        {/*       tournaments.length > 0 */}
        {/*         ? [...tournaments].sort((a, b) => { */}
        {/*             // Sort by createdAt if available, otherwise by startDate */}
        {/*             if (a.createdAt && b.createdAt) { */}
        {/*               return ( */}
        {/*                 new Date(b.createdAt).getTime() - */}
        {/*                 new Date(a.createdAt).getTime() */}
        {/*               ); */}
        {/*             } */}
        {/*             return ( */}
        {/*               new Date(b.startDate).getTime() - */}
        {/*               new Date(a.startDate).getTime() */}
        {/*             ); */}
        {/*           })[0]?.id */}
        {/*         : "" */}
        {/*     } */}
        {/*   > */}
        {/*     <SelectTrigger> */}
        {/*       <SelectValue placeholder="Select tournament" /> */}
        {/*     </SelectTrigger> */}
        {/*     <SelectContent> */}
        {/*       {tournaments */}
        {/*         .sort((a, b) => { */}
        {/*           // Sort by createdAt if available, otherwise by startDate */}
        {/*           if (a.createdAt && b.createdAt) { */}
        {/*             return ( */}
        {/*               new Date(b.createdAt).getTime() - */}
        {/*               new Date(a.createdAt).getTime() */}
        {/*             ); */}
        {/*           } */}
        {/*           return ( */}
        {/*             new Date(b.startDate).getTime() - */}
        {/*             new Date(a.startDate).getTime() */}
        {/*           ); */}
        {/*         }) */}
        {/*         .map((tournament) => ( */}
        {/*           <SelectItem key={tournament.id} value={tournament.id}> */}
        {/*             {tournament.title} */}
        {/*           </SelectItem> */}
        {/*         ))} */}
        {/*     </SelectContent> */}
        {/*   </Select> */}
        {/* </div> */}

        {/* <div className="space-y-2"> */}
        {/*   <label className="text-sm font-medium">1st Place</label> */}
        {/*   <div className="space-y-2"> */}
        {/*     <div className="relative"> */}
        {/*       <Input */}
        {/*         type="text" */}
        {/*         placeholder="Search player" */}
        {/*         value={playerSearch.firstPlace} */}
        {/*         onChange={(e) => { */}
        {/*           setPlayerSearch({ */}
        {/*             ...playerSearch, */}
        {/*             firstPlace: e.target.value, */}
        {/*           }); */}
        {/*           setActiveInput("firstPlace"); */}
        {/*         }} */}
        {/*         onFocus={() => setActiveInput("firstPlace")} */}
        {/*         className="pr-10" */}
        {/*       /> */}
        {/*       <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /> */}

        {/*       {filteredPlayers.length > 0 && */}
        {/*         activeInput === "firstPlace" && */}
        {/*         playerSearch.firstPlace && ( */}
        {/*           <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-md max-h-60 overflow-auto"> */}
        {/*             {filteredPlayers.map((player) => ( */}
        {/*               <div */}
        {/*                 key={player.id} */}
        {/*                 className="p-2 hover:bg-accent cursor-pointer" */}
        {/*                 onClick={() => { */}
        {/*                   // If first slot is empty, fill it */}
        {/*                   if (!newResult.firstPlace[0]) { */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       firstPlace: [player.id], */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   // If second slot doesn't exist yet, add player to second slot */}
        {/*                   else if (newResult.firstPlace.length === 1) { */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       firstPlace: [ */}
        {/*                         ...newResult.firstPlace, */}
        {/*                         player.id, */}
        {/*                       ], */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   // Replace the first empty slot found */}
        {/*                   else { */}
        {/*                     const updatedFirstPlace = [ */}
        {/*                       ...newResult.firstPlace, */}
        {/*                     ]; */}
        {/*                     const emptyIndex = updatedFirstPlace.findIndex( */}
        {/*                       (id) => !id, */}
        {/*                     ); */}
        {/*                     if (emptyIndex >= 0) { */}
        {/*                       updatedFirstPlace[emptyIndex] = player.id; */}
        {/*                     } else { */}
        {/*                       updatedFirstPlace.push(player.id); */}
        {/*                     } */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       firstPlace: updatedFirstPlace, */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   setPlayerSearch({ */}
        {/*                     ...playerSearch, */}
        {/*                     firstPlace: "", */}
        {/*                   }); */}
        {/*                 }} */}
        {/*               > */}
        {/*                 {player.name} */}
        {/*               </div> */}
        {/*             ))} */}
        {/*           </div> */}
        {/*         )} */}
        {/*     </div> */}

        {/*     <div className="space-y-2"> */}
        {/*       {newResult.firstPlace */}
        {/*         .filter((id) => id) */}
        {/*         .map((playerId, index) => ( */}
        {/*           <div */}
        {/*             key={index} */}
        {/*             className="p-2 bg-blue-100 dark:bg-blue-800/40 rounded-lg flex justify-between items-center border border-blue-200 dark:border-blue-700" */}
        {/*           > */}
        {/*             <span>{getPlayerName(playerId)}</span> */}
        {/*             <Button */}
        {/*               variant="ghost" */}
        {/*               size="sm" */}
        {/*               onClick={() => { */}
        {/*                 const updatedFirstPlace = [...newResult.firstPlace]; */}
        {/*                 updatedFirstPlace.splice(index, 1); */}
        {/*                 // Ensure there's always at least one slot */}
        {/*                 if (updatedFirstPlace.length === 0) */}
        {/*                   updatedFirstPlace.push(""); */}
        {/*                 setNewResult({ */}
        {/*                   ...newResult, */}
        {/*                   firstPlace: updatedFirstPlace, */}
        {/*                 }); */}
        {/*               }} */}
        {/*             > */}
        {/*               × */}
        {/*             </Button> */}
        {/*           </div> */}
        {/*         ))} */}

        {/*       {showAddPlayerButtons.firstPlace && ( */}
        {/*         <Button */}
        {/*           variant="outline" */}
        {/*           size="sm" */}
        {/*           className="w-full mt-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20" */}
        {/*           onClick={() => */}
        {/*             setNewResult({ */}
        {/*               ...newResult, */}
        {/*               firstPlace: [...newResult.firstPlace, ""], */}
        {/*             }) */}
        {/*           } */}
        {/*         > */}
        {/*           <Plus className="h-4 w-4 mr-2" /> */}
        {/*           Add Another Player */}
        {/*         </Button> */}
        {/*       )} */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}

        {/* <div className="space-y-2"> */}
        {/*   <label className="text-sm font-medium">2nd Place</label> */}
        {/*   <div className="space-y-2"> */}
        {/*     <div className="relative"> */}
        {/*       <Input */}
        {/*         type="text" */}
        {/*         placeholder="Search player" */}
        {/*         value={playerSearch.secondPlace} */}
        {/*         onChange={(e) => { */}
        {/*           setPlayerSearch({ */}
        {/*             ...playerSearch, */}
        {/*             secondPlace: e.target.value, */}
        {/*           }); */}
        {/*           setActiveInput("secondPlace"); */}
        {/*         }} */}
        {/*         onFocus={() => setActiveInput("secondPlace")} */}
        {/*         className="pr-10" */}
        {/*       /> */}
        {/*       <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" /> */}

        {/*       {filteredPlayers.length > 0 && */}
        {/*         activeInput === "secondPlace" && */}
        {/*         playerSearch.secondPlace && ( */}
        {/*           <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-md shadow-md max-h-60 overflow-auto"> */}
        {/*             {filteredPlayers.map((player) => ( */}
        {/*               <div */}
        {/*                 key={player.id} */}
        {/*                 className="p-2 hover:bg-accent cursor-pointer" */}
        {/*                 onClick={() => { */}
        {/*                   // If first slot is empty, fill it */}
        {/*                   if (!newResult.secondPlace[0]) { */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       secondPlace: [player.id], */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   // If second slot doesn't exist yet, add player to second slot */}
        {/*                   else if (newResult.secondPlace.length === 1) { */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       secondPlace: [ */}
        {/*                         ...newResult.secondPlace, */}
        {/*                         player.id, */}
        {/*                       ], */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   // Replace the first empty slot found */}
        {/*                   else { */}
        {/*                     const updatedSecondPlace = [ */}
        {/*                       ...newResult.secondPlace, */}
        {/*                     ]; */}
        {/*                     const emptyIndex = updatedSecondPlace.findIndex( */}
        {/*                       (id) => !id, */}
        {/*                     ); */}
        {/*                     if (emptyIndex >= 0) { */}
        {/*                       updatedSecondPlace[emptyIndex] = player.id; */}
        {/*                     } else { */}
        {/*                       updatedSecondPlace.push(player.id); */}
        {/*                     } */}
        {/*                     setNewResult({ */}
        {/*                       ...newResult, */}
        {/*                       secondPlace: updatedSecondPlace, */}
        {/*                     }); */}
        {/*                   } */}
        {/*                   setPlayerSearch({ */}
        {/*                     ...playerSearch, */}
        {/*                     secondPlace: "", */}
        {/*                   }); */}
        {/*                 }} */}
        {/*               > */}
        {/*                 {player.name} */}
        {/*               </div> */}
        {/*             ))} */}
        {/*           </div> */}
        {/*         )} */}
        {/*     </div> */}

        {/*     <div className="space-y-2"> */}
        {/*       {newResult.secondPlace */}
        {/*         .filter((id) => id) */}
        {/*         .map((playerId, index) => ( */}
        {/*           <div */}
        {/*             key={index} */}
        {/*             className="p-2 bg-gray-100 dark:bg-gray-800/40 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700" */}
        {/*           > */}
        {/*             <span>{getPlayerName(playerId)}</span> */}
        {/*             <Button */}
        {/*               variant="ghost" */}
        {/*               size="sm" */}
        {/*               onClick={() => { */}
        {/*                 const updatedSecondPlace = [ */}
        {/*                   ...newResult.secondPlace, */}
        {/*                 ]; */}
        {/*                 updatedSecondPlace.splice(index, 1); */}
        {/*                 // Ensure there's always at least one slot */}
        {/*                 if (updatedSecondPlace.length === 0) */}
        {/*                   updatedSecondPlace.push(""); */}
        {/*                 setNewResult({ */}
        {/*                   ...newResult, */}
        {/*                   secondPlace: updatedSecondPlace, */}
        {/*                 }); */}
        {/*               }} */}
        {/*             > */}
        {/*               × */}
        {/*             </Button> */}
        {/*           </div> */}
        {/*         ))} */}

        {/*       {showAddPlayerButtons.secondPlace && ( */}
        {/*         <Button */}
        {/*           variant="outline" */}
        {/*           size="sm" */}
        {/*           className="w-full mt-2 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/20" */}
        {/*           onClick={() => */}
        {/*             setNewResult({ */}
        {/*               ...newResult, */}
        {/*               secondPlace: [...newResult.secondPlace, ""], */}
        {/*             }) */}
        {/*           } */}
        {/*         > */}
        {/*           <Plus className="h-4 w-4 mr-2" /> */}
        {/*           Add Another Player */}
        {/*         </Button> */}
        {/*       )} */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}

        {/* Warning message removed as requested */}
      </div>
      {/* <DialogFooter> */}
      {/*   <Button variant="outline" onClick={() => setIsDialogOpen(false)}> */}
      {/*     Cancel */}
      {/*   </Button> */}
      {/*   <Button */}
      {/*     onClick={handleAddResult} */}
      {/*     disabled={isSaving || !newResult.tournamentId} */}
      {/*   > */}
      {/*     {isSaving ? "Saving..." : "Save Result"} */}
      {/*   </Button> */}
      {/* </DialogFooter> */}
      {/* </DialogContent> */}
      {/* </Dialog> */}
    </div>
  );
}
