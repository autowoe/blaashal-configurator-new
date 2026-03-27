import { apiFetchJson } from "@/lib/api/client"
import type { Dashboard } from "@/lib/types/generic"

export const DashboardLoader = async (): Promise<Dashboard> => {
    return apiFetchJson<Dashboard>("/dashboard/")
}