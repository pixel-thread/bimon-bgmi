import { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import http from "@/src/utils/http";
import { ADMIN_USER_ENDPOINTS } from "@/src/lib/endpoints/admin/user";
const role = [
  {
    label: "Super Admin",
    value: "SUPER_ADMIN",
  },
  {
    label: "Admin",
    value: "ADMIN",
  },
  {
    label: "Player",
    value: "PLAYER",
  },
  {
    label: "User",
    value: "USER",
  },
];

interface UserRole {
  id: string;
  role: string;
  userName: string;
  email: string;
  createdBy: string;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
};
const RoleSelector: React.FC<Props> = ({ value, onChange, isLoading }) => {
  return (
    <Select
      value={value}
      defaultValue={value}
      onValueChange={(value) => onChange(value)}
    >
      <SelectTrigger disabled={isLoading} className="w-full">
        <SelectValue placeholder="Select a role" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>ROLE</SelectLabel>
          {role.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const cols: ColumnDef<UserRole>[] = [
  {
    header: "Name",
    accessorKey: "userName",
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Created By",
    accessorKey: "createdBy",
  },
];

export function useUserColumns() {
  const queryClient = useQueryClient();
  const { isPending, mutate } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      http.put(ADMIN_USER_ENDPOINTS.PUT_USER_ROLE.replace(":id", id), { role }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return data;
      }
    },
  });
  const columns: ColumnDef<UserRole>[] = [
    ...cols,
    {
      header: "Role",
      cell: ({ row }) => (
        <RoleSelector
          value={row.original.role}
          isLoading={isPending}
          onChange={(role) => mutate({ id: row.original.id, role })}
        />
      ),
    },
  ];
  return {
    columns,
  };
}
