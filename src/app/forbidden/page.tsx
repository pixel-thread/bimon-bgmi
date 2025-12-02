"use client";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { useAuth } from "@/src/hooks/context/auth/useAuth";
import { cn } from "@/src/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function page() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search.get("redirect") || "/";

  const onClickTryAgain = () => {
    queryClient.refetchQueries({ queryKey: ["user"] });
    if (user?.role !== "USER") {
      router.push(redirect);
    }
  };

  return (
    <>
      <main className="min-h-screen flex justify-center  items-center px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          <p className="text-lg font-black text-indigo-400">401</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-balance text-red-500 sm:text-7xl">
            Unauthorized
          </h1>
          <p className="mt-6 text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
            You are not authorized to view this page. Please contact support.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-2">
            <Button
              className={cn(buttonVariants({ variant: "default" }))}
              onClick={onClickTryAgain}
            >
              Try Again
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
