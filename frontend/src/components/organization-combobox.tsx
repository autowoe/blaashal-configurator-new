import * as React from "react"
import { RiAddFill, RiArrowUpDownFill, RiCheckDoubleFill } from "@remixicon/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import type { Organization } from "@/lib/types/organization"

interface OrganizationComboboxProps {
    organizations: Organization[]
    value?: number
    onChange: (value: number) => void
    onCreate?: (name: string) => Promise<void>
}

export function OrganizationCombobox({
    organizations,
    value,
    onChange,
    onCreate,
}: OrganizationComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")
    const [isCreating, setIsCreating] = React.useState(false)

    const selected = organizations.find((org) => org.id === value)

    const filtered = organizations.filter((org) =>
        org.name.toLowerCase().includes(inputValue.toLowerCase())
    )

    const trimmedInput = inputValue.trim()

    const showCreate =
        trimmedInput.length > 0 &&
        !organizations.some(
            (org) => org.name.toLowerCase() === trimmedInput.toLowerCase()
        )

    const handleCreate = async () => {
        if (!onCreate || !trimmedInput) return

        try {
            setIsCreating(true)
            await onCreate(trimmedInput)
            setInputValue("")
            setOpen(false)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                >
                    {selected ? selected.name : "Selecteer of maak organisatie"}
                    <RiArrowUpDownFill className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                    <CommandInput
                        placeholder="Zoek organisatie..."
                        value={inputValue}
                        onValueChange={setInputValue}
                    />
                    <CommandList>
                        <CommandEmpty>Geen organisatie gevonden.</CommandEmpty>
                        <CommandGroup>
                            {filtered.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    value={org.name}
                                    onSelect={() => {
                                        onChange(org.id)
                                        setOpen(false)
                                        setInputValue("")
                                    }}
                                >
                                    <RiCheckDoubleFill
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === org.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {org.name}
                                </CommandItem>
                            ))}

                            {showCreate && (
                                <CommandItem
                                    value={trimmedInput}
                                    onSelect={handleCreate}
                                    disabled={isCreating}
                                >
                                    <RiAddFill className="mr-2 h-4 w-4" />
                                    {isCreating
                                        ? `Bezig met maken...`
                                        : `Maak "${trimmedInput}"`}
                                </CommandItem>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}