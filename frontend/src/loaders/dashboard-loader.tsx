import type { Dashboard } from "@/lib/types/generic"

export const DashboardLoader = async () => {
    const res = await fetch(`http://localhost:8000/api/dashboard/`)
    if (!res.ok) throw new Response("Failed to load dashboard", { status: res.status })
    return res.json() as Promise<Dashboard>
}