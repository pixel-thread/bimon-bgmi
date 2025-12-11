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
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                        <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                            <TableHead className="w-10 sm:w-16 pl-3 sm:pl-6">#</TableHead>
                            <TableHead className="min-w-[180px] sm:min-w-[280px]">Player</TableHead>
                            <TableHead className="min-w-[70px] sm:min-w-[100px] pr-3 sm:pr-6">K/D Ratio</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 10 }).map((_, index) => (
                            <TableRow
                                key={index}
                                className="border-b border-zinc-100 dark:border-zinc-800/50 last:border-0"
                            >
                                <TableCell className="pl-3 sm:pl-6 py-3 sm:py-4">
                                    <Skeleton className="h-4 sm:h-5 w-5 sm:w-6" />
                                </TableCell>
                                <TableCell className="py-3 sm:py-4">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full shrink-0" />
                                        <div className="flex flex-col gap-1 sm:gap-1.5 min-w-0">
                                            <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
                                            <Skeleton className="h-4 sm:h-5 w-14 sm:w-16 rounded-full" />
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="pr-3 sm:pr-6">
                                    <Skeleton className="h-4 sm:h-5 w-10 sm:w-12" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

