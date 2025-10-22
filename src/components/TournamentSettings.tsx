"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { FileUpload } from "@/src/components/ui/file-upload";
import { Button } from "@/src/components/ui/button";
import TournamentToolbar from "./TournamentToolbar";
import TournamentForm from "./TournamentForm";
import TeamConfirmationModal from "./TeamConfirmationModal";
import TournamentCreateModal from "@/src/components/tournaments/TournamentCreateModal";
import TeamCreationModal from "./TeamCreationModal";
import { SeasonManagement } from "./admin/season/SeasonManagement";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Check,
  X,
  DollarSign,
  Plus,
  Calendar,
  Edit,
} from "lucide-react";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteField,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Badge } from "@/src/components/ui/badge";
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
import { LoaderFive } from "@/src/components/ui/loader";
import { db } from "@/src/lib/firebase";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination";

import { useTournaments } from "../hooks/tournament/useTournaments";
import { useSeasonStore } from "../store/season";
import { Ternary } from "./common/Ternary";
import { useTournamentStore } from "../store/tournament";
import { useTournament } from "../hooks/tournament/useTournament";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "../utils/http";
import { useGallery } from "../hooks/gallery/useGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function TournamentSettings() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { tournamentId: selectedTournament } = useTournamentStore();
  const { seasonId: selectedSeason } = useSeasonStore();
  const [teamsToCreate, setTeamsToCreate] = useState<
    { teamName: string; players: { ign: string; kills: number }[] }[]
  >([]);

  // Fund Tracker States
  const [fundTransactions, setFundTransactions] = useState<any[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [fundForm, setFundForm] = useState({
    amount: "",
    description: "",
    tournamentId: "",
    parentId: "",
  });
  const [fundFilter, setFundFilter] = useState({
    tournament: "all",
  });
  const [totalFunds, setTotalFunds] = useState({
    income: 0,
    expense: 0,
    balance: 0,
    total: 0,
  });
  const [selectedParentIncome, setSelectedParentIncome] = useState<
    string | null
  >(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: tournaments } = useTournaments({ seasonId: selectedSeason });

  useEffect(() => {
    if (tournaments && tournaments?.length > 0 && !selectedTournament) {
      // Use the new utility function to get the best tournament (preferring those with teams)
      // getBestTournamentForAutoSelect(tournaments)
      //   .then((bestTournamentId) => {
      //     if (bestTournamentId) {
      //       setSelectedTournament(bestTournamentId);
      //     }
      //   })
      //   .catch((error) => {
      //     console.error("Error selecting best tournament:", error);
      //     // Fallback to the old logic if there's an error
      //     const sortedTournaments = [...tournaments].sort((a, b) => {
      //       const aTime = a.id.includes("_") ? parseInt(a.id.split("_")[1]) : 0;
      //       const bTime = b.id.includes("_") ? parseInt(b.id.split("_")[1]) : 0;
      //       return bTime - aTime;
      //     });
      //     if (sortedTournaments.length > 0) {
      //       setSelectedTournament(sortedTournaments[0].id);
      //     }
      //   });
    }
  }, [tournaments, selectedTournament]);

  // Reset selected tournament if not in filtered list
  useEffect(() => {
    if (tournaments && selectedTournament && tournaments.length > 0) {
      const isSelectedTournamentInList = tournaments.some(
        (t) => t.id === selectedTournament,
      );
      if (!isSelectedTournamentInList) {
        const sorted = [...tournaments].sort((a, b) => {
          const aTime = a.id.includes("_") ? parseInt(a.id.split("_")[1]) : 0;
          const bTime = b.id.includes("_") ? parseInt(b.id.split("_")[1]) : 0;
          return bTime - aTime;
        });
        // setSelectedTournament(sorted[0]?.id || null);
      }
    }
  }, [tournaments, selectedTournament]);

  const handleAddFundTransaction = async () => {
    if (!fundForm.amount || !fundForm.description) {
      toast.error("Amount and description are required");
      return;
    }
    try {
      const transactionData = {
        amount: parseFloat(fundForm.amount),
        description: fundForm.description,
        tournamentId:
          fundForm.tournamentId === "general"
            ? null
            : fundForm.tournamentId || null,
        tournamentName:
          fundForm.tournamentId && fundForm.tournamentId !== "general"
            ? tournaments?.find((t) => t.id === fundForm.tournamentId)?.name ||
              "Unknown Tournament"
            : null,
        parentId: fundForm.parentId || null,
        isSubIncome: !!fundForm.parentId,
        createdBy: "admin",
      };
      if (isEditing && editingIncomeId) {
        await updateDoc(doc(db, "fundTransactions", editingIncomeId), {
          ...transactionData,
          updatedAt: new Date().toISOString(),
        });
        toast.success("Income updated successfully!");
      } else {
        await addDoc(collection(db, "fundTransactions"), {
          ...transactionData,
          createdAt: new Date().toISOString(),
        });
        toast.success("Income added successfully!");
      }
      // const latestTournament =
      //   tournaments?.length > 0
      //     ? [...tournaments].sort((a, b) => {
      //         const aTime = a.id.includes("_")
      //           ? parseInt(a.id.split("_")[1])
      //           : 0;
      //         const bTime = b.id.includes("_")
      //           ? parseInt(b.id.split("_")[1])
      //           : 0;
      //         return bTime - aTime;
      //       })[0]
      //     : null;
      // setFundForm({
      //   amount: "",
      //   description: latestTournament ? latestTournament.title : "",
      //   tournamentId: latestTournament ? latestTournament.id : "",
      //   parentId: "",
      // });
      setSelectedParentIncome(null);
      setIsEditing(false);
      setEditingIncomeId(null);
      setShowFundDialog(false);
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Failed to save income");
    }
  };

  const filteredFundTransactions = useMemo(() => {
    return fundTransactions.filter((transaction) => {
      const tournamentMatch =
        fundFilter.tournament === "all" ||
        (fundFilter.tournament === "general" && !transaction.tournamentId) ||
        transaction.tournamentId === fundFilter.tournament;
      return tournamentMatch;
    });
  }, [fundTransactions, fundFilter]);

  const mainIncomeTransactions = useMemo(() => {
    return filteredFundTransactions.filter(
      (transaction) => !transaction.isSubIncome,
    );
  }, [filteredFundTransactions]);

  const totalPages = Math.ceil(mainIncomeTransactions.length / itemsPerPage);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return mainIncomeTransactions.slice(startIndex, endIndex);
  }, [mainIncomeTransactions, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [fundFilter.tournament]);

  useEffect(() => {
    if (tournaments && showFundDialog && tournaments.length > 0) {
      const sortedTournaments = [...tournaments].sort((a, b) => {
        const aTime = a.id.includes("_") ? parseInt(a.id.split("_")[1]) : 0;
        const bTime = b.id.includes("_") ? parseInt(b.id.split("_")[1]) : 0;
        return bTime - aTime;
      });
      if (sortedTournaments.length > 0 && !fundForm.tournamentId) {
        setFundForm((prev) => ({
          ...prev,
          tournamentId: sortedTournaments[0].id,
          description: sortedTournaments[0].name,
        }));
      }
    }
  }, [showFundDialog, tournaments]);

  const handleEditIncome = (income: any) => {
    setFundForm({
      amount: income.amount.toString(),
      description: income.description,
      tournamentId: income.tournamentId || "general",
      parentId: income.parentId || "",
    });
    setEditingIncomeId(income.id);
    setIsEditing(true);
    setSelectedParentIncome(income.parentId);
    setShowFundDialog(true);
  };

  const handleDeleteIncome = async (
    incomeId: string,
    isMainIncome: boolean,
  ) => {
    if (!confirm("Are you sure you want to delete this income entry?")) return;
    try {
      if (isMainIncome) {
        const subEntries = fundTransactions.filter(
          (t) => t.parentId === incomeId,
        );
        if (subEntries.length > 0) {
          const deleteSubPromises = subEntries.map((entry) =>
            deleteDoc(doc(db, "fundTransactions", entry.id)),
          );
          await Promise.all(deleteSubPromises);
        }
      }
      await deleteDoc(doc(db, "fundTransactions", incomeId));
      toast.success("Income entry deleted successfully");
    } catch (error) {
      console.error("Error deleting income entry:", error);
      toast.error("Failed to delete income entry");
    }
  };

  return (
    <div className="space-y-3 overflow-x-hidden px-2">
      {/* Page header */}
      <div className="flex flex-col items-start gap-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground">
            Minimal, focused controls to manage tournaments
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3">
          <TournamentToolbar
            setShowCreateModal={setShowCreateModal}
            setShowBulkCreateModal={setShowTeamCreationModal}
          />
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid gap-3 md:grid-cols-1">
        {/* Left column */}
        {/* Configuration */}
        <TournamentConfiguration />
        <TournamentBackground />
        {/* Background Images */}

        <GalleryImages />

        {/* Season Management */}
        <Card>
          <CardHeader className="p-3 pb-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Season Management
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-4">
            <SeasonManagement />
          </CardContent>
        </Card>
        {/* Right column */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="p-3 pb-0">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Income
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  className="h-6 w-full"
                  onClick={() => {
                    setSelectedParentIncome(null);
                    setIsEditing(false);
                    setEditingIncomeId(null);
                    setShowFundDialog(true);
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-sm font-semibold text-green-600">
                  ₹{(totalFunds.total || 0).toFixed(2)}
                </div>
              </div>

              <Select
                value={fundFilter.tournament}
                onValueChange={(value) =>
                  setFundFilter((prev) => ({ ...prev, tournament: value }))
                }
              >
                <SelectTrigger className="w-full text-xs h-8">
                  <SelectValue placeholder="All Tournaments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tournaments</SelectItem>
                  <SelectItem value="general">
                    General (No Tournament)
                  </SelectItem>
                  {tournaments?.map((tournament) => (
                    <SelectItem key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-3">
                {isLoadingFunds ? (
                  <div className="flex justify-center py-6">
                    <LoaderFive text="Loading income data..." />
                  </div>
                ) : mainIncomeTransactions.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">
                    No income entries
                  </div>
                ) : (
                  <>
                    <div className="divide-y max-h-[16rem] overflow-y-auto overflow-x-hidden">
                      {paginatedTransactions.map((transaction) => {
                        const subIncomeEntries =
                          filteredFundTransactions.filter(
                            (t) =>
                              t.isSubIncome && t.parentId === transaction.id,
                          );
                        const hasSubIncome = subIncomeEntries.length > 0;
                        return (
                          <div key={transaction.id} className="py-2">
                            <div className="flex flex-col gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-xs truncate">
                                  {transaction.description}
                                </div>
                                <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                                  {transaction.tournamentName && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[8px]"
                                    >
                                      {transaction.tournamentName}
                                    </Badge>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-2 h-2" />
                                    {new Date(
                                      transaction.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-1 flex-shrink-0">
                                <div className="text-xs font-semibold text-green-600">
                                  ₹{transaction.amount.toFixed(2)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setFundForm({
                                        amount: "",
                                        description: `${transaction.description} - `,
                                        tournamentId:
                                          transaction.tournamentId || "general",
                                        parentId: transaction.id,
                                      });
                                      setSelectedParentIncome(transaction.id);
                                      setShowFundDialog(true);
                                    }}
                                    title="Add sub-income"
                                    aria-label="Add sub-income"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      handleEditIncome(transaction)
                                    }
                                    title="Edit income"
                                    aria-label="Edit income"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-600"
                                    onClick={() =>
                                      handleDeleteIncome(transaction.id, true)
                                    }
                                    title="Delete income"
                                    aria-label="Delete income"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {hasSubIncome && (
                              <div className="mt-2 ml-2 pl-2 border-l space-y-2">
                                {subIncomeEntries.map((subIncome) => (
                                  <div
                                    key={subIncome.id}
                                    className="flex flex-col gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <div className="text-xs truncate">
                                        {subIncome.description}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-1 flex-shrink-0">
                                      <div className="text-xs font-medium text-green-600">
                                        ₹{subIncome.amount.toFixed(2)}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() =>
                                            handleEditIncome(subIncome)
                                          }
                                          title="Edit sub-income"
                                          aria-label="Edit sub-income"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-600"
                                          onClick={() =>
                                            handleDeleteIncome(
                                              subIncome.id,
                                              false,
                                            )
                                          }
                                          title="Delete sub-income"
                                          aria-label="Delete sub-income"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Info */}
                    {mainIncomeTransactions.length > itemsPerPage && (
                      <div className="flex justify-between items-center pt-2 text-[10px] text-muted-foreground">
                        <span>
                          Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            mainIncomeTransactions.length,
                          )}{" "}
                          of {mainIncomeTransactions.length} entries
                        </span>
                        <span>
                          Page {currentPage} of {totalPages}
                        </span>
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center pt-3">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(1, prev - 1),
                                  )
                                }
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer text-xs h-6"
                                }
                              />
                            </PaginationItem>

                            {Array.from(
                              { length: totalPages },
                              (_, i) => i + 1,
                            ).map((page) => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer text-xs h-6"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}

                            <PaginationItem>
                              <PaginationNext
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1),
                                  )
                                }
                                className={
                                  currentPage === totalPages
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer text-xs h-6"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <TeamCreationModal
        showModal={showTeamCreationModal}
        setShowModal={setShowTeamCreationModal}
        setShowConfirmModal={setShowConfirmModal}
        setTeamsToCreate={setTeamsToCreate}
      />

      <TeamConfirmationModal
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        teamsToCreate={teamsToCreate}
        setTeamsToCreate={setTeamsToCreate}
      />

      <TournamentCreateModal
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
      />

      {/* Income Entry Dialog */}
      <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
        <DialogContent className="w-[95vw] max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {isEditing
                ? "Edit Income Entry"
                : selectedParentIncome
                  ? "Add Sub-Income Entry"
                  : "Add Income Entry"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="amount" className="text-xs">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={fundForm.amount}
                onChange={(e) =>
                  setFundForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Enter amount..."
                className="text-sm h-8"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-xs">
                Description
              </Label>
              <Input
                id="description"
                value={fundForm.description}
                onChange={(e) =>
                  setFundForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="e.g., Tournament Entry Fees"
                className="text-sm h-8"
              />
            </div>
            {!selectedParentIncome && (
              <div>
                <Label htmlFor="tournament" className="text-xs">
                  Tournament
                </Label>
                <Select
                  value={fundForm.tournamentId}
                  onValueChange={(value) =>
                    setFundForm((prev) => ({ ...prev, tournamentId: value }))
                  }
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      General (No specific tournament)
                    </SelectItem>
                    {tournaments?.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedParentIncome && (
              <div className="bg-muted/20 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  This will be added as a sub-entry to the selected income
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="h-8 text-xs"
              onClick={() => {
                setShowFundDialog(false);
                setSelectedParentIncome(null);
                setIsEditing(false);
                setEditingIncomeId(null);
              }}
            >
              Cancel
            </Button>
            <Button className="h-8 text-xs" onClick={handleAddFundTransaction}>
              {isEditing
                ? "Update Income"
                : selectedParentIncome
                  ? "Add Sub-Income"
                  : "Add Income"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
const TournamentConfiguration = () => {
  const { tournamentId: selectedTournament } = useTournamentStore();
  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          Tournament Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-4">
        <Ternary
          condition={!!selectedTournament}
          trueComponent={<TournamentForm />}
          falseComponent={
            <div className="flex items-center gap-2">
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                No tournament selected
              </p>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
};

const TournamentBackground = () => {
  const { tournamentId } = useTournamentStore();

  const { data } = useTournament({ id: tournamentId });

  const handleRemoveBackground = () => {};

  const image = data?.gallery;
  if (!tournamentId) return null;
  return (
    <Card>
      <CardHeader className="p-3 pb-0">
        <div className="flex items-center gap-2">
          <CardTitle className="font-medium text-muted-foreground">
            Tournament Background
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {image?.publicUrl && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Current</p>
            <div className="relative w-full max-w-full rounded-md overflow-hidden">
              <img
                src={image.publicUrl}
                alt="Current background"
                className="w-full h-20 object-cover border"
              />
              <Button
                onClick={handleRemoveBackground}
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                aria-label="Remove background"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const GalleryImages = () => {
  const { data: backgroundGallery } = useGallery();
  const { tournamentId } = useTournamentStore();
  const { data } = useTournament({ id: tournamentId });
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    mutationFn: ({
      tournamentId,
      galleryId,
    }: {
      tournamentId: string;
      galleryId: string;
    }) =>
      http.post("/admin/gallery/tournament-background", {
        tournamentId,
        galleryId,
      }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({
          queryKey: ["tournament", tournamentId],
        });
      }
    },
  });

  const { mutate: uploadGallery } = useMutation({
    mutationFn: (data: { image: File }) =>
      http.post("/admin/gallery", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    onSuccess: (data) => {
      if (data.success)
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  const { mutate: deleteFromGallery } = useMutation({
    mutationFn: ({ id }: { id: string }) => http.delete(`/admin/gallery/${id}`),
    onSuccess: (data) => {
      if (data.success)
        queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
  const isUploadingBackground = true;

  const currentBackgroundImage = backgroundGallery?.find(
    (val) => val.id === data?.gallery?.id,
  );

  return (
    <>
      <Tabs defaultValue="gallery" className="w-full">
        <TabsList>
          <TabsTrigger className="bg-secondary" value="gallery">
            Gallery
          </TabsTrigger>
          <TabsTrigger className="bg-secondary" value="upload">
            Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="gallery">
          <Card>
            <CardContent className="p-3 pt-4 space-y-3">
              {backgroundGallery && backgroundGallery?.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 overflow-x-hidden">
                    {backgroundGallery.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.publicUrl}
                          onClick={() => {
                            if (tournamentId) {
                              mutate({
                                tournamentId,
                                galleryId: image.id,
                              });
                            }
                          }}
                          alt={`Background ${index + 1}`}
                          className={`w-full h-36 object-cover rounded cursor-pointer border-2 transition-all ${
                            currentBackgroundImage === image
                              ? "border-blue-500"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        />
                        {currentBackgroundImage === image && (
                          <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white rounded-full p-0.5">
                            <Check className="h-2 w-2" />
                          </div>
                        )}
                        <button
                          onClick={() => deleteFromGallery({ id: image.id })}
                          className="absolute top-0.5 left-0.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Delete background"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="w-full">
          <Card>
            <CardHeader className="p-3 pb-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-3 w-3 text-muted-foreground" />
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Background
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-4 space-y-3 ">
              {/* Current Background */}
              {/* Upload */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Upload</p>
                <div className="border border-dashed rounded-md p-2">
                  <FileUpload
                    onChange={(files) => uploadGallery({ image: files[0] })}
                  />
                </div>
                {isUploadingBackground && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Upload className="h-3 w-3 animate-pulse" />
                    Uploading...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
};
