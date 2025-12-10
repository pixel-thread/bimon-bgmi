"use client";
import { CookiesProvider } from "react-cookie";
import { AuthProvider } from "./auth";
import { RoleBaseRoute } from "../common/RoleBaseRouting";
import InstallPrompt from "../InstallPrompt";
import { Toaster } from "sonner";
import { TQueryProvider } from "./query";
import { Layout } from "../common/layout";
import { ThemeProvider } from "next-themes";
import { ClerkProvider, ClerkLoaded } from "@clerk/nextjs";

type Props = {
  children: React.ReactNode;
};
export const Wrapper = ({ children }: Props) => {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <ClerkLoaded>
        <CookiesProvider
          defaultSetOptions={{
            path: "/",
          }}
        >
          <TQueryProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              <AuthProvider>
                <RoleBaseRoute>
                  <Layout>{children}</Layout>
                  {/* <InstallPrompt /> */}
                  <Toaster richColors position="top-right" />
                </RoleBaseRoute>
              </AuthProvider>
            </ThemeProvider>
          </TQueryProvider>
        </CookiesProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
};
