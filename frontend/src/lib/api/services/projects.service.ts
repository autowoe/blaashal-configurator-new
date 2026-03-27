import type { PaginatedProjects } from "@/lib/types/project";
import { apiFetchJson } from "@/lib/api/client";

export interface GetProjectsParams {
    page?: number;
    pageSize?: number;
    ordering?: string;
    search?: string
}

export async function getProjects(
    params: GetProjectsParams = {}
): Promise<PaginatedProjects> {
    const searchParams = new URLSearchParams()

    if (params?.page) searchParams.set("page", String(params.page))
    if (params?.pageSize) searchParams.set("page_size", String(params.pageSize))
    if (params?.ordering) searchParams.set("ordering", params.ordering)
    if (params?.search) searchParams.set("search", params.search)

    const query = searchParams.toString()
    return apiFetchJson<PaginatedProjects>(
        `/projects/${query ? `?${query}` : ""}`
    )
}