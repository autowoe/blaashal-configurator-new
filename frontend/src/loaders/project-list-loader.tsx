import type { PaginatedProjects } from "@/lib/types/project"

export const ProjectListLoader = async () => {
    const res = await fetch("http://localhost:8000/api/projects")
    if (!res.ok) throw new Response("Failed to load projects", { status: res.status })
    return res.json() as Promise<PaginatedProjects>
}
