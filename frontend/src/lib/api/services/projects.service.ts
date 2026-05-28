import type { PaginatedProjects, Project, ProjectImage } from "@/lib/types/project";
import type { ExistingConfiguration } from "@/lib/types/configuration";
import { apiFetch, apiFetchJson } from "@/lib/api/client";

export interface GetProjectsParams {
    page?: number;
    pageSize?: number;
    ordering?: string;
    search?: string;
    status?: string[];
}

export interface GetProjectConfigurationsParams {
    isActive?: boolean;
}

export interface CreateProjectPayload {
    name: string
    organization: number
}

export interface UpdateProjectPayload {
    name?: string
    organization?: number
    status?: string
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

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
    return apiFetchJson<Project>("/projects/", {
        method: "POST",
        body: JSON.stringify(payload),
    })
}

export async function updateProject(projectId: string | number, payload: UpdateProjectPayload): Promise<Project> {
    return apiFetchJson<Project>(`/projects/${projectId}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    })
}

export async function deleteProject(projectId: string | number): Promise<void> {
    await apiFetchJson<void>(`/projects/${projectId}`, { method: "DELETE" });
}

export async function getProjectImages(projectId: string | number): Promise<ProjectImage[]> {
    return apiFetchJson<ProjectImage[]>(`/projects/${projectId}/images/`);
}

export async function uploadProjectImage(projectId: string | number, file: File, name?: string): Promise<ProjectImage> {
    const formData = new FormData();
    formData.append("image", file);
    if (name) formData.append("name", name);
    const response = await apiFetch(`/projects/${projectId}/images/`, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Upload mislukt");
    return response.json() as Promise<ProjectImage>;
}

export async function deleteProjectImage(projectId: string | number, imageId: number): Promise<void> {
    await apiFetch(`/projects/${projectId}/images/${imageId}/`, { method: "DELETE" });
}

export async function generateAiPreview(
    projectId: string | number,
    environmentImageId: number,
    modelScreenshot?: string | null,
): Promise<{ request_id: string }> {
    return apiFetchJson(`/projects/${projectId}/generate-preview/`, {
        method: "POST",
        body: JSON.stringify({
            environment_image_id: environmentImageId,
            model_screenshot: modelScreenshot ?? null,
        }),
    });
}

export async function getAiPreviewStatus(
    projectId: string | number,
    requestId: string,
): Promise<{ status: string; image?: ProjectImage }> {
    return apiFetchJson(`/projects/${projectId}/preview-status/${requestId}/`);
}