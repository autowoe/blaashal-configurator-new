"use client"

import type { ColumnDef } from "@tanstack/react-table"

import type { Project } from "@/lib/types/project"
import { ActionCell } from "@/components/tables/projects/action-cell"

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
        id: "actions",
        header: "Acties",
        size: 2,
        cell: ({ row }) => <ActionCell row={row} />,
    }
]