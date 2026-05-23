import { useLoaderData, useRevalidator } from "react-router"
import { useState, useMemo } from "react"
import type { Organization } from "@/lib/types/organization"
import { deleteOrganization } from "@/lib/api/services/organization.service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { RiAddLine, RiPencilLine, RiDeleteBinLine } from "@remixicon/react"
import { toast } from "react-toastify"
import { EditOrganizationDialog } from "@/components/edit-organization-dialog"
import { CreateOrganizationDialog } from "@/components/create-organization-dialog"

export const OrganizationList = () => {
    const organizations = useLoaderData() as Organization[]
    const revalidator = useRevalidator()

    const [search, setSearch] = useState("")
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
    const [showCreate, setShowCreate] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const filtered = useMemo(() => {
        if (!search.trim()) return organizations
        const q = search.toLowerCase()
        return organizations.filter(
            (o) => o.name.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q)
        )
    }, [organizations, search])

    const handleDelete = async (org: Organization) => {
        if (!confirm(`Weet je zeker dat je "${org.name}" wilt verwijderen?`)) return
        try {
            setDeletingId(org.id)
            await deleteOrganization(org.id)
            toast("Organisatie verwijderd", { type: "success" })
            revalidator.revalidate()
        } catch {
            toast("Verwijderen mislukt", { type: "error" })
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <Input
                    className="w-48"
                    placeholder="Zoeken..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Button onClick={() => setShowCreate(true)}>
                    <RiAddLine className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Nieuwe organisatie</span>
                </Button>
            </div>

            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Naam</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead className="w-px pr-4 text-right">Acties</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    Geen organisaties gevonden.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {org.email || <span className="italic text-muted-foreground/60">Niet ingesteld</span>}
                                    </TableCell>
                                    <TableCell className="w-px pr-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => setEditingOrg(org)}
                                            >
                                                <RiPencilLine className="h-4 w-4" />
                                                <span className="sr-only">Bewerken</span>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => handleDelete(org)}
                                                disabled={deletingId === org.id}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <RiDeleteBinLine className="h-4 w-4" />
                                                <span className="sr-only">Verwijderen</span>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <EditOrganizationDialog
                organization={editingOrg}
                open={!!editingOrg}
                onOpenChange={(open) => { if (!open) setEditingOrg(null) }}
                onSuccess={() => {
                    setEditingOrg(null)
                    revalidator.revalidate()
                }}
            />

            <CreateOrganizationDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onSuccess={() => {
                    setShowCreate(false)
                    revalidator.revalidate()
                }}
            />
        </div>
    )
}
