import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProject } from "@/lib/api/services/projects.service"
import { createOrganization, getOrganizations } from "@/lib/api/services/organization.service"
import type { Project } from "@/lib/types/project"
import type { Organization } from "@/lib/types/organization"
import { OrganizationCombobox } from "../organization-combobox"
import { statusConfig } from "@/components/tables/projects/status-config"

const editProjectSchema = z.object({
    name: z.string().min(1, "Naam is verplicht"),
    organization: z.number().positive("Organisatie is verplicht"),
    status: z.string().min(1, "Status is verplicht"),
})
type EditProjectFormValues = z.infer<typeof editProjectSchema>

interface EditProjectFormProps extends React.ComponentProps<"form"> {
    project: Project
    onSuccess?: (project: Project) => void
}

export function EditProjectForm({ className, project, onSuccess, ...props }: EditProjectFormProps) {
    const [organizations, setOrganizations] = useState<Organization[]>([])

    useEffect(() => {
        getOrganizations().then(setOrganizations)
    }, [])

    const {
        register,
        handleSubmit,
        setError,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<EditProjectFormValues>({
        resolver: zodResolver(editProjectSchema),
        defaultValues: {
            name: project.name,
            organization: typeof project.organization === "number"
                ? project.organization
                : project.organization.id,
            status: project.status,
        },
    })

    const handleCreateOrganization = async (name: string) => {
        try {
            const organization = await createOrganization({ name })
            setOrganizations((prev) => [...prev, organization])
            setValue("organization", Number(organization.id), {
                shouldValidate: true,
                shouldDirty: true,
                shouldTouch: true,
            })
        } catch (error) {
            if (error instanceof Response) {
                let message = "Organisatie aanmaken mislukt"
                try {
                    const data = (await error.json()) as Record<string, string[]>
                    const first = Object.values(data).flat()[0]
                    if (first) message = first
                } catch { /* ignore */ }
                setError("root", { message })
                return
            }
            setError("root", { message: "Er ging iets mis tijdens het aanmaken van de organisatie" })
        }
    }

    const onSubmit = async (values: EditProjectFormValues) => {
        try {
            const updated = await updateProject(project.id, {
                name: values.name,
                organization: values.organization,
                status: values.status,
            })
            onSuccess?.(updated)
        } catch (error) {
            if (error instanceof Response) {
                let message = "Opslaan mislukt"
                try {
                    const data = (await error.json()) as Record<string, string[]>
                    const first = Object.values(data).flat()[0]
                    if (first) message = first
                } catch { /* ignore */ }
                setError("root", { message })
                return
            }
            setError("root", { message: "Er ging iets mis tijdens het opslaan" })
        }
    }

    return (
        <form
            className={cn("flex flex-col gap-6", className)}
            onSubmit={handleSubmit(onSubmit)}
            {...props}
        >
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">Naam</FieldLabel>
                    <Input
                        id="name"
                        type="text"
                        autoFocus
                        placeholder="Projectnaam"
                        {...register("name")}
                    />
                    {errors.name && <FieldError>{errors.name.message}</FieldError>}
                </Field>
                <Field>
                    <FieldLabel htmlFor="organization">Organisatie</FieldLabel>
                    <Controller
                        control={control}
                        name="organization"
                        render={({ field }) => (
                            <OrganizationCombobox
                                organizations={organizations}
                                value={field.value || undefined}
                                onChange={field.onChange}
                                onCreate={handleCreateOrganization}
                            />
                        )}
                    />
                    {errors.organization && <FieldError>{errors.organization.message}</FieldError>}
                </Field>
                <Field>
                    <FieldLabel htmlFor="status">Status</FieldLabel>
                    <Controller
                        control={control}
                        name="status"
                        render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger id="status">
                                    <SelectValue>
                                        {field.value ? statusConfig[field.value as keyof typeof statusConfig]?.label : "Selecteer status"}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(statusConfig).map(([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.status && <FieldError>{errors.status.message}</FieldError>}
                </Field>
                {errors.root && <FieldError>{errors.root.message}</FieldError>}
                <Field>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Bezig..." : "Opslaan"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}