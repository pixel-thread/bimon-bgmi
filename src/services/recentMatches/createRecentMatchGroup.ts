import { prisma } from "@/src/lib/db/prisma";

type CreateRecentMatchGroupInput = {
    tournamentId: string;
    tournamentTitle: string;
    deletionMarker: number;
    images: {
        matchNumber: number;
        imageUrl: string;
        imagePath: string;
    }[];
};

export async function createRecentMatchGroup(data: CreateRecentMatchGroupInput) {
    return prisma.recentMatchGroup.create({
        data: {
            tournamentId: data.tournamentId,
            tournamentTitle: data.tournamentTitle,
            deletionMarker: data.deletionMarker,
            images: {
                create: data.images.map((img) => ({
                    matchNumber: img.matchNumber,
                    imageUrl: img.imageUrl,
                    imagePath: img.imagePath,
                })),
            },
        },
        include: {
            images: true,
        },
    });
}
