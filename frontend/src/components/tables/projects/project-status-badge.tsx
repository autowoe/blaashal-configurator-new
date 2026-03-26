import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/types/project"
import type { Row } from "@tanstack/react-table"
import { statusConfig } from "@/components/tables/projects/status-config"

export const ProjectStatusBadgeCell = ({ row }: { row: Row<Project> }) => {
    const status = row.original.status
    const config = statusConfig[status]

    return (
        <Badge
            className={config.className}
            variant={config.variant}
        >
            {config.label}
        </Badge>
    )
}