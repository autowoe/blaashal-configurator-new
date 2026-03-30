import { useLoaderData, useRevalidator } from "react-router"
import { useRef, useState } from "react"
import type { Project } from "@/lib/types/project"
import type { ConfigurationType, ComponentPrice, ExistingConfiguration } from "@/lib/types/configuration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/components/tables/projects/status-config"
import { ConfigurationForm, type ConfigurationFormRef } from "@/components/forms/configuration-form"
import { updateProject } from "@/lib/api/services/projects.service"
import { toast } from "react-toastify"
import { RiSendPlaneLine } from "@remixicon/react"
import { useSidebar } from "@/components/ui/sidebar"

const LOCKED_STATUSES = ["quoted", "accepted", "done", "denied"]

export const ProjectDetail = () => {
    const { project, types, components, existingConfig, activeTypeId } = useLoaderData() as {
        project: Project
        types: ConfigurationType[]
        components: ComponentPrice[]
        existingConfig: ExistingConfiguration | null
        activeTypeId: string | null
    }

    const { state } = useSidebar()
    const revalidator = useRevalidator()
    const formRef = useRef<ConfigurationFormRef>(null)
    const [isSendingQuote, setIsSendingQuote] = useState(false)
    const [isDirty, setIsDirty] = useState(false)

    const isLocked = (LOCKED_STATUSES as string[]).includes(project.status)
    const isDraft = project.status === "draft"
    const snapshot = existingConfig?.data.price_snapshot ?? {}
    const snapshotTotal = Object.values(snapshot).reduce((sum, item) => sum + parseFloat(item.verkoop), 0)

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
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-2xl mx-auto px-8 pt-8 pb-32 space-y-6">
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

                {isLocked ? (
                    <div className="bg-card text-card-foreground rounded-xl border border-border overflow-hidden">
                        <div className="px-5 py-4 border-b border-border flex flex-row justify-between items-center gap-2">
                            <div className="flex flex-row gap-2 items-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                    Vastgelegde prijzen
                                </span>
                            </div>
                            {existingConfig && (
                                <Badge>{existingConfig.configuration_type.name}</Badge>
                            )}
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
                            <span className="text-sm font-medium opacity-90">Totaal</span>
                            <span className="text-lg font-semibold tabular-nums">
                                € {snapshotTotal.toLocaleString("nl-NL")}
                            </span>
                        </div>
                    </div>
                ) : (
                    <ConfigurationForm
                        ref={formRef}
                        project={project}
                        types={types}
                        components={components}
                        existingConfig={existingConfig}
                        activeTypeId={activeTypeId}
                        onDirtyChange={setIsDirty}
                    />
                )}

                {/* Footer */}
                <div
                    className="fixed bottom-0 right-0 left-0 border-t border-border bg-background/80 backdrop-blur-sm px-8 py-4 transition-all duration-300"
                    style={{ left: state === "expanded" ? "var(--sidebar-width, 0px)" : "0px" }}
                >
                    <div className="max-w-2xl mx-auto flex items-center justify-between">
                        <div>
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
        </div>
    )
}