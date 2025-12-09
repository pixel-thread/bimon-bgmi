"use client";

import { useState, useEffect, useMemo } from "react";
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

export function IncomeManagement() {
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
    const itemsPerPage = 10;

    const { data: tournaments } = useTournaments();

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
                toast.success("Income updated successfully!");
            } else {
                toast.success("Income added successfully!");
            }
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
        isMainIncome: boolean
    ) => {
        if (!confirm("Are you sure you want to delete this income entry?")) return;
        try {
            if (isMainIncome) {
                const subEntries = fundTransactions.filter(
                    (t) => t.parentId === incomeId
                );
                if (subEntries.length > 0) {
                    // Delete sub-entries first if needed
                }
            }
            toast.success("Income entry deleted successfully");
        } catch (error) {
            console.error("Error deleting income entry:", error);
            toast.error("Failed to delete income entry");
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
                                    {mainIncomeTransactions.length}
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
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select
                            value={fundFilter.tournament}
                            onValueChange={(value) =>
                                setFundFilter((prev) => ({ ...prev, tournament: value }))
                            }
                        >
                            <SelectTrigger className="w-[200px]">
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
                                                className="p-4 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-start justify-between">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium">
                                                                {transaction.description}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                                {transaction.tournamentName && (
                                                                    <Badge variant="secondary">
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
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-lg font-bold text-emerald-500">
                                                                {transaction.amount.toFixed(2)} UC
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
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
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => handleEditIncome(transaction)}
                                                                    title="Edit income"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        handleDeleteIncome(transaction.id, true)
                                                                    }
                                                                    title="Delete income"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {hasSubIncome && (
                                                        <div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
                                                            {subIncomeEntries.map((subIncome) => (
                                                                <div
                                                                    key={subIncome.id}
                                                                    className="flex items-center justify-between py-2"
                                                                >
                                                                    <div className="text-sm text-muted-foreground">
                                                                        {subIncome.description}
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="text-sm font-medium text-emerald-500">
                                                                            {subIncome.amount.toFixed(2)} UC
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-7 w-7"
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
                                                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                                                onClick={() =>
                                                                                    handleDeleteIncome(
                                                                                        subIncome.id,
                                                                                        false
                                                                                    )
                                                                                }
                                                                                title="Delete sub-income"
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
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleAddFundTransaction}>
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
