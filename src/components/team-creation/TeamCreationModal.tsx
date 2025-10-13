"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { Player, TournamentConfig } from "@/src/lib/types";
import { useTournaments } from "@/src/hooks/useTournaments";
import { Loader2 } from "lucide-react";
import { generateTeamsNew, Team } from "@/src/lib/teamGenerator";
import {
  tournamentParticipationService,
  TournamentParticipant,
} from "@/src/lib/tournamentParticipationService";
import { pollService } from "@/src/lib/pollService";
import { TeamModeSelector } from "./TeamModeSelector";

import { SelectionSummary } from "./SelectionSummary";
import { CategoryTabs } from "./CategoryTabs";
import { PlayerSearchInput } from "./PlayerSearchInput";
import { SelectAllControl } from "./SelectAllControl";
import { PlayerGrid } from "./PlayerGrid";
import { ActionButtons } from "./ActionButtons";
import {
  TeamCreationModalProps,
  PlayerSelectionState,
  TeamCreationState,
  TeamMode,
} from "./types";
import { useTournamentStore } from "@/src/store/tournament";
import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";

export default function TeamCreationModal({
  showModal,
  setShowModal,
  setShowConfirmModal,
  setTeamsToCreate,
}: TeamCreationModalProps) {
  const { tournamentId: selectedTournament } = useTournamentStore();

  const [state, setState] = useState<TeamCreationState>({
    players: { ultraNoobs: [], noobs: [], pros: [], ultraPros: [] },
    teamMode: "Duo 2",
    loading: true,
    generating: false,
    saving: false,
    activeTab: "noobs",
    tournamentTitle: null,
    searchQuery: "",
    savedPlayers: [],

    playerStats: {},
    tournamentParticipants: [],
  });

  const [selection, setSelection] = useState<PlayerSelectionState>({
    selectedUltraNoobs: [],
    selectedNoobs: [],
    selectedPros: [],
    selectedUltraPros: [],
    selectedSoloPlayers: [],
    excludedFromDeduction: new Set(),
  });

  const [syncingParticipants, setSyncingParticipants] = useState(false);

  const autoSyncTriggered = useRef(false);

  const { tournaments } = useTournaments();
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const updateState = (updates: Partial<TeamCreationState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const updateSelection = (updates: Partial<PlayerSelectionState>) => {
    setSelection((prev) => ({ ...prev, ...updates }));
  };

  // Auto-scroll to CategoryTabs when modal opens or activeTab changes
  useEffect(() => {
    if (
      showModal &&
      tabsRef.current &&
      scrollContainerRef.current &&
      !state.loading
    ) {
      const tabsTop = tabsRef.current.getBoundingClientRect().top;
      const containerTop =
        scrollContainerRef.current.getBoundingClientRect().top;
      const scrollOffset = tabsTop - containerTop;
      scrollContainerRef.current.scrollTo({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  }, [showModal, state.loading, state.activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      updateState({ loading: true });
      try {
        const playersSnapshot = await getDocs(collection(db, "players"));
        const ultraNoobs: Player[] = [];
        const noobs: Player[] = [];
        const pros: Player[] = [];
        const ultraPros: Player[] = [];

        playersSnapshot.forEach((doc) => {
          const playerData = { id: doc.id, ...doc.data() } as Player;
          // Skip deleted or banned players
          if (playerData.deleted || playerData.isBanned) return;

          switch (playerData.category) {
            case "Ultra Noob":
              ultraNoobs.push(playerData);
              break;
            case "Noob":
              noobs.push(playerData);
              break;
            case "Pro":
              pros.push(playerData);
              break;
            case "Ultra Pro":
              ultraPros.push(playerData);
              break;
          }
        });

        updateState({ players: { ultraNoobs, noobs, pros, ultraPros } });

        if (selectedTournament) {
          const tournamentDoc = await getDoc(
            doc(db, "tournaments", selectedTournament),
          );
          updateState({
            tournamentTitle: tournamentDoc.exists()
              ? (tournamentDoc.data() as TournamentConfig).title
              : null,
          });

          // Ensure votes are synced before we fetch participants locally
          await syncParticipantsFromVotes();

          try {
            const participants =
              await tournamentParticipationService.getTournamentParticipants(
                selectedTournament,
              );
            updateState({ tournamentParticipants: participants });

            const savedDoc = await getDoc(
              doc(db, "teamSelections", selectedTournament),
            );
            const hasSavedPlayers =
              savedDoc.exists() && savedDoc.data()?.savedPlayers?.length > 0;

            if (!hasSavedPlayers) {
              const participatingPlayers = participants.filter(
                (p) => p.status === "in",
              );
              const soloPlayers = participants.filter(
                (p) => p.status === "solo",
              );

              const selectedUNs: string[] = [];
              const selectedNs: string[] = [];
              const selectedPs: string[] = [];
              const selectedUPs: string[] = [];
              const selectedSolos: string[] = [];

              const getParticipantPlayerId = (participant: any) => {
                // Prefer explicit player id field if present, otherwise parse from doc id (playerId_tournamentId)
                const rawId = participant?.id as string;
                if (!rawId) return rawId;
                if (
                  state.players.ultraNoobs
                    .concat(
                      state.players.noobs,
                      state.players.pros,
                      state.players.ultraPros,
                    )
                    .some((p) => p.id === rawId)
                ) {
                  return rawId;
                }
                const parsed = rawId.includes("_")
                  ? rawId.split("_")[0]
                  : rawId;
                return parsed;
              };

              participatingPlayers.forEach((participant) => {
                const participantPlayerId = getParticipantPlayerId(participant);
                const player = [
                  ...ultraNoobs,
                  ...noobs,
                  ...pros,
                  ...ultraPros,
                ].find((p) => p.id === participantPlayerId);
                if (player) {
                  switch (player.category) {
                    case "Ultra Noob":
                      selectedUNs.push(player.id);
                      break;
                    case "Noob":
                      selectedNs.push(player.id);
                      break;
                    case "Pro":
                      selectedPs.push(player.id);
                      break;
                    case "Ultra Pro":
                      selectedUPs.push(player.id);
                      break;
                  }
                }
              });

              soloPlayers.forEach((participant) => {
                const participantPlayerId = getParticipantPlayerId(participant);
                const player = [
                  ...ultraNoobs,
                  ...noobs,
                  ...pros,
                  ...ultraPros,
                ].find((p) => p.id === participantPlayerId);
                if (player) {
                  selectedSolos.push(player.id);
                }
              });

              updateSelection({
                selectedUltraNoobs: selectedUNs,
                selectedNoobs: selectedNs,
                selectedPros: selectedPs,
                selectedUltraPros: selectedUPs,
                selectedSoloPlayers: selectedSolos,
              });
            } else {
              // If there are saved players, trust them fully and do not override with participant defaults
              const saved = savedDoc.data()?.savedPlayers || [];
              const soloSaved = savedDoc.data()?.soloPlayers || [];
              updateSelection({
                selectedUltraNoobs: state.players.ultraNoobs
                  .filter(
                    (p) => saved.includes(p.id) && !soloSaved.includes(p.id),
                  )
                  .map((p) => p.id),
                selectedNoobs: state.players.noobs
                  .filter(
                    (p) => saved.includes(p.id) && !soloSaved.includes(p.id),
                  )
                  .map((p) => p.id),
                selectedPros: state.players.pros
                  .filter(
                    (p) => saved.includes(p.id) && !soloSaved.includes(p.id),
                  )
                  .map((p) => p.id),
                selectedUltraPros: state.players.ultraPros
                  .filter(
                    (p) => saved.includes(p.id) && !soloSaved.includes(p.id),
                  )
                  .map((p) => p.id),
                selectedSoloPlayers: soloSaved,
                excludedFromDeduction: new Set(
                  savedDoc.data()?.excludedFromDeduction || [],
                ),
              });
            }
          } catch (error) {
            console.error("Error fetching tournament participants:", error);
            updateState({ tournamentParticipants: [] });
          }
        } else {
          updateState({ tournamentTitle: null, tournamentParticipants: [] });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        updateState({ tournamentTitle: null });
      } finally {
        updateState({ loading: false });
      }
    };

    if (showModal) fetchData();
  }, [showModal, selectedTournament]);

  useEffect(() => {
    const fetchSavedPlayers = async () => {
      if (!selectedTournament) return;
      updateState({ loading: true });

      try {
        const docSnap = await getDoc(
          doc(db, "teamSelections", selectedTournament),
        );
        if (docSnap.exists()) {
          const data = docSnap.data();
          const savedIds: string[] = Array.isArray(data.savedPlayers)
            ? data.savedPlayers
            : [];
          const soloIds: string[] = Array.isArray(data.soloPlayers)
            ? data.soloPlayers
            : [];
          const soloSet = new Set<string>(soloIds);

          // Only override selections when we have an explicit saved selection
          if (savedIds.length > 0) {
            updateState({ savedPlayers: savedIds });
            updateSelection({
              // Exclude solo players from category selections to prevent double counting
              selectedUltraNoobs: state.players.ultraNoobs
                .filter((p) => savedIds.includes(p.id) && !soloSet.has(p.id))
                .map((p) => p.id),
              selectedNoobs: state.players.noobs
                .filter((p) => savedIds.includes(p.id) && !soloSet.has(p.id))
                .map((p) => p.id),
              selectedPros: state.players.pros
                .filter((p) => savedIds.includes(p.id) && !soloSet.has(p.id))
                .map((p) => p.id),
              selectedUltraPros: state.players.ultraPros
                .filter((p) => savedIds.includes(p.id) && !soloSet.has(p.id))
                .map((p) => p.id),
              selectedSoloPlayers: soloIds,
              excludedFromDeduction: new Set(data.excludedFromDeduction || []),
            });
          } else {
            // Respect participant-based auto-selection; only apply exclusions if present
            if (Array.isArray(data.excludedFromDeduction)) {
              updateSelection({
                excludedFromDeduction: new Set(data.excludedFromDeduction),
              });
            }
          }
        }
      } catch (e) {
        console.error("Error fetching saved players:", e);
      }

      updateState({ loading: false });
    };

    fetchSavedPlayers();
  }, [selectedTournament]);

  // Keep tournament participants in sync real-time to match vote UI
  useEffect(() => {
    if (!selectedTournament) return;
    const unsubscribe =
      tournamentParticipationService.subscribeToTournamentParticipants(
        selectedTournament,
        (participants) => {
          updateState({ tournamentParticipants: participants });
        },
      );
    return () => unsubscribe();
  }, [selectedTournament]);

  const sortedPlayers = useMemo(() => {
    const sortByBalance = (players: Player[]) =>
      players.slice().sort((a, b) => {
        const balanceA = a.balance ?? 0;
        const balanceB = b.balance ?? 0;
        return balanceB - balanceA || a.name.localeCompare(b.name);
      });

    return {
      ultraNoobs: sortByBalance(state.players.ultraNoobs),
      noobs: sortByBalance(state.players.noobs),
      pros: sortByBalance(state.players.pros),
      ultraPros: sortByBalance(state.players.ultraPros),
    };
  }, [state.players]);

  const filteredPlayers = useMemo(() => {
    const query = state.searchQuery.toLowerCase();
    const allPlayers = [
      ...sortedPlayers.ultraNoobs,
      ...sortedPlayers.noobs,
      ...sortedPlayers.pros,
      ...sortedPlayers.ultraPros,
    ];

    const soloTabPlayers = query
      ? allPlayers.filter((p) => p.name.toLowerCase().includes(query))
      : [
          ...sortedPlayers.ultraNoobs.filter((p) =>
            selection.selectedSoloPlayers.includes(p.id),
          ),
          ...sortedPlayers.noobs.filter((p) =>
            selection.selectedSoloPlayers.includes(p.id),
          ),
          ...sortedPlayers.pros.filter((p) =>
            selection.selectedSoloPlayers.includes(p.id),
          ),
          ...sortedPlayers.ultraPros.filter((p) =>
            selection.selectedSoloPlayers.includes(p.id),
          ),
        ];

    return {
      ultraNoobs: sortedPlayers.ultraNoobs.filter((p) =>
        p.name.toLowerCase().includes(query),
      ),
      noobs: sortedPlayers.noobs.filter((p) =>
        p.name.toLowerCase().includes(query),
      ),
      pros: sortedPlayers.pros.filter((p) =>
        p.name.toLowerCase().includes(query),
      ),
      ultraPros: sortedPlayers.ultraPros.filter((p) =>
        p.name.toLowerCase().includes(query),
      ),
      solo: soloTabPlayers,
    };
  }, [sortedPlayers, state.searchQuery, selection.selectedSoloPlayers]);

  const participantDiagnostics = useMemo(() => {
    const allActivePlayers = [
      ...state.players.ultraNoobs,
      ...state.players.noobs,
      ...state.players.pros,
      ...state.players.ultraPros,
    ];

    // If players haven't loaded yet, avoid false negatives
    if (allActivePlayers.length === 0) {
      return {
        inCount: 0,
        soloCount: 0,
        expectedTotal: 0,
        foundCount: 0,
        missing: [] as { id: string; name: string; status: "in" | "solo" }[],
      };
    }

    const activeById = new Map(allActivePlayers.map((p) => [p.id, p]));
    const activeByNameLower = new Map(
      allActivePlayers.map((p) => [p.name.toLowerCase(), p]),
    );

    const inParticipants = state.tournamentParticipants.filter(
      (p) => p.status === "in",
    );
    const soloParticipants = state.tournamentParticipants.filter(
      (p) => p.status === "solo",
    );

    const expectedTotal = inParticipants.length + soloParticipants.length;

    const resolvePlayerId = (participant: any): string | null => {
      const rawId: string | undefined = participant?.id;
      if (rawId && activeById.has(rawId)) return rawId;
      const docId: string | undefined = participant?.documentId;
      if (docId) {
        const parsed = docId.includes("_") ? docId.split("_")[0] : docId;
        if (activeById.has(parsed)) return parsed;
      }
      const name: string | undefined = participant?.playerName;
      if (name) {
        const byName = activeByNameLower.get(name.toLowerCase());
        if (byName) return byName.id;
      }
      return null;
    };

    const missing: { id: string; name: string; status: "in" | "solo" }[] = [];
    [...inParticipants, ...soloParticipants].forEach((p: any) => {
      const resolvedId = resolvePlayerId(p);
      if (!resolvedId || !activeById.has(resolvedId)) {
        missing.push({
          id: p.id,
          name: (p as any).playerName || p.id,
          status: p.status,
        });
      }
    });

    const foundCount = expectedTotal - missing.length;

    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "TeamCreation diagnostics — excluded participants:",
        missing,
      );
    }

    return {
      inCount: inParticipants.length,
      soloCount: soloParticipants.length,
      expectedTotal,
      foundCount,
      missing,
    };
  }, [state.players, state.tournamentParticipants]);

  const participantResolved = useMemo(() => {
    const allActivePlayers = [
      ...state.players.ultraNoobs,
      ...state.players.noobs,
      ...state.players.pros,
      ...state.players.ultraPros,
    ];
    const activeById = new Map(allActivePlayers.map((p) => [p.id, p]));
    const activeByNameLower = new Map(
      allActivePlayers.map((p) => [p.name.toLowerCase(), p]),
    );

    const resolvePlayerId = (participant: any): string | null => {
      const rawId: string | undefined = participant?.id;
      if (rawId && activeById.has(rawId)) return rawId;
      const docId: string | undefined = participant?.documentId;
      if (docId) {
        const parsed = docId.includes("_") ? docId.split("_")[0] : docId;
        if (activeById.has(parsed)) return parsed;
      }
      const name: string | undefined = participant?.playerName;
      if (name) {
        const byName = activeByNameLower.get(name.toLowerCase());
        if (byName) return byName.id;
      }
      return null;
    };

    const inIds: string[] = [];
    const soloIds: string[] = [];
    state.tournamentParticipants.forEach((p: any) => {
      if (p.status !== "in" && p.status !== "solo") return;
      const id = resolvePlayerId(p);
      if (!id) return;
      if (p.status === "in") inIds.push(id);
      else soloIds.push(id);
    });

    return { inIds, soloIds };
  }, [state.players, state.tournamentParticipants]);

  const syncParticipantsFromVotes = async () => {
    if (!selectedTournament) return;
    setSyncingParticipants(true);
    try {
      const polls = await pollService.getAllPolls();
      const tournamentPolls = (polls || []).filter(
        (p) =>
          p.type === "tournament_participation" &&
          p.tournamentId === selectedTournament,
      );
      if (tournamentPolls.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(
          "No tournament participation polls found for selected tournament",
        );
        setSyncingParticipants(false);
        return;
      }
      // Pick latest by createdAt
      const latestPoll = tournamentPolls
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0];

      const votes = await pollService.getPollResults(latestPoll.id);

      const inferStatus = (voteText: string): "in" | "out" | "solo" => {
        const text = voteText.toLowerCase();
        const options = latestPoll.options as any[] | undefined;
        if (options && Array.isArray(options)) {
          const opt = options.find(
            (o: any) => (typeof o === "string" ? o : o.text) === voteText,
          );
          if (opt && typeof opt === "object" && opt.action) {
            return opt.action as any;
          }
        }
        if (text.includes("solo")) return "solo";
        if (text.includes("out") || text.includes("rei")) return "out";
        return "in";
      };

      // Latest vote per playerId
      const latestByPlayer: Record<string, (typeof votes)[number]> = {};
      votes.forEach((v) => {
        const current = latestByPlayer[v.playerId];
        if (
          !current ||
          new Date(v.votedAt).getTime() > new Date(current.votedAt).getTime()
        ) {
          latestByPlayer[v.playerId] = v;
        }
      });

      const latest = Object.values(latestByPlayer).map((v) => ({
        ...v,
        status: inferStatus(v.vote),
      }));

      // Apply to tournament_participants
      for (const v of latest) {
        await tournamentParticipationService.updateParticipation(
          selectedTournament,
          v.playerId,
          v.playerName,
          v.status as "in" | "out" | "solo",
        );
      }

      // Refresh local participants
      const refreshed =
        await tournamentParticipationService.getTournamentParticipants(
          selectedTournament,
        );
      updateState({ tournamentParticipants: refreshed });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to sync participants from votes", e);
    } finally {
      setSyncingParticipants(false);
    }
  };

  // Auto-sync participants from latest votes if mismatch is detected
  useEffect(() => {
    if (
      participantDiagnostics.expectedTotal > 0 &&
      participantDiagnostics.missing.length > 0 &&
      !syncingParticipants &&
      !autoSyncTriggered.current
    ) {
      autoSyncTriggered.current = true;
      // eslint-disable-next-line no-console
      console.log(
        "Auto-syncing participants from votes due to mismatch",
        participantDiagnostics,
      );
      syncParticipantsFromVotes();
    }
  }, [participantDiagnostics, syncingParticipants]);

  const totalSelectedPlayers = useMemo(() => {
    const unique = new Set<string>([
      ...state.savedPlayers,
      ...selection.selectedUltraNoobs,
      ...selection.selectedNoobs,
      ...selection.selectedPros,
      ...selection.selectedUltraPros,
      ...selection.selectedSoloPlayers,
      ...participantResolved.inIds,
      ...participantResolved.soloIds,
    ]);
    return unique.size;
  }, [state.savedPlayers, selection, participantResolved]);

  const handleSelectAll = (
    category: "Ultra Noob" | "Noob" | "Pro" | "Ultra Pro" | "Solo",
  ) => {
    const toggleSelection = (current: string[], all: Player[]) =>
      current.length === all.length ? [] : all.map((p) => p.id);

    let selectedIds: string[] = [];
    const isSelecting =
      category === "Ultra Noob"
        ? selection.selectedUltraNoobs.length !==
          sortedPlayers.ultraNoobs.length
        : category === "Noob"
          ? selection.selectedNoobs.length !== sortedPlayers.noobs.length
          : category === "Pro"
            ? selection.selectedPros.length !== sortedPlayers.pros.length
            : category === "Ultra Pro"
              ? selection.selectedUltraPros.length !==
                sortedPlayers.ultraPros.length
              : selection.selectedSoloPlayers.length !==
                filteredPlayers.solo.length;

    switch (category) {
      case "Ultra Noob":
        selectedIds = toggleSelection(
          selection.selectedUltraNoobs,
          sortedPlayers.ultraNoobs,
        );
        updateSelection({ selectedUltraNoobs: selectedIds });
        if (isSelecting) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => !selectedIds.includes(id),
            ),
          });
        }
        break;
      case "Noob":
        selectedIds = toggleSelection(
          selection.selectedNoobs,
          sortedPlayers.noobs,
        );
        updateSelection({ selectedNoobs: selectedIds });
        if (isSelecting) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => !selectedIds.includes(id),
            ),
          });
        }
        break;
      case "Pro":
        selectedIds = toggleSelection(
          selection.selectedPros,
          sortedPlayers.pros,
        );
        updateSelection({ selectedPros: selectedIds });
        if (isSelecting) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => !selectedIds.includes(id),
            ),
          });
        }
        break;
      case "Ultra Pro":
        selectedIds = toggleSelection(
          selection.selectedUltraPros,
          sortedPlayers.ultraPros,
        );
        updateSelection({ selectedUltraPros: selectedIds });
        if (isSelecting) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => !selectedIds.includes(id),
            ),
          });
        }
        break;
      case "Solo":
        const currentSoloPlayers = filteredPlayers.solo;
        selectedIds = toggleSelection(
          selection.selectedSoloPlayers,
          currentSoloPlayers,
        );
        updateSelection({ selectedSoloPlayers: selectedIds });
        if (isSelecting) {
          updateSelection({
            selectedUltraNoobs: selection.selectedUltraNoobs.filter(
              (id) => !selectedIds.includes(id),
            ),
            selectedNoobs: selection.selectedNoobs.filter(
              (id) => !selectedIds.includes(id),
            ),
            selectedPros: selection.selectedPros.filter(
              (id) => !selectedIds.includes(id),
            ),
            selectedUltraPros: selection.selectedUltraPros.filter(
              (id) => !selectedIds.includes(id),
            ),
          });
        }
        break;
    }

    const newExcluded = new Set(selection.excludedFromDeduction);
    if (selectedIds.length > 0) {
      selectedIds.forEach((id) => newExcluded.add(id));
    } else {
      let pool: Player[] = [];
      switch (category) {
        case "Ultra Noob":
          pool = sortedPlayers.ultraNoobs;
          break;
        case "Noob":
          pool = sortedPlayers.noobs;
          break;
        case "Pro":
          pool = sortedPlayers.pros;
          break;
        case "Ultra Pro":
          pool = sortedPlayers.ultraPros;
          break;
        case "Solo":
          pool = filteredPlayers.solo;
          break;
      }
      pool.forEach((p) => newExcluded.delete(p.id));
    }
    updateSelection({ excludedFromDeduction: newExcluded });
  };

  const handleRowSelect = (
    playerId: string,
    category: "Ultra Noob" | "Noob" | "Pro" | "Ultra Pro" | "Solo",
  ) => {
    const togglePlayer = (current: string[]) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId];

    let isSelected = false;

    switch (category) {
      case "Ultra Noob":
        isSelected = !selection.selectedUltraNoobs.includes(playerId);
        updateSelection({
          selectedUltraNoobs: togglePlayer(selection.selectedUltraNoobs),
        });
        if (isSelected) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => id !== playerId,
            ),
          });
        }
        break;
      case "Noob":
        isSelected = !selection.selectedNoobs.includes(playerId);
        updateSelection({
          selectedNoobs: togglePlayer(selection.selectedNoobs),
        });
        if (isSelected) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => id !== playerId,
            ),
          });
        }
        break;
      case "Pro":
        isSelected = !selection.selectedPros.includes(playerId);
        updateSelection({ selectedPros: togglePlayer(selection.selectedPros) });
        if (isSelected) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => id !== playerId,
            ),
          });
        }
        break;
      case "Ultra Pro":
        isSelected = !selection.selectedUltraPros.includes(playerId);
        updateSelection({
          selectedUltraPros: togglePlayer(selection.selectedUltraPros),
        });
        if (isSelected) {
          updateSelection({
            selectedSoloPlayers: selection.selectedSoloPlayers.filter(
              (id) => id !== playerId,
            ),
          });
        }
        break;
      case "Solo":
        isSelected = !selection.selectedSoloPlayers.includes(playerId);
        updateSelection({
          selectedSoloPlayers: togglePlayer(selection.selectedSoloPlayers),
        });
        if (isSelected) {
          updateSelection({
            selectedUltraNoobs: selection.selectedUltraNoobs.filter(
              (id) => id !== playerId,
            ),
            selectedNoobs: selection.selectedNoobs.filter(
              (id) => id !== playerId,
            ),
            selectedPros: selection.selectedPros.filter(
              (id) => id !== playerId,
            ),
            selectedUltraPros: selection.selectedUltraPros.filter(
              (id) => id !== playerId,
            ),
          });
        }
        break;
    }

    const newExcluded = new Set(selection.excludedFromDeduction);
    if (isSelected) {
      newExcluded.add(playerId);
    } else {
      newExcluded.delete(playerId);
    }
    updateSelection({ excludedFromDeduction: newExcluded });
  };

  const handleGenerateTeams = async () => {
    updateState({ generating: true });
    try {
      const allSelected = Array.from(
        new Set([
          ...state.savedPlayers,
          ...selection.selectedUltraNoobs,
          ...selection.selectedNoobs,
          ...selection.selectedPros,
          ...selection.selectedUltraPros,
          ...selection.selectedSoloPlayers,
          ...participantResolved.inIds,
          ...participantResolved.soloIds,
        ]),
      );

      const soloSet = new Set<string>([
        ...selection.selectedSoloPlayers,
        ...participantResolved.soloIds,
      ]);

      let teams: Team[] | null = null;

      // Extract team size from team mode (e.g., "Duo 2" -> 2)
      const teamSizeMatch = state.teamMode.match(/\d+/);
      const teamSize = teamSizeMatch ? parseInt(teamSizeMatch[0]) : 2;

      const combinedUltraNoobs = sortedPlayers.ultraNoobs
        .filter((p) => allSelected.includes(p.id) && !soloSet.has(p.id))
        .map((p) => p.id);
      const combinedNoobs = sortedPlayers.noobs
        .filter((p) => allSelected.includes(p.id) && !soloSet.has(p.id))
        .map((p) => p.id);
      const combinedPros = sortedPlayers.pros
        .filter((p) => allSelected.includes(p.id) && !soloSet.has(p.id))
        .map((p) => p.id);
      const combinedUltraPros = sortedPlayers.ultraPros
        .filter((p) => allSelected.includes(p.id) && !soloSet.has(p.id))
        .map((p) => p.id);

      teams = generateTeamsNew(
        combinedUltraNoobs,
        combinedNoobs,
        combinedPros,
        combinedUltraPros,
        state.players,
        teamSize,
      );

      if (teams && soloSet.size > 0) {
        const allPlayersArray = [
          ...sortedPlayers.ultraNoobs,
          ...sortedPlayers.noobs,
          ...sortedPlayers.pros,
          ...sortedPlayers.ultraPros,
        ];

        const soloTeams = Array.from(soloSet)
          .map((playerId) => {
            const player = allPlayersArray.find((p) => p.id === playerId);
            if (player) {
              return {
                teamName: player.name,
                players: [{ ign: player.name, kills: 0 }],
              };
            }
            return null;
          })
          .filter((team) => team !== null);

        teams = [...teams, ...soloTeams];
      }

      if (teams) {
        setTeamsToCreate(
          teams.map((team) => ({
            ...team,
            excludedFromDeduction: Array.from(selection.excludedFromDeduction),
          })),
        );
        setShowModal(false);
        setShowConfirmModal(true);
      }
    } finally {
      updateState({ generating: false });
    }
  };

  const handleSavePlayers = async () => {
    updateState({ saving: true });
    const allPlayerIds = [
      ...selection.selectedUltraNoobs,
      ...selection.selectedNoobs,
      ...selection.selectedPros,
      ...selection.selectedUltraPros,
      ...selection.selectedSoloPlayers,
    ];
    updateState({ savedPlayers: allPlayerIds });

    if (selectedTournament) {
      await setDoc(
        doc(db, "teamSelections", selectedTournament),
        {
          savedPlayers: allPlayerIds,
          soloPlayers: selection.selectedSoloPlayers,
          excludedFromDeduction: Array.from(selection.excludedFromDeduction),
        },
        { merge: true },
      );
    }
    updateState({ saving: false });
  };

  const getCurrentTabData = () => {
    const currentPlayers =
      state.activeTab === "solo"
        ? filteredPlayers.solo
        : filteredPlayers[state.activeTab];

    const currentSelection =
      state.activeTab === "solo"
        ? selection.selectedSoloPlayers
        : state.activeTab === "ultraNoobs"
          ? selection.selectedUltraNoobs
          : state.activeTab === "noobs"
            ? selection.selectedNoobs
            : state.activeTab === "pros"
              ? selection.selectedPros
              : selection.selectedUltraPros;

    const allSelected = Array.from(
      new Set([
        ...state.savedPlayers,
        ...selection.selectedUltraNoobs,
        ...selection.selectedNoobs,
        ...selection.selectedPros,
        ...selection.selectedUltraPros,
        ...selection.selectedSoloPlayers,
        ...participantResolved.inIds,
        ...participantResolved.soloIds,
      ]),
    );

    return { currentPlayers, currentSelection, allSelected };
  };

  const { currentSelection, allSelected } = getCurrentTabData();

  const { data: currentPlayers } = useQuery({
    queryKey: ["player"],
    queryFn: () => http.get<Prisma.PlayerGetPayload<{}>[]>("/player"),
    select: (data) => data.data,
  });
  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="max-w-3xl w-full h-[95vh] sm:h-[90vh] p-0 flex flex-col bg-background overflow-hidden">
        <DialogHeader className="border-b pb-2 sm:pb-3 flex-shrink-0 px-3 sm:px-4 pt-2 sm:pt-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base sm:text-xl font-semibold flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-xl">🏆</span>
                <span className="truncate">Team Creation</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {state.tournamentTitle || "No Tournament Selected"}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-muted-foreground">
                Press ESC to close
              </div>
            </div>
          </div>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-[400px] sm:min-h-[500px]"
        >
          {state.loading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-3">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
              <span className="text-sm sm:text-base font-medium">
                Loading player data...
              </span>
            </div>
          ) : (
            <div className="px-3 sm:px-4 py-2 sm:py-3 space-y-2 sm:space-y-3">
              <div className="space-y-2">
                <div className="w-full">
                  <TeamModeSelector
                    teamMode={state.teamMode}
                    setTeamMode={(mode) => updateState({ teamMode: mode })}
                  />
                </div>
                <div className="flex flex-col lg:flex-row gap-2 sm:gap-3">
                  <SelectionSummary
                    totalSelectedPlayers={totalSelectedPlayers}
                    selectedSoloPlayers={
                      new Set([
                        ...selection.selectedSoloPlayers,
                        ...participantResolved.soloIds,
                      ]).size
                    }
                    teamMode={state.teamMode}
                  />
                </div>
              </div>

              <div ref={tabsRef} className="space-y-2 sm:space-y-3">
                <CategoryTabs
                  activeTab={state.activeTab}
                  setActiveTab={(tab) => updateState({ activeTab: tab })}
                  selectedCounts={{
                    ultraNoobs: sortedPlayers.ultraNoobs.filter(
                      (p) =>
                        new Set([
                          ...state.savedPlayers,
                          ...selection.selectedUltraNoobs,
                          ...selection.selectedNoobs,
                          ...selection.selectedPros,
                          ...selection.selectedUltraPros,
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.inIds,
                          ...participantResolved.soloIds,
                        ]).has(p.id) &&
                        !new Set([
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.soloIds,
                        ]).has(p.id),
                    ).length,
                    noobs: sortedPlayers.noobs.filter(
                      (p) =>
                        new Set([
                          ...state.savedPlayers,
                          ...selection.selectedUltraNoobs,
                          ...selection.selectedNoobs,
                          ...selection.selectedPros,
                          ...selection.selectedUltraPros,
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.inIds,
                          ...participantResolved.soloIds,
                        ]).has(p.id) &&
                        !new Set([
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.soloIds,
                        ]).has(p.id),
                    ).length,
                    pros: sortedPlayers.pros.filter(
                      (p) =>
                        new Set([
                          ...state.savedPlayers,
                          ...selection.selectedUltraNoobs,
                          ...selection.selectedNoobs,
                          ...selection.selectedPros,
                          ...selection.selectedUltraPros,
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.inIds,
                          ...participantResolved.soloIds,
                        ]).has(p.id) &&
                        !new Set([
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.soloIds,
                        ]).has(p.id),
                    ).length,
                    ultraPros: sortedPlayers.ultraPros.filter(
                      (p) =>
                        new Set([
                          ...state.savedPlayers,
                          ...selection.selectedUltraNoobs,
                          ...selection.selectedNoobs,
                          ...selection.selectedPros,
                          ...selection.selectedUltraPros,
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.inIds,
                          ...participantResolved.soloIds,
                        ]).has(p.id) &&
                        !new Set([
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.soloIds,
                        ]).has(p.id),
                    ).length,
                    solo: new Set([
                      ...selection.selectedSoloPlayers,
                      ...participantResolved.soloIds,
                    ]).size,
                  }}
                />
                <div className="space-y-2 sm:space-y-3">
                  <PlayerSearchInput
                    searchQuery={state.searchQuery}
                    setSearchQuery={(query) =>
                      updateState({ searchQuery: query })
                    }
                    activeTab={state.activeTab}
                  />
                  <SelectAllControl
                    isAllSelected={
                      currentPlayers.length > 0 &&
                      currentPlayers.every((p) =>
                        new Set([
                          ...state.savedPlayers,
                          ...selection.selectedUltraNoobs,
                          ...selection.selectedNoobs,
                          ...selection.selectedPros,
                          ...selection.selectedUltraPros,
                          ...selection.selectedSoloPlayers,
                          ...participantResolved.inIds,
                          ...participantResolved.soloIds,
                        ]).has(p.id),
                      )
                    }
                    onSelectAll={() =>
                      handleSelectAll(
                        state.activeTab === "ultraNoobs"
                          ? "Ultra Noob"
                          : state.activeTab === "noobs"
                            ? "Noob"
                            : state.activeTab === "pros"
                              ? "Pro"
                              : state.activeTab === "ultraPros"
                                ? "Ultra Pro"
                                : "Solo",
                      )
                    }
                    availableCount={currentPlayers.length}
                  />
                  <PlayerGrid
                    players={currentPlayers}
                    selectedPlayers={allSelected}
                    selectedSoloPlayers={Array.from(
                      new Set([
                        ...selection.selectedSoloPlayers,
                        ...participantResolved.soloIds,
                      ]),
                    )}
                    excludedFromDeduction={selection.excludedFromDeduction}
                    activeTab={state.activeTab}
                    tournaments={tournaments}
                    searchQuery={state.searchQuery}
                    onPlayerSelect={(playerId) =>
                      handleRowSelect(
                        playerId,
                        state.activeTab === "ultraNoobs"
                          ? "Ultra Noob"
                          : state.activeTab === "noobs"
                            ? "Noob"
                            : state.activeTab === "pros"
                              ? "Pro"
                              : state.activeTab === "ultraPros"
                                ? "Ultra Pro"
                                : "Solo",
                      )
                    }
                    onToggleExclusion={(playerId) => {
                      const newExcluded = new Set(
                        selection.excludedFromDeduction,
                      );
                      if (newExcluded.has(playerId)) {
                        newExcluded.delete(playerId);
                      } else {
                        newExcluded.add(playerId);
                      }
                      updateSelection({ excludedFromDeduction: newExcluded });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="h-3 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
        </div>

        <ActionButtons
          loading={state.loading}
          generating={state.generating}
          saving={state.saving}
          hasSelectedPlayers={totalSelectedPlayers > 0}
          hasSavedPlayers={
            state.savedPlayers.length > 0 || totalSelectedPlayers > 0
          }
          onCancel={() => setShowModal(false)}
          onSave={handleSavePlayers}
          onGenerate={handleGenerateTeams}
        />
      </DialogContent>
    </Dialog>
  );
}
