import { clientClerk } from "@/src/lib/clerk/client";
import { createUserIfNotExistInDB } from "@/src/services/user/createUser";
import { handleApiErrors } from "@/src/utils/errors/handleApiErrors";

export async function POST(req: Request) {
  try {
    const limit = 100; // Clerk max limit per page
    let offset = 0;
    let hasMore = true;

    do {
      // Fetch a page of users
      const clerkUsers = await clientClerk.users.getUserList({
        limit,
        offset,
      });

      // Loop through users in this page
      for (const clerkUser of clerkUsers.data) {
        const userName =
          clerkUser.username ||
          clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] ||
          Math.floor(Math.random() * 1000000000).toString();

        await createUserIfNotExistInDB({
          data: {
            password: "123Abc_@",
            email: clerkUser.primaryEmailAddress?.emailAddress || "",
            userName,
            createdBy: "SEED",
            clerkId: clerkUser.id,
          },
        });
      }

      // Update pagination
      offset += limit;
      hasMore = clerkUsers.data.length === limit;
    } while (hasMore);

    return new Response(JSON.stringify({ message: "success" }), {
      status: 200,
    });
  } catch (error) {
    return handleApiErrors(error);
  }
}
