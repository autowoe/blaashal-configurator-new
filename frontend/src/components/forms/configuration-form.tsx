import { useNavigate } from "react-router"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { forwardRef, useEffect, useImperativeHandle } from "react"
import type { Project } from "@/lib/types/project"
import type { ConfigurationType, ComponentPrice, ExistingConfiguration } from "@/lib/types/configuration"
import { createProjectConfiguration } from "@/lib/api/services/configuration.service"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "react-toastify"

const configurationSchema = z.object({
    configuration_type: z.number({ error: "Selecteer een type" }),
    selected_components: z.array(z.number()).min(1, "Selecteer minimaal één component"),
})

type ConfigurationFormValues = z.infer<typeof configurationSchema>

export interface ConfigurationFormRef {
    isDirty: boolean
    isSubmitting: boolean
    submit: () => void
    reset: () => void
}

interface ConfigurationFormProps {
    project: Project
    types: ConfigurationType[]
    components: ComponentPrice[]
    existingConfig: ExistingConfiguration | null
    activeTypeId: string | null
    onDirtyChange?: (isDirty: boolean) => void
}

export const ConfigurationForm = forwardRef<ConfigurationFormRef, ConfigurationFormProps>(({
    project,
    types,
    components,
    existingConfig,
    activeTypeId,
    onDirtyChange
}, ref) => {
    const navigate = useNavigate()

    const form = useForm<ConfigurationFormValues>({
        resolver: zodResolver(configurationSchema),
        defaultValues: {
            configuration_type: activeTypeId
                ? Number(activeTypeId)
                : existingConfig?.configuration_type.id ?? undefined,
            selected_components: existingConfig?.data.selected_components ?? [],
        },
    })

    const { formState: { isSubmitting, isDirty } } = form
    const selectedComponents = form.watch("selected_components")

    const total = components
        .filter((c) => selectedComponents.includes(c.component.id))
        .reduce((sum, c) => sum + parseFloat(c.verkoop), 0)

    const defaultValues = {
        configuration_type: activeTypeId
            ? Number(activeTypeId)
            : existingConfig?.configuration_type.id ?? undefined,
        selected_components: existingConfig?.data.selected_components ?? [],
    }

    const onSubmit = async (values: ConfigurationFormValues) => {
        try {
            const snap = components
                .filter((c) => values.selected_components.includes(c.component.id))
                .reduce<Record<number, { name: string; inkoop: string; verkoop: string }>>(
                    (acc, c) => {
                        acc[c.component.id] = {
                            name: c.component.name,
                            inkoop: c.inkoop,
                            verkoop: c.verkoop,
                        }
                        return acc
                    },
                    {}
                )

            await createProjectConfiguration(project.id, {
                configuration_type: values.configuration_type,
                data: {
                    selected_components: values.selected_components,
                    price_snapshot: snap,
                },
            })

            form.reset(values)
            toast("Configuratie succesvol opgeslagen", { type: "success" })
        } catch {
            toast("Opslaan van de configuratie is mislukt", { type: "error" })
        }
    }

    useEffect(() => {
        onDirtyChange?.(isDirty)
    }, [isDirty])

    useImperativeHandle(ref, () => ({
        isDirty,
        isSubmitting,
        submit: () => form.handleSubmit(onSubmit)(),
        reset: () => form.reset(defaultValues),
    }))

    return (
        <form id="configuration-form" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden">
                <div className="px-5 py-5 border-b border-border">
                    <FieldGroup>
                        <Controller
                            name="configuration_type"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                        Type installatie
                                    </FieldLabel>
                                    <Select
                                        value={field.value ? String(field.value) : undefined}
                                        onValueChange={(value) => {
                                            field.onChange(Number(value))
                                            navigate(`?configuration_type=${value}`)
                                        }}
                                    >
                                        <SelectTrigger className="mt-1.5" aria-invalid={fieldState.invalid}>
                                            <SelectValue placeholder="Kies een type...">
                                                {field.value ? types.find((t) => t.id === field.value)?.name : undefined}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {types.map((t) => (
                                                <SelectItem key={t.id.toString()} value={t.id.toString()}>
                                                    {t.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </div>

                {components.length > 0 && (
                    <Controller
                        name="selected_components"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid}>
                                <div className="px-5 pt-4 pb-1">
                                    <FieldLabel className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                        Componenten
                                    </FieldLabel>
                                </div>
                                <div className="divide-y divide-border">
                                    {components.map((c) => {
                                        const checked = field.value.includes(c.component.id)
                                        return (
                                            <label
                                                key={c.id}
                                                htmlFor={`component-${c.id}`}
                                                className={[
                                                    "flex items-center justify-between px-5 py-3.5 cursor-pointer transition-colors",
                                                    checked ? "bg-secondary" : "hover:bg-muted/60",
                                                ].join(" ")}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Checkbox
                                                        id={`component-${c.id}`}
                                                        checked={checked}
                                                        onCheckedChange={(val) => {
                                                            field.onChange(
                                                                val
                                                                    ? [...field.value, c.component.id]
                                                                    : field.value.filter((id) => id !== c.component.id)
                                                            )
                                                        }}
                                                    />
                                                    <p className="text-sm font-medium text-foreground">
                                                        {c.component.name}
                                                    </p>
                                                </div>
                                                <span className={[
                                                    "text-sm tabular-nums font-medium",
                                                    checked ? "text-primary" : "text-muted-foreground",
                                                ].join(" ")}>
                                                    € {parseFloat(c.verkoop).toLocaleString("nl-NL")}
                                                </span>
                                            </label>
                                        )
                                    })}
                                </div>
                                {fieldState.invalid && (
                                    <div className="px-5 pb-3">
                                        <FieldError errors={[fieldState.error]} />
                                    </div>
                                )}
                            </Field>
                        )}
                    />
                )}

                {selectedComponents.length > 0 && (
                    <div className="px-5 py-4 bg-primary text-primary-foreground flex items-center justify-between">
                        <span className="text-sm font-medium opacity-90">Totaal</span>
                        <span className="text-lg font-semibold tabular-nums">
                            € {total.toLocaleString("nl-NL")}
                        </span>
                    </div>
                )}
            </div>
        </form>
    )
})

ConfigurationForm.displayName = "ConfigurationForm"