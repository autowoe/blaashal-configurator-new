import type { Organization } from "@/lib/types/organization"
import type { PaginatedResponse } from "@/lib/types/generic"
import type { User } from "@/lib/types/user"


export type Project = {
    id: number
    name: string
    status: "draft" | "quoted" | "accepted" | "done" | "denied"
    organization: Organization
    created_by: User
    created_at: string
}
export type PaginatedProjects = PaginatedResponse<Project>