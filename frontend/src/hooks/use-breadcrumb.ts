import { useMatches } from "react-router"

export function useBreadcrumbs() {
    const matches = useMatches()
    return matches.filter((m) => (m.handle as any)?.breadcrumb)
}