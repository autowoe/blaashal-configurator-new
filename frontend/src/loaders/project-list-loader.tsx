import type { PaginatedProjects } from "@/lib/types/project"

export const ProjectListLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const page = url.searchParams.get("page") ?? "1"
    const pageSize = url.searchParams.get("page_size") ?? "10"
    const statuses = url.searchParams.getAll("status")
    const search = url.searchParams.get("search") ?? ""

    const params = new URLSearchParams({ page, page_size: pageSize })
    if (search) params.set("search", search)
    statuses.forEach((s) => params.append("status", s))

    const res = await fetch(`http://localhost:8000/api/projects?${params}`)
    if (!res.ok) throw new Response("Failed to load projects", { status: res.status })
    return res.json() as Promise<PaginatedProjects>
}