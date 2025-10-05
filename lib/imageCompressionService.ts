/**
 * Advanced Image Compression Service
 *
 * Compresses images to target size (~1MB) while maintaining quality.
 * Uses WebP format when supported, falls back to JPEG.
 * Implements progressive quality reduction to meet size targets.
 */

export interface CompressionOptions {
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  initialQuality?: number;
  minQuality?: number;
  format?: "webp" | "jpeg" | "auto";
}

export interface CompressionResult {
  base64: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
}

export class ImageCompressionService {
  // Default settings for ~1MB target
  private static readonly DEFAULT_OPTIONS: Required<CompressionOptions> = {
    maxSizeBytes: 1024 * 1024, // 1MB
    maxWidth: 1024,
    maxHeight: 1024,
    initialQuality: 0.9,
    minQuality: 0.3,
    format: "auto",
  };

  /**
   * Compress image file to meet size and quality requirements
   */
  static async compressImage(
    file: File,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    console.log("ImageCompressionService: Starting compression", {
      fileName: file.name,
      originalSize: file.size,
      targetSize: opts.maxSizeBytes,
      options: opts,
    });

    // Validate file
    this.validateFile(file);

    // Load image
    const img = await this.loadImage(file);
    const originalDimensions = { width: img.width, height: img.height };

    console.log(
      "ImageCompressionService: Original dimensions",
      originalDimensions
    );

    // Calculate optimal dimensions
    const targetDimensions = this.calculateTargetDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight
    );

    console.log("ImageCompressionService: Target dimensions", targetDimensions);

    // Determine best format
    const format = this.getBestFormat(opts.format);
    console.log("ImageCompressionService: Using format", format);

    // Compress with progressive quality reduction
    const result = await this.compressWithQualityReduction(
      img,
      targetDimensions,
      format,
      opts
    );

    console.log("ImageCompressionService: Compression complete", {
      originalSize: file.size,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      format: result.format,
    });

    return result;
  }

  /**
   * Load image from file
   */
  private static loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  }

  /**
   * Calculate target dimensions maintaining aspect ratio
   */
  private static calculateTargetDimensions(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // If image is already smaller, don't upscale
    if (width <= maxWidth && height <= maxHeight) {
      return { width, height };
    }

    const aspectRatio = width / height;

    let targetWidth = maxWidth;
    let targetHeight = maxWidth / aspectRatio;

    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
    };
  }

  /**
   * Determine best compression format
   */
  private static getBestFormat(
    format: "webp" | "jpeg" | "auto"
  ): "webp" | "jpeg" {
    if (format !== "auto") {
      return format;
    }

    // Check WebP support
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;

    try {
      const webpData = canvas.toDataURL("image/webp");
      return webpData.startsWith("data:image/webp") ? "webp" : "jpeg";
    } catch {
      return "jpeg";
    }
  }

  /**
   * Compress image with progressive quality reduction to meet size target
   */
  private static async compressWithQualityReduction(
    img: HTMLImageElement,
    dimensions: { width: number; height: number },
    format: "webp" | "jpeg",
    options: Required<CompressionOptions>
  ): Promise<CompressionResult> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // Draw image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    let quality = options.initialQuality;
    let base64: string;
    let compressedSize: number;

    const mimeType = format === "webp" ? "image/webp" : "image/jpeg";

    // Progressive quality reduction
    do {
      base64 = canvas.toDataURL(mimeType, quality);
      compressedSize = this.getBase64Size(base64);

      console.log(
        `ImageCompressionService: Quality ${quality.toFixed(2)}, Size: ${(
          compressedSize / 1024
        ).toFixed(1)}KB`
      );

      if (compressedSize <= options.maxSizeBytes) {
        break;
      }

      // Reduce quality more aggressively as we approach the limit
      const sizeRatio = compressedSize / options.maxSizeBytes;
      if (sizeRatio > 2) {
        quality *= 0.7; // Reduce by 30%
      } else if (sizeRatio > 1.5) {
        quality *= 0.8; // Reduce by 20%
      } else {
        quality *= 0.9; // Reduce by 10%
      }

      if (quality < options.minQuality) {
        console.warn(
          "ImageCompressionService: Reached minimum quality, size may exceed target"
        );
        break;
      }
    } while (compressedSize > options.maxSizeBytes);

    const originalSize = img.width * img.height * 4; // Rough estimate
    const compressionRatio = originalSize / compressedSize;

    return {
      base64,
      originalSize,
      compressedSize,
      compressionRatio,
      format,
      dimensions,
    };
  }

  /**
   * Calculate base64 string size in bytes
   */
  private static getBase64Size(base64: string): number {
    // Remove data URL prefix
    const base64Data = base64.split(",")[1] || base64;

    // Calculate size: each base64 char represents 6 bits
    // 4 base64 chars = 3 bytes, but we need to account for padding
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Data.length * 3) / 4) - padding;
  }

  /**
   * Validate uploaded file
   */
  private static validateFile(file: File): void {
    if (!file) {
      throw new Error("No file provided");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "File type not supported. Please use JPG, PNG, GIF, WebP, or BMP"
      );
    }

    // Allow larger uploads since we'll compress them
    const maxUploadSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxUploadSize) {
      throw new Error("File size must be less than 50MB");
    }
  }

  /**
   * Get compression stats for display
   */
  static formatCompressionStats(result: CompressionResult): string {
    const originalKB = (result.originalSize / 1024).toFixed(1);
    const compressedKB = (result.compressedSize / 1024).toFixed(1);
    const ratio = result.compressionRatio.toFixed(1);

    return `Compressed from ${originalKB}KB to ${compressedKB}KB (${ratio}x reduction) using ${result.format.toUpperCase()}`;
  }
}
