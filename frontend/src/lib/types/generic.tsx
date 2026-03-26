import type { Project } from "@/lib/types/project"

export type PaginatedResponse<T> = {
    count: number
    next: string | null
    previous: string | null
    results: T[]
}

export type Dashboard = {
    project_count: number
    accepted_count: number
    pending_count: number
    done_count: number
    recent_projects: Project[]
}