import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { createOrganization } from "@/lib/api/services/organization.service"
import { toast } from "react-toastify"

const schema = z.object({
    name: z.string().min(1, "Naam is verplicht"),
    email: z.string().email("Ongeldig e-mailadres").or(z.literal("")),
})
type FormValues = z.infer<typeof schema>

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CreateOrganizationDialog({ open, onOpenChange, onSuccess }: CreateOrganizationDialogProps) {
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { name: "", email: "" },
    })

    const onSubmit = async (values: FormValues) => {
        try {
            await createOrganization(values)
            toast("Organisatie aangemaakt", { type: "success" })
            reset()
            onSuccess()
        } catch {
            setError("root", { message: "Aanmaken mislukt" })
        }
    }

    const handleOpenChange = (next: boolean) => {
        if (!next) reset()
        onOpenChange(next)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nieuwe organisatie</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="new-org-name">Naam</FieldLabel>
                            <Input id="new-org-name" autoFocus placeholder="Bedrijfsnaam" {...register("name")} />
                            {errors.name && <FieldError>{errors.name.message}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="new-org-email">E-mail</FieldLabel>
                            <Input id="new-org-email" type="email" placeholder="contact@bedrijf.nl" {...register("email")} />
                            {errors.email && <FieldError>{errors.email.message}</FieldError>}
                        </Field>
                        {errors.root && <FieldError>{errors.root.message}</FieldError>}
                    </FieldGroup>
                    <DialogFooter className="mt-4" showCloseButton>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Bezig..." : "Aanmaken"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
