"use client";

import { useState } from "react";
import { FiAward } from "react-icons/fi";
import {
  ActionToolbar,
  Button,
  OverallStandingModal,
  TeamCard,
  TournamentSelector,
} from "../teamManagementImports";
import { motion, AnimatePresence } from "framer-motion";
import { SeasonSelector } from "../SeasonSelector";
import { useTeams } from "../../hooks/team/useTeams";

import { useTournamentStore } from "../../store/tournament";
import MatchSelector from "../match/MatchSelector";
import { useMatchStore } from "../../store/match/useMatchStore";

export default function TeamsPage() {
  // Auth state for role-based UI
  const [searchTerm, setSearchTerm] = useState("");
  const { matchId: selectedMatch } = useMatchStore();
  const { tournamentId: selectedTournament } = useTournamentStore();

  const { data: sortedTeams } = useTeams();

  // Use teams from Firestore
  const { data: teams, isFetching: loading } = useTeams();

  return (
    <>
      <div className="border-none shadow-lg bg-background text-foreground">
        <div className="p-6 bg-background text-foreground">
          <ActionToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            actions={
              <div className="flex flex-col gap-2 w-full">
                {/* First row: Season and Tournament selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  <SeasonSelector
                    size="sm"
                    variant="blue"
                    placeholder="Season"
                    showAllSeasons={false}
                  />
                  <TournamentSelector />
                  <MatchSelector isAllMatch={true} />
                </div>
              </div>
            }
          />
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Hunting for teams...
                </p>
              </div>
            </div>
          ) : sortedTeams?.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                <svg
                  className="w-full h-full"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">
                No teams match your filters
              </p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or match selection
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <AnimatePresence>
                {sortedTeams &&
                  sortedTeams?.map((team, index) => (
                    <motion.div
                      key={team.id + index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.4 }}
                    >
                      <TeamCard
                        onClick={() => {}}
                        team={team as any}
                        searchTerm={searchTerm}
                        selectedMatch={selectedMatch}
                        position={team.position}
                      />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
