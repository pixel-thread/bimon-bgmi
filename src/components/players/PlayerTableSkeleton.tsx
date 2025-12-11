"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/src/components/ui/table";

export function PlayerTableSkeleton() {
    return (
        <div className="w-full bg-white dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                    <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                        <TableHead className="w-16 pl-6">#</TableHead>
                        <TableHead className="w-[300px]">Player</TableHead>
                        <TableHead>K/D Ratio</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 10 }).map((_, index) => (
                        <TableRow
                            key={index}
                            className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                        >
                            <TableCell className="pl-6 py-4">
                                <Skeleton className="h-5 w-6" />
                            </TableCell>
                            <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="flex flex-col gap-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-5 w-16 rounded-full" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Skeleton className="h-5 w-12" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
