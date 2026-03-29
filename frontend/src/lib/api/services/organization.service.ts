import type { Organization } from "@/lib/types/organization"
import { apiFetchJson } from "@/lib/api/client"

export interface CreateOrganizationPayload {
    name: string
}

export async function getOrganizations(): Promise<Organization[]> {
    return apiFetchJson<Organization[]>("/organizations/")
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<Organization> {
    return apiFetchJson<Organization>("/organizations/", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}