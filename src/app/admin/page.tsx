// app/admin/page.tsx
"use client";

import { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { FiSettings, FiUsers, FiBarChart } from "react-icons/fi";

const AdminPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to teams page as default
    const timer = setTimeout(() => {
      router.replace("/admin/teams");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);
  return redirect("/admin/teams");
};

export default AdminPage;
