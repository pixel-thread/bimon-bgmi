// components/InitializeSuperAdmin.tsx
"use client";

import { useEffect } from "react";
import { db } from "@/src/lib/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { SUPER_ADMIN_EMAIL } from "@/src/config/adminAccess";

export function InitializeSuperAdmin() {
  useEffect(() => {
    const fixExistingTeamsAdmins = async () => {
      try {
        const adminRolesSnapshot = await getDocs(collection(db, "admin_roles"));
        let fixedCount = 0;

        for (const adminDoc of adminRolesSnapshot.docs) {
          const adminData = adminDoc.data();
          const email = adminDoc.id;

          if (adminData.role === "teams_admin") {
            const emailDoc = doc(db, "authorized_emails", email);
            const emailSnap = await getDoc(emailDoc);

            if (!emailSnap.exists()) {
              await setDoc(emailDoc, {
                authorized: true,
                role: "teams_admin",
                addedBy: adminData.addedBy || "system_fix",
                addedAt: adminData.addedAt || new Date().toISOString(),
              });

              fixedCount++;
            }
          }
        }

        if (fixedCount > 0) {
          console.log(`🎉 Fixed ${fixedCount} teams admin(s)`);
        }
      } catch (error) {
        console.error("❌ Error fixing teams admins:", error);
      }
    };

    const initializeSystem = async () => {
      try {
        // Check if super admin email exists in authorized_emails
        const emailDoc = doc(db, "authorized_emails", SUPER_ADMIN_EMAIL);
        const emailSnap = await getDoc(emailDoc);

        if (!emailSnap.exists()) {
          // Add super admin email to authorized_emails
          await setDoc(emailDoc, {
            authorized: true,
            role: "super_admin",
            addedAt: new Date().toISOString(),
            addedBy: "system",
          });

          console.log(
            `✅ Super admin email ${SUPER_ADMIN_EMAIL} added to authorized_emails`
          );
        }

        // Fix existing teams admins
        await fixExistingTeamsAdmins();
      } catch (error) {
        console.error("❌ Error initializing system:", error);
      }
    };

    initializeSystem();
  }, []);

  return null; // This component doesn't render anything
}
