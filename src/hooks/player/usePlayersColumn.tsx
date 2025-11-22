import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { ADMIN_PLAYER_ENDPOINTS } from "@/src/lib/endpoints/admin/player";
import { useSeasonStore } from "@/src/store/season";
import http from "@/src/utils/http";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "../context/auth/useAuth";

type PlayerT = {
  id: string;
  isBanned: boolean;
  userName: string;
  kd: number;
  matches: number;
  category: string;
};

const defaultClientColumn: ColumnDef<PlayerT>[] = [
  {
    accessorKey: "isBanned",
    header: "Chah Banned",
    cell: ({ row }) => (row.original.isBanned ? "Hae" : "Huh"),
  },
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
    accessorKey: "uc",
    header: "UC",
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
    accessorKey: "uc",
    header: "UC",
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
  const { isSuperAdmin } = useAuth();
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

  const { mutate: deletePlayer, isPending: isDeletePending } = useMutation({
    mutationFn: () =>
      http.delete(
        ADMIN_PLAYER_ENDPOINTS.DELETE_PLAYER_BY_ID.replace(":id", playerId),
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
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center space-x-2">
            {isSuperAdmin ? (
              <Button
                variant={"outline"}
                onClick={() => {
                  setPlayerId(row.original.id);
                  deletePlayer();
                }}
                disabled={
                  row.original.id === playerId ? isDeletePending : false
                }
              >
                Delete
              </Button>
            ) : (
              "N/A"
            )}
          </div>
        );
      },
    },
  ];

  if (isSuperAdmin) {
    return { columns };
  }

  return { columns: defaultClientColumn };
}
