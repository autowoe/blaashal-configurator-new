import type { Organization } from "@/lib/types/organization"
import type { PaginatedResponse } from "@/lib/types/generic"


export type Project = {
    id: number
    name: string
    status: "draft" | "quoted" | "accepted" | "done" | "denied"
    organization: Organization
    created_at: string
}
export type PaginatedProjects = PaginatedResponse<Project>