import { prisma } from "@/src/lib/db/prisma";

export async function getProfileImages() {
    return await prisma.gallery.findMany({
        where: {
            isCharacterImg: true,
            status: "ACTIVE",
            player: { is: null }, // Only show admin-uploaded images, not user character images
        },
        orderBy: { id: "desc" },
    });
}
