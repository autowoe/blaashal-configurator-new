import { useEffect, useRef, useState } from "react"
import type { ProjectImage } from "@/lib/types/project"
import { uploadProjectImage, deleteProjectImage, generateAiPreview, getAiPreviewStatus } from "@/lib/api/services/projects.service"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { RiUpload2Line, RiDeleteBinLine, RiImageLine, RiCloseLine, RiMagicLine, RiLoader4Line } from "@remixicon/react"

interface Props {
    projectId: number
    images: ProjectImage[]
    onImagesChange: (images: ProjectImage[]) => void
    selectedIndex: number | null
    onSelect: (idx: number) => void
    onClose?: () => void
    onCaptureModelScreenshot?: () => string | null
}

type GenerationState = { status: "idle" } | { status: "generating"; requestId: string } | { status: "error" }

export function ProjectGallery({ projectId, images, onImagesChange, selectedIndex, onSelect, onClose, onCaptureModelScreenshot }: Props) {
    const [uploading, setUploading] = useState(false)
    const [generation, setGeneration] = useState<GenerationState>({ status: "idle" })
    const fileInputRef = useRef<HTMLInputElement>(null)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [])

    async function handleUpload(files: FileList) {
        setUploading(true)
        try {
            const uploaded: ProjectImage[] = []
            for (const file of Array.from(files)) {
                const img = await uploadProjectImage(projectId, file)
                uploaded.push(img)
            }
            onImagesChange([...uploaded, ...images])
        } catch {
            toast("Upload mislukt", { type: "error" })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    async function handleDelete(image: ProjectImage, e: React.MouseEvent) {
        e.stopPropagation()
        try {
            await deleteProjectImage(projectId, image.id)
            const newImages = images.filter((i) => i.id !== image.id)
            onImagesChange(newImages)
        } catch {
            toast("Verwijderen mislukt", { type: "error" })
        }
    }

    async function handleGenerateAi() {
        const sourceImage = selectedIndex !== null ? images[selectedIndex] : images[0]
        if (!sourceImage) {
            toast("Upload eerst een omgevingsfoto", { type: "info" })
            return
        }

        const modelScreenshot = onCaptureModelScreenshot?.() ?? null

        try {
            setGeneration({ status: "generating", requestId: "" })
            const { request_id } = await generateAiPreview(projectId, sourceImage.id, modelScreenshot)
            setGeneration({ status: "generating", requestId: request_id })

            pollRef.current = setInterval(async () => {
                try {
                    const result = await getAiPreviewStatus(projectId, request_id)
                    if (result.status === "COMPLETED" && result.image) {
                        if (pollRef.current) clearInterval(pollRef.current)
                        setGeneration({ status: "idle" })
                        const newImages = [result.image, ...images]
                        onImagesChange(newImages)
                        onSelect(0)
                        toast("AI preview gegenereerd!", { type: "success" })
                    } else if (result.status === "FAILED") {
                        if (pollRef.current) clearInterval(pollRef.current)
                        setGeneration({ status: "error" })
                        toast("AI generatie mislukt", { type: "error" })
                    }
                } catch {
                    if (pollRef.current) clearInterval(pollRef.current)
                    setGeneration({ status: "error" })
                    toast("AI generatie mislukt", { type: "error" })
                }
            }, 3000)
        } catch {
            setGeneration({ status: "error" })
            toast("AI generatie starten mislukt", { type: "error" })
        }
    }

    const isGenerating = generation.status === "generating"

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border shrink-0">
                <p className="text-sm font-medium">
                    Foto's
                    {images.length > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">({images.length})</span>
                    )}
                </p>
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <RiUpload2Line className="h-3.5 w-3.5" />
                        {uploading ? "Uploaden..." : "Uploaden"}
                    </Button>
                    {onClose && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
                            <RiCloseLine className="h-4 w-4" />
                        </Button>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleUpload(e.target.files)}
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {images.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-muted-foreground cursor-pointer hover:bg-muted/20 transition-colors h-full"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <RiImageLine className="h-10 w-10 opacity-20" />
                        <p className="text-sm">Klik om foto's te uploaden</p>
                    </div>
                ) : (
                    <div className="p-3 grid grid-cols-2 gap-2">
                        {images.map((image, idx) => (
                            <div
                                key={image.id}
                                className={[
                                    "group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted/20 transition-all",
                                    selectedIndex === idx
                                        ? "border-primary ring-2 ring-primary ring-offset-1"
                                        : "border-border hover:border-muted-foreground/40",
                                ].join(" ")}
                                onClick={() => onSelect(idx)}
                            >
                                <img
                                    src={image.image_url}
                                    alt={image.name || `Foto ${idx + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70 text-white hover:text-white rounded-md transition-opacity"
                                    onClick={(e) => handleDelete(image, e)}
                                >
                                    <RiDeleteBinLine className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {images.length > 0 && (
                <div className="shrink-0 border-t border-border px-3 py-3">
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs gap-1.5"
                        disabled={isGenerating}
                        onClick={handleGenerateAi}
                    >
                        {isGenerating ? (
                            <>
                                <RiLoader4Line className="h-3.5 w-3.5 animate-spin" />
                                Genereren...
                            </>
                        ) : (
                            <>
                                <RiMagicLine className="h-3.5 w-3.5" />
                                AI preview genereren
                            </>
                        )}
                    </Button>
                    {isGenerating && (
                        <p className="mt-1.5 text-center text-xs text-muted-foreground">
                            Dit kan een minuut duren
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
