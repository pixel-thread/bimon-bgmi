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
import { useMemo, useState, useCallback, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { FiSearch, FiX } from "react-icons/fi";

export const AdminUserPage = () => {
  const { columns } = useUserColumns();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const page = searchParams.get("page") || "1";
  const role = searchParams.get("role") || "USER";
  const searchQuery = searchParams.get("search") || "";

  const [searchInput, setSearchInput] = useState(searchQuery);

  const roles = useMemo(
    () => [
      { label: "Players", value: "PLAYER" },
      { label: "Super Admin", value: "SUPER_ADMIN" },
      { label: "Admins", value: "ADMIN" },
      { label: "Users", value: "USER" },
    ],
    []
  );

  // Debounced search update - only update if value differs from current URL param
  useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    // Skip update if the input matches the current URL param
    if (searchInput === currentSearch) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput) {
        params.set("search", searchInput);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.replace(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, pathname, router, searchParams]);

  const onChangeRole = (nextRole: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("role", nextRole);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const clearSearch = useCallback(() => {
    setSearchInput("");
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["users", page, role, searchQuery],
    queryFn: () => {
      let url = `${ADMIN_USER_ENDPOINTS.GET_ALL_USER.replace(":page", page || "1")}&role=${role}`;
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      return http.get(url);
    },
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <FiX className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
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
