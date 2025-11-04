"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
// import { Poll, PollVote } from "@/src/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { ChevronDown, Plus, Users } from "lucide-react";
import { VotersDialog } from "@/src/components/vote/VotersDialog";
import { LoaderFive } from "../../ui/loader";
import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import { useQuery } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { DataTable } from "../../data-table";
import { CreatePollDialog } from "./CreatePollDialog";
import { usePollColumns } from "@/src/hooks/poll/usePollColumns";
import { useSearchParams } from "next/navigation";
import { UpdatePollDialog } from "./UpdatePollDialog";
import { Ternary } from "../../common/Ternary";

type PollT = Prisma.PollGetPayload<{ include: { options: true } }>;

const PollManagement: React.FC = () => {
  const { columns } = usePollColumns();
  const search = useSearchParams();
  const updateId = search.get("update") || "";
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [adminPollFilter, setAdminPollFilter] = useState<
    "active" | "inactive" | "all"
  >("active");

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

  const [showVotersDialog, setShowVotersDialog] = useState<PollT | null>(null);

  const closeVotersDialog = () => {
    setShowVotersDialog(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 gap-4">
        <LoaderFive text="Loading polls..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8 space-y-6 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Poll Management
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Create and manage tournament polls
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                {adminFilterLabels[adminPollFilter]}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full sm:w-[200px]">
              <DropdownMenuLabel>Filter Polls</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("active")}
                className={adminPollFilter === "active" ? "bg-accent" : ""}
              >
                Active Polls
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("inactive")}
                className={adminPollFilter === "inactive" ? "bg-accent" : ""}
              >
                Inactive Polls
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setAdminPollFilter("all")}
                className={adminPollFilter === "all" ? "bg-accent" : ""}
              >
                All Polls
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Poll
          </Button>
        </div>
      </div>

      {/* Polls List */}
      <div className="space-y-4">
        <Ternary
          condition={polls?.length === 0}
          trueComponent={
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No polls found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Create a new poll to get started with tournament voting
              </p>
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-sm"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Poll
              </Button>
            </div>
          }
          falseComponent={<DataTable data={polls} columns={columns} />}
        />
      </div>

      {/* Voters Dialog */}
      {showVotersDialog && (
        <VotersDialog
          isOpen={!!showVotersDialog}
          onClose={closeVotersDialog}
          poll={showVotersDialog as any}
        />
      )}

      <CreatePollDialog
        open={isCreateModalOpen}
        onValueChange={setIsCreateModalOpen}
      />
      {!!updateId && <UpdatePollDialog open={!!updateId} id={updateId} />}
    </div>
  );
};

export default PollManagement;
