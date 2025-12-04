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
import { Textarea } from "@/src/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/src/components/ui/tabs";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { toast } from "sonner";
import { useAuth } from "@/src/hooks/context/auth/useAuth";

type Props = {
    isOpen: boolean;
    onClose: () => void;
    toPlayerId: string;
    toPlayerName: string;
};

export function UCTransferDialog({ isOpen, onClose, toPlayerId, toPlayerName }: Props) {
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState<"send" | "request">("send");
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const userBalance = user?.player?.uc?.balance || 0;

    const { mutate: createTransfer, isPending } = useMutation({
        mutationFn: (data: { amount: number; type: string; toPlayerId: string; message?: string }) =>
            http.post("/uc-transfers", data),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message);
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                queryClient.invalidateQueries({ queryKey: ["player"] });
                handleClose();
            } else {
                toast.error(data.message || "Transfer failed");
            }
        },
        onError: () => toast.error("Transfer failed"),
    });

    const handleClose = () => {
        setAmount("");
        setMessage("");
        setActiveTab("send");
        onClose();
    };

    const handleSubmit = () => {
        const amountNum = parseInt(amount);
        if (!amountNum || amountNum <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (activeTab === "send" && amountNum > userBalance) {
            toast.error(`Insufficient balance. You have ${userBalance} UC.`);
            return;
        }

        createTransfer({
            amount: amountNum,
            type: activeTab === "send" ? "SEND" : "REQUEST",
            toPlayerId,
            message: message || undefined,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Transfer UC with {toPlayerName}</DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "send" | "request")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="send" className="flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4" />
                            Send UC
                        </TabsTrigger>
                        <TabsTrigger value="request" className="flex items-center gap-2">
                            <ArrowDownLeft className="w-4 h-4" />
                            Request UC
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="send" className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Send UC directly to <span className="font-medium text-foreground">{toPlayerName}</span>.
                            The UC will be transferred immediately from your balance.
                            <br />
                            <span className="text-xs mt-1 block">
                                Your Balance: <span className={userBalance > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{userBalance} UC</span>
                            </span>
                        </p>
                    </TabsContent>

                    <TabsContent value="request" className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Request UC from <span className="font-medium text-foreground">{toPlayerName}</span>.
                            They will need to approve your request from their profile page.
                        </p>
                    </TabsContent>
                </Tabs>

                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (UC)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            min="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message (optional)</Label>
                        <Textarea
                            id="message"
                            placeholder="Add a note..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending || !amount}
                        className={activeTab === "send" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
                    >
                        {isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : activeTab === "send" ? (
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                        ) : (
                            <ArrowDownLeft className="w-4 h-4 mr-2" />
                        )}
                        {activeTab === "send" ? "Send UC" : "Request UC"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
