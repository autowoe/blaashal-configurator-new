import { columns } from "@/components/tables/projects/columns"
import { DataTable } from "@/components/tables/projects/data-table"
import type { PaginatedProjects } from "@/lib/types/project"
import type { PaginationState } from "@tanstack/react-table"
import { useLoaderData, useSearchParams } from "react-router"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect, useState } from "react"

export const ProjectList = () => {
    const data = useLoaderData() as PaginatedProjects
    const [searchParams, setSearchParams] = useSearchParams()

    const pageIndex = Number(searchParams.get("page") ?? "1") - 1
    const pageSize = Number(searchParams.get("page_size") ?? "10")
    const status = searchParams.getAll("status")
    const pageCount = Math.ceil(data.count / pageSize)

    const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "")
    const debouncedSearch = useDebounce(searchInput, 300)

    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams)

        if (debouncedSearch) {
            nextParams.set("search", debouncedSearch)
        } else {
            nextParams.delete("search")
        }

        nextParams.set("page", "1")
        setSearchParams(nextParams)
    }, [debouncedSearch])

    const handlePaginationChange = (nextPagination: PaginationState) => {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set("page", String(nextPagination.pageIndex + 1))
        nextParams.set("page_size", String(nextPagination.pageSize))
        setSearchParams(nextParams)
    }

    const handleStatusChange = (nextStatus: string[]) => {
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete("status")
        nextStatus.forEach((s) => nextParams.append("status", s))
        nextParams.set("page", "1")
        setSearchParams(nextParams)
    }

    return (
        <div>
            <DataTable
                columns={columns}
                data={data.results}
                pagination={{ pageIndex, pageSize }}
                pageCount={pageCount}
                status={status}
                onPaginationChange={handlePaginationChange}
                onStatusChange={handleStatusChange}
                search={searchInput}
                onSearchChange={setSearchInput}
            />
        </div>
    )
}