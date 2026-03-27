import type { LoaderFunctionArgs } from "react-router"
import type { Project } from "@/lib/types/project"
import type { ConfigurationType, ComponentPrice, ExistingConfiguration } from "@/lib/types/configuration"

export const ProjectDetailLoader = async ({ params, request }: LoaderFunctionArgs) => {
    const url = new URL(request.url)
    const configurationType = url.searchParams.get("configuration_type")

    const [projectRes, typesRes, configRes] = await Promise.all([
        fetch(`http://localhost:8000/api/projects/${params.id}`),
        fetch(`http://localhost:8000/api/configuration/types/`),
        fetch(`http://localhost:8000/api/projects/${params.id}/configurations/?is_active=true`),
    ])

    if (!projectRes.ok) throw new Response("Failed to load project", { status: projectRes.status })
    if (!typesRes.ok) throw new Response("Failed to load types", { status: typesRes.status })

    const [project, types, configData] = await Promise.all([
        projectRes.json() as Promise<Project>,
        typesRes.json() as Promise<ConfigurationType[]>,
        configRes.json(),
    ])

    const existingConfig: ExistingConfiguration | null = configData[0] ?? null

    // prefer URL param, fall back to existing config's type
    const typeToFetch = configurationType ??
        (existingConfig ? String(existingConfig.configuration_type) : null)

    let components: ComponentPrice[] = []
    if (typeToFetch) {
        const componentsRes = await fetch(
            `http://localhost:8000/api/configuration/components/?configuration_type=${typeToFetch}`
        )
        components = await componentsRes.json()
    }

    return { project, types, components, existingConfig, activeTypeId: typeToFetch }
}