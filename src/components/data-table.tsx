// @ts-ignore
"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Input } from "@/src/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { MetaT } from "../types/meta";
import { useRouter, useSearchParams } from "next/navigation";

type DataTableProps<T> = {
  data: T[] | any;
  columns: ColumnDef<T>[] | any;
  filter?: DataTableFilterOptions[];
  meta?: MetaT | null;
};

export function DataTable<T>({
  data,
  columns,
  filter = [],
  meta,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });
  return (
    <div className="w-full">
      <DataTableHeader
        enableFilter={true}
        filterColumnId="category"
        filterType="select"
        selectOptions={filter || []}
        table={table}
      />
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} meta={meta} />
    </div>
  );
}
type DataTablePaginationProps = {
  meta?: MetaT | null;
  table: any;
};

const DataTablePagination = ({ meta, table }: DataTablePaginationProps) => {
  const router = useRouter();
  const search = useSearchParams();
  const page = search.get("page") || "1";

  const onNextPageChange = () => {
    const nextPage = Number(page) + 1;
    if (meta?.hasNextPage) {
      router.push(`?page=${nextPage}`);
    }
  };

  const onPrevPageChange = () => {
    const prevPage = Number(page) - 1;
    if (meta?.hasPreviousPage) {
      router.push(`?page=${prevPage}`);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-muted-foreground flex-1 text-sm">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className="space-x-2">
        <Button
          disabled={!meta?.hasPreviousPage}
          variant="outline"
          size="sm"
          onClick={() => onPrevPageChange()}
        >
          Previous
        </Button>
        <Button
          disabled={!meta?.hasNextPage}
          variant="outline"
          size="sm"
          onClick={() => onNextPageChange()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export type DataTableFilterOptions = {
  id: string;
  option: { label: string; value: string }[];
};

type DataTableHeaderProps = {
  table: any;
  filterColumnId?: string;
  enableFilter?: boolean;
  filterType?: "input" | "select";
  selectOptions?: DataTableFilterOptions[];
};

function DataTableHeader({
  table,
  filterColumnId = "email",
  enableFilter = false,
  filterType = "input",
  selectOptions = [],
}: DataTableHeaderProps) {
  // Shared handler
  const setFilterValue = (value: string, columnId: string) => {
    if (value === "all") {
      table.getColumn(columnId)?.setFilterValue("");
    } else {
      table.getColumn(columnId)?.setFilterValue(value);
    }
  };

  return (
    <div className="flex items-center py-4 space-x-4">
      {enableFilter && filterType === "input" && (
        <Input
          placeholder={`Filter ${filterColumnId}...`}
          onChange={(e) => setFilterValue(e.target.value, filterColumnId)}
          className="max-w-sm"
        />
      )}

      {selectOptions.length > 0 &&
        selectOptions.map((sel) => (
          <Select
            key={sel.id}
            onValueChange={(value) => setFilterValue(value, sel.id)}
          >
            <SelectTrigger className="min-w-[100px]">
              <SelectValue placeholder={`Select ${sel.id}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{sel.id.toUpperCase()}</SelectLabel>
                {sel.option.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ))}
    </div>
  );
}
