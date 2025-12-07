import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";

type GalleryT = Prisma.GalleryGetPayload<object>;

export function useGlobalBackground() {
    return useQuery({
        queryKey: ["global-background"],
        queryFn: () => http.get<GalleryT | null>("/admin/gallery/global-background"),
        select: (data) => data.data,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        gcTime: 10 * 60 * 1000,
    });
}
