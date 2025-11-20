import { ADMIN_USER_ENDPOINTS } from "@/src/lib/endpoints/admin/user";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "../../data-table";
import { useUserColumns } from "@/src/hooks/user/useUserColumns";
import { LoaderFive } from "@/src/components/ui/loader";
import { useSearchParams } from "next/navigation";

export const AdminUserPage = () => {
  const { columns } = useUserColumns();
  const search = useSearchParams();
  const page = search.get("page") || "1";
  const { data, isFetching } = useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      http.get(ADMIN_USER_ENDPOINTS.GET_ALL_USER.replace(":page", page || "1")),
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
    <div>
      <DataTable data={users} meta={meta} columns={columns} />
    </div>
  );
};
