import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteProject } from "@/lib/api/services/projects.service"
import type { Project } from "@/lib/types/project"
import {
    RiDeleteBin2Fill,
    RiFileCopy2Fill,
    RiInfoCardFill,
    RiMenuLine,
} from "@remixicon/react"
import type { Row } from "@tanstack/react-table"
import { useNavigate, useRevalidator } from "react-router"
import { toast } from "react-toastify"

export const ActionCell = ({ row }: { row: Row<Project> }) => {
    const navigate = useNavigate()
    const revalidator = useRevalidator()
    const project = row.original

    const handleDeleteProject = async () => {
        try {
            await deleteProject(project.id)

            toast(`Project ${project.name} verwijderd`, { type: "success" })

            revalidator.revalidate()
        } catch {
            toast(`Verwijderen ${project.name} mislukt`, { type: "error" })
        }
    }

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
                        onClick={() =>
                            navigator.clipboard.writeText(project.id.toString())
                        }
                    >
                        <RiFileCopy2Fill />
                        Kopieër ID
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        variant="destructive"
                        onClick={handleDeleteProject}
                    >
                        <RiDeleteBin2Fill />
                        Verwijder project
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}