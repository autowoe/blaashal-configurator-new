"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { Project } from "@/lib/types/project"
import { ActionCell } from "@/components/tables/projects/action-cell"
import { ProjectStatusBadgeCell } from "./project-status-badge"

export const columns: ColumnDef<Project>[] = [
    {
        accessorKey: "name",
        header: "Naam",
    },
    {
        accessorKey: "organization.name",
        header: "Organisatie"
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <ProjectStatusBadgeCell row={row} />
    },
    {
        id: "actions",
        header: "Acties",
        size: 2,
        cell: ({ row, table }) => <ActionCell row={row} table={table} />,
    }
]