import { USER_ENDPOINTS } from "@/src/lib/endpoints/admin/user";
import http from "@/src/utils/http";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "../../data-table";
import { ColumnDef } from "@tanstack/react-table";

const columns: ColumnDef<any>[] = [
  {
    header: "Name",
    accessorKey: "userName",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Role",
    accessorKey: "role",
  },
  {
    header: "Created By",
    accessorKey: "createdBy",
  },
];
export const AdminUserPage = () => {
  const { data } = useQuery({
    queryKey: ["users"],
    queryFn: () => http.get(USER_ENDPOINTS.GET_ALL_USER),
    select: (data) => data.data,
  });
  return (
    <div>
      <DataTable data={data} columns={columns} />
    </div>
  );
};
