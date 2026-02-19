"use client";

import { HeroUIProvider } from "@heroui/react";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";

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
                <HeroUIProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="dark"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {children}
                        <Toaster
                            position="top-center"
                            richColors
                            closeButton
                            theme="dark"
                        />
                    </ThemeProvider>
                </HeroUIProvider>
            </QueryClientProvider>
        </ClerkProvider>
    );
}
