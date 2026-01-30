/**
 * Video to GIF conversion utility
 * Converts short video files to optimized GIFs for character images
 * Uses Canvas API and a simple GIF encoder (no external dependencies)
 */

interface VideoToGifOptions {
    maxWidth?: number;
    maxHeight?: number;
    fps?: number;
    maxDuration?: number; // in seconds
    quality?: number; // 1-20, lower is better quality but larger file
}

const DEFAULT_OPTIONS: Required<VideoToGifOptions> = {
    maxWidth: 270,
    maxHeight: 480,
    fps: 10,
    maxDuration: 5,
    quality: 10,
};

/**
 * Simple GIF encoder using LZW compression
 * Based on the GIF89a specification
 */
class GifEncoder {
    private width: number;
    private height: number;
    private frames: ImageData[] = [];
    private delays: number[] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    addFrame(imageData: ImageData, delay: number = 100) {
        this.frames.push(imageData);
        this.delays.push(delay);
    }

    /**
     * Encode all frames to a GIF blob
     * Uses a simplified approach with a global color palette
     */
    encode(): Blob {
        const buffer: number[] = [];

        // GIF Header
        this.writeHeader(buffer);

        // Logical Screen Descriptor
        this.writeLogicalScreenDescriptor(buffer);

        // Global Color Table (256 colors)
        this.writeGlobalColorTable(buffer);

        // Note: Skipping Netscape Extension means GIF plays exactly once (no loop)
        // If you want looping, call: this.writeNetscapeExtension(buffer, 0) for infinite
        // or this.writeNetscapeExtension(buffer, n) for n additional loops

        // Write each frame
        for (let i = 0; i < this.frames.length; i++) {
            this.writeGraphicControlExtension(buffer, this.delays[i]);
            this.writeImageDescriptor(buffer);
            this.writeImageData(buffer, this.frames[i]);
        }

        // GIF Trailer
        buffer.push(0x3B);

        return new Blob([new Uint8Array(buffer)], { type: 'image/gif' });
    }

    private writeHeader(buffer: number[]) {
        // GIF89a
        const header = 'GIF89a';
        for (let i = 0; i < header.length; i++) {
            buffer.push(header.charCodeAt(i));
        }
    }

    private writeLogicalScreenDescriptor(buffer: number[]) {
        // Width (little-endian)
        buffer.push(this.width & 0xFF);
        buffer.push((this.width >> 8) & 0xFF);

        // Height (little-endian)
        buffer.push(this.height & 0xFF);
        buffer.push((this.height >> 8) & 0xFF);

        // Packed field: Global Color Table Flag = 1, Color Resolution = 7, Sort = 0, Size = 7
        buffer.push(0xF7); // 11110111

        // Background color index
        buffer.push(0);

        // Pixel aspect ratio
        buffer.push(0);
    }

    private writeGlobalColorTable(buffer: number[]) {
        // Generate a 256-color palette (6-6-6 cube + grays)
        for (let i = 0; i < 256; i++) {
            if (i < 216) {
                // 6x6x6 color cube
                const r = Math.floor(i / 36) * 51;
                const g = Math.floor((i % 36) / 6) * 51;
                const b = (i % 6) * 51;
                buffer.push(r, g, b);
            } else {
                // Grayscale ramp
                const gray = (i - 216) * 6 + 3;
                buffer.push(gray, gray, gray);
            }
        }
    }

    private writeNetscapeExtension(buffer: number[], loops: number) {
        buffer.push(0x21); // Extension introducer
        buffer.push(0xFF); // Application extension
        buffer.push(0x0B); // Block size

        const id = 'NETSCAPE2.0';
        for (let i = 0; i < id.length; i++) {
            buffer.push(id.charCodeAt(i));
        }

        buffer.push(0x03); // Sub-block size
        buffer.push(0x01); // Sub-block ID
        buffer.push(loops & 0xFF); // Loop count (little-endian)
        buffer.push((loops >> 8) & 0xFF);
        buffer.push(0x00); // Block terminator
    }

    private writeGraphicControlExtension(buffer: number[], delay: number) {
        buffer.push(0x21); // Extension introducer
        buffer.push(0xF9); // Graphic control label
        buffer.push(0x04); // Block size

        // Packed field: disposal = none, user input = false, transparent = false
        buffer.push(0x00);

        // Delay time (in 1/100 seconds, little-endian)
        const delayHundredths = Math.round(delay / 10);
        buffer.push(delayHundredths & 0xFF);
        buffer.push((delayHundredths >> 8) & 0xFF);

        // Transparent color index
        buffer.push(0);

        // Block terminator
        buffer.push(0x00);
    }

    private writeImageDescriptor(buffer: number[]) {
        buffer.push(0x2C); // Image separator

        // Position (0, 0)
        buffer.push(0, 0, 0, 0);

        // Dimensions
        buffer.push(this.width & 0xFF);
        buffer.push((this.width >> 8) & 0xFF);
        buffer.push(this.height & 0xFF);
        buffer.push((this.height >> 8) & 0xFF);

        // Packed field: no local color table
        buffer.push(0x00);
    }

    private writeImageData(buffer: number[], imageData: ImageData) {
        const pixels = imageData.data;
        const indexedPixels: number[] = [];

        // Convert RGBA to indexed colors
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            // Quantize to 6x6x6 color cube
            const ri = Math.min(5, Math.floor(r / 43));
            const gi = Math.min(5, Math.floor(g / 43));
            const bi = Math.min(5, Math.floor(b / 43));
            const index = ri * 36 + gi * 6 + bi;

            indexedPixels.push(index);
        }

        // LZW encode
        const minCodeSize = 8;
        buffer.push(minCodeSize);

        const lzwData = this.lzwEncode(indexedPixels, minCodeSize);

        // Write sub-blocks (max 255 bytes each)
        let offset = 0;
        while (offset < lzwData.length) {
            const chunkSize = Math.min(255, lzwData.length - offset);
            buffer.push(chunkSize);
            for (let i = 0; i < chunkSize; i++) {
                buffer.push(lzwData[offset + i]);
            }
            offset += chunkSize;
        }

        // Block terminator
        buffer.push(0x00);
    }

    private lzwEncode(pixels: number[], minCodeSize: number): number[] {
        const clearCode = 1 << minCodeSize;
        const eoiCode = clearCode + 1;
        let codeSize = minCodeSize + 1;
        let nextCode = eoiCode + 1;
        const maxCode = 4095;

        // Initialize code table
        const codeTable = new Map<string, number>();
        for (let i = 0; i < clearCode; i++) {
            codeTable.set(String(i), i);
        }

        const output: number[] = [];
        let bitBuffer = 0;
        let bitCount = 0;

        const emitCode = (code: number) => {
            bitBuffer |= code << bitCount;
            bitCount += codeSize;

            while (bitCount >= 8) {
                output.push(bitBuffer & 0xFF);
                bitBuffer >>= 8;
                bitCount -= 8;
            }
        };

        // Emit clear code
        emitCode(clearCode);

        let indexBuffer = String(pixels[0]);

        for (let i = 1; i < pixels.length; i++) {
            const k = String(pixels[i]);
            const combined = indexBuffer + ',' + k;

            if (codeTable.has(combined)) {
                indexBuffer = combined;
            } else {
                emitCode(codeTable.get(indexBuffer)!);

                if (nextCode <= maxCode) {
                    codeTable.set(combined, nextCode++);

                    if (nextCode > (1 << codeSize) && codeSize < 12) {
                        codeSize++;
                    }
                }

                indexBuffer = k;
            }
        }

        // Emit final code
        emitCode(codeTable.get(indexBuffer)!);

        // Emit EOI
        emitCode(eoiCode);

        // Flush remaining bits
        if (bitCount > 0) {
            output.push(bitBuffer & 0xFF);
        }

        return output;
    }
}

/**
 * Extract frames from a video at specified FPS
 */
async function extractFrames(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: Required<VideoToGifOptions>
): Promise<{ frames: ImageData[]; delays: number[] }> {
    const frames: ImageData[] = [];
    const delays: number[] = [];
    const frameInterval = 1 / options.fps;
    const maxFrames = options.maxDuration * options.fps;
    const duration = Math.min(video.duration, options.maxDuration);

    for (let time = 0; time < duration && frames.length < maxFrames; time += frameInterval) {
        video.currentTime = time;
        await new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push(imageData);
        delays.push(frameInterval * 1000); // Convert to ms
    }

    return { frames, delays };
}

/**
 * Convert a video file to an optimized GIF
 * @param file - Video file (mp4, webm, mov)
 * @param options - Conversion options
 * @returns Promise<File> - GIF file ready for upload
 */
export async function videoToGif(
    file: File,
    options: VideoToGifOptions = {}
): Promise<File> {
    const opts: Required<VideoToGifOptions> = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        // Validate file type
        const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
        if (!validTypes.some(type => file.type.includes(type.split('/')[1]))) {
            reject(new Error('Invalid video format. Please use MP4, WebM, or MOV.'));
            return;
        }

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = async () => {
            try {
                // Check duration
                if (video.duration > opts.maxDuration + 1) {
                    console.warn(`Video is ${video.duration.toFixed(1)}s, will be trimmed to ${opts.maxDuration}s`);
                }

                // Calculate dimensions maintaining 9:16 aspect ratio
                const targetRatio = 9 / 16;
                let width = opts.maxWidth;
                let height = opts.maxHeight;

                // Adjust to maintain aspect ratio
                if (width / height > targetRatio) {
                    width = Math.round(height * targetRatio);
                } else {
                    height = Math.round(width / targetRatio);
                }

                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Wait for video to be ready
                video.currentTime = 0;
                await new Promise<void>((res) => {
                    video.onseeked = () => res();
                });

                // Extract frames
                const { frames, delays } = await extractFrames(video, canvas, ctx, opts);

                if (frames.length === 0) {
                    reject(new Error('Could not extract frames from video'));
                    return;
                }

                // Create GIF
                const encoder = new GifEncoder(width, height);
                for (let i = 0; i < frames.length; i++) {
                    encoder.addFrame(frames[i], delays[i]);
                }

                const gifBlob = encoder.encode();

                // Create file
                const gifFile = new File(
                    [gifBlob],
                    file.name.replace(/\.[^.]+$/, '.gif'),
                    { type: 'image/gif', lastModified: Date.now() }
                );

                // Cleanup
                URL.revokeObjectURL(url);

                console.log(`GIF created: ${(gifFile.size / 1024).toFixed(0)}KB, ${frames.length} frames, ${width}x${height}`);
                resolve(gifFile);
            } catch (error) {
                URL.revokeObjectURL(url);
                reject(error);
            }
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not load video file'));
        };
    });
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
}

/**
 * Get the first frame of a video as a static image (for fallback/thumbnail)
 */
export async function getVideoThumbnail(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'metadata';

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadeddata = () => {
            video.currentTime = 0;
        };

        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 270;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    if (!blob) {
                        reject(new Error('Could not create thumbnail'));
                        return;
                    }
                    const thumbnailFile = new File(
                        [blob],
                        file.name.replace(/\.[^.]+$/, '_thumb.jpg'),
                        { type: 'image/jpeg', lastModified: Date.now() }
                    );
                    resolve(thumbnailFile);
                },
                'image/jpeg',
                0.8
            );
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Could not load video'));
        };
    });
}
