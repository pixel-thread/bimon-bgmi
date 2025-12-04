"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { toast } from "sonner";
import http from "@/src/utils/http";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";

interface AdjustBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    playerId: string;
    playerName: string;
    currentBalance: number;
}

export function AdjustBalanceDialog({
    open,
    onOpenChange,
    playerId,
    playerName,
    currentBalance,
}: AdjustBalanceDialogProps) {
    const [type, setType] = useState<"credit" | "debit">("credit");
    const [amount, setAmount] = useState("");
    const queryClient = useQueryClient();

    const { mutate: updateBalance, isPending } = useMutation({
        mutationFn: (data: { type: "credit" | "debit"; amount: number }) =>
            http.post(
                ADMIN_PLAYER_ENDPOINTS.POST_UPDATE_BALANCE.replace(":id", playerId),
                data
            ),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Balance updated successfully");
                queryClient.invalidateQueries({ queryKey: ["players"] });
                onOpenChange(false);
                setAmount("");
                setType("credit");
            } else {
                toast.error(data.message || "Failed to update balance");
            }
        },
        onError: () => {
            toast.error("Failed to update balance");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        updateBalance({ type, amount: numAmount });
    };

    const newBalance =
        type === "credit"
            ? currentBalance + (parseFloat(amount) || 0)
            : currentBalance - (parseFloat(amount) || 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adjust Balance</DialogTitle>
                    <DialogDescription>
                        Adjust UC balance for {playerName}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Current Balance</Label>
                            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                                {currentBalance} UC
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Transaction Type</Label>
                            <RadioGroup value={type} onValueChange={(v) => setType(v as "credit" | "debit")}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="credit" id="credit" />
                                    <Label htmlFor="credit" className="font-normal cursor-pointer">
                                        Credit (Add)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="debit" id="debit" />
                                    <Label htmlFor="debit" className="font-normal cursor-pointer">
                                        Debit (Subtract)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        {amount && (
                            <div className="grid gap-2">
                                <Label>New Balance</Label>
                                <div className={`text-xl font-semibold ${newBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {newBalance.toFixed(2)} UC
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Updating..." : "Update Balance"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
