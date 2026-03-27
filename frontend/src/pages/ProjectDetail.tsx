import { useLoaderData, useNavigate } from "react-router"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { Project } from "@/lib/types/project"
import type { ConfigurationType, ComponentPrice, ExistingConfiguration } from "@/lib/types/configuration"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { statusConfig } from "@/components/tables/projects/status-config"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-toastify"

const configurationSchema = z.object({
    configuration_type: z.number({ error: "Selecteer een type" }),
    selected_components: z.array(z.number()).min(1, "Selecteer minimaal één component"),
})

type ConfigurationFormValues = z.infer<typeof configurationSchema>

const LOCKED_STATUSES = ["quoted", "accepted", "done", "denied"]

export const ProjectDetail = () => {
    const { project, types, components, existingConfig, activeTypeId } = useLoaderData() as {
        project: Project
        types: ConfigurationType[]
        components: ComponentPrice[]
        existingConfig: ExistingConfiguration | null
        activeTypeId: string | null
    }

    const isLocked = (LOCKED_STATUSES as string[]).includes(project.status)
    const snapshot = existingConfig?.data.price_snapshot ?? {}
    const snapshotTotal = Object.values(snapshot).reduce((sum, item) => sum + parseFloat(item.verkoop), 0)

    const navigate = useNavigate()

    const form = useForm<ConfigurationFormValues>({
        resolver: zodResolver(configurationSchema),
        defaultValues: {
            configuration_type: activeTypeId ? Number(activeTypeId) : existingConfig?.configuration_type ?? undefined,
            selected_components: existingConfig?.data.selected_components ?? [],
        },
    })

    const selectedComponents = form.watch("selected_components")

    const total = components
        .filter((c) => selectedComponents.includes(c.component.id))
        .reduce((sum, c) => sum + parseFloat(c.verkoop), 0)

    const onSubmit = async (values: ConfigurationFormValues) => {
        const snap = components
            .filter((c) => values.selected_components.includes(c.component.id))
            .reduce(
                (acc, c) => ({
                    ...acc,
                    [c.component.id]: {
                        name: c.component.name,
                        inkoop: c.inkoop,
                        verkoop: c.verkoop,
                    },
                }),
                {}
            )

        await fetch(`http://localhost:8000/api/projects/${project.id}/configurations/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                configuration_type: values.configuration_type,
                data: { selected_components: values.selected_components, price_snapshot: snap },
            }),
        }).then((response) => {
            if (response.ok) {
                toast('Configuratie succesvol opgeslagen', { type: "success" })
            } else {
                toast('Opslaan van de configuratie is mislukt', { type: "error" })
            }
        })
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-1">
                            Project configuratie
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {project.name}
                        </h1>
                    </div>

                    <Badge
                        variant={statusConfig[project.status].variant}
                        className={statusConfig[project.status].className}
                    >
                        {statusConfig[project.status].label}
                    </Badge>
                </div>

                {isLocked ? (
                    <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                            <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                Vastgelegde prijzen
                            </span>
                        </div>

                        <div className="divide-y divide-border">
                            {Object.values(snapshot).map((item) => (
                                <div key={item.name} className="flex items-center justify-between px-5 py-3.5">
                                    <span className="text-sm text-foreground/90">{item.name}</span>
                                    <span className="text-sm tabular-nums font-medium">
                                        € {parseFloat(item.verkoop).toLocaleString("nl-NL")}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="px-5 py-4 bg-primary text-primary-foreground flex items-center justify-between">
                            <span className="text-sm font-medium opacity-90">Totaal verkoop</span>
                            <span className="text-lg font-semibold tabular-nums">
                                € {snapshotTotal.toLocaleString("nl-NL")}
                            </span>
                        </div>
                    </div>
                ) : (
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
                                                        <SelectValue placeholder="Kies een type..." />
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

                                                                <div>
                                                                    <p className="text-sm font-medium text-foreground">
                                                                        {c.component.name}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <span
                                                                className={[
                                                                    "text-sm tabular-nums font-medium",
                                                                    checked ? "text-primary" : "text-muted-foreground",
                                                                ].join(" ")}
                                                            >
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
                                    <span className="text-sm font-medium opacity-90">Totaal verkoop</span>
                                    <span className="text-lg font-semibold tabular-nums">
                                        € {total.toLocaleString("nl-NL")}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                onClick={() =>
                                    form.reset({
                                        configuration_type: activeTypeId
                                            ? Number(activeTypeId)
                                            : existingConfig?.configuration_type ?? undefined,
                                        selected_components: existingConfig?.data.selected_components ?? [],
                                    })
                                }
                                variant="destructive"
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Reset
                            </Button>

                            <Button type="submit" form="configuration-form">
                                Opslaan
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}