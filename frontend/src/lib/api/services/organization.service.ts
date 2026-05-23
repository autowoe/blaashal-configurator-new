import type { Organization } from "@/lib/types/organization"
import { apiFetchJson, apiFetch } from "@/lib/api/client"

export interface CreateOrganizationPayload {
    name: string
    email?: string
}

export interface UpdateOrganizationPayload {
    name?: string
    email?: string
}

export async function getOrganizations(search?: string): Promise<Organization[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : ""
    return apiFetchJson<Organization[]>(`/organizations/${params}`)
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<Organization> {
    return apiFetchJson<Organization>("/organizations/", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateOrganization(id: number, payload: UpdateOrganizationPayload): Promise<Organization> {
    return apiFetchJson<Organization>(`/organizations/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    })
}

export async function deleteOrganization(id: number): Promise<void> {
    const response = await apiFetch(`/organizations/${id}/`, { method: "DELETE" })
    if (!response.ok) throw new Response("Verwijderen mislukt", { status: response.status })
}