import { prisma } from "@/src/lib/db/prisma";

export async function getProfileImages() {
    return await prisma.gallery.findMany({
        where: {
            isCharacterImg: true,
            status: "ACTIVE",
        },
        orderBy: { id: "desc" },
    });
}
