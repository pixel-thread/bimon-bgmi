import { prisma } from "@/lib/database";
import { SuccessResponse, ErrorResponse, CACHE } from "@/lib/api-response";
import { getAuthEmail } from "@/lib/auth";
import { type NextRequest } from "next/server";

const SETTING_KEY = "help_contacts";

interface HelpContact {
    state: string;
    name: string;
    whatsapp: string;
}

const DEFAULT_CONTACTS: HelpContact[] = [
    { state: "Meghalaya", name: "", whatsapp: "" },
    { state: "Nagaland", name: "", whatsapp: "" },
    { state: "Manipur", name: "", whatsapp: "" },
];

/**
 * GET /api/help/contacts
 * Returns the help contacts for each state.
 */
export async function GET() {
    try {
        const setting = await prisma.appSetting.findUnique({
            where: { key: SETTING_KEY },
        });

        const contacts: HelpContact[] = setting
            ? JSON.parse(setting.value)
            : DEFAULT_CONTACTS;

        return SuccessResponse({ data: { contacts }, cache: CACHE.LONG });
    } catch (error) {
        return ErrorResponse({ message: "Failed to load help contacts", error });
    }
}

/**
 * PUT /api/help/contacts
 * Admin-only: update help contacts.
 * Body: { contacts: HelpContact[] }
 */
export async function PUT(req: NextRequest) {
    try {
        const email = await getAuthEmail();
        if (!email) return ErrorResponse({ message: "Unauthorized", status: 401 });

        const user = await prisma.user.findUnique({
            where: { email },
            select: { role: true },
        });
        if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
            return ErrorResponse({ message: "Forbidden", status: 403 });
        }

        const body = await req.json();
        const contacts: HelpContact[] = body.contacts;

        if (!Array.isArray(contacts)) {
            return ErrorResponse({ message: "Invalid contacts format", status: 400 });
        }

        await prisma.appSetting.upsert({
            where: { key: SETTING_KEY },
            update: { value: JSON.stringify(contacts) },
            create: { key: SETTING_KEY, value: JSON.stringify(contacts) },
        });

        return SuccessResponse({ data: { contacts } });
    } catch (error) {
        return ErrorResponse({ message: "Failed to update help contacts", error });
    }
}
