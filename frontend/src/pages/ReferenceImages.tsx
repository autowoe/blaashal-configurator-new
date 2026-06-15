import { useLoaderData, useRevalidator } from "react-router"
import { useRef, useState } from "react"
import type { ReferenceImage } from "@/lib/types/reference-image"
import { uploadReferenceImage, deleteReferenceImage, toggleReferenceImage } from "@/lib/api/services/reference-images.service"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { RiUpload2Line, RiDeleteBinLine, RiImageLine, RiCheckLine } from "@remixicon/react"

export const ReferenceImages = () => {
    const images = useLoaderData() as ReferenceImage[]
    const revalidator = useRevalidator()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const activeCount = images.filter((i) => i.is_active).length

    async function handleUpload(files: FileList) {
        setUploading(true)
        try {
            for (const file of Array.from(files)) {
                await uploadReferenceImage(file)
            }
            revalidator.revalidate()
        } catch {
            toast("Upload mislukt", { type: "error" })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    async function handleToggle(image: ReferenceImage) {
        try {
            setTogglingId(image.id)
            await toggleReferenceImage(image.id, !image.is_active)
            revalidator.revalidate()
        } catch {
            toast("Wijziging mislukt", { type: "error" })
        } finally {
            setTogglingId(null)
        }
    }

    async function handleDelete(image: ReferenceImage) {
        if (!confirm(`Weet je zeker dat je "${image.name || "deze afbeelding"}" wilt verwijderen?`)) return
        try {
            setDeletingId(image.id)
            await deleteReferenceImage(image.id)
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
                <div>
                    <h1 className="text-lg font-semibold">Referentie afbeeldingen</h1>
                    <p className="text-sm text-muted-foreground">
                        Afbeeldingen van blaashallen die de AI gebruikt als stijlreferentie.
                        {images.length > 0 && (
                            <span className={activeCount > 10 ? " text-amber-500" : ""}>
                                {" "}{activeCount} actief{activeCount > 10 ? ` (max 10 worden gebruikt)` : ""}.
                            </span>
                        )}
                    </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <RiUpload2Line className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{uploading ? "Uploaden..." : "Uploaden"}</span>
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                />
            </div>

            {images.length === 0 ? (
                <div
                    className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-24 text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <RiImageLine className="h-12 w-12 opacity-20" />
                    <p className="text-sm">Klik om referentie afbeeldingen te uploaden</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {images.map((image) => (
                        <div
                            key={image.id}
                            className={[
                                "group relative aspect-square overflow-hidden rounded-lg border bg-muted/20 transition-all",
                                image.is_active
                                    ? "border-primary ring-2 ring-primary ring-offset-1"
                                    : "border-border opacity-50",
                            ].join(" ")}
                        >
                            <img
                                src={image.image_url}
                                alt={image.name || `Referentie ${image.id}`}
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                            {image.is_active && (
                                <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-primary/80 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground leading-none">
                                    <RiCheckLine className="h-2.5 w-2.5" />
                                    Actief
                                </span>
                            )}

                            {image.name && !image.is_active && (
                                <span className="absolute bottom-1 left-1 right-8 truncate rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white leading-none">
                                    {image.name}
                                </span>
                            )}

                            <div className="absolute top-1 right-1 flex gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    title={image.is_active ? "Deactiveren" : "Activeren"}
                                    className={[
                                        "h-6 w-6 p-0 rounded-md transition-opacity",
                                        image.is_active
                                            ? "opacity-0 group-hover:opacity-100 bg-primary/80 hover:bg-primary text-primary-foreground hover:text-primary-foreground"
                                            : "opacity-100 bg-black/40 hover:bg-black/60 text-white hover:text-white",
                                    ].join(" ")}
                                    disabled={togglingId === image.id}
                                    onClick={() => handleToggle(image)}
                                >
                                    <RiCheckLine className="h-3 w-3" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-red-600/80 text-white hover:text-white rounded-md transition-opacity"
                                    disabled={deletingId === image.id}
                                    onClick={() => handleDelete(image)}
                                >
                                    <RiDeleteBinLine className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
