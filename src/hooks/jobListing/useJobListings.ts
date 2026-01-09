import http from "@/src/utils/http";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Types
export interface JobListing {
    id: string;
    playerId: string;
    category: string;
    category2: string | null;
    customCategory: string | null;
    title: string;
    description: string | null;
    phoneNumber: string;
    experience: string | null;
    isActive: boolean;
    likeCount: number;
    dislikeCount: number;
    isJobBanned: boolean;
    createdAt: string;
    updatedAt: string;
    player?: {
        id: string;
        user: {
            displayName: string | null;
            userName: string;
        };
        characterImage?: {
            publicUrl: string;
        } | null;
    };
    userReaction?: "like" | "dislike" | null;  // Current user's reaction
}

export interface CreateJobListingInput {
    category: string;
    category2?: string;
    customCategory?: string;
    title: string;
    description?: string;
    phoneNumber: string;
    experience?: string;
}

export interface UpdateJobListingInput extends Partial<CreateJobListingInput> {
    id: string;
    isActive?: boolean;
}

// Experience options
export const EXPERIENCE_OPTIONS = [
    { value: "1_MONTH", label: "1 Month" },
    { value: "6_MONTHS", label: "6 Months" },
    { value: "1_YEAR", label: "1 Year" },
    { value: "2_YEARS", label: "2 Years" },
    { value: "3_YEARS_PLUS", label: "3+ Years" },
] as const;

// Predefined job categories
export const JOB_CATEGORIES = [
    "Painter",
    "Shopkeeper",
    "Driver",
    "Electrician",
    "Plumber",
    "Mechanic",
    "Tutor/Teacher",
    "Delivery",
    "Carpenter",
    "Tailor",
    "Cook/Chef",
    "Other",
] as const;

// Hook to fetch all job categories (predefined + custom)
export function useJobCategories() {
    return useQuery({
        queryKey: ["jobCategories"],
        queryFn: () => http.get<string[]>("/job-categories"),
        select: (data) => data.data,
        staleTime: 60000, // 1 minute
    });
}

// Hook to fetch all active job listings (for banner)
export function useJobListings() {
    return useQuery({
        queryKey: ["jobListings"],
        queryFn: () => http.get<JobListing[]>("/job-listing"),
        select: (data) => data.data,
        refetchOnWindowFocus: false,
        staleTime: 30000, // 30 seconds
    });
}

// Hook to fetch current player's job listings (for profile management)
export function useMyJobListings() {
    return useQuery({
        queryKey: ["myJobListings"],
        queryFn: () => http.get<JobListing[]>("/job-listing/my"),
        select: (data) => data.data,
        refetchOnWindowFocus: false,
    });
}

// Hook to create a new job listing
export function useCreateJobListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateJobListingInput) =>
            http.post<JobListing>("/job-listing", data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Job listing created successfully!");
                queryClient.invalidateQueries({ queryKey: ["jobListings"] });
                queryClient.invalidateQueries({ queryKey: ["myJobListings"] });
                queryClient.invalidateQueries({ queryKey: ["jobCategories"] }); // Refresh categories
            } else {
                toast.error(response.message || "Failed to create job listing");
            }
        },
        onError: () => {
            toast.error("Failed to create job listing");
        },
    });
}

// Hook to update a job listing
export function useUpdateJobListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, ...data }: UpdateJobListingInput) =>
            http.put<JobListing>(`/job-listing/${id}`, data),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Job listing updated successfully!");
                queryClient.invalidateQueries({ queryKey: ["jobListings"] });
                queryClient.invalidateQueries({ queryKey: ["myJobListings"] });
            } else {
                toast.error(response.message || "Failed to update job listing");
            }
        },
        onError: () => {
            toast.error("Failed to update job listing");
        },
    });
}

// Hook to delete a job listing
export function useDeleteJobListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => http.delete<null>(`/job-listing/${id}`),
        onSuccess: (response) => {
            if (response.success) {
                toast.success("Job listing deleted successfully!");
                queryClient.invalidateQueries({ queryKey: ["jobListings"] });
                queryClient.invalidateQueries({ queryKey: ["myJobListings"] });
            } else {
                toast.error(response.message || "Failed to delete job listing");
            }
        },
        onError: () => {
            toast.error("Failed to delete job listing");
        },
    });
}

// Hook to like/dislike a job listing
export function useReactToListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ listingId, reactionType }: { listingId: string; reactionType: "like" | "dislike" }) =>
            http.post<{ likeCount: number; dislikeCount: number; isJobBanned: boolean }>(`/job-listing/${listingId}/react`, { reactionType }),
        onSuccess: (response) => {
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ["jobListings"] });
            } else {
                toast.error(response.message || "Failed to react");
            }
        },
        onError: () => {
            toast.error("Failed to react to listing");
        },
    });
}
