"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Skeleton,
} from "@heroui/react";
import { LogIn, Eye, Gamepad2 } from "lucide-react";
import { GAME } from "@/lib/game-config";

/**
 * Shows a blurred skeleton page with a login modal overlay.
 * Renders fake content behind a blur so guests see "something is here"
 * but need to sign in to access it.
 */
export function AuthRequired() {
    return (
        <>
            {/* Blurred skeleton background */}
            <div className="pointer-events-none select-none blur-sm opacity-60 px-4 py-6 space-y-6">
                {/* Fake header area */}
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-40 rounded-lg" />
                        <Skeleton className="h-3 w-24 rounded-lg" />
                    </div>
                </div>

                {/* Fake stats grid */}
                <div className="grid grid-cols-3 gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl bg-default-100 p-4 space-y-2">
                            <Skeleton className="h-3 w-16 rounded-lg" />
                            <Skeleton className="h-6 w-20 rounded-lg" />
                        </div>
                    ))}
                </div>

                {/* Fake list */}
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-default-50">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-32 rounded-lg" />
                                <Skeleton className="h-2 w-20 rounded-lg" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Login modal overlay */}
            <Modal
                isOpen
                isDismissable={false}
                hideCloseButton
                size="sm"
                placement="center"
                backdrop="transparent"
            >
                <ModalContent>
                    <ModalHeader className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                        Sign in to continue
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-foreground/70">
                            Sign in to access your {GAME.name} profile, participate in tournaments, vote on maps, and manage your wallet.
                        </p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            size="sm"
                            startContent={<Eye className="h-4 w-4" />}
                            onPress={() => window.history.back()}
                        >
                            Go Back
                        </Button>
                        <Button
                            color="primary"
                            size="sm"
                            startContent={<LogIn className="h-4 w-4" />}
                            onPress={() => { window.location.href = "/sign-in"; }}
                        >
                            Sign In
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
