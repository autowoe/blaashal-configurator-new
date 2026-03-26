import { useMatches } from "react-router"

interface BreadcrumbHandle {
    breadcrumb: string | ((data: unknown) => string)
}

function hasBreadcrumb(handle: unknown): handle is BreadcrumbHandle {
    return (
        typeof handle === "object" &&
        handle !== null &&
        "breadcrumb" in handle
    )
}

export function useBreadcrumbs() {
    const matches = useMatches()
    return matches
        .filter((m) => hasBreadcrumb(m.handle))
        .map((m) => ({
            ...m,
            label: typeof (m.handle as BreadcrumbHandle).breadcrumb === "function"
                ? ((m.handle as BreadcrumbHandle).breadcrumb as (data: unknown) => string)(m.data)
                : (m.handle as BreadcrumbHandle).breadcrumb as string,
        }))
}