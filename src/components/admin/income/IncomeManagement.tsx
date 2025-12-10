"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";
import {
    DollarSign,
    Plus,
    Calendar,
    Edit,
    Trash2,
    TrendingUp,
    Filter,
    Loader2,
} from "lucide-react";
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
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/src/components/ui/pagination";
import { useTournaments } from "@/src/hooks/tournament/useTournaments";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import http from "@/src/utils/http";

interface Income {
    id: string;
    amount: number;
    description: string;
    tournamentId: string | null;
    tournamentName: string | null;
    parentId: string | null;
    isSubIncome: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export function IncomeManagement() {
    // Fund Tracker States
    const [fundTransactions, setFundTransactions] = useState<Income[]>([]);
    const [isLoadingFunds, setIsLoadingFunds] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
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
        total: 0,
        count: 0,
    });
    const [selectedParentIncome, setSelectedParentIncome] = useState<
        string | null
    >(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: tournaments } = useTournaments();
    const { user, isAuthLoading } = useAuth();

    // Fetch income data
    const fetchIncomeData = useCallback(async () => {
        if (!user) return; // Don't fetch if user not ready

        setIsLoadingFunds(true);
        try {
            const result = await http.get<{
                incomes: Income[];
                totals: { thisMonth: number; total: number; count: number };
            }>("/admin/income");

            if (result.success && result.data) {
                setFundTransactions(result.data.incomes);
                setTotalFunds({
                    income: result.data.totals.thisMonth,
                    total: result.data.totals.total,
                    count: result.data.totals.count,
                });
            } else {
                toast.error(result.message || "Failed to fetch income data");
            }
        } catch (error) {
            console.error("Error fetching income data:", error);
            toast.error("Failed to fetch income data");
        } finally {
            setIsLoadingFunds(false);
        }
    }, [user]);

    // Fetch data on mount (when user is ready)
    useEffect(() => {
        if (user && !isAuthLoading) {
            fetchIncomeData();
        }
    }, [fetchIncomeData, user, isAuthLoading]);

    const handleAddFundTransaction = async () => {
        if (!fundForm.amount || !fundForm.description) {
            toast.error("Amount and description are required");
            return;
        }

        setIsSaving(true);
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
            };

            let result;
            if (isEditing && editingIncomeId) {
                // Update existing income
                result = await http.put<Income>(
                    `/admin/income/${editingIncomeId}`,
                    transactionData
                );
            } else {
                // Create new income
                result = await http.post<Income>(
                    "/admin/income",
                    transactionData
                );
            }

            if (result.success) {
                toast.success(
                    isEditing ? "Income updated successfully!" : "Income added successfully!"
                );
                setSelectedParentIncome(null);
                setIsEditing(false);
                setEditingIncomeId(null);
                setShowFundDialog(false);
                setFundForm({
                    amount: "",
                    description: "",
                    tournamentId: "",
                    parentId: "",
                });
                // Refetch data
                await fetchIncomeData();
            } else {
                toast.error(result.message || "Failed to save income");
            }
        } catch (error) {
            console.error("Error saving income:", error);
            toast.error("Failed to save income");
        } finally {
            setIsSaving(false);
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
            (transaction) => !transaction.isSubIncome
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
            if (sortedTournaments.length > 0 && !fundForm.tournamentId && !isEditing) {
                setFundForm((prev) => ({
                    ...prev,
                    tournamentId: sortedTournaments[0].id,
                    description: prev.description || sortedTournaments[0].name,
                }));
            }
        }
    }, [showFundDialog, tournaments, isEditing]);

    const handleEditIncome = (income: Income) => {
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
        isMainIncome: boolean
    ) => {
        if (!confirm("Are you sure you want to delete this income entry?")) return;

        setIsDeleting(incomeId);
        try {
            const result = await http.delete(`/admin/income/${incomeId}`);

            if (result.success) {
                toast.success(result.message || "Income entry deleted successfully");
                // Refetch data
                await fetchIncomeData();
            } else {
                toast.error(result.message || "Failed to delete income entry");
            }
        } catch (error) {
            console.error("Error deleting income entry:", error);
            toast.error("Failed to delete income entry");
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Income</p>
                                <p className="text-2xl font-bold text-emerald-500">
                                    {(totalFunds.total || 0).toFixed(2)} UC
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <DollarSign className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">This Month</p>
                                <p className="text-2xl font-bold text-blue-500">
                                    {(totalFunds.income || 0).toFixed(2)} UC
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Calendar className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Entries</p>
                                <p className="text-2xl font-bold text-purple-500">
                                    {totalFunds.count}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Income Card */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <DollarSign className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Income Management</CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Track and manage income entries
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setSelectedParentIncome(null);
                                setIsEditing(false);
                                setEditingIncomeId(null);
                                setFundForm({
                                    amount: "",
                                    description: "",
                                    tournamentId: "",
                                    parentId: "",
                                });
                                setShowFundDialog(true);
                            }}
                            className="gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Income
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    {/* Filter */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <Select
                                value={fundFilter.tournament}
                                onValueChange={(value) =>
                                    setFundFilter((prev) => ({ ...prev, tournament: value }))
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
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
                        </div>
                    </div>

                    {/* Income List */}
                    <div className="space-y-3">
                        {isLoadingFunds ? (
                            <div className="flex justify-center py-12">
                                <LoaderFive text="Loading income data..." />
                            </div>
                        ) : mainIncomeTransactions.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No income entries found</p>
                                <p className="text-xs mt-1">Click &quot;Add Income&quot; to get started</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y rounded-lg border">
                                    {paginatedTransactions.map((transaction) => {
                                        const subIncomeEntries = filteredFundTransactions.filter(
                                            (t) => t.isSubIncome && t.parentId === transaction.id
                                        );
                                        const hasSubIncome = subIncomeEntries.length > 0;
                                        return (
                                            <div
                                                key={transaction.id}
                                                className="p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex flex-col gap-2 sm:gap-3">
                                                    {/* Mobile: Stack everything, Desktop: Side by side */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-sm sm:text-base break-words">
                                                                {transaction.description}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                                                                {transaction.tournamentName && (
                                                                    <Badge variant="secondary" className="text-xs">
                                                                        {transaction.tournamentName}
                                                                    </Badge>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(
                                                                        transaction.createdAt
                                                                    ).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {/* Amount and Actions */}
                                                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
                                                            <div className="text-base sm:text-lg font-bold text-emerald-500">
                                                                {transaction.amount.toFixed(2)} UC
                                                            </div>
                                                            <div className="flex items-center gap-0.5 sm:gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                                                    onClick={() => {
                                                                        setFundForm({
                                                                            amount: "",
                                                                            description: `${transaction.description} - `,
                                                                            tournamentId:
                                                                                transaction.tournamentId || "general",
                                                                            parentId: transaction.id,
                                                                        });
                                                                        setSelectedParentIncome(transaction.id);
                                                                        setIsEditing(false);
                                                                        setEditingIncomeId(null);
                                                                        setShowFundDialog(true);
                                                                    }}
                                                                    title="Add sub-income"
                                                                >
                                                                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                                                    onClick={() => handleEditIncome(transaction)}
                                                                    title="Edit income"
                                                                >
                                                                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        handleDeleteIncome(transaction.id, true)
                                                                    }
                                                                    disabled={isDeleting === transaction.id}
                                                                    title="Delete income"
                                                                >
                                                                    {isDeleting === transaction.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {hasSubIncome && (
                                                        <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-muted space-y-2">
                                                            {subIncomeEntries.map((subIncome) => (
                                                                <div
                                                                    key={subIncome.id}
                                                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 py-2"
                                                                >
                                                                    <div className="text-xs sm:text-sm text-muted-foreground break-words">
                                                                        {subIncome.description}
                                                                    </div>
                                                                    <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                                                                        <div className="text-xs sm:text-sm font-medium text-emerald-500">
                                                                            {subIncome.amount.toFixed(2)} UC
                                                                        </div>
                                                                        <div className="flex items-center gap-0.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 sm:h-7 sm:w-7"
                                                                                onClick={() =>
                                                                                    handleEditIncome(subIncome)
                                                                                }
                                                                                title="Edit sub-income"
                                                                            >
                                                                                <Edit className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive"
                                                                                onClick={() =>
                                                                                    handleDeleteIncome(
                                                                                        subIncome.id,
                                                                                        false
                                                                                    )
                                                                                }
                                                                                disabled={isDeleting === subIncome.id}
                                                                                title="Delete sub-income"
                                                                            >
                                                                                {isDeleting === subIncome.id ? (
                                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                                ) : (
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                )}
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
                                        <span className="text-sm text-muted-foreground">
                                            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                            {Math.min(
                                                currentPage * itemsPerPage,
                                                mainIncomeTransactions.length
                                            )}{" "}
                                            of {mainIncomeTransactions.length} entries
                                        </span>
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() =>
                                                            setCurrentPage((prev) => Math.max(1, prev - 1))
                                                        }
                                                        className={
                                                            currentPage === 1
                                                                ? "pointer-events-none opacity-50"
                                                                : "cursor-pointer"
                                                        }
                                                    />
                                                </PaginationItem>
                                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                    .filter(
                                                        (page) =>
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            Math.abs(page - currentPage) <= 1
                                                    )
                                                    .map((page, index, arr) => (
                                                        <>
                                                            {index > 0 && arr[index - 1] !== page - 1 && (
                                                                <PaginationItem key={`ellipsis-${page}`}>
                                                                    <span className="px-2">...</span>
                                                                </PaginationItem>
                                                            )}
                                                            <PaginationItem key={page}>
                                                                <PaginationLink
                                                                    onClick={() => setCurrentPage(page)}
                                                                    isActive={currentPage === page}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        </>
                                                    ))}
                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() =>
                                                            setCurrentPage((prev) =>
                                                                Math.min(totalPages, prev + 1)
                                                            )
                                                        }
                                                        className={
                                                            currentPage === totalPages
                                                                ? "pointer-events-none opacity-50"
                                                                : "cursor-pointer"
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

            {/* Income Entry Dialog */}
            <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing
                                ? "Edit Income Entry"
                                : selectedParentIncome
                                    ? "Add Sub-Income Entry"
                                    : "Add Income Entry"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (UC)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                value={fundForm.amount}
                                onChange={(e) =>
                                    setFundForm((prev) => ({ ...prev, amount: e.target.value }))
                                }
                                placeholder="Enter amount..."
                                autoFocus
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
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
                            />
                        </div>
                        {!selectedParentIncome && (
                            <div className="space-y-2">
                                <Label htmlFor="tournament">Tournament</Label>
                                <Select
                                    value={fundForm.tournamentId}
                                    onValueChange={(value) =>
                                        setFundForm((prev) => ({ ...prev, tournamentId: value }))
                                    }
                                >
                                    <SelectTrigger>
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
                            <div className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    This will be added as a sub-entry to the selected income
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowFundDialog(false);
                                setSelectedParentIncome(null);
                                setIsEditing(false);
                                setEditingIncomeId(null);
                            }}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddFundTransaction} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
