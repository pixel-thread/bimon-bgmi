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

// Platform fee percentage (2.4%)
const PLATFORM_FEE_PERCENT = 2.4;
const QUICK_AMOUNTS = [10, 50, 100, 200];

// Calculate UC after platform fee (from rupees)
const calculateUC = (rupees: number) => Math.floor(rupees * (1 - PLATFORM_FEE_PERCENT / 100));

// Calculate rupees needed to get desired UC (inverse calculation) - exact with paise
const calculateRupees = (uc: number) => {
    const exactAmount = uc / (1 - PLATFORM_FEE_PERCENT / 100);
    // Round to 2 decimal places (paise precision)
    return Math.round(exactAmount * 100) / 100;
};

// Format rupee amount with paise
const formatRupees = (amount: number) => {
    return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
};

export function AddBalanceDialog() {
    const [open, setOpen] = useState(false);
    const [desiredUC, setDesiredUC] = useState<number>(10);
    const queryClient = useQueryClient();

    // Calculate the rupee amount needed for the desired UC
    const rupeeAmount = calculateRupees(desiredUC);

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
        mutationFn: () => http.post<CreateOrderResponse>("/payments/create-order", { amount: rupeeAmount, amountInPaise: Math.round(rupeeAmount * 100) }),
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
                description: `Add ${desiredUC} UC to your balance`,
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
                setDesiredUC(10);
            } else {
                toast.error(response.message || "Payment verification failed");
            }
        },
        onError: () => {
            toast.error("Payment verification failed. Please contact support.");
        },
    });

    const handleUCChange = (value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setDesiredUC(numValue);
        } else if (value === "") {
            setDesiredUC(0);
        }
    };

    const isLoading = isCreatingOrder || isVerifying;
    const isValidAmount = desiredUC >= 10 && rupeeAmount <= 10000;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Add UC Balance
                    </DialogTitle>
                    <DialogDescription>
                        Add UC to your account balance. A {PLATFORM_FEE_PERCENT}% platform fee applies.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Quick amount buttons */}
                    <div className="space-y-2">
                        <Label>Quick Select (UC)</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_AMOUNTS.map((ucAmount) => (
                                <Button
                                    key={ucAmount}
                                    variant={desiredUC === ucAmount ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setDesiredUC(ucAmount)}
                                    disabled={isLoading}
                                >
                                    {ucAmount} UC
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Custom UC input */}
                    <div className="space-y-2">
                        <Label htmlFor="uc-amount">Custom UC Amount</Label>
                        <Input
                            id="uc-amount"
                            type="number"
                            min={10}
                            max={9756}
                            value={desiredUC || ""}
                            onChange={(e) => handleUCChange(e.target.value)}
                            placeholder="Enter UC amount"
                            disabled={isLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Min: 10 UC • Max: 9,756 UC (₹10,000)
                        </p>
                    </div>

                    {/* Payment preview */}
                    <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20 space-y-2">
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>UC to receive</span>
                            <span className="font-semibold text-green-600 dark:text-green-400">{desiredUC} UC</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                            <span>Platform Fee ({PLATFORM_FEE_PERCENT}%)</span>
                            <span className="text-muted-foreground">included</span>
                        </div>
                        <div className="border-t border-green-500/20 pt-2 flex justify-between items-center">
                            <span className="text-sm font-medium">You pay</span>
                            <span className="text-2xl font-bold">
                                ₹{formatRupees(rupeeAmount)}
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
                                Pay ₹{formatRupees(rupeeAmount)}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
