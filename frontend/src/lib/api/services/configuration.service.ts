import type {
    ConfigurationType,
    ComponentPrice,
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