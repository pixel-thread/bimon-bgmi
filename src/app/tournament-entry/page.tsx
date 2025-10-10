// app/tournament-entry/page.tsx
import { Suspense } from "react";
import TournamentEntryForm from "@/src/components/TournamentEntryForm";
import { redirect } from "next/navigation";

// Define the correct PageProps interface
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Use async function without NextPage, as it's not strictly necessary
export default async function TournamentEntryPage({ searchParams }: PageProps) {
  // Resolve the searchParams Promise
  const resolvedSearchParams = await searchParams;
  const phoneNumber = resolvedSearchParams.phoneNumber;

  // Validate and redirect if phoneNumber is missing or invalid
  if (
    !phoneNumber ||
    (Array.isArray(phoneNumber)
      ? !/^\d{10}$/.test(phoneNumber[0])
      : !/^\d{10}$/.test(phoneNumber))
  ) {
    redirect("/auth?error=invalid_phone");
  }

  const validatedPhoneNumber = Array.isArray(phoneNumber)
    ? phoneNumber[0]
    : phoneNumber;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-600">
          Loading tournament entry form...
        </div>
      }
    >
      <TournamentEntryForm phoneNumber={validatedPhoneNumber} />
    </Suspense>
  );
}

export const dynamic = "force-dynamic"; // Ensure dynamic rendering
