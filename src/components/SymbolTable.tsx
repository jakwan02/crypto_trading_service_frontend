"use client";

import { useMemo } from "react";
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSymbols } from "@/hooks/useSymbols";
import { useSymbolsStore, SortKey } from "@/store/useSymbolStore";
import type { SymbolRow } from "@/hooks/useSymbols";

const columnHelper = createColumnHelper<SymbolRow>();

export default function SymbolTable() {
  const router = useRouter();
  const { data, isLoading, isError } = useSymbols();
  const sortKey = useSymbolsStore((s) => s.sortKey);
  const sortOrder = useSymbolsStore((s) => s.sortOrder);
  const setSortKey = useSymbolsStore((s) => s.setSortKey);
  const toggleSortOrder = useSymbolsStore((s) => s.toggleSortOrder);

  const columns = useMemo<ColumnDef<SymbolRow, any>[]>(
    () => [
      columnHelper.accessor("symbol", {
        header: () => "Symbol",
        cell: (info) => (
          <span className="font-medium text-slate-100">
            {info.getValue()}
          </span>
        )
      }),
      columnHelper.accessor("price", {
        header: () => "Price",
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="tabular-nums">
              {value.toLocaleString(undefined, {
                maximumFractionDigits: 4
              })}
            </span>
          );
        }
      }),
      columnHelper.accessor("volume", {
        header: () => "24h Volume",
        cell: (info) => {
          const value = info.getValue();
          return (
            <span className="tabular-nums">
              {value.toLocaleString(undefined, {
                notation: "compact",
                maximumFractionDigits: 2
              })}
            </span>
          );
        }
      }),
      columnHelper.accessor("change24h", {
        header: () => "24h Change",
        cell: (info) => {
          const value = info.getValue() as number;
          const isUp = value >= 0;
          return (
            <span
              className={`tabular-nums ${
                isUp ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {value.toFixed(2)}%
            </span>
          );
        }
      }),
      // ✅ Updated → Onboard Date 로 변경
      columnHelper.accessor("time", {
        header: () => "Onboard Date",
        cell: (info) => {
          const value = info.getValue() as number;
          return (
            <span className="text-xs text-slate-400">
              {new Date(value).toLocaleDateString()}
            </span>
          );
        }
      })
    ],
    []
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  const handleSort = (id: SortKey) => {
    if (id === sortKey) {
      toggleSortOrder();
    } else {
      setSortKey(id);
    }
  };

  const renderSortIcon = (id: string) => {
    if (id !== sortKey) return null;
    return sortOrder === "desc" ? (
      <ChevronDown className="ml-1 h-3 w-3" />
    ) : (
      <ChevronUp className="ml-1 h-3 w-3" />
    );
  };

  if (isLoading) {
    return (
      <div className="rounded-lg bg-slate-900 p-4 text-sm text-slate-300">
        로딩 중...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-900/50 p-4 text-sm text-red-200">
        심볼 데이터를 불러오는 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-900/80 p-4 shadow-lg ring-1 ring-slate-800">
      <table className="min-w-full text-left">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400"
            >
              {headerGroup.headers.map((header) => {
                const id = header.column.id as SortKey;

                return (
                  <th
                    key={header.id}
                    className="cursor-pointer px-3 py-2 select-none"
                    onClick={() => handleSort(id)}
                  >
                    <div className="flex items-center">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {renderSortIcon(id)}
                    </div>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-800 text-sm">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="cursor-pointer hover:bg-slate-800/70"
              onClick={() => router.push(`/chart/${row.original.symbol}`)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}