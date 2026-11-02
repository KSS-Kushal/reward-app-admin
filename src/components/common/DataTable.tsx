import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature must match the library's
  interface ColumnMeta<TData, TValue> {
    headerClassName?: string
    cellClassName?: string
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[] | undefined
  isLoading?: boolean
  /** Dims rows while a new page loads over the previous one. */
  isFetching?: boolean
  emptyState?: ReactNode
  skeletonRows?: number
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  /** Extra classes per row, e.g. to highlight failures. */
  getRowClassName?: (row: TData) => string | undefined
  /** Sorting applies to the rows on screen (the API has no sort parameters). */
  enableSorting?: boolean
  caption?: string
}

export function DataTable<TData>({
  columns,
  data,
  isLoading,
  isFetching,
  emptyState,
  skeletonRows = 6,
  getRowId,
  onRowClick,
  getRowClassName,
  enableSorting = false,
  caption,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  // TanStack Table returns non-memoizable functions by design; the React Compiler lint rule doesn't apply.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data ?? [],
    columns,
    getRowId,
    state: { sorting },
    onSortingChange: setSorting,
    enableSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows
  const showEmpty = !isLoading && rows.length === 0

  if (showEmpty && emptyState) return <>{emptyState}</>

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table className={cn(isFetching && !isLoading && 'opacity-60 transition-opacity')}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="hover:bg-transparent">
              {group.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sorted = header.column.getIsSorted()
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'h-10 text-xs font-medium tracking-wide uppercase',
                      header.column.columnDef.meta?.headerClassName,
                    )}
                    aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                  >
                    {header.isPlaceholder ? null : sortable ? (
                      <button
                        type="button"
                        className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : sorted === 'desc' ? (
                          <ArrowDown className="size-3" />
                        ) : (
                          <ArrowUpDown className="size-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                  {columns.map((_column, columnIndex) => (
                    <TableCell key={columnIndex}>
                      <Skeleton className="h-5 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && 'cursor-pointer', getRowClassName?.(row.original))}
                  onClick={
                    onRowClick
                      ? (event) => {
                          // Clicks on buttons, links and menus inside the row keep their own behaviour.
                          if ((event.target as HTMLElement).closest('button, a, [role="menuitem"], input'))
                            return
                          onRowClick(row.original)
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn('py-3', cell.column.columnDef.meta?.cellClassName)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          {showEmpty && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
