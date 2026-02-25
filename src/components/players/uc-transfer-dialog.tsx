"use client";

import { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Tabs,
    Tab,
} from "@heroui/react";
import { ArrowUpRight, ArrowDownLeft, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthUser } from "@/hooks/use-auth-user";

interface UCTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    toPlayerId: string;
    toPlayerName: string;
}

export function UCTransferDialog({
    isOpen,
    onClose,
    toPlayerId,
    toPlayerName,
}: UCTransferDialogProps) {
    const [amount, setAmount] = useState("");
    const [message, setMessage] = useState("UC Top-up");
    const [activeTab, setActiveTab] = useState<string>("request");
    const queryClient = useQueryClient();
    const { balance } = useAuthUser();

    const { mutate: createTransfer, isPending } = useMutation({
        mutationFn: async (data: {
            amount: number;
            type: string;
            toPlayerId: string;
            message?: string;
        }) => {
            const res = await fetch("/api/uc-transfers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ["auth-user"] });
                queryClient.invalidateQueries({ queryKey: ["players"] });
                handleClose();
            }
        },
    });

    const handleClose = () => {
        setAmount("");
        setMessage("UC Top-up");
        setActiveTab("request");
        onClose();
    };

    const handleSubmit = () => {
        const amountNum = parseInt(amount);
        if (!amountNum || amountNum <= 0) return;

        if (activeTab === "send" && amountNum > balance) return;

        createTransfer({
            amount: amountNum,
            type: activeTab === "send" ? "SEND" : "REQUEST",
            toPlayerId,
            message: message || undefined,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} placement="center" size="md" scrollBehavior="outside">
            <ModalContent>
                <ModalHeader className="flex flex-col items-center gap-1 pb-0">
                    <span className="text-lg font-bold">{toPlayerName}</span>
                </ModalHeader>

                <ModalBody className="gap-4 px-5 pt-4">
                    <Tabs
                        selectedKey={activeTab}
                        onSelectionChange={(key) => setActiveTab(key as string)}
                        fullWidth
                        size="sm"
                        color={activeTab === "send" ? "success" : "primary"}
                    >
                        <Tab
                            key="request"
                            title={
                                <div className="flex items-center gap-1.5">
                                    <ArrowDownLeft className="h-3.5 w-3.5" />
                                    <span>Request UC</span>
                                </div>
                            }
                        />
                        <Tab
                            key="send"
                            title={
                                <div className="flex items-center gap-1.5">
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                    <span>Send UC</span>
                                </div>
                            }
                        />
                    </Tabs>

                    {activeTab === "send" && (
                        <p className="text-xs text-foreground/50">
                            Your Balance:{" "}
                            <span
                                className={`font-bold ${balance > 0 ? "text-success" : "text-danger"
                                    }`}
                            >
                                {balance} UC
                            </span>
                        </p>
                    )}

                    {activeTab === "request" && (
                        <p className="text-xs text-foreground/50">
                            The player will need to approve your request.
                        </p>
                    )}

                    {/* Suggested amounts */}
                    <div className="flex flex-wrap gap-2">
                        {[5, 10, 20, 50, 100].map((v) => {
                            const disabled = activeTab === "send" && v > balance;
                            return (
                                <button
                                    key={v}
                                    onClick={() => !disabled && setAmount(String(v))}
                                    disabled={disabled}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${amount === String(v)
                                        ? activeTab === "send"
                                            ? "bg-success text-success-foreground border-success shadow-sm"
                                            : "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : disabled
                                            ? "border-divider text-foreground/20 cursor-not-allowed"
                                            : "border-divider text-foreground/60 hover:border-foreground/30 hover:bg-default-100"
                                        }`}
                                >
                                    {v} UC
                                </button>
                            );
                        })}
                    </div>

                    <Input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        label="Amount"
                        placeholder="0"
                        value={amount}
                        onValueChange={(v) => setAmount(v.replace(/\D/g, ""))}
                        endContent={<span className="text-foreground/40 text-sm font-medium">UC</span>}
                        classNames={{
                            input: "text-xl font-bold text-center",
                            inputWrapper: "h-14",
                        }}
                        isInvalid={
                            activeTab === "send" &&
                            !!amount &&
                            parseInt(amount) > balance
                        }
                        errorMessage={
                            activeTab === "send" &&
                                parseInt(amount) > balance
                                ? "Insufficient balance"
                                : undefined
                        }
                    />

                    {/* Quick message suggestions */}
                    <div>
                        <p className="text-xs text-foreground/40 mb-1.5">Quick message</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[
                                "Prize 🏆",
                                "Bonus 🎁",
                                "Refund 💰",
                                "Streak Reward 🔥",
                                "RP Reward 👑",
                                "Promo",
                                "Compensation",
                            ].map((msg) => (
                                <button
                                    key={msg}
                                    onClick={() => setMessage(message === msg ? "" : msg)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${message === msg
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "border-divider text-foreground/50 hover:border-foreground/30 hover:bg-default-100"
                                        }`}
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Textarea
                        label="Message (optional)"
                        placeholder="Add a note..."
                        value={message}
                        onValueChange={setMessage}
                        minRows={2}
                        maxRows={3}
                    />
                </ModalBody>

                <ModalFooter>
                    <Button variant="flat" onPress={handleClose} isDisabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        color={activeTab === "send" ? "success" : "primary"}
                        onPress={handleSubmit}
                        isDisabled={isPending || !amount || parseInt(amount) <= 0}
                        isLoading={isPending}
                        startContent={
                            !isPending &&
                            (activeTab === "send" ? (
                                <ArrowUpRight className="h-4 w-4" />
                            ) : (
                                <ArrowDownLeft className="h-4 w-4" />
                            ))
                        }
                    >
                        {activeTab === "send" ? "Send UC" : "Request UC"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
