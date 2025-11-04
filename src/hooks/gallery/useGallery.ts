import { Prisma } from "@/src/lib/db/prisma/generated/prisma";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
type GalleryT = Prisma.GalleryGetPayload<{ include: { _count: true } }>;

export function useGallery() {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: () => http.get<GalleryT[]>("/admin/gallery"),
    select: (data) => data.data,
  });
}
