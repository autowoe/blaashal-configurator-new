import { getProjects } from "@/lib/api/services/projects.service";

export interface RootLoaderData {
    projects: Awaited<ReturnType<typeof getProjects>>["results"];
}

export async function RootLoader(): Promise<RootLoaderData> {
    const data = await getProjects({
        page: 1,
        pageSize: 10,
        ordering: "name",
    });

    return {
        projects: data.results,
    };
}