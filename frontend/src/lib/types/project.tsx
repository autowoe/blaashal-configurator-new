import type { Organization } from "@/lib/types/organization"
import type { PaginatedResponse } from "@/lib/types/generic"


export type Project = {
    id: string
    name: string
    organization: Organization
}
export type PaginatedProjects = PaginatedResponse<Project>