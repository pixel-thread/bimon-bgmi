"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { PlayerT } from "@/src/types/player";

interface BalanceAdjustmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  player: PlayerT | null;
  onBalanceUpdate: () => void;
}

export function BalanceAdjustmentDialog({
  isOpen,
  onOpenChange,
  player,
  onBalanceUpdate,
}: BalanceAdjustmentDialogProps) {
  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: "",
    reason: "Manual balance increase",
    type: "credit" as "credit" | "debit",
  });
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);

  const handleTransactionTypeChange = (newType: "credit" | "debit") => {
    const defaultReason =
      newType === "credit"
        ? "Manual balance increase"
        : "Manual balance decrease";
    setBalanceAdjustment((prev) => ({
      ...prev,
      type: newType,
      reason:
        prev.reason === "Manual balance increase" ||
        prev.reason === "Manual balance decrease" ||
        prev.reason === ""
          ? defaultReason
          : prev.reason,
    }));
  };

  const handleConfirmBalanceAdjustment = async () => {
    const amountValue = parseFloat(balanceAdjustment.amount) || 0;
    if (!player || amountValue <= 0 || !balanceAdjustment.reason.trim()) {
      toast.error("Please fill in all fields with valid values");
      return;
    }

    setIsAdjustingBalance(true);
    try {
      const currentBalance =
        typeof player.balance === "number" ? player.balance : 0;
      const adjustmentAmount =
        balanceAdjustment.type === "credit" ? amountValue : -amountValue;
      const newBalance = currentBalance + adjustmentAmount;

      const now = new Date().toISOString();
      const txId = `${player.id}_${Date.now()}`;

      toast.success(
        `Balance ${
          balanceAdjustment.type === "credit" ? "credited" : "debited"
        } successfully!`,
      );
      setBalanceAdjustment({
        amount: "",
        reason: "Manual balance increase",
        type: "credit",
      });
      onBalanceUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adjusting balance:", error);
      toast.error("Failed to adjust balance");
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Wallet className="w-5 h-5" />
            Adjust Balance - {player?.user.userName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="text-sm font-medium">Current Balance</label>
            <div className="text-lg font-bold text-muted-foreground">
              ₹
              {typeof player?.balance === "number"
                ? player.balance.toFixed(2)
                : "0.00"}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium block mb-2">
              Transaction Type
            </Label>
            <RadioGroup
              value={balanceAdjustment.type}
              onValueChange={(value: "credit" | "debit") =>
                handleTransactionTypeChange(value)
              }
              className="grid grid-cols-2 gap-3 w-full"
            >
              <div
                onClick={() =>
                  !isAdjustingBalance && handleTransactionTypeChange("credit")
                }
                className={`flex items-center justify-center gap-2 w-full rounded-md border py-2 cursor-pointer transition-colors ${
                  balanceAdjustment.type === "credit"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/50"
                } ${isAdjustingBalance ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RadioGroupItem
                  value="credit"
                  id="credit"
                  disabled={isAdjustingBalance}
                />
                <Label
                  htmlFor="credit"
                  className="font-normal cursor-pointer select-none"
                >
                  Credit
                </Label>
              </div>
              <div
                onClick={() =>
                  !isAdjustingBalance && handleTransactionTypeChange("debit")
                }
                className={`flex items-center justify-center gap-2 w-full rounded-md border py-2 cursor-pointer transition-colors ${
                  balanceAdjustment.type === "debit"
                    ? "border-primary bg-primary/5"
                    : "border-input hover:border-primary/50"
                } ${isAdjustingBalance ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <RadioGroupItem
                  value="debit"
                  id="debit"
                  disabled={isAdjustingBalance}
                />
                <Label
                  htmlFor="debit"
                  className="font-normal cursor-pointer select-none"
                >
                  Debit
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <label className="text-sm font-medium">Amount (₹)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={balanceAdjustment.amount}
              onChange={(e) =>
                setBalanceAdjustment((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              placeholder="Enter amount"
              className="border border-input"
              disabled={isAdjustingBalance}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Reason</label>
            <Input
              value={balanceAdjustment.reason}
              onChange={(e) =>
                setBalanceAdjustment((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="Enter reason for adjustment"
              className="border border-input"
              disabled={isAdjustingBalance}
            />
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Preview:</strong>{" "}
              {balanceAdjustment.type === "credit" ? "Add" : "Deduct"} ₹
              {(parseFloat(balanceAdjustment.amount) || 0).toFixed(2)}
              <br />
              <strong>New Balance:</strong> ₹
              {(
                (typeof player?.balance === "number" ? player.balance : 0) +
                (balanceAdjustment.type === "credit"
                  ? parseFloat(balanceAdjustment.amount) || 0
                  : -(parseFloat(balanceAdjustment.amount) || 0))
              ).toFixed(2)}
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdjustingBalance}
            className="w-full sm:w-auto border border-input"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBalanceAdjustment}
            disabled={
              (parseFloat(balanceAdjustment.amount) || 0) <= 0 ||
              !balanceAdjustment.reason.trim() ||
              isAdjustingBalance
            }
            className="w-full sm:w-auto border border-input"
          >
            {isAdjustingBalance ? "Processing..." : "Confirm Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
