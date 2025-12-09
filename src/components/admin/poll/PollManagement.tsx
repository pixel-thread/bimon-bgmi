"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ChevronDown, Plus, Filter, Users } from "lucide-react";
import { VotersDialog } from "@/src/components/vote/VotersDialog";
import { LoaderFive } from "../../ui/loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { CreatePollDialog } from "./CreatePollDialog";
import { useSearchParams, useRouter } from "next/navigation";
import { UpdatePollDialog } from "./UpdatePollDialog";
import { Ternary } from "../../common/Ternary";
import { PollCard } from "./PollCard";
import { PollTeamsPreviewDialog } from "./PollTeamsPreviewDialog";
import type { PreviewTeamsByPollsResult } from "@/src/services/team/previewTeamsByPoll";
import { ADMIN_TEAM_ENDPOINTS } from "@/src/lib/endpoints/admin/team";
import { toast } from "sonner";
import { PollT } from "@/src/types/poll";
import { Badge } from "@/src/components/ui/badge";

const PollManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();
  const updateId = search.get("update") || "";
  const viewId = search.get("view") || "";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [adminPollFilter, setAdminPollFilter] = useState<
    "active" | "inactive" | "all"
  >("active");

  // State for team preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewTeamsByPollsResult | null>(null);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [selectedTeamSize, setSelectedTeamSize] = useState<number>(2);

  const adminFilterLabels = {
    active: "Active Polls",
    inactive: "Inactive Polls",
    all: "All Polls",
  };

  const { data: polls, isFetching: loading } = useQuery({
    queryKey: ["polls"],
    queryFn: async () => http.get<PollT[]>("/admin/poll"),
    select: (data) => data.data,
  });

  // Mutations for card actions
  const { mutate: updatePollStatus, isPending: isToggling } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      http.get<PollT>(`/admin/poll/${id}/toggle-status`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
      }
    },
  });

  const { mutate: deletePoll, isPending: isDeleting } = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      http.delete(`/admin/poll/${id}`),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
      }
    },
  });

  const { mutate: deleteTeams, isPending: isTeamsDeleting } = useMutation({
    mutationFn: (data: { tournamentId: string }) =>
      http.post<PollT>(
        ADMIN_TEAM_ENDPOINTS.POST_DELETE_TEAMS_BY_TOURNAMENT_ID,
        data,
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
      }
    },
  });

  const { mutate: fetchPreview, isPending: isPreviewLoading } = useMutation({
    mutationFn: ({ id, size }: { id: string; size: number }) =>
      http.post<PreviewTeamsByPollsResult>(
        ADMIN_TEAM_ENDPOINTS.POST_PREVIEW_TEAM_BY_POLL.replace(
          ":size",
          size.toString(),
        ),
        { pollId: id },
      ),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setPreviewData(data.data);
      } else {
        toast.error(data.message || "Failed to generate preview");
        setPreviewDialogOpen(false);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to generate preview");
      setPreviewDialogOpen(false);
    },
  });

  const { mutate: createTeams, isPending: isCreating } = useMutation({
    mutationFn: ({ id, size }: { id: string; size: number }) =>
      http.post<PollT>(
        ADMIN_TEAM_ENDPOINTS.POST_CREATE_TEAM_BY_POLL.replace(
          ":size",
          size.toString(),
        ),
        { pollId: id },
      ),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        queryClient.invalidateQueries({ queryKey: ["polls"] });
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        setPreviewDialogOpen(false);
        setPreviewData(null);
        setSelectedPollId(null);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create teams");
    },
  });

  const handlePreviewClick = (pollId: string, size: number) => {
    setSelectedPollId(pollId);
    setSelectedTeamSize(size);
    setPreviewData(null);
    setPreviewDialogOpen(true);
    fetchPreview({ id: pollId, size });
  };

  const handleConfirm = () => {
    if (selectedPollId) {
      createTeams({ id: selectedPollId, size: selectedTeamSize });
    }
  };

  const handleRegenerate = () => {
    if (selectedPollId) {
      setPreviewData(null);
      fetchPreview({ id: selectedPollId, size: selectedTeamSize });
    }
  };

  // Filter polls based on selected filter
  const filteredPolls = polls?.filter((poll) => {
    if (adminPollFilter === "active") return poll.isActive;
    if (adminPollFilter === "inactive") return !poll.isActive;
    return true;
  });

  const activeCount = polls?.filter((p) => p.isActive).length || 0;
  const inactiveCount = polls?.filter((p) => !p.isActive).length || 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
        <LoaderFive text="Loading polls..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-semibold text-foreground">{polls?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Polls</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <div className="text-sm text-muted-foreground">Active Polls</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-semibold text-foreground">{inactiveCount}</div>
          <div className="text-sm text-muted-foreground">Inactive Polls</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-2xl font-semibold text-foreground">
            {polls?.reduce((sum, p) => sum + (p.playersVotes?.length || 0), 0) || 0}
          </div>
          <div className="text-sm text-muted-foreground">Total Votes</div>
        </div>
      </div>

      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {adminFilterLabels[adminPollFilter]}
              <Badge variant="secondary" className="ml-1">
                {filteredPolls?.length || 0}
              </Badge>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuLabel>Filter Polls</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setAdminPollFilter("active")}
              className={adminPollFilter === "active" ? "bg-accent" : ""}
            >
              Active Polls
              <Badge variant="secondary" className="ml-auto">
                {activeCount}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAdminPollFilter("inactive")}
              className={adminPollFilter === "inactive" ? "bg-accent" : ""}
            >
              Inactive Polls
              <Badge variant="secondary" className="ml-auto">
                {inactiveCount}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setAdminPollFilter("all")}
              className={adminPollFilter === "all" ? "bg-accent" : ""}
            >
              All Polls
              <Badge variant="secondary" className="ml-auto">
                {polls?.length || 0}
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Poll
        </Button>
      </div>

      {/* Polls Grid */}
      <Ternary
        condition={!filteredPolls || filteredPolls.length === 0}
        trueComponent={
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No polls found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create a new poll to get started with tournament voting and team management
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Poll
            </Button>
          </div>
        }
        falseComponent={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPolls?.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                onToggleStatus={(id) => updatePollStatus({ id })}
                onDelete={(id) => deletePoll({ id })}
                onDeleteTeams={(tournamentId) => deleteTeams({ tournamentId })}
                onPreviewTeams={handlePreviewClick}
                isToggling={isToggling}
                isDeleting={isDeleting}
                isTeamsDeleting={isTeamsDeleting}
                isPreviewLoading={isPreviewLoading}
              />
            ))}
          </div>
        }
      />

      {/* Voters Dialog */}
      {viewId && (
        <VotersDialog
          isOpen={!!viewId}
          id={viewId}
          onClose={() => router.push("/admin/polls")}
          poll={polls?.find((p) => p.id === viewId)}
        />
      )}

      <CreatePollDialog
        open={isCreateModalOpen}
        onValueChange={setIsCreateModalOpen}
      />
      {!!updateId && <UpdatePollDialog open={!!updateId} id={updateId} />}

      {/* Teams Preview Dialog */}
      <PollTeamsPreviewDialog
        open={previewDialogOpen}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) {
            setPreviewData(null);
            setSelectedPollId(null);
          }
        }}
        previewData={previewData}
        isLoading={isPreviewLoading}
        isConfirming={isCreating}
        onConfirm={handleConfirm}
        onRegenerate={handleRegenerate}
        teamSize={selectedTeamSize}
      />
    </div>
  );
};

export default PollManagement;
