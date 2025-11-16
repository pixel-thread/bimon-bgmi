import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { useSeasonStore } from "@/src/store/season";
import http from "@/src/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CellContext, ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PlayerT = {
  id: string;
  isBanned: boolean;
  userName: string;
  kd: number;
  matches: number;
  category: string;
};

const DefaultColBTN = ({
  children,
}: {
  children: React.ReactNode;
  row: CellContext<PlayerT, unknown>;
}) => {
  const router = useRouter();
  return <Button variant={"outline"}>{children}</Button>;
};

const defaultColumn: ColumnDef<PlayerT>[] = [
  {
    accessorKey: "userName",
    header: "Name",
    cell: (info) => (
      <Link href={`?player=${info.row.original.id}`}>
        {(info.getValue() as string) || ""}
      </Link>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: (info) => (
      <Link href={`?player=${info.row.original.id}`}>
        {(info.getValue() as string) || ""}
      </Link>
    ),
  },
  {
    accessorKey: "kd",
    header: "K/D",
    cell: (info) => (
      <Link href={`?player=${info.row.original.id}`}>
        {(info.getValue() as string) || ""}
      </Link>
    ),
  },
  {
    accessorKey: "matches",
    header: "Matches",
    cell: ({ row }) => (
      <Link href={`?player=${row.original.id}`}>{row.original.matches}</Link>
    ),
  },
];

type Props = {
  page?: string | number;
};

export function usePlayersColumn({ page = 1 }: Props) {
  const [playerId, setPlayerId] = useState("");
  const { seasonId } = useSeasonStore();
  const queryClient = useQueryClient();
  const { mutate: toggleBanned, isPending } = useMutation({
    mutationFn: () =>
      http.post(
        ADMIN_PLAYER_ENDPOINTS.POST_TOGGLE_BANNED.replace(":id", playerId),
      ),
    onSuccess: (data) => {
      if (data.success) {
        setPlayerId("");
        queryClient.invalidateQueries({ queryKey: ["player", page, seasonId] });
        toast.success(data.message);
        return data.data;
      }
      toast.error(data.message);
    },
  });

  const columns: ColumnDef<PlayerT>[] = [
    {
      accessorKey: "isBanned",
      header: "Banned",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id="airplane-mode"
              checked={row.original.isBanned}
              disabled={row.original.id === playerId ? isPending : false}
              onCheckedChange={() => {
                setPlayerId(row.original.id);
                toggleBanned();
              }}
            />
          </div>
        );
      },
    },
    ...defaultColumn,
  ];

  return { columns };
}
