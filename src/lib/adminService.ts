// lib/adminService.ts
import { db } from "@/src/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import {
  AdminUser,
  UserRole,
  isSuperAdmin,
  extractUsername,
} from "@/src/config/adminAccess";

const ADMIN_ROLES_COLLECTION = "admin_roles";

// Get user role from database
export const getUserRoleFromDB = async (email: string): Promise<UserRole> => {
  if (isSuperAdmin(email)) {
    return "super_admin";
  }

  try {
    const docRef = doc(db, ADMIN_ROLES_COLLECTION, email);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.role as UserRole;
    }

    return "none";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "none";
  }
};

// Add teams admin
export const addTeamsAdmin = async (
  email: string,
  addedBy: string
): Promise<boolean> => {
  try {
    const adminUser: AdminUser = {
      email,
      role: "teams_admin",
      addedBy,
      addedAt: new Date().toISOString(),
      username: extractUsername(email),
    };

    // Add to admin_roles collection
    await setDoc(doc(db, ADMIN_ROLES_COLLECTION, email), adminUser);

    // Also add to authorized_emails collection for basic auth
    await setDoc(doc(db, "authorized_emails", email), {
      authorized: true,
      role: "teams_admin",
      addedBy,
      addedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error adding teams admin:", error);
    return false;
  }
};

// Remove admin role
export const removeAdmin = async (email: string): Promise<boolean> => {
  try {
    // Cannot remove super admin
    if (isSuperAdmin(email)) {
      return false;
    }

    // Remove from admin_roles collection
    await deleteDoc(doc(db, ADMIN_ROLES_COLLECTION, email));

    // Also remove from authorized_emails collection
    await deleteDoc(doc(db, "authorized_emails", email));

    return true;
  } catch (error) {
    console.error("Error removing admin:", error);
    return false;
  }
};

// Get all admin users
export const getAllAdmins = async (): Promise<AdminUser[]> => {
  try {
    const q = query(
      collection(db, ADMIN_ROLES_COLLECTION),
      orderBy("addedAt", "desc")
    );
    const querySnapshot = await getDocs(q);

    const admins: AdminUser[] = [];

    // Add super admin first
    admins.push({
      email: "bimonlangnongsiej@gmail.com",
      role: "super_admin",
      username: "bimonlangnongsiej",
      addedAt: "System",
      addedBy: "System",
    });

    // Add other admins from database
    querySnapshot.forEach((doc) => {
      const data = doc.data() as AdminUser;
      admins.push(data);
    });

    return admins;
  } catch (error) {
    console.error("Error getting all admins:", error);
    return [];
  }
};

// Check if email is already an admin
export const isEmailAdmin = async (email: string): Promise<boolean> => {
  if (isSuperAdmin(email)) {
    return true;
  }

  try {
    const docRef = doc(db, ADMIN_ROLES_COLLECTION, email);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking if email is admin:", error);
    return false;
  }
};

// Link teams_admin role to a player account
export const linkAdminToPlayer = async (
  email: string,
  playerId: string,
  playerName: string
): Promise<boolean> => {
  try {
    // Update admin role with player link
    const adminDocRef = doc(db, ADMIN_ROLES_COLLECTION, email);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      throw new Error("Admin role not found");
    }

    const adminData = adminDoc.data() as AdminUser;
    if (adminData.role !== "teams_admin") {
      throw new Error("Only teams_admin roles can be linked to players");
    }

    await setDoc(adminDocRef, {
      ...adminData,
      linkedPlayerId: playerId,
      linkedPlayerName: playerName,
    });

    // Update player with admin link
    const playerDocRef = doc(db, "players", playerId);
    const playerDoc = await getDoc(playerDocRef);

    if (!playerDoc.exists()) {
      throw new Error("Player not found");
    }

    const playerData = playerDoc.data();
    await setDoc(playerDocRef, {
      ...playerData,
      linkedRole: "teams_admin",
      linkedEmail: email,
    });

    return true;
  } catch (error) {
    console.error("Error linking admin to player:", error);
    return false;
  }
};

// Unlink teams_admin role from a player account
export const unlinkAdminFromPlayer = async (
  email: string
): Promise<boolean> => {
  try {
    // Get admin data to find linked player
    const adminDocRef = doc(db, ADMIN_ROLES_COLLECTION, email);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      throw new Error("Admin role not found");
    }

    const adminData = adminDoc.data() as AdminUser;

    // Create admin data without linked fields
    const { linkedPlayerId, linkedPlayerName, ...adminDataWithoutLinks } =
      adminData;

    // Remove player link from admin
    await setDoc(adminDocRef, adminDataWithoutLinks);

    // Remove admin link from player if exists
    if (linkedPlayerId) {
      const playerDocRef = doc(db, "players", linkedPlayerId);
      const playerDoc = await getDoc(playerDocRef);

      if (playerDoc.exists()) {
        const playerData = playerDoc.data();
        const { linkedRole, linkedEmail, ...playerDataWithoutLinks } =
          playerData;
        await setDoc(playerDocRef, playerDataWithoutLinks);
      }
    }

    return true;
  } catch (error) {
    console.error("Error unlinking admin from player:", error);
    return false;
  }
};

// Get player by linked admin email
export const getPlayerByLinkedEmail = async (
  email: string
): Promise<any | null> => {
  try {
    const adminDocRef = doc(db, ADMIN_ROLES_COLLECTION, email);
    const adminDoc = await getDoc(adminDocRef);

    if (!adminDoc.exists()) {
      return null;
    }

    const adminData = adminDoc.data() as AdminUser;
    if (!adminData.linkedPlayerId) {
      return null;
    }

    const playerDocRef = doc(db, "players", adminData.linkedPlayerId);
    const playerDoc = await getDoc(playerDocRef);

    if (playerDoc.exists()) {
      return { id: playerDoc.id, ...playerDoc.data() };
    }

    return null;
  } catch (error) {
    console.error("Error getting player by linked email:", error);
    return null;
  }
};
