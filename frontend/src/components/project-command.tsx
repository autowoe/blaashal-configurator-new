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
import { Button } from "./ui/button"
import type { PaginatedProjects, Project } from "@/lib/types/project"
import { Badge } from "./ui/badge"

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
        const res = await fetch(
            `http://localhost:8000/api/projects?search=${encodeURIComponent(value)}`
        )
        if (!res.ok) {
            setSearchResults([])
            return
        }
        const data = (await res.json()) as PaginatedProjects
        console.log(data)
        setSearchResults(data.results)
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
                        placeholder="Zoeken..."
                        value={query}
                        onValueChange={handleSearch}
                    />
                    <CommandList>
                        <CommandEmpty>Geen resultaten</CommandEmpty>
                        {results.map((project) => (
                            <CommandItem
                                key={project.id}
                                value={project.name}
                                onSelect={() => {
                                    navigate(`/projects/${project.id}`)
                                    setOpen(false)
                                }}
                            >
                                <div className="flex flex-col">
                                    <span>{project.name}</span>
                                    <span className="text-xs text-primary">{project.organization.name}</span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    )
}