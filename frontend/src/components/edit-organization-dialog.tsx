import { useEffect } from "react"
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
import { updateOrganization } from "@/lib/api/services/organization.service"
import type { Organization } from "@/lib/types/organization"
import { toast } from "react-toastify"

const schema = z.object({
    name: z.string().min(1, "Naam is verplicht"),
    email: z.string().email("Ongeldig e-mailadres").or(z.literal("")),
})
type FormValues = z.infer<typeof schema>

interface EditOrganizationDialogProps {
    organization: Organization | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditOrganizationDialog({ organization, open, onOpenChange, onSuccess }: EditOrganizationDialogProps) {
    const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(schema),
    })

    useEffect(() => {
        if (organization) {
            reset({ name: organization.name, email: organization.email ?? "" })
        }
    }, [organization, reset])

    const onSubmit = async (values: FormValues) => {
        if (!organization) return
        try {
            await updateOrganization(organization.id, values)
            toast("Organisatie opgeslagen", { type: "success" })
            onSuccess()
        } catch {
            setError("root", { message: "Opslaan mislukt" })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Organisatie bewerken</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="org-name">Naam</FieldLabel>
                            <Input id="org-name" autoFocus {...register("name")} />
                            {errors.name && <FieldError>{errors.name.message}</FieldError>}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="org-email">E-mail</FieldLabel>
                            <Input id="org-email" type="email" placeholder="contact@bedrijf.nl" {...register("email")} />
                            {errors.email && <FieldError>{errors.email.message}</FieldError>}
                        </Field>
                        {errors.root && <FieldError>{errors.root.message}</FieldError>}
                    </FieldGroup>
                    <DialogFooter className="mt-4" showCloseButton>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Bezig..." : "Opslaan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
