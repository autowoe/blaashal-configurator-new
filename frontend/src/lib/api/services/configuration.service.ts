import type {
    ConfigurationType,
    ComponentPrice,
    ExistingConfiguration,
} from "@/lib/types/configuration";
import { apiFetch, apiFetchJson } from "@/lib/api/client";

export async function getConfigurationTypes(): Promise<ConfigurationType[]> {
    return apiFetchJson<ConfigurationType[]>("/configuration/types/");
}

export interface GetConfigurationComponentsParams {
    configurationType?: string | number;
}

export async function getConfigurationComponents(
    params: GetConfigurationComponentsParams = {}
): Promise<ComponentPrice[]> {
    const searchParams = new URLSearchParams();

    if (params.configurationType) {
        searchParams.set("configuration_type", String(params.configurationType));
    }

    const query = searchParams.toString();

    return apiFetchJson<ComponentPrice[]>(
        `/configuration/components/${query ? `?${query}` : ""}`
    );
}

export interface CreateProjectConfigurationPayload {
    configuration_type: number
    data: {
        components: { id: number; value: boolean | number }[]
        price_snapshot: Record<
            number,
            {
                name: string
                inkoop: string
                verkoop: string
                value: boolean | number
            }
        >
    }
}

export async function createProjectConfiguration(
    projectId: number,
    payload: CreateProjectConfigurationPayload
): Promise<ExistingConfiguration> {
    return apiFetchJson<ExistingConfiguration>(
        `/projects/${projectId}/configurations/`,
        {
            method: "POST",
            body: JSON.stringify(payload),
        }
    )
}

export interface ImportComponentsResult {
    total_components: number
    total_prices: number
    errors: string[]
}

export async function downloadQuotePdf(projectId: number): Promise<void> {
    const response = await apiFetch(`/projects/${projectId}/configurations/quote-pdf/`)

    if (!response.ok) {
        throw new Error("PDF genereren mislukt")
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url

    const disposition = response.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="([^"]+)"/)
    a.download = match ? match[1] : `offerte_${projectId}.pdf`

    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}

export async function importComponents(file: File): Promise<ImportComponentsResult> {
    const formData = new FormData()
    formData.append("file", file)

    const response = await apiFetch("/configuration/import/", {
        method: "POST",
        body: formData,
    })

    const data = await response.json() as ImportComponentsResult

    if (!response.ok && response.status !== 207) {
        const detail = (data as unknown as { detail?: string }).detail ?? "Import mislukt"
        throw new Error(detail)
    }

    return data
}