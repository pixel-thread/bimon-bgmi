"use client";

import { HeroUIProvider } from "@heroui/react";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState, Suspense } from "react";
import { PostHogProvider } from "@/components/providers/posthog-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        retry: (failureCount, error) => {
                            // Don't retry on 4xx errors
                            if (error instanceof Error && error.message.includes("4")) {
                                return false;
                            }
                            return failureCount < 3;
                        },
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        retry: false,
                    },
                },
            })
    );

    return (
        <ClerkProvider>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <HeroUIProvider>
                        <Suspense fallback={null}>
                            <PostHogProvider>
                                {children}
                            </PostHogProvider>
                        </Suspense>
                        <Toaster
                            position="top-center"
                            richColors
                            closeButton
                            theme="dark"
                        />
                    </HeroUIProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </ClerkProvider>
    );
}
