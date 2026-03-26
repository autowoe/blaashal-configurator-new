import { columns } from "@/components/tables/projects/columns"
import { DataTable } from "@/components/tables/projects/data-table"
import { useLoaderData, useSearchParams } from "react-router"
import type { PaginatedProjects } from "@/lib/types/project"

export const ProjectList = () => {
    const data = useLoaderData() as PaginatedProjects
    const [searchParams, setSearchParams] = useSearchParams()

    const pageIndex = Number(searchParams.get("page") ?? "1") - 1
    const pageSize = Number(searchParams.get("page_size") ?? "10")
    const pageCount = Math.ceil(data.count / pageSize)

    return (
        <div>
            <DataTable
                columns={columns}
                data={data.results}
                pagination={{ pageIndex, pageSize }}
                pageCount={pageCount}
                onPaginationChange={(nextPagination) => {
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.set("page", String(nextPagination.pageIndex + 1))
                    nextParams.set("page_size", String(nextPagination.pageSize))
                    setSearchParams(nextParams)
                }}
            />
        </div>
    )
}