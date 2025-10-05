import { db } from "./firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ImageCompressionService } from "./imageCompressionService";

export class AvatarService {
  /**
   * Upload avatar for a player with advanced compression
   */
  static async uploadAvatar(playerId: string, file: File): Promise<string> {
    try {
      console.log(`Uploading avatar for player ${playerId}...`);

      // Compress image using advanced compression service
      console.log("Compressing image with advanced compression...");
      const compressionResult = await ImageCompressionService.compressImage(
        file,
        {
          maxSizeBytes: 1024 * 1024, // 1MB target
          maxWidth: 512, // Higher resolution for avatars
          maxHeight: 512,
          initialQuality: 0.9,
          minQuality: 0.4,
        }
      );

      console.log(
        "Compression stats:",
        ImageCompressionService.formatCompressionStats(compressionResult)
      );

      // Update player document with the compressed avatar
      console.log("Updating player document...");
      const playerRef = doc(db, "players", playerId);
      await updateDoc(playerRef, {
        avatarBase64: compressionResult.base64,
        avatarUpdatedAt: new Date().toISOString(),
        // Store compression metadata for debugging
        avatarCompressionStats: {
          originalSize: compressionResult.originalSize,
          compressedSize: compressionResult.compressedSize,
          format: compressionResult.format,
          dimensions: compressionResult.dimensions,
        },
        // Clear the old avatarUrl field
        avatarUrl: null,
      });
      console.log("Player document updated successfully");

      return compressionResult.base64;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      throw new Error("Failed to upload avatar. Please try again.");
    }
  }

  /**
   * Delete avatar for a player
   */
  static async deleteAvatar(playerId: string): Promise<void> {
    try {
      console.log(`Deleting avatar for player ${playerId}...`);

      // Update player document to remove avatar
      const playerRef = doc(db, "players", playerId);

      try {
        await updateDoc(playerRef, {
          avatarBase64: null,
          avatarUrl: null, // Also clear old field
          avatarUpdatedAt: serverTimestamp(),
          avatarCompressionStats: null, // Clear compression metadata
        });
        console.log("Player document updated - avatar removed");
      } catch (error: any) {
        if (
          error.code === "not-found" ||
          error.message.includes("No document to update")
        ) {
          console.log(
            `Player document ${playerId} not found, no need to delete avatar`
          );
          return;
        }
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error("Avatar deletion failed:", error);
      throw error;
    }
  }

  /**
   * Get avatar URL for a player (helper method)
   */
  static getAvatarUrl(player: { avatarBase64?: string | null }): string | null {
    return player.avatarBase64 || null;
  }
}
