"use client"

import {
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import type { ColumnDef, PaginationState } from "@tanstack/react-table"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { Field, FieldLabel } from "@/components/ui/field"

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { statusConfig } from "@/components/tables/projects/status-config"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreateProjectDialog } from "@/components/create-project-dialog"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    pagination: PaginationState
    pageCount: number
    onPaginationChange: (updater: PaginationState) => void
    status: string[]
    onStatusChange: (status: string[]) => void
    search: string,
    onSearchChange: (status: string) => void
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageCount,
    pagination,
    onPaginationChange,
    status,
    onStatusChange,
    search,
    onSearchChange,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        manualPagination: true,
        pageCount,
        state: {
            pagination,
        },
        onPaginationChange: (updater) => {
            // TanStack passes either a new state object or an updater function
            const next = typeof updater === "function" ? updater(pagination) : updater
            onPaginationChange(next)
        },
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <>
            <div className="flex flex-row justify-between gap-2 mb-2">
                <div className="flex flex-row">
                    <Input
                        className="w-32"
                        placeholder="Zoeken..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <div className="flex gap-2 items-center">
                        {Object.entries(statusConfig).map(([value, config]) => {
                            const isActive = status.includes(value)
                            return (
                                <Badge
                                    key={value}
                                    variant="outline"
                                    className={`cursor-pointer transition-opacity ${config.className} ${isActive ? "opacity-100" : "opacity-40"}`}
                                    onClick={() => {
                                        const next = isActive
                                            ? status.filter((s) => s !== value)
                                            : [...status, value]
                                        onStatusChange(next)
                                    }}
                                >
                                    {config.label}
                                </Badge>
                            )
                        })}
                    </div>
                </div>
                <CreateProjectDialog />
            </div>
            <div className="overflow-hidden rounded-md border mb-5">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={header.column.id === "actions" ? "w-px pr-4 text-right" : ""}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cell.column.id === "actions" ? "w-px pr-4 text-right whitespace-nowrap" : ""}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between gap-4">
                <Field orientation="horizontal" className="w-fit">
                    <FieldLabel htmlFor="select-rows-per-page">Rijen</FieldLabel>
                    <Select
                        value={String(pagination.pageSize)}
                        onValueChange={(value) =>
                            onPaginationChange({ pageIndex: 0, pageSize: Number(value) })
                        }
                    >
                        <SelectTrigger className="w-20" id="select-rows-per-page">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start">
                            <SelectGroup>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>
                <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href="#"
                                text="Vorige"
                                onClick={(e) => {
                                    e.preventDefault()
                                    table.previousPage()
                                }}
                                aria-disabled={!table.getCanPreviousPage()}
                            />
                        </PaginationItem>

                        {(() => {
                            const current = pagination.pageIndex
                            const total = pageCount
                            const pages: (number | "ellipsis")[] = []

                            if (total <= 7) {
                                for (let i = 0; i < total; i++) pages.push(i)
                            } else {
                                pages.push(0)
                                if (current > 3) pages.push("ellipsis")
                                for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
                                    pages.push(i)
                                }
                                if (current < total - 4) pages.push("ellipsis")
                                pages.push(total - 1)
                            }

                            return pages.map((page, i) =>
                                page === "ellipsis" ? (
                                    <PaginationItem key={`ellipsis-${i}`}>
                                        <PaginationEllipsis />
                                    </PaginationItem>
                                ) : (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            isActive={page === current}
                                            onClick={(e) => {
                                                e.preventDefault()
                                                table.setPageIndex(page)
                                            }}
                                        >
                                            {page + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                )
                            )
                        })()}

                        <PaginationItem>
                            <PaginationNext
                                href="#"
                                text="Volgende"
                                onClick={(e) => {
                                    e.preventDefault()
                                    table.nextPage()
                                }}
                                aria-disabled={!table.getCanNextPage()}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </>
    )
}