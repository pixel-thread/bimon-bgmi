import { ADMIN_USER_ENDPOINTS } from "@/src/lib/endpoints/admin/user";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "../../data-table";
import { useUserColumns } from "@/src/hooks/user/useUserColumns";
import { LoaderFive } from "@/src/components/ui/loader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useMemo } from "react";

export const AdminUserPage = () => {
  const { columns } = useUserColumns();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = search.get("page") || "1";
  const role = search.get("role") || "USER";

  const roles = useMemo(
    () => [
      { label: "Players", value: "PLAYER" },
      { label: "Super Admin", value: "SUPER_ADMIN" },
      { label: "Admins", value: "ADMIN" },
      { label: "Users", value: "USER" },
    ],
    []
  );

  const onChangeRole = (nextRole: string) => {
    const params = new URLSearchParams(search.toString());
    params.set("role", nextRole);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };
  const { data, isFetching } = useQuery({
    queryKey: ["users", page, role],
    queryFn: () =>
      http.get(
        `${ADMIN_USER_ENDPOINTS.GET_ALL_USER.replace(":page", page || "1")}&role=${role}`
      ),
  });
  const meta = data?.meta;
  const users = data?.data || [];

  if (isFetching) {
    return (
      <div>
        <LoaderFive text="Loading..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="min-w-[220px]">
          <Select value={role} onValueChange={onChangeRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Filter by Role</SelectLabel>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DataTable data={users} meta={meta} columns={columns} />
    </div>
  );
};
