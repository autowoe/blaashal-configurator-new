import { getProjects } from "@/lib/api/services/projects.service";

export const ProjectListLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);

    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("page_size") ?? "10");
    const statuses = url.searchParams.getAll("status");
    const search = url.searchParams.get("search") ?? "";

    return getProjects({
        page,
        pageSize,
        search: search || undefined,
        status: statuses.length ? statuses : undefined,
    });
};