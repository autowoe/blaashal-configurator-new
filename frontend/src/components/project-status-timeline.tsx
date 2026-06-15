import type { ProjectStatusEvent } from "@/lib/types/project"
import { statusConfig } from "@/components/tables/projects/status-config"
import { RiArrowRightLine } from "@remixicon/react"

interface ProjectStatusTimelineProps {
    events: ProjectStatusEvent[]
}

export function ProjectStatusTimeline({ events }: ProjectStatusTimelineProps) {
    if (events.length === 0) {
        return <p className="text-sm text-muted-foreground px-5 py-4">Geen geschiedenis beschikbaar.</p>
    }

    return (
        <div className="flex flex-col">
            {events.map((event, index) => {
                const toConfig = statusConfig[event.to_status]
                const isLast = index === events.length - 1
                const date = new Intl.DateTimeFormat("nl-NL", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                }).format(new Date(event.created_at))

                const userName = event.changed_by
                    ? event.changed_by.first_name && event.changed_by.last_name
                        ? `${event.changed_by.first_name} ${event.changed_by.last_name}`
                        : event.changed_by.username
                    : null

                return (
                    <div key={event.id} className="flex gap-4 px-5 py-4">
                        <div className="flex flex-col items-center">
                            <div className={`mt-0.5 h-2.5 w-2.5 rounded-full border-2 shrink-0 ${toConfig.className}`} />
                            {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
                        </div>
                        <div className={`pb-4 ${isLast ? "" : ""}`}>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                {event.from_status ? (
                                    <>
                                        <span className="text-sm text-muted-foreground">{event.from_status_display}</span>
                                        <RiArrowRightLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className={`text-sm font-medium ${toConfig.className}`}>{event.to_status_display}</span>
                                    </>
                                ) : (
                                    <span className={`text-sm font-medium ${toConfig.className}`}>Project aangemaakt als {event.to_status_display}</span>
                                )}
                            </div>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {date}{userName ? ` · ${userName}` : ""}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
