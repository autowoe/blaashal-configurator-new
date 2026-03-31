import { apiFetchJson } from "@/lib/api/client"
import type { Visualization } from "@/lib/types/visualization"

export async function getVisualizations(configurationTypeId?: number): Promise<Visualization[]> {
    const query = configurationTypeId
        ? `?configuration_type=${configurationTypeId}`
        : ""

    return apiFetchJson<Visualization[]>(`/visualizations/${query}`)
}