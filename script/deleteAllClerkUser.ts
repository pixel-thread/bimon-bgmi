import { clientClerk } from "../src/lib/clerk/client";

async function main() {
  const users = await clientClerk.users.getUserList();

  for (const user of users.data) {
    await clientClerk.users.deleteUser(user.id);
  }
}

main()
  .then(() => {
    console.log("All users deleted successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error deleting users:", error);
    process.exit(1);
  });
