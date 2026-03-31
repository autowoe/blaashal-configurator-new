import { useLoaderData, useRevalidator } from "react-router"
import { useRef, useState } from "react"
import type { Project } from "@/lib/types/project"
import type {
    ConfigurationType,
    ComponentPrice,
    ExistingConfiguration,
} from "@/lib/types/configuration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/components/tables/projects/status-config"
import {
    ConfigurationForm,
    type ConfigurationFormRef,
} from "@/components/forms/configuration-form"
import { updateProject } from "@/lib/api/services/projects.service"
import { toast } from "react-toastify"
import { RiSendPlaneLine } from "@remixicon/react"
import type { Visualization } from "@/lib/types/visualization"
import { Configuration3DPreview } from "@/components/3d-configurator"
import { Switch } from "@/components/ui/switch"

const LOCKED_STATUSES = ["quoted", "accepted", "done", "denied"]

export const ProjectDetail = () => {
    const { project, types, components, visualizations, existingConfig, activeTypeId } =
        useLoaderData() as {
            project: Project
            types: ConfigurationType[]
            components: ComponentPrice[]
            visualizations: Visualization[]
            existingConfig: ExistingConfiguration | null
            activeTypeId: string | null
        }

    const revalidator = useRevalidator()
    const formRef = useRef<ConfigurationFormRef>(null)

    const [showPreview, setShowPreview] = useState(false)
    const [isSendingQuote, setIsSendingQuote] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>(
        existingConfig?.data.selected_components ?? []
    )

    const isLocked = LOCKED_STATUSES.includes(project.status)
    const isDraft = project.status === "draft"

    const snapshot = existingConfig?.data.price_snapshot ?? {}
    const snapshotTotal = Object.values(snapshot).reduce(
        (sum, item) => sum + parseFloat(item.verkoop),
        0
    )

    const createdAt = new Intl.DateTimeFormat("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(project.created_at))

    const handleSendQuote = async () => {
        try {
            setIsSendingQuote(true)
            await updateProject(project.id, { status: "quoted" })
            toast("Offerte verstuurd", { type: "success" })
            revalidator.revalidate()
        } catch {
            toast("Versturen mislukt", { type: "error" })
        } finally {
            setIsSendingQuote(false)
        }
    }

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full lg:h-full lg:min-h-0">
                    <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
                        <div className="shrink-0">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                                        Project configuratie
                                    </p>

                                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {project.name}
                                    </h1>

                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                        <span>{project.organization.name}</span>
                                        <span className="hidden sm:inline text-border">·</span>
                                        <span>{createdAt}</span>
                                    </div>

                                    <div className="pt-1 sm:hidden">
                                        <Badge
                                            variant={statusConfig[project.status].variant}
                                            className={statusConfig[project.status].className}
                                        >
                                            {statusConfig[project.status].label}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="hidden sm:block">
                                    <Badge
                                        variant={statusConfig[project.status].variant}
                                        className={statusConfig[project.status].className}
                                    >
                                        {statusConfig[project.status].label}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="lg:flex-1 lg:min-h-0">
                            {isLocked ? (
                                <div className="mx-auto w-full max-w-2xl lg:h-full lg:min-h-0">
                                    <div className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col">
                                        <div className="px-4 py-4 sm:px-5 border-b border-border shrink-0 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex gap-2 items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                                    Vastgelegde prijzen
                                                </span>
                                            </div>

                                            {existingConfig && (
                                                <Badge>{existingConfig.configuration_type.name}</Badge>
                                            )}
                                        </div>

                                        <div className="divide-y divide-border lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                                            {Object.values(snapshot).map((item) => (
                                                <div
                                                    key={item.name}
                                                    className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                                                >
                                                    <span className="min-w-0 text-sm text-foreground/90">
                                                        {item.name}
                                                    </span>
                                                    <span className="shrink-0 text-sm tabular-nums font-medium">
                                                        € {parseFloat(item.verkoop).toLocaleString("nl-NL")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="px-4 py-4 sm:px-5 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                                            <span className="text-sm font-medium">Totaal</span>
                                            <span className="text-lg font-semibold tabular-nums">
                                                € {snapshotTotal.toLocaleString("nl-NL")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`grid gap-6 lg:h-full lg:min-h-0 ${showPreview
                                        ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_460px]"
                                        : "grid-cols-1"
                                        }`}
                                >
                                    <div
                                        className={
                                            showPreview
                                                ? "min-w-0 lg:h-[full] lg:min-h-0"
                                                : "mx-auto w-full max-w-2xl min-w-0 lg:h-full lg:min-h-0"
                                        }
                                    >
                                        <ConfigurationForm
                                            ref={formRef}
                                            project={project}
                                            types={types}
                                            components={components}
                                            existingConfig={existingConfig}
                                            activeTypeId={activeTypeId}
                                            onDirtyChange={setIsDirty}
                                            onSelectedComponentsChange={setSelectedComponentIds}
                                        />
                                    </div>

                                    {showPreview && (
                                        <div className="min-w-0 lg:h-full lg:min-h-0">
                                            <Configuration3DPreview
                                                visualizations={visualizations}
                                                selectedComponentIds={selectedComponentIds}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-4 sm:h-6 lg:hidden" />
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sticky bottom-0 mt-3">
                <div className="mx-auto max-w-7xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                        {isDraft && (
                            <Button
                                variant="outline"
                                onClick={handleSendQuote}
                                disabled={isSendingQuote || isDirty}
                                title={isDirty ? "Sla de configuratie eerst op" : undefined}
                                className="w-full sm:w-auto"
                            >
                                <RiSendPlaneLine className="h-4 w-4 mr-2" />
                                {isSendingQuote ? "Bezig..." : "Verstuur offerte"}
                            </Button>
                        )}

                        {!isLocked && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="preview-toggle"
                                    checked={showPreview}
                                    onCheckedChange={setShowPreview}
                                />
                                <label
                                    htmlFor="preview-toggle"
                                    className="text-sm font-medium leading-none"
                                >
                                    Preview tonen
                                </label>
                            </div>
                        )}
                    </div>

                    {!isLocked && isDirty && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => formRef.current?.reset()}
                                className="w-full sm:w-auto"
                            >
                                Reset
                            </Button>
                            <Button
                                type="button"
                                onClick={() => formRef.current?.submit()}
                                className="w-full sm:w-auto"
                            >
                                Opslaan
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}