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
import { RiAddLine } from "@remixicon/react"

export function CreateProjectDialog() {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                <Button>
                    <RiAddLine className="sm:hidden h-4 w-4" />
                    <span className="hidden sm:inline">Nieuw project</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nieuw project</DialogTitle>
                </DialogHeader>
                <CreateProjectForm />
            </DialogContent>
        </Dialog>
    )
}