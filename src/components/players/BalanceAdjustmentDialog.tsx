"use client";

import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/navigation";
import { usePlayer } from "@/src/hooks/player/usePlayer";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";

interface BalanceAdjustmentDialogProps {
  isOpen: boolean;
  playerId: string;
}

const ucSchema = z.object({
  type: z.enum(["credit", "debit"]),
  amount: z.number(),
});

export function BalanceAdjustmentDialog({
  isOpen,
  playerId,
}: BalanceAdjustmentDialogProps) {
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(ucSchema),
  });

  const [balanceAdjustment, setBalanceAdjustment] = useState({
    amount: "",
    type: "credit" as "credit" | "debit",
  });

  const { data: player } = usePlayer({ id: playerId });

  const { mutate, isPending: isAdjustingBalance } = useMutation({
    mutationFn: () =>
      http.post(`/admin/players/${playerId}/uc`, { ...balanceAdjustment }),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        form.reset();
        // Small delay to let the user see the success state/toast
        setTimeout(() => {
          router.back();
        }, 500);
        return data;
      }
      toast.success(data.message);
      return data;
    },
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBalanceAdjustment({
        amount: "", // Reset to empty
        type: "credit",
      });
    }
  }, [isOpen, playerId]); // Reset when opening or changing player

  const handleTransactionTypeChange = (newType: "credit" | "debit") => {
    setBalanceAdjustment((prev) => ({
      ...prev,
      type: newType,
    }));
  };
  const onClose = () => router.back();

  const handleConfirmBalanceAdjustment = async () => mutate();

  const uc = player?.uc;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
              {typeof uc?.balance === "number"
                ? uc?.balance.toFixed(2)
                : "0.00"} UC
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
                className={`flex items-center justify-center gap-2 w-full rounded-md border py-2 cursor-pointer transition-colors ${balanceAdjustment.type === "credit"
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
                className={`flex items-center justify-center gap-2 w-full rounded-md border py-2 cursor-pointer transition-colors ${balanceAdjustment.type === "debit"
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
            <label className="text-sm font-medium">Amount (UC)</label>
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

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Preview:</strong>{" "}
              {balanceAdjustment.type === "credit" ? "Add" : "Deduct"}{" "}
              {(parseFloat(balanceAdjustment.amount) || 0).toFixed(2)} UC
              <br />
              <strong>New Balance:</strong>{" "}
              {(
                (typeof uc?.balance === "number" ? uc?.balance : 0) +
                (balanceAdjustment.type === "credit"
                  ? parseFloat(balanceAdjustment.amount) || 0
                  : -(parseFloat(balanceAdjustment.amount) || 0))
              ).toFixed(2)} UC
            </p>
          </div>
        </div>

        <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isAdjustingBalance}
            className="w-full sm:w-auto border border-input"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmBalanceAdjustment}
            disabled={
              (parseFloat(balanceAdjustment.amount) || 0) <= 0 ||
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
