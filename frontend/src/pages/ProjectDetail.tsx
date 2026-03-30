import { useLoaderData } from "react-router"
import type { Project } from "@/lib/types/project"
import type { ConfigurationType, ComponentPrice, ExistingConfiguration } from "@/lib/types/configuration"
import { Badge } from "@/components/ui/badge"
import { statusConfig } from "@/components/tables/projects/status-config"
import { ConfigurationForm } from "@/components/forms/configuration-form"

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
                        project={project}
                        types={types}
                        components={components}
                        existingConfig={existingConfig}
                        activeTypeId={activeTypeId}
                    />
                )}
            </div>
        </div>
    )
}