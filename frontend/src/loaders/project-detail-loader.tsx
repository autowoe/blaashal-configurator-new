import type { LoaderFunctionArgs } from "react-router"
import type { Project } from "@/lib/types/project"

export const ProjectDetailLoader = async ({ params }: LoaderFunctionArgs) => {
    const res = await fetch(`http://localhost:8000/api/projects/${params.id}`)
    if (!res.ok) throw new Response("Failed to load project", { status: res.status })
    return res.json() as Promise<Project>
}