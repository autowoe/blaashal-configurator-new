import type { Project } from "@/lib/types/project"
import { useLoaderData } from "react-router"


export const ProjectDetail = () => {
    const project = useLoaderData() as Project

    return (
        <div>
            {project.id}
        </div>
    )
}