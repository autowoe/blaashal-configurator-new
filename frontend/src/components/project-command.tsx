import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import {
    CommandDialog,
    CommandInput,
    CommandItem,
    CommandList,
    CommandEmpty,
    Command,
} from "@/components/ui/command"
import { RiSearchLine } from "@remixicon/react"

export function ProjectCommand() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<{ id: string; name: string }[]>([])
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
        const fetchInitial = async () => {
            const res = await fetch(`http://localhost:8000/api/projects`)
            const data = await res.json()
            setResults(data.slice(0, 10))
        }

        fetchInitial()
    }, [])

    const handleSearch = async (value: string) => {
        setQuery(value)
        if (!value) {
            setResults([])
            return
        }

        const res = await fetch(
            `http://localhost:8000/api/projects?search=${value}`
        )
        const data = await res.json()
        setResults(data.slice(0, 10))
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"
            >
                <RiSearchLine className="size-4" />
                Zoeken...
                <kbd className="ml-auto text-xs">⌘K</kbd>
            </button>

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