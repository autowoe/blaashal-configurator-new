import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/lib/types/project"
import { RiFileCopy2Fill, RiInfoCardFill, RiMenuLine } from "@remixicon/react"
import type { Row } from "@tanstack/react-table"
import { useNavigate } from "react-router"


export const ActionCell = ({ row }: { row: Row<Project> }) => {
    const navigate = useNavigate()
    const project = row.original

    return (
        <DropdownMenu>
            <DropdownMenuTrigger>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <RiMenuLine className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                        onClick={() => navigate(`/projects/${project.id}`)}
                    >
                        <RiInfoCardFill />
                        Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(project.id)}
                    >
                        <RiFileCopy2Fill />
                        Kopieër ID
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}