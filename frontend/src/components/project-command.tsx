import { useEffect, useState, useMemo } from "react"
import { useNavigate, useRouteLoaderData } from "react-router"
import {
    CommandDialog,
    CommandInput,
    CommandItem,
    CommandList,
    CommandEmpty,
    Command,
} from "@/components/ui/command"
import { RiSearchLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type { Project } from "@/lib/types/project"
import { Badge } from "@/components/ui/badge"
import { statusConfig } from "@/components/tables/projects/status-config"
import { getProjects } from "@/lib/api/services/projects.service"

export function ProjectCommand() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Project[]>([])
    const rootData = useRouteLoaderData("root") as { projects: Project[] } | undefined
    const initialResults = useMemo(() => rootData?.projects.slice(0, 10) ?? [], [rootData])
    const navigate = useNavigate()

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const results = query ? searchResults : initialResults

    const handleSearch = async (value: string) => {
        setQuery(value)
        if (!value.trim()) {
            setSearchResults([])
            return
        }
        try {
            const data = await getProjects({ search: value, pageSize: 10 })
            setSearchResults(data.results)
        } catch {
            setSearchResults([])
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="w-full h-10">
                <RiSearchLine className="size-4" />
                Zoek projecten...
                <kbd className="ml-auto text-xs">⌘K</kbd>
            </Button>
            <CommandDialog className="w-[80vw]" open={open} onOpenChange={setOpen}>
                <Command>
                    <CommandInput
                        placeholder="Zoeken op projectnaam en organisatie"
                        value={query}
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        <CommandEmpty>Geen resultaten</CommandEmpty>
                        {results.map((project) => (
                            <CommandItem
                                key={project.id}
                                value={`${project.name}-${project.id}`}
                                className="[&_svg:last-child]:hidden"
                                onSelect={() => {
                                    navigate(`/projects/${project.id}`)
                                    setOpen(false)
                                }}
                            >
                                <div className="flex flex-row items-center justify-between w-full">
                                    <div className="flex flex-col">
                                        <span>{project.name}</span>
                                        <span className="text-xs text-primary">{project.organization.name}</span>
                                    </div>
                                    <Badge
                                        className={statusConfig[project.status].className}
                                        variant={statusConfig[project.status].variant}
                                    >
                                        {statusConfig[project.status].label}
                                    </Badge>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    )
}