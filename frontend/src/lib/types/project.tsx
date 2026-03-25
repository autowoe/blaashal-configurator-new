import type { Organization } from "@/lib/types/organization"

export type Project = {
    id: string
    name: string
    organization: Organization
}