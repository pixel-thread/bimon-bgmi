// TwoColumnTable.tsx
"use client";

import { TeamT } from "../types/team";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Card } from "@/src/components/ui/card";

interface TwoColumnTableProps {
  teams: TeamT[];
}

const column: ColumnDef<TeamT>[] = [
  {
    header: "#",
    cell: ({ row }) => row.index,
  },
  {
    header: "Team",
    cell: ({ row }) => {
      const teamName = row.original?.players
        .map((player) => player.name)
        .join("_");
      return teamName;
    },
  },
  {
    accessorKey: "matches",
    header: "Matches",
  },
  {
    accessorKey: "kills",
    header: "Kills",
  },
  {
    header: "PTS",
    accessorKey: "pts",
  },
  {
    accessorKey: "total",
    header: "Total",
  },
];

export default function TwoColumnTable({ teams }: TwoColumnTableProps) {
  return (
    <div className="w-full">
      <Card className="overflow-y-auto p-4">
        <DataTable data={teams} columns={column} />
      </Card>
    </div>
  );
}
