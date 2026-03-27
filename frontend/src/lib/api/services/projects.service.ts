import type { PaginatedProjects, Project } from "@/lib/types/project";
import type { ExistingConfiguration } from "@/lib/types/configuration";
import { apiFetchJson } from "@/lib/api/client";

export interface GetProjectsParams {
    page?: number;
    pageSize?: number;
    ordering?: string;
    search?: string;
    status?: string[];
}

export async function getProjects(
    params: GetProjectsParams = {}
): Promise<PaginatedProjects> {
    const searchParams = new URLSearchParams();

    if (params.page) searchParams.set("page", String(params.page));
    if (params.pageSize) searchParams.set("page_size", String(params.pageSize));
    if (params.ordering) searchParams.set("ordering", params.ordering);
    if (params.search) searchParams.set("search", params.search);
    params.status?.forEach((s) => searchParams.append("status", s));

    const query = searchParams.toString();

    return apiFetchJson<PaginatedProjects>(
        `/projects/${query ? `?${query}` : ""}`
    );
}

export async function getProject(projectId: string | number): Promise<Project> {
    return apiFetchJson<Project>(`/projects/${projectId}`);
}

export interface GetProjectConfigurationsParams {
    isActive?: boolean;
}

export async function getProjectConfigurations(
    projectId: string | number,
    params: GetProjectConfigurationsParams = {}
): Promise<ExistingConfiguration[]> {
    const searchParams = new URLSearchParams();

    if (params.isActive !== undefined) {
        searchParams.set("is_active", String(params.isActive));
    }

    const query = searchParams.toString();

    return apiFetchJson<ExistingConfiguration[]>(
        `/projects/${projectId}/configurations/${query ? `?${query}` : ""}`
    );
}