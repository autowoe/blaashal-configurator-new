import type { PaginatedProjects } from "@/lib/types/project"

export const ProjectListLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get("page") ?? "1"
    const pageSize = url.searchParams.get("page_size") ?? "10"

    const res = await fetch(`http://localhost:8000/api/projects?page=${page}&page_size=${pageSize}`)
    if (!res.ok) throw new Response("Failed to load projects", { status: res.status })
    return res.json() as Promise<PaginatedProjects>
}