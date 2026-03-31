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
        <div className="h-full min-h-0 bg-background text-foreground flex flex-col overflow-hidden">
            <div className="max-w-7xl mx-auto w-full px-8 pt-8 flex flex-col flex-1 min-h-0">
                <div className="shrink-0">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                                Project configuratie
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {project.name}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{project.organization.name}</span>
                                <span className="text-border">·</span>
                                <span>{createdAt}</span>
                            </div>
                        </div>

                        <Badge
                            variant={statusConfig[project.status].variant}
                            className={statusConfig[project.status].className}
                        >
                            {statusConfig[project.status].label}
                        </Badge>
                    </div>
                </div>

                <div className="mt-6 flex-1 min-h-0">
                    {isLocked ? (
                        <div className="mx-auto w-full max-w-2xl h-full min-h-0">
                            <div className="h-full min-h-0 rounded-xl border border-border bg-card text-card-foreground overflow-hidden flex flex-col">
                                <div className="px-5 py-4 border-b border-border flex justify-between items-center gap-2 shrink-0">
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

                                <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-border">
                                    {Object.values(snapshot).map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center justify-between px-5 py-3.5"
                                        >
                                            <span className="text-sm text-foreground/90">
                                                {item.name}
                                            </span>
                                            <span className="text-sm tabular-nums font-medium">
                                                € {parseFloat(item.verkoop).toLocaleString("nl-NL")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                                    <span className="text-sm font-medium">Totaal</span>
                                    <span className="text-lg font-semibold tabular-nums">
                                        € {snapshotTotal.toLocaleString("nl-NL")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`h-full min-h-0 grid gap-6 ${showPreview
                                ? "grid-cols-1 xl:grid-cols-[minmax(0,1fr)_520px]"
                                : "grid-cols-1"
                                }`}
                        >
                            <div
                                className={
                                    showPreview
                                        ? "h-full min-h-0"
                                        : "mx-auto w-full max-w-2xl h-full min-h-0"
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
                                <div className="h-full min-h-0">
                                    <Configuration3DPreview
                                        visualizations={visualizations}
                                        selectedComponentIds={selectedComponentIds}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background px-8 py-4 mt-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex flex-row gap-5 items-center">
                        {isDraft && (
                            <Button
                                variant="outline"
                                onClick={handleSendQuote}
                                disabled={isSendingQuote || isDirty}
                                title={isDirty ? "Sla de configuratie eerst op" : undefined}
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

                    <div className="flex items-center gap-2">
                        {!isLocked && isDirty && (
                            <>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => formRef.current?.reset()}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => formRef.current?.submit()}
                                >
                                    Opslaan
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}