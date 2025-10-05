import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ImageCompressionService } from "./imageCompressionService";

export class CharacterImageService {
  /**
   * Upload character image with advanced compression
   */
  static async uploadCharacterImage(
    playerId: string,
    file: File
  ): Promise<string> {
    console.log("CharacterImageService: Starting upload", {
      playerId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    try {
      // Compress image using advanced compression service
      console.log("CharacterImageService: Compressing image...");
      const compressionResult = await ImageCompressionService.compressImage(
        file,
        {
          maxSizeBytes: 1024 * 1024, // 1MB target
          maxWidth: 800, // Larger for character images
          maxHeight: 800,
          initialQuality: 0.9,
          minQuality: 0.4,
        }
      );

      console.log(
        "CharacterImageService: Compression stats:",
        ImageCompressionService.formatCompressionStats(compressionResult)
      );

      // Update player document with compressed character image
      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, {
        characterAvatarBase64: compressionResult.base64,
        characterImageUpdatedAt: new Date().toISOString(),
        // Store compression metadata
        characterCompressionStats: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          format: compressionResult.format,
          dimensions: compressionResult.dimensions,
        },
      });

      console.log(
        "CharacterImageService: Character image updated in Firestore"
      );
      return compressionResult.base64;
    } catch (error) {
      console.error("CharacterImageService: Upload failed:", error);
      throw new Error("Failed to upload character image");
    }
  }

  /**
   * Remove character image from player document
   */
  static async deleteCharacterImage(playerId: string): Promise<void> {
    console.log(
      "CharacterImageService: Removing character image for player:",
      playerId
    );

    try {
      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, {
        characterAvatarBase64: null,
        characterImageUpdatedAt: null,
        characterCompressionStats: null, // Clear compression metadata
      });

      console.log(
        "CharacterImageService: Character image removed from Firestore"
      );
    } catch (error) {
      console.error("CharacterImageService: Delete failed:", error);
      throw new Error("Failed to remove character image");
    }
  }
}
