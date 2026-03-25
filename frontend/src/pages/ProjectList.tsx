import { columns } from "@/components/tables/projects/columns"
import { DataTable } from "@/components/tables/projects/data-table"
import type { Project } from "@/lib/types/project"
import { useLoaderData } from "react-router"

export const ProjectListLoader = async () => {
    const res = await fetch("http://localhost:8000/api/projects")
    if (!res.ok) throw new Response("Failed to load projects", { status: res.status })
    return res.json() as Promise<Project[]>
}

export const ProjectList = () => {
    const projects = useLoaderData()
    console.log(projects)

    return (
        <div>
            <DataTable columns={columns} data={projects} />
        </div>
    )
}