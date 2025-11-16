import { clientClerk } from "../src/lib/clerk/client"; // Adjust path relative to script location

async function deleteAllUsers() {
  try {
    const response = await clientClerk.users.getUserList({
      limit: 100,
    });

    // if (!response.data.length) break;

    for (const user of response.data) {
      try {
        await clientClerk.users.deleteUser(user.id);
        console.log(`Deleted user: ${user.id}`);
      } catch (err) {
        console.error(`Failed to delete user ${user.id}:`, err);
      }
    }

    console.log("All users deletion attempt completed.");
  } catch (err) {
    console.error("Error fetching user list:", err);
  }
}

deleteAllUsers();
