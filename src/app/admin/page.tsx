// app/admin/page.tsx
"use client";

import { redirect } from "next/navigation";

export default function page() {
  return redirect("/admin/teams");
}
