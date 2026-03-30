import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useRevalidator } from "react-router"
import { EditProjectForm } from "@/components/forms/edit-project-form"
import type { Project } from "@/lib/types/project"

interface EditProjectDialogProps {
    project: Project
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
    const revalidator = useRevalidator()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Project bewerken</DialogTitle>
                </DialogHeader>
                <EditProjectForm
                    project={project}
                    onSuccess={() => {
                        onOpenChange(false)
                        revalidator.revalidate()
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}