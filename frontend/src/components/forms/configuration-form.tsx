import { useNavigate } from "react-router"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react"
import type { Project } from "@/lib/types/project"
import type {
    ConfigurationType,
    ComponentPrice,
    ExistingConfiguration,
} from "@/lib/types/configuration"
import { createProjectConfiguration } from "@/lib/api/services/configuration.service"
import { Field, FieldError, FieldGroup } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "react-toastify"

const configurationSchema = z.object({
    configuration_type: z.number({ error: "Selecteer een type" }),
    components: z.record(z.string(), z.union([z.boolean(), z.number()])),
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
    onSelectedComponentsChange?: (selectedComponents: number[]) => void
}

function buildDefaultComponents(
    existingConfig: ExistingConfiguration | null
): Record<string, boolean | number> {
    if (!existingConfig?.data.components) return {}
    return Object.fromEntries(existingConfig.data.components.map((c) => [String(c.id), c.value]))
}

function collectAllPrices(prices: ComponentPrice[]): ComponentPrice[] {
    return prices.flatMap((p) => [p, ...collectAllPrices(p.children)])
}

function getActiveIds(
    allPrices: ComponentPrice[],
    values: Record<string, boolean | number>
): number[] {
    return allPrices
        .filter((p) => {
            const val = values[p.component.id]
            const type = p.component.input_type
            if (type === "boolean" || type === "select") return val === true
            if (type === "quantity" || type === "formula") return typeof val === "number" && val > 0
            return false
        })
        .map((p) => p.component.id)
}

function calcLinePrice(price: ComponentPrice, val: boolean | number | undefined): number {
    const unitPrice = parseFloat(price.verkoop)
    const type = price.component.input_type
    if (type === "boolean" || type === "select") return val === true ? unitPrice : 0
    if (type === "quantity" || type === "formula") return typeof val === "number" ? val * unitPrice : 0
    return 0
}

function calcTotal(
    allPrices: ComponentPrice[],
    values: Record<string, boolean | number>
): number {
    return allPrices.reduce((sum, p) => sum + calcLinePrice(p, values[p.component.id]), 0)
}

// Groups sibling select items by group_key for radio rendering
type RenderItem =
    | { kind: "single"; price: ComponentPrice }
    | { kind: "group"; groupKey: string; items: ComponentPrice[] }

function buildRenderItems(prices: ComponentPrice[]): RenderItem[] {
    const seen = new Set<string>()
    const items: RenderItem[] = []
    for (const price of prices) {
        const { input_type, group_key } = price.component
        if (input_type === "select" && group_key) {
            if (!seen.has(group_key)) {
                seen.add(group_key)
                items.push({
                    kind: "group",
                    groupKey: group_key,
                    items: prices.filter(
                        (p) => p.component.input_type === "select" && p.component.group_key === group_key
                    ),
                })
            }
        } else {
            items.push({ kind: "single", price })
        }
    }
    return items
}

export const ConfigurationForm = forwardRef<ConfigurationFormRef, ConfigurationFormProps>(
    ({ project, types, components, existingConfig, activeTypeId, onDirtyChange, onSelectedComponentsChange }, ref) => {
        const navigate = useNavigate()

        const defaultValues = {
            configuration_type: activeTypeId
                ? Number(activeTypeId)
                : existingConfig?.configuration_type.id ?? undefined,
            components: buildDefaultComponents(existingConfig),
        }

        const form = useForm<ConfigurationFormValues>({
            resolver: zodResolver(configurationSchema),
            defaultValues,
        })

        const { formState: { isSubmitting, isDirty } } = form
        const watchedComponents = useWatch({ control: form.control, name: "components" })

        const allPrices = useMemo(() => collectAllPrices(components), [components])
        const activeIds = useMemo(() => getActiveIds(allPrices, watchedComponents ?? {}), [allPrices, watchedComponents])
        const total = useMemo(() => calcTotal(allPrices, watchedComponents ?? {}), [allPrices, watchedComponents])

        const onSubmit = async (values: ConfigurationFormValues) => {
            try {
                const activePrices = allPrices.filter((p) => activeIds.includes(p.component.id))
                const snap = activePrices.reduce<Record<number, { name: string; inkoop: string; verkoop: string; value: boolean | number }>>(
                    (acc, p) => {
                        acc[p.component.id] = {
                            name: p.component.name,
                            inkoop: p.inkoop,
                            verkoop: p.verkoop,
                            value: values.components[p.component.id],
                        }
                        return acc
                    },
                    {}
                )

                await createProjectConfiguration(project.id, {
                    configuration_type: values.configuration_type,
                    data: {
                        components: activePrices.map((p) => ({
                            id: p.component.id,
                            value: values.components[p.component.id],
                        })),
                        price_snapshot: snap,
                    },
                })

                form.reset(values)
                toast("Configuratie succesvol opgeslagen", { type: "success" })
            } catch {
                toast("Opslaan van de configuratie is mislukt", { type: "error" })
            }
        }

        useEffect(() => { onDirtyChange?.(isDirty) }, [isDirty, onDirtyChange])
        useEffect(() => { onSelectedComponentsChange?.(activeIds) }, [activeIds, onSelectedComponentsChange])

        useImperativeHandle(ref, () => ({
            isDirty,
            isSubmitting,
            submit: () => form.handleSubmit(onSubmit)(),
            reset: () => form.reset(defaultValues),
        }))

        return (
            <form id="configuration-form" onSubmit={form.handleSubmit(onSubmit)} className="w-full lg:h-full lg:min-h-0">
                <div className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col">
                    {/* Type selector */}
                    <div className="px-4 py-5 sm:px-5 border-b border-border shrink-0">
                        <FieldGroup>
                            <Controller
                                name="configuration_type"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground mb-1.5">
                                            Type installatie
                                        </p>
                                        <Select
                                            value={field.value ? String(field.value) : undefined}
                                            onValueChange={(value) => {
                                                field.onChange(Number(value))
                                                navigate(`?configuration_type=${value}`)
                                            }}
                                        >
                                            <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
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

                    {/* Component list */}
                    {components.length > 0 && (
                        <div className="flex flex-col lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                            <div className="px-4 pt-4 pb-1 sm:px-5 shrink-0">
                                <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                    Componenten
                                </p>
                            </div>

                            <div className="lg:flex-1 lg:min-h-0 lg:overflow-hidden">
                                <ScrollArea className="lg:max-h-[40vh] lg:h-full lg:max-h-none">
                                    <div className="divide-y divide-border">
                                        {components.map((price) => (
                                            <ParentRow
                                                key={price.id}
                                                price={price}
                                                form={form}
                                                watchedComponents={watchedComponents ?? {}}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    {activeIds.length > 0 && (
                        <div className="px-4 py-4 sm:px-5 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                            <span className="text-sm font-medium">Totaal</span>
                            <span className="text-lg font-semibold tabular-nums">
                                € {total.toLocaleString("nl-NL")}
                            </span>
                        </div>
                    )}
                </div>
            </form>
        )
    }
)

ConfigurationForm.displayName = "ConfigurationForm"

// ─── ParentRow ───────────────────────────────────────────────────────────────

interface RowProps {
    price: ComponentPrice
    form: ReturnType<typeof useForm<ConfigurationFormValues>>
    watchedComponents: Record<string, boolean | number>
}

function ParentRow({ price, form, watchedComponents }: RowProps) {
    const checked = watchedComponents[price.component.id] === true
    const lineTotal = calcLinePrice(price, watchedComponents[price.component.id])
    const hasChildren = price.children.length > 0

    return (
        <div>
            {/* Parent checkbox row */}
            <Controller
                name={`components.${price.component.id}` as const}
                control={form.control}
                render={({ field }) => (
                    <label
                        htmlFor={`component-${price.id}`}
                        className={[
                            "flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5 cursor-pointer transition-colors",
                            checked ? "bg-secondary" : "hover:bg-muted/60",
                        ].join(" ")}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <Checkbox
                                id={`component-${price.id}`}
                                checked={checked}
                                onCheckedChange={(val) => {
                                    field.onChange(val === true)
                                    // clear child values when unchecking parent
                                    if (!val) {
                                        collectAllPrices(price.children).forEach((child) => {
                                            form.setValue(`components.${child.component.id}`, false)
                                        })
                                    }
                                }}
                            />
                            <p className="truncate text-sm font-medium text-foreground">
                                {price.component.name}
                            </p>
                        </div>
                        <span className={["shrink-0 text-sm tabular-nums font-medium", checked ? "text-primary" : "text-muted-foreground"].join(" ")}>
                            € {lineTotal.toLocaleString("nl-NL")}
                        </span>
                    </label>
                )}
            />

            {/* Collapsible children */}
            {hasChildren && (
                <div className={["grid transition-all duration-200 ease-in-out", checked ? "grid-rows-[1fr]" : "grid-rows-[0fr]"].join(" ")}>
                    <div className="overflow-hidden">
                        <ChildrenList prices={price.children} form={form} watchedComponents={watchedComponents} />
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── ChildrenList ─────────────────────────────────────────────────────────────

interface ChildrenListProps {
    prices: ComponentPrice[]
    form: ReturnType<typeof useForm<ConfigurationFormValues>>
    watchedComponents: Record<string, boolean | number>
}

function ChildrenList({ prices, form, watchedComponents }: ChildrenListProps) {
    const renderItems = useMemo(() => buildRenderItems(prices), [prices])

    return (
        <div className="border-t border-border bg-muted/40 divide-y divide-border/60">
            {renderItems.map((item) => {
                if (item.kind === "group") {
                    return (
                        <ChildGroupRow
                            key={item.groupKey}
                            groupKey={item.groupKey}
                            items={item.items}
                            watchedComponents={watchedComponents}
                            onChange={(selectedId) => {
                                item.items.forEach((p) => {
                                    form.setValue(
                                        `components.${p.component.id}`,
                                        p.component.id === Number(selectedId)
                                    )
                                })
                            }}
                        />
                    )
                }
                return (
                    <ChildInputRow
                        key={item.price.id}
                        price={item.price}
                        form={form}
                        watchedComponents={watchedComponents}
                    />
                )
            })}
        </div>
    )
}

// ─── ChildInputRow ────────────────────────────────────────────────────────────

function ChildInputRow({ price, form, watchedComponents }: RowProps) {
    const { input_type } = price.component
    const val = watchedComponents[price.component.id]
    const numVal = typeof val === "number" ? val : 0
    const unitPrice = parseFloat(price.verkoop)
    const lineTotal = calcLinePrice(price, val)
    const active = lineTotal > 0

    if (input_type === "boolean") {
        const checked = val === true
        return (
            <Controller
                name={`components.${price.component.id}` as const}
                control={form.control}
                render={({ field }) => (
                    <label
                        htmlFor={`child-${price.id}`}
                        className={["flex items-center justify-between gap-4 pl-10 pr-4 py-3 sm:pr-5 cursor-pointer transition-colors", checked ? "bg-secondary/60" : "hover:bg-muted/60"].join(" ")}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <Checkbox
                                id={`child-${price.id}`}
                                checked={checked}
                                onCheckedChange={(v) => field.onChange(v === true)}
                            />
                            <p className="truncate text-sm text-foreground">{price.component.name}</p>
                        </div>
                        <span className={["shrink-0 text-sm tabular-nums", checked ? "text-primary font-medium" : "text-muted-foreground"].join(" ")}>
                            € {unitPrice.toLocaleString("nl-NL")}
                        </span>
                    </label>
                )}
            />
        )
    }

    if (input_type === "quantity" || input_type === "formula") {
        return (
            <Controller
                name={`components.${price.component.id}` as const}
                control={form.control}
                render={({ field }) => (
                    <div className="flex items-center justify-between gap-4 pl-10 pr-4 py-3 sm:pr-5">
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <p className="truncate text-sm text-foreground">{price.component.name}</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    min={0}
                                    step="1"
                                    value={numVal || ""}
                                    placeholder="0"
                                    className="h-7 w-24 text-sm"
                                    onChange={(e) => {
                                        const parsed = input_type === "formula"
                                            ? parseFloat(e.target.value)
                                            : parseInt(e.target.value, 10)
                                        field.onChange(isNaN(parsed) ? 0 : parsed)
                                    }}
                                />
                                {price.component.unit && (
                                    <span className="text-xs text-muted-foreground">{price.component.unit}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    × € {unitPrice.toLocaleString("nl-NL")}
                                </span>
                            </div>
                        </div>
                        <span className={["shrink-0 text-sm tabular-nums", active ? "text-primary font-medium" : "text-muted-foreground"].join(" ")}>
                            € {lineTotal.toLocaleString("nl-NL")}
                        </span>
                    </div>
                )}
            />
        )
    }

    return null
}

// ─── ChildGroupRow ────────────────────────────────────────────────────────────

interface ChildGroupRowProps {
    groupKey: string
    items: ComponentPrice[]
    watchedComponents: Record<string, boolean | number>
    onChange: (id: string) => void
}

function ChildGroupRow({ groupKey, items, watchedComponents, onChange }: ChildGroupRowProps) {
    const selectedId = items.find((p) => watchedComponents[p.component.id] === true)?.component.id.toString() ?? ""

    return (
        <div className="pl-10 pr-4 py-3 sm:pr-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground capitalize">
                {groupKey.replace(/_/g, " ")}
            </p>
            <RadioGroup value={selectedId} onValueChange={onChange} className="gap-1">
                {items.map((price) => {
                    const selected = selectedId === price.component.id.toString()
                    return (
                        <label
                            key={price.id}
                            htmlFor={`radio-child-${price.id}`}
                            className={["flex items-center justify-between gap-4 rounded-md px-3 py-2 cursor-pointer transition-colors", selected ? "bg-secondary" : "hover:bg-muted/60"].join(" ")}
                        >
                            <div className="flex items-center gap-2.5">
                                <RadioGroupItem id={`radio-child-${price.id}`} value={price.component.id.toString()} />
                                <span className="text-sm text-foreground">{price.component.name}</span>
                            </div>
                            <span className={["text-sm tabular-nums", selected ? "text-primary font-medium" : "text-muted-foreground"].join(" ")}>
                                € {parseFloat(price.verkoop).toLocaleString("nl-NL")}
                            </span>
                        </label>
                    )
                })}
            </RadioGroup>
        </div>
    )
}
