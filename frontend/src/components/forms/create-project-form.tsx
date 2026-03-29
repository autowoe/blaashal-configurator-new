import { useNavigate } from "react-router"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, Controller } from "react-hook-form"
import { z } from "zod"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createProject } from "@/lib/api/services/projects.service"
import { createOrganization, getOrganizations } from "@/lib/api/services/organization.service"
import type { Project } from "@/lib/types/project"
import type { Organization } from "@/lib/types/organization"
import { OrganizationCombobox } from "../organization-combobox"
import { useRevalidator } from "react-router"

const createProjectSchema = z.object({
    name: z.string().min(1, "Naam is verplicht"),
    organization: z.number().positive("Organisatie is verplicht"),
})
type CreateProjectFormValues = z.infer<typeof createProjectSchema>
interface CreateProjectFormProps extends React.ComponentProps<"form"> {
    onSuccess?: (project: Project) => void
}

export function CreateProjectForm({
    className,
    onSuccess,
    ...props
}: CreateProjectFormProps) {
    const navigate = useNavigate()
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
    } = useForm<CreateProjectFormValues>({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: "",
            organization: 0,
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
                } catch {
                    // ignore
                }
                setError("root", { message })
                return
            }

            setError("root", { message: "Er ging iets mis tijdens het aanmaken van de organisatie" })
        }
    }

    const onSubmit = async (values: CreateProjectFormValues) => {
        try {
            let organizationId: number

            if (typeof values.organization === "number") {
                organizationId = values.organization
            } else {
                const organization = await createOrganization({
                    name: values.organization.create,
                })

                organizationId = organization.id
            }

            const project = await createProject({
                name: values.name,
                organization: organizationId,
            })

            if (onSuccess) {
                onSuccess(project)
            } else {
                navigate(`/projects/${project.id}`)
            }
        } catch (error) {
            if (error instanceof Response) {
                let message = "Aanmaken mislukt"
                try {
                    const data = (await error.json()) as Record<string, string[]>
                    const first = Object.values(data).flat()[0]
                    if (first) message = first
                } catch {
                    // ignore json parse failure
                }
                setError("root", { message })
                return
            }

            setError("root", { message: "Er ging iets mis tijdens het aanmaken" })
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
                {errors.root && <FieldError>{errors.root.message}</FieldError>}
                <Field>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Bezig..." : "Project aanmaken"}
                    </Button>
                </Field>
            </FieldGroup>
        </form>
    )
}