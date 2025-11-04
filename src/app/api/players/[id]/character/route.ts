import { addGalleryImage } from "@/src/services/gallery/addGalleryImage";
import { getGalleryImageById } from "@/src/services/gallery/getImageById";
import { removeGalleryImage } from "@/src/services/gallery/removeGalleryImage";
import { getPlayerById } from "@/src/services/player/getPlayerById";
import { removePlayerChracterImage } from "@/src/services/player/removePlayerChracter";
import { updatePlayerChracterImage } from "@/src/services/player/updatePlayerChracterImage";
import { uploadImage } from "@/src/services/upload/uploadImage";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";
import { logger } from "@/src/utils/logger";
import { tokenMiddleware } from "@/src/utils/middleware/tokenMiddleware";
import { ErrorResponse, SuccessResponse } from "@/src/utils/next-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);
    const playerId = (await params).id;
    const formData = await req.formData();

    const isPlayerExist = await getPlayerById({ id: playerId });
    if (isPlayerExist === null) {
      return ErrorResponse({
        message: "Player does not exist",
        status: 404,
      });
    }
    const file = formData.get("image");

    // @ts-ignore
    if (!file || !(file instanceof Blob || file instanceof File)) {
      return ErrorResponse({
        message: "No file or invalid file upload",
      });
    }

    const data = await uploadImage({ file, bucketName: "characters" });
    const gallary = await addGalleryImage({
      data: {
        imageId: data.id,
        name: data.fileName,
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: data.url,
        isCharacterImg: true,
      },
    });
    const chracter = await updatePlayerChracterImage({
      id: playerId,
      galleryId: gallary.id,
    });
    return SuccessResponse({ data: chracter });
  } catch (error) {
    return handleApiErrors(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await tokenMiddleware(req);

    const playerId = (await params).id;

    const isPlayerExist = await getPlayerById({ id: playerId });

    logger.log("1");
    if (!isPlayerExist?.id) {
      return ErrorResponse({
        message: "Player does not exist",
        status: 404,
      });
    }

    logger.log("2");
    if (!isPlayerExist.characterImage?.id) {
      return ErrorResponse({
        message: "Player does not have a character image",
        status: 404,
      });
    }

    const image = await getGalleryImageById({
      id: isPlayerExist.characterImage?.id,
      isCharacterImg: true,
    });

    logger.log("3");
    if (!image?.id) {
      return ErrorResponse({
        message: "Image does not exist",
        status: 404,
      });
    }

    const removeGallary = await removeGalleryImage({
      image: image,
      bucketName: "characters",
    });

    logger.log("4");
    const removeCharacter = await removePlayerChracterImage({
      id: playerId,
      galleryId: removeGallary.id,
    });

    return SuccessResponse({
      data: removeCharacter,
      message: "Image removed Successfully",
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
