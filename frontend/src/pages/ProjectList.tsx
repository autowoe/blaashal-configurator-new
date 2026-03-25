import { columns } from "@/components/tables/projects/columns"
import { DataTable } from "@/components/tables/projects/data-table"
import type { PaginatedResponse } from "@/lib/types/generic"
import type { Project } from "@/lib/types/project"
import { useLoaderData } from "react-router"

export const ProjectList = () => {
    const data = useLoaderData() as PaginatedResponse<Project>

    return (
        <div>
            <DataTable
                columns={columns}
                data={data.results}
            />
        </div>
    )
}