"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { Button } from "@/src/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { toast } from "sonner";
import { Plus, Loader2, CreditCard, Wallet } from "lucide-react";

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
    };
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayInstance {
    open: () => void;
    close: () => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

interface CreateOrderResponse {
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
}

interface VerifyPaymentResponse {
    ucAdded: number;
}

const QUICK_AMOUNTS = [100, 200, 500, 1000];

export function AddBalanceDialog() {
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState<number>(100);
    const queryClient = useQueryClient();

    // Load Razorpay script
    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    // Create order mutation
    const { mutate: createOrder, isPending: isCreatingOrder } = useMutation({
        mutationFn: () => http.post<CreateOrderResponse>("/payments/create-order", { amount }),
        onSuccess: async (response) => {
            if (!response.success || !response.data) {
                toast.error(response.message || "Failed to create order");
                return;
            }

            const { orderId, amount: orderAmount, currency, keyId } = response.data;

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error("Failed to load payment gateway");
                return;
            }

            const options: RazorpayOptions = {
                key: keyId,
                amount: orderAmount,
                currency: currency,
                name: "BIMON BGMI",
                description: `Add ${amount} UC to your balance`,
                order_id: orderId,
                handler: function (response: RazorpayResponse) {
                    verifyPayment(response);
                },
                theme: {
                    color: "#6366f1",
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Payment cancelled");
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        },
        onError: () => {
            toast.error("Failed to initiate payment");
        },
    });

    // Verify payment mutation
    const { mutate: verifyPayment, isPending: isVerifying } = useMutation({
        mutationFn: (paymentResponse: RazorpayResponse) =>
            http.post<VerifyPaymentResponse>("/payments/verify", paymentResponse),
        onSuccess: (response) => {
            if (response.success && response.data) {
                toast.success(response.message || `Added ${response.data.ucAdded} UC to your balance!`);
                queryClient.invalidateQueries({ queryKey: ["player"] });
                queryClient.invalidateQueries({ queryKey: ["uc-transfers"] });
                setOpen(false);
                setAmount(100);
            } else {
                toast.error(response.message || "Payment verification failed");
            }
        },
        onError: () => {
            toast.error("Payment verification failed. Please contact support.");
        },
    });

    const handleAmountChange = (value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setAmount(numValue);
        } else if (value === "") {
            setAmount(0);
        }
    };

    const isLoading = isCreatingOrder || isVerifying;
    const isValidAmount = amount >= 100 && amount <= 10000;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    Add Balance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Add UC Balance
                    </DialogTitle>
                    <DialogDescription>
                        Add UC to your account balance. ₹1 = 1 UC
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick amount buttons */}
                    <div className="space-y-2">
                        <Label>Quick Select</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_AMOUNTS.map((quickAmount) => (
                                <Button
                                    key={quickAmount}
                                    variant={amount === quickAmount ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setAmount(quickAmount)}
                                    disabled={isLoading}
                                >
                                    ₹{quickAmount}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom amount input */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Custom Amount (₹)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min={100}
                            max={10000}
                            value={amount || ""}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Enter amount"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Min: ₹100 • Max: ₹10,000
                        </p>
                    </div>

                    {/* UC preview */}
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">You will receive</span>
                            <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {amount} UC
                            </span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createOrder()}
                        disabled={isLoading || !isValidAmount}
                        className="gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4" />
                                Pay ₹{amount}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
