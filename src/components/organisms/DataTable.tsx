"use client";
import {
  flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable,
  type ColumnDef, type RowSelectionState, type SortingState, type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Columns3 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Checkbox } from "@/components/atoms/Checkbox";
import { Skeleton } from "@/components/atoms/Skeleton";
import { Button } from "@/components/atoms/Button";
import { Pagination } from "@/components/molecules/Pagination";
import { Popover } from "@/components/molecules/Overlays";

export type { ColumnDef };
/** column.meta: { align: "right" } right-aligns numbers; { label } names it in the column picker */
export interface ColMeta { align?: "left" | "right"; label?: string; className?: string }

interface Props<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  getRowId: (r: T) => string;
  caption: string;
  loading?: boolean;
  empty?: ReactNode;
  selectable?: boolean;
  /** rendered in the floating bar when rows are selected */
  selectionActions?: (rows: T[], clear: () => void) => ReactNode;
  pageSize?: number;
  columnPicker?: boolean;
  onRowClick?: (r: T) => void;
  fade?: boolean;
  toolbar?: ReactNode;
  /** extra row rendered under a row (e.g. failure details); return null for none */
  expanded?: (r: T) => ReactNode;
  density?: "comfortable" | "compact";
}

// LM6.1: first column stays visible while wide tables scroll sideways on tablets/phones.
const STICKY = "max-lg:sticky max-lg:left-0 max-lg:z-[1] max-lg:bg-canvas";

/** TanStack table in our style: sticky header, sort, select + floating action bar, column picker, pagination, loading/empty. */
export function DataTable<T>({ data, columns, getRowId, caption, loading, empty, selectable, selectionActions, pageSize, columnPicker, onRowClick, fade, toolbar, expanded, density }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const selectCol: ColumnDef<T, unknown> = {
    id: "_select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => (
      <Checkbox aria-label="Select all rows" checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false} onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)} />
    ),
    cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(v === true)} onClick={(e) => e.stopPropagation()} />,
  };

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack returns unmemoizable functions; this component opts out of compiler memoization.
  const table = useReactTable({
    data,
    columns: selectable ? [selectCol, ...columns] : columns,
    getRowId,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize, pageIndex: 0 } } } : {}),
  });

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const rows = table.getRowModel().rows;
  const cols = table.getVisibleLeafColumns().length;

  if (!loading && data.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="flex flex-col gap-3">
      {(toolbar || columnPicker) && (
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          {columnPicker && (
            <Popover align="end" trigger={<Button variant="outline" size="sm" className="ml-auto" icon={<Columns3 />}>Columns</Button>}>
              <p className="label-mono px-2 py-1">Show columns</p>
              {table.getAllLeafColumns().filter((c) => c.getCanHide()).map((c) => (
                <div key={c.id} className="px-2 py-1.5">
                  <Checkbox label={(c.columnDef.meta as ColMeta)?.label ?? c.id} checked={c.getIsVisible()} onCheckedChange={(v) => c.toggleVisibility(v === true)} />
                </div>
              ))}
            </Popover>
          )}
        </div>
      )}
      <div data-density={density === "compact" ? "compact" : undefined} className={cn("relative overflow-x-auto rounded-card border border-line", fade && "fade-bottom")}>
        <table className="w-full min-w-[640px] border-collapse text-small">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 z-[1] bg-canvas">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-line">
                {hg.headers.map((h, hi) => {
                  const meta = h.column.columnDef.meta as ColMeta | undefined;
                  const sort = h.column.getIsSorted();
                  return (
                    <th key={h.id} scope="col" aria-sort={sort === "asc" ? "ascending" : sort === "desc" ? "descending" : undefined} className={cn("h-10 px-4 font-normal whitespace-nowrap text-fg-muted", hi === 0 && h.column.id !== "_select" && STICKY, meta?.align === "right" ? "text-right" : "text-left", h.column.id === "_select" && "w-10 pr-0", meta?.className)}>
                      {h.isPlaceholder ? null : h.column.getCanSort() ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()} className={cn("inline-flex items-center gap-1 hover:text-fg", meta?.align === "right" && "flex-row-reverse")}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {sort === "asc" ? <ArrowUp className="size-3" /> : sort === "desc" ? <ArrowDown className="size-3" /> : null}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    {Array.from({ length: cols }, (_, j) => <td key={j} className="h-row px-4"><Skeleton className={cn("h-3", j === 0 ? "w-3/4" : "ml-auto w-1/2")} /></td>)}
                  </tr>
                ))
              : rows.flatMap((r) => {
                  const extra = expanded?.(r.original);
                  return [
                  <tr
                    key={r.id}
                    data-state={r.getIsSelected() ? "selected" : undefined}
                    onClick={onRowClick ? () => onRowClick(r.original) : undefined}
                    className={cn("border-b border-line transition-colors last:border-0 hover:bg-surface-hover data-[state=selected]:bg-selected", onRowClick && "cursor-pointer")}
                  >
                    {r.getVisibleCells().map((c, ci) => {
                      const meta = c.column.columnDef.meta as ColMeta | undefined;
                      return <td key={c.id} className={cn("h-row px-4 text-fg-body", ci === 0 && c.column.id !== "_select" && STICKY, meta?.align === "right" && "text-right tabular-nums", c.column.id === "_select" && "w-10 pr-0", meta?.className)}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>;
                    })}
                  </tr>,
                  extra ? <tr key={`${r.id}-x`} className="border-b border-line bg-raised"><td colSpan={cols} className="px-4 py-4">{extra}</td></tr> : null,
                  ];
                })}
          </tbody>
        </table>
      </div>
      {pageSize && !loading && (
        <Pagination page={table.getState().pagination.pageIndex + 1} pageSize={pageSize} total={data.length} onPage={(p) => table.setPageIndex(p - 1)} />
      )}
      {selectable && selected.length > 0 && (
        <div role="toolbar" aria-label="Selection actions" className="bg-raised ring-1 ring-line shadow-overlay fixed bottom-6 left-1/2 z-[var(--z-sticky)] flex -translate-x-1/2 animate-slide-up items-center gap-3 rounded-full border border-line py-1.5 pl-4 pr-1.5 text-small text-fg">
          <span className="tabular-nums">{selected.length} selected</span>
          {selectionActions?.(selected, () => setRowSelection({}))}
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>Clear</Button>
        </div>
      )}
    </div>
  );
}

/** Two-line cell: title + muted "A · B", optional leading round icon. */
export function TwoLine({ title, meta, lead }: { title: ReactNode; meta?: ReactNode; lead?: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      {lead && <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-fg-muted [&_svg]:size-4">{lead}</span>}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-fg">{title}</span>
        {meta && <span className="truncate text-micro text-fg-muted">{meta}</span>}
      </span>
    </span>
  );
}
