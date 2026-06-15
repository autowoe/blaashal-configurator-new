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
        accessorKey: "created_by",
        header: "Gemaakt door",
        cell: ({ row }) => {
            const user = row.original.created_by
            if (!user) return <span className="text-muted-foreground">—</span>
            const name = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.email || user.username
            return <span>{name}</span>
        },
    },
    {
        id: "actions",
        header: "Acties",
        size: 2,
        cell: ({ row, table }) => <ActionCell row={row} table={table} />,
    }
]