import type {
    ConfigurationType,
    ComponentPrice,
    ExistingConfiguration,
} from "@/lib/types/configuration";
import { apiFetchJson } from "@/lib/api/client";

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
        selected_components: number[]
        price_snapshot: Record<
            number,
            {
                name: string
                inkoop: string
                verkoop: string
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