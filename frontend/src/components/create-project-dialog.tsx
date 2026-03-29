import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreateProjectForm } from "@/components/forms/create-project-form"
import { useState } from "react"
import { useRevalidator } from "react-router"

export function CreateProjectDialog() {
    const [open, setOpen] = useState(false)
    const revalidator = useRevalidator()

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button>Nieuw project</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nieuw project</DialogTitle>
                </DialogHeader>
                <CreateProjectForm onSuccess={() => { setOpen(false); revalidator.revalidate() }} />
            </DialogContent>
        </Dialog>
    )
}