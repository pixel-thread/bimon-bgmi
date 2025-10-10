import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";

export async function POST(req: Request) {
  try {
    const body = await req.json();
  } catch (error) {
    return handleApiErrors(error);
  }
}
