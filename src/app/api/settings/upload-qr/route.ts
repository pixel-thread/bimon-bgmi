import { ErrorResponse, SuccessResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

/**
 * POST /api/settings/upload-qr
 * Admin-only: Upload a UPI QR code image to ImgBB and save the URL in settings.
 */
export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("image") as File | null;

        if (!file) {
            return ErrorResponse({ message: "No image provided", status: 400 });
        }

        // Convert to base64 and upload to ImgBB
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        const imgbbForm = new FormData();
        imgbbForm.append("key", process.env.IMGBB_API_KEY!);
        imgbbForm.append("image", base64);
        imgbbForm.append("name", `upi_qr_${Date.now()}`);

        const imgbbRes = await fetch("https://api.imgbb.com/1/upload", {
            method: "POST",
            body: imgbbForm,
        });

        if (!imgbbRes.ok) {
            const err = await imgbbRes.text();
            console.error("ImgBB upload failed:", err);
            return ErrorResponse({ message: "Image upload failed", status: 500 });
        }

        const imgbbData = await imgbbRes.json();
        const imageUrl: string = imgbbData.data.url;

        // Save to settings
        const updated = await saveSettings({ upiQrImageUrl: imageUrl });

        return SuccessResponse({
            data: { upiQrImageUrl: updated.upiQrImageUrl },
            message: "QR code uploaded successfully",
        });
    } catch (error) {
        return ErrorResponse({ message: "Upload failed", error });
    }
}
