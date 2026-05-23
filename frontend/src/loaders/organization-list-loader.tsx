import { getOrganizations } from "@/lib/api/services/organization.service"
import type { Organization } from "@/lib/types/organization"

export async function OrganizationListLoader(): Promise<Organization[]> {
    return getOrganizations()
}
