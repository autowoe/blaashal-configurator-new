import { useRef, useState } from "react"
import { RiUploadLine } from "@remixicon/react"
import { toast } from "react-toastify"
import { useRouteLoaderData } from "react-router"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { importComponents } from "@/lib/api/services/configuration.service"
import type { RootLoaderData } from "@/loaders/root-loader"

export function ImportComponentsDialog() {
    const { me } = useRouteLoaderData("root") as RootLoaderData
    const [open, setOpen] = useState(false)

    if (!me?.is_staff) return null
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    function handleClose(isOpen: boolean) {
        if (!isOpen) {
            setFile(null)
        }
        setOpen(isOpen)
    }

    async function handleSubmit() {
        if (!file) return
        setLoading(true)
        try {
            const result = await importComponents(file)
            if (result.errors.length > 0) {
                toast.warning(
                    `Import voltooid met ${result.errors.length} fout(en). ` +
                    `${result.total_components} componenten, ${result.total_prices} prijsregels verwerkt.`
                )
            } else {
                toast.success(
                    `Import geslaagd: ${result.total_components} nieuwe componenten, ` +
                    `${result.total_prices} prijsregels verwerkt.`
                )
            }
            setOpen(false)
            setFile(null)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Import mislukt")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger render={<Button variant="outline" />}>
                <RiUploadLine className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Componenten importeren</span>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Componenten importeren</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                        Upload een Excel-bestand (.xlsx). Elke sheet wordt verwerkt als één configuratietype.
                    </p>
                    <div
                        className="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => inputRef.current?.click()}
                    >
                        <RiUploadLine className="h-8 w-8 text-muted-foreground" />
                        {file ? (
                            <span className="text-sm font-medium">{file.name}</span>
                        ) : (
                            <span className="text-sm text-muted-foreground">Klik om een .xlsx bestand te selecteren</span>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                            Annuleren
                        </Button>
                        <Button onClick={handleSubmit} disabled={!file || loading}>
                            {loading ? "Importeren..." : "Importeren"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
