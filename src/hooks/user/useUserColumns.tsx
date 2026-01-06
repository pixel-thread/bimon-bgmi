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
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

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
  displayName?: string;
  email: string;
}

type RoleSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
};

const RoleSelector: React.FC<RoleSelectorProps> = ({ value, onChange, isLoading }) => {
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

type DeleteButtonProps = {
  user: UserRole;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

const DeleteButton: React.FC<DeleteButtonProps> = ({ user, onDelete, isDeleting }) => {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowConfirm(true)}
        disabled={isDeleting}
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        {isDeleting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <FiTrash2 className="h-4 w-4" />
        )}
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{user.displayName || user.userName}</strong> from both Clerk and the database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(user.id);
                setShowConfirm(false);
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

type UseUserColumnsProps = {
  showDeleteButton?: boolean;
};

export function useUserColumns({ showDeleteButton = false }: UseUserColumnsProps = {}) {
  const queryClient = useQueryClient();

  const { isPending: isRoleUpdating, mutate: updateRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      http.put(ADMIN_USER_ENDPOINTS.PUT_USER_ROLE.replace(":id", id), { role }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        return data;
      }
    },
  });

  const { isPending: isDeleting, mutate: deleteUser } = useMutation({
    mutationFn: (id: string) =>
      http.delete(ADMIN_USER_ENDPOINTS.DELETE_USER.replace(":id", id)),
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "User deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const columns: ColumnDef<UserRole>[] = [
    {
      header: "Name",
      accessorKey: "userName",
    },
    {
      header: "Display Name",
      accessorKey: "displayName",
      cell: ({ row }) => row.original.displayName || "-",
    },
    {
      header: "Role",
      cell: ({ row }) => (
        <RoleSelector
          value={row.original.role}
          isLoading={isRoleUpdating}
          onChange={(role) => updateRole({ id: row.original.id, role })}
        />
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
    },
  ];

  // Add delete action column only if showDeleteButton is true
  if (showDeleteButton) {
    columns.push({
      header: "Actions",
      cell: ({ row }) => (
        <DeleteButton
          user={row.original}
          onDelete={deleteUser}
          isDeleting={isDeleting}
        />
      ),
    });
  }

  return {
    columns,
  };
}

