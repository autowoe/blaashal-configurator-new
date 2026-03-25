export const RootLoader = async () => {
    const res = await fetch(
        "http://localhost:8000/api/projects?page=1&page_size=10&ordering=name"
    )
    if (!res.ok) {
        throw new Response("Failed to fetch projects", { status: res.status })
    }
    const data = await res.json()
    return {
        projects: data.results
    }
}