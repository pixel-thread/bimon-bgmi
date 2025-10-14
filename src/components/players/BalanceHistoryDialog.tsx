"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { History, TrendingUp, TrendingDown } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { toast } from "sonner";
import { LoaderFive } from "@/src/components/ui/loader";
import { PlayerT } from "@/src/types/player";

interface BalanceHistory {
  id: string;
  playerId: string;
  playerName: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  timestamp: string;
}

interface BalanceHistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerT | null;
  selectedSeason: string;
}

export function BalanceHistoryDialog({
  isOpen,
  onOpenChange,
  player,
  selectedSeason,
}: BalanceHistoryDialogProps) {
  const [balanceHistory, setBalanceHistory] = useState<
    (BalanceHistory & { tournamentId?: string })[]
  >([]);
  const [displayedHistory, setDisplayedHistory] = useState<
    (BalanceHistory & { tournamentId?: string })[]
  >([]);
  const [isLoadingBalanceHistory, setIsLoadingBalanceHistory] = useState(false);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Tournament cache with TTL
  const tournamentCache = useMemo(
    () =>
      new Map<
        string,
        { title: string; seasonId?: string; timestamp: number }
      >(),
    [],
  );

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const getTournamentData = useCallback(async (): Promise<
    Map<string, { title: string; seasonId?: string }>
  > => {
    const now = Date.now();

    if (tournamentCache.size > 0) {
      const firstEntry = tournamentCache.values().next().value;
      if (firstEntry && now - firstEntry.timestamp < CACHE_TTL) {
        const result = new Map<string, { title: string; seasonId?: string }>();
        tournamentCache.forEach((value, key) => {
          result.set(key, { title: value.title, seasonId: value.seasonId });
        });
        return result;
      }
    }

    try {
      const snapshot = await getDocs(collection(db, "tournaments"));
      const result = new Map<string, { title: string; seasonId?: string }>();
      tournamentCache.clear();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const tournamentInfo = {
          title: data.title || "Unknown Tournament",
          seasonId: data.seasonId,
          timestamp: now,
        };
        tournamentCache.set(doc.id, tournamentInfo);
        result.set(doc.id, {
          title: tournamentInfo.title,
          seasonId: tournamentInfo.seasonId,
        });
      });

      return result;
    } catch (error) {
      console.error("Failed to fetch tournament data:", error);
      throw new Error("Unable to load tournament information");
    }
  }, [tournamentCache]);

  const processTransactionDescription = useCallback(
    (
      description: string,
      tournamentId: string | undefined,
      tournamentsMap: Map<string, { title: string; seasonId?: string }>,
    ): string => {
      if (!tournamentId || !tournamentsMap.has(tournamentId)) {
        return description;
      }
      const tournamentTitle = tournamentsMap.get(tournamentId)?.title;
      if (!tournamentTitle) return description;

      return description.replace(
        /\(tournament_[a-zA-Z0-9_]+\)/g,
        `(${tournamentTitle})`,
      );
    },
    [],
  );

  const filterTransactionsBySeason = useCallback(
    (
      transactions: (BalanceHistory & { tournamentId?: string })[],
      season: string,
      seasonTournamentIds: Set<string>,
      seasonData?: { startDate?: string; endDate?: string; isActive?: boolean },
    ): (BalanceHistory & { tournamentId?: string })[] => {
      // Helper to safely convert Firestore Timestamp or string/date-like to JS Date
      const toJSDate = (value: any): Date | null => {
        if (!value) return null;
        try {
          if (typeof value?.toDate === "function") {
            const d = value.toDate();
            return isNaN(d.getTime()) ? null : d;
          }
          const d = new Date(value);
          return isNaN(d.getTime()) ? null : d;
        } catch {
          return null;
        }
      };

      return transactions.filter((transaction) => {
        if (transaction.tournamentId) {
          if (season === "all") return true;
          return seasonTournamentIds.has(transaction.tournamentId);
        }

        if (season === "all") return true;

        const start = seasonData?.startDate
          ? toJSDate(seasonData.startDate)
          : null;
        if (start) {
          const tDate = toJSDate((transaction as any).timestamp);
          if (!tDate) return true; // If transaction date can't be parsed, do not hide it

          const now = new Date();
          now.setHours(23, 59, 59, 999);

          let end: Date;
          if (seasonData?.endDate) {
            end = toJSDate(seasonData.endDate) || now;
          } else {
            end = seasonData?.isActive
              ? now
              : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
          }

          const isSameDayRange =
            !!seasonData?.endDate &&
            !!start &&
            !!end &&
            start.toDateString() === end.toDateString();

          const effectiveEnd = isSameDayRange ? now : end;

          const tOnly = new Date(
            tDate.getFullYear(),
            tDate.getMonth(),
            tDate.getDate(),
          );
          const startOnly = new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
          );
          const endOnly = new Date(
            effectiveEnd.getFullYear(),
            effectiveEnd.getMonth(),
            effectiveEnd.getDate(),
          );

          return tOnly >= startOnly && tOnly <= endOnly;
        }

        console.log(
          `No valid season startDate for manual transaction filtering. Season: ${season}, Transaction: ${transaction.description}`,
        );
        return true;
      });
    },
    [],
  );

  const fetchBalanceHistory = useCallback(
    async (playerId: string, reset: boolean = true) => {
      if (reset) {
        setIsLoadingBalanceHistory(true);
        setHistoryPage(1);
      } else {
        setIsLoadingMoreHistory(true);
      }

      try {
        const [transactionsSnapshot, tournamentsMap, seasonsSnapshot] =
          await Promise.all([
            getDocs(collection(db, `players/${playerId}/transactions`)),
            getTournamentData(),
            selectedSeason !== "all"
              ? getDocs(collection(db, "seasons"))
              : Promise.resolve(null),
          ]);

        const selectedSeasonData = seasonsSnapshot?.docs
          .find((doc) => doc.id === selectedSeason)
          ?.data();

        console.log("Season filtering debug:", {
          selectedSeason,
          seasonData: selectedSeasonData,
          hasSeasonData: !!selectedSeasonData,
          startDate: selectedSeasonData?.startDate,
          endDate: selectedSeasonData?.endDate,
          isActive: selectedSeasonData?.isActive,
        });

        const seasonTournamentIds = new Set<string>();
        tournamentsMap.forEach((tournamentInfo, tournamentId) => {
          const shouldInclude =
            selectedSeason === "all" ||
            tournamentInfo.seasonId === selectedSeason ||
            (!tournamentInfo.seasonId && selectedSeason === "season_1");
          if (shouldInclude) {
            seasonTournamentIds.add(tournamentId);
          }
        });

        const transactions = transactionsSnapshot.docs
          .map((doc) => {
            try {
              const data = doc.data();
              const description = processTransactionDescription(
                data.reason || "No description",
                data.tournamentId,
                tournamentsMap,
              );
              const createdAtValue = data.createdAt;
              const createdAtIso =
                createdAtValue && typeof createdAtValue?.toDate === "function"
                  ? createdAtValue.toDate().toISOString()
                  : typeof createdAtValue === "string"
                    ? createdAtValue
                    : new Date().toISOString();
              return {
                id: doc.id,
                playerId,
                playerName: "",
                amount: Math.abs(Number(data.amount) || 0),
                type: data.type === "deduct" ? "debit" : "credit",
                description,
                timestamp: createdAtIso,
                tournamentId: data.tournamentId,
              } as BalanceHistory & { tournamentId?: string };
            } catch (error) {
              console.warn(`Failed to process transaction ${doc.id}:`, error);
              return null;
            }
          })
          .filter(
            (
              transaction,
            ): transaction is BalanceHistory & { tournamentId?: string } =>
              transaction !== null,
          );

        const filteredTransactions = filterTransactionsBySeason(
          transactions,
          selectedSeason,
          seasonTournamentIds,
          selectedSeasonData,
        );

        const sortedTransactions = filteredTransactions.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return isNaN(timeB) ? -1 : isNaN(timeA) ? 1 : timeB - timeA;
        });

        setBalanceHistory(sortedTransactions);
        const itemsPerPage = 10;
        const currentPage = reset ? 1 : historyPage + 1;
        const endIndex = currentPage * itemsPerPage;
        setDisplayedHistory(sortedTransactions.slice(0, endIndex));
        if (!reset) {
          setHistoryPage(currentPage);
        }
      } catch (error) {
        console.error("Error fetching balance history:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load balance history";
        toast.error(errorMessage);
        setBalanceHistory([]);
        setDisplayedHistory([]);
      } finally {
        setIsLoadingBalanceHistory(false);
        setIsLoadingMoreHistory(false);
      }
    },
    [
      selectedSeason,
      getTournamentData,
      processTransactionDescription,
      filterTransactionsBySeason,
      historyPage,
    ],
  );

  const handleLoadMoreHistory = async () => {
    if (player) {
      await fetchBalanceHistory(player.id, false);
    }
  };

  React.useEffect(() => {
    if (isOpen && player) {
      fetchBalanceHistory(player.id, true);
    }
  }, [isOpen, player, fetchBalanceHistory]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Balance History - {player?.user.userName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isLoadingBalanceHistory ? (
            <div className="flex items-center justify-center py-12">
              <LoaderFive text="Loading balance history..." />
            </div>
          ) : displayedHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No balance history found for this player.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={
                          entry.type === "credit"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }
                      >
                        {entry.type === "credit" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {entry.type === "credit" ? "Credit" : "Debit"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        entry.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {entry.type === "credit" ? "+" : "-"}₹
                      {Math.abs(entry.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          {displayedHistory.length < balanceHistory.length && (
            <Button
              variant="outline"
              onClick={handleLoadMoreHistory}
              disabled={isLoadingMoreHistory}
              className="w-full sm:w-auto sm:mr-auto"
            >
              {isLoadingMoreHistory
                ? "Loading..."
                : `Load More (${
                    balanceHistory.length - displayedHistory.length
                  } remaining)`}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
