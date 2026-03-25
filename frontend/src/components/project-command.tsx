import { useEffect, useMemo, useState } from "react"
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

type Project = { id: string; name: string }

export function ProjectCommand() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const rootData = useRouteLoaderData("root") as
        | { projects: Project[] }
        | undefined

    const initialResults = useMemo(
        () => rootData?.projects.slice(0, 10) ?? [],
        [rootData]
    )

    const [results, setResults] = useState<Project[]>(initialResults)
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

    useEffect(() => {
        if (!query) {
            setResults(initialResults)
        }
    }, [query, initialResults])

    const handleSearch = async (value: string) => {
        setQuery(value)

        if (!value.trim()) {
            setResults(initialResults)
            return
        }

        const res = await fetch(
            `http://localhost:8000/api/projects?search=${encodeURIComponent(value)}`
        )

        if (!res.ok) {
            setResults([])
            return
        }

        const data = (await res.json()) as Project[]
        setResults(data.slice(0, 10))
    }

    return (
        <>
            <Button
                onClick={() => setOpen(true)}
                className="w-full h-10"
            >
                <RiSearchLine className="size-4" />
                Zoek projecten...
                <kbd className="ml-auto text-xs">⌘K</kbd>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
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
                                {project.name}
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </CommandDialog>
        </>
    )
}