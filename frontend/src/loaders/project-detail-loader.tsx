import type { LoaderFunctionArgs } from "react-router";
import {
    getProject,
    getProjectConfigurations,
} from "@/lib/api/services/projects.service";
import {
    getConfigurationTypes,
    getConfigurationComponents,
} from "@/lib/api/services/configuration.service";

export const ProjectDetailLoader = async ({ params, request }: LoaderFunctionArgs) => {
    const projectId = params.id;
    if (!projectId) {
        throw new Response("Project id is required", { status: 400 });
    }

    const url = new URL(request.url);
    const configurationType = url.searchParams.get("configuration_type");

    const [project, types, configData] = await Promise.all([
        getProject(projectId),
        getConfigurationTypes(),
        getProjectConfigurations(projectId, { isActive: true }),
    ]);

    const existingConfig = configData[0] ?? null;

    const typeToFetch =
        configurationType ??
        (existingConfig ? String(existingConfig.configuration_type) : null);

    const components = typeToFetch
        ? await getConfigurationComponents({ configurationType: typeToFetch })
        : [];

    return {
        project,
        types,
        components,
        existingConfig,
        activeTypeId: typeToFetch,
    };
};