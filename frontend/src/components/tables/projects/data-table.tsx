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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import type { Project } from "@/lib/types/project"
import { useState } from "react"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { Button } from "@/components/ui/button"
import { RiFilter3Line } from "@remixicon/react"
import { Checkbox } from "@/components/ui/checkbox"

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
    const [editingProject, setEditingProject] = useState<Project | null>(null)
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
        meta: {
            onEdit: (project: Project) => setEditingProject(project),
        },
    })

    return (
        <>
            <div className="flex flex-row justify-between gap-2 mb-2 flex-wrap">
                <div className="flex flex-row gap-2 items-center">
                    <Input
                        className="w-32 shrink-0"
                        placeholder="Zoeken..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />

                    {/* Desktop filters */}
                    <div className="hidden sm:flex gap-2 items-center flex-wrap">
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

                    {/* Mobile filter popover */}
                    <div className="flex sm:hidden">
                        <Popover>
                            <PopoverTrigger>
                                <Button variant="outline" className="relative">
                                    <RiFilter3Line className="h-4 w-4 mr-1" />
                                    Filter
                                    {status.length > 0 && (
                                        <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                                            {status.length}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-48 p-3">
                                <div className="flex flex-col gap-1">
                                    {Object.entries(statusConfig).map(([value, config]) => {
                                        const isActive = status.includes(value)
                                        return (
                                            <label
                                                key={value}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors"
                                            >
                                                <Checkbox
                                                    checked={isActive}
                                                    onCheckedChange={(checked) => {
                                                        const next = checked
                                                            ? [...status, value]
                                                            : status.filter((s) => s !== value)
                                                        onStatusChange(next)
                                                    }}
                                                />
                                                <span className={`text-sm ${config.className} border-none`}>
                                                    {config.label}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </PopoverContent>
                        </Popover>
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

                            return (
                                <>
                                    <span className="contents sm:hidden">
                                        <PaginationItem>
                                            <PaginationLink href="#" isActive onClick={(e) => e.preventDefault()}>
                                                {current + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    </span>
                                    <span className="hidden sm:contents">
                                        {pages.map((page, i) =>
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
                                        )}
                                    </span>
                                </>
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
            {editingProject && (
                <EditProjectDialog
                    project={editingProject}
                    open={!!editingProject}
                    onOpenChange={(open) => { if (!open) setEditingProject(null) }}
                />
            )}
        </>
    )
}