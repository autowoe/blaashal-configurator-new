import { useLoaderData, useRevalidator } from "react-router"
import { useRef, useState } from "react"
import type { Project, ProjectImage, ProjectStatusEvent } from "@/lib/types/project"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type {
    ConfigurationType,
    ComponentPrice,
    ExistingConfiguration,
} from "@/lib/types/configuration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { statusConfig } from "@/components/tables/projects/status-config"
import {
    ConfigurationForm,
    type ConfigurationFormRef,
} from "@/components/forms/configuration-form"
import { downloadQuotePdf } from "@/lib/api/services/configuration.service"
import { toast } from "react-toastify"
import { RiFilePdf2Line, RiImageLine, RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine, RiTimeLine } from "@remixicon/react"
import { SendQuoteDialog } from "@/components/send-quote-dialog"
import type { Visualization } from "@/lib/types/visualization"
import { Configuration3DPreview, type Configuration3DPreviewRef } from "@/components/3d-configurator"
import { ProjectGallery } from "@/components/project-gallery"
import { Switch } from "@/components/ui/switch"
import { ProjectStatusTimeline } from "@/components/project-status-timeline"

const LOCKED_STATUSES = ["quoted", "accepted", "done", "denied"]

const GALLERY_WIDTH = "383px"

export const ProjectDetail = () => {
    const { project, types, components, visualizations, existingConfig, activeTypeId, projectImages, statusHistory } =
        useLoaderData() as {
            project: Project
            types: ConfigurationType[]
            components: ComponentPrice[]
            visualizations: Visualization[]
            existingConfig: ExistingConfiguration | null
            activeTypeId: string | null
            projectImages: ProjectImage[]
            statusHistory: ProjectStatusEvent[]
        }

    const revalidator = useRevalidator()
    const formRef = useRef<ConfigurationFormRef>(null)
    const previewRef = useRef<Configuration3DPreviewRef>(null)

    const [showPreview, setShowPreview] = useState(false)
    const [showGallery, setShowGallery] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
    const [showSendDialog, setShowSendDialog] = useState(false)
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [selectedComponentIds, setSelectedComponentIds] = useState<number[]>(
        existingConfig?.data.components?.map((c) => c.id) ?? []
    )
    const [images, setImages] = useState<ProjectImage[]>(projectImages)

    const isLocked = LOCKED_STATUSES.includes(project.status)
    const isDraft = project.status === "draft"

    const snapshot = existingConfig?.data.price_snapshot ?? {}
    const snapshotTotal = Object.values(snapshot).reduce((sum, item) => {
        const qty = typeof item.value === "number" ? item.value : 1
        return sum + parseFloat(item.verkoop) * qty
    }, 0)

    const createdAt = new Intl.DateTimeFormat("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(project.created_at))

    function handleCloseGallery() {
        setShowGallery(false)
        setSelectedImageIndex(null)
    }

    function goPrevImage() {
        if (selectedImageIndex === null || images.length === 0) return
        setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)
    }

    function goNextImage() {
        if (selectedImageIndex === null || images.length === 0) return
        setSelectedImageIndex((selectedImageIndex + 1) % images.length)
    }

    const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null

    const handleQuoteSent = () => {
        revalidator.revalidate()
    }

    const handleDownloadPdf = async () => {
        try {
            setIsDownloadingPdf(true)
            await downloadQuotePdf(project.id)
        } catch {
            toast("PDF downloaden mislukt", { type: "error" })
        } finally {
            setIsDownloadingPdf(false)
        }
    }

    return (
        <div className="h-full bg-background text-foreground flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full lg:h-full lg:min-h-0">
                    <div className="flex flex-col gap-6 lg:h-full lg:min-h-0">
                        <div className="shrink-0">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-2">
                                    <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                                        Project configuratie
                                    </p>
                                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                        {project.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                                        <span>{project.organization.name}</span>
                                        <span className="hidden sm:inline text-border">·</span>
                                        <span>{createdAt}</span>
                                    </div>
                                    <div className="pt-1 sm:hidden">
                                        <Badge
                                            variant={statusConfig[project.status].variant}
                                            className={statusConfig[project.status].className}
                                        >
                                            {statusConfig[project.status].label}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <Badge
                                        variant={statusConfig[project.status].variant}
                                        className={statusConfig[project.status].className}
                                    >
                                        {statusConfig[project.status].label}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="lg:flex-1 lg:min-h-0">
                            {isLocked ? (
                                <div className="mx-auto w-full max-w-2xl lg:h-full lg:min-h-0">
                                    <div className="rounded-xl border border-border bg-card text-card-foreground overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-col">
                                        <div className="px-4 py-4 sm:px-5 border-b border-border shrink-0 flex flex-wrap items-center justify-between gap-2">
                                            <div className="flex gap-2 items-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                                <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                                                    Vastgelegde prijzen
                                                </span>
                                            </div>
                                            {existingConfig && (
                                                <Badge>{existingConfig.configuration_type.name}</Badge>
                                            )}
                                        </div>
                                        <div className="divide-y divide-border lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                                            {Object.values(snapshot).map((item) => (
                                                <div
                                                    key={item.name}
                                                    className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"
                                                >
                                                    <span className="min-w-0 text-sm text-foreground/90">{item.name}</span>
                                                    <span className="shrink-0 text-sm tabular-nums font-medium">
                                                        € {parseFloat(item.verkoop).toLocaleString("nl-NL")}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="px-4 py-4 sm:px-5 border-t border-border bg-muted/30 flex items-center justify-between shrink-0">
                                            <span className="text-sm font-medium">Totaal</span>
                                            <span className="text-lg font-semibold tabular-nums">
                                                € {snapshotTotal.toLocaleString("nl-NL")}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`grid gap-6 lg:h-full lg:min-h-0 ${showPreview
                                        ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] xl:grid-cols-[minmax(0,1fr)_800px] 2xl:grid-cols-[minmax(0,1fr)_1000px]"
                                        : "grid-cols-1"
                                        }`}
                                >
                                    <div className={showPreview ? "min-w-0 lg:h-[full] lg:min-h-0" : "mx-auto w-full max-w-2xl min-w-0 lg:h-full lg:min-h-0"}>
                                        <ConfigurationForm
                                            ref={formRef}
                                            project={project}
                                            types={types}
                                            components={components}
                                            existingConfig={existingConfig}
                                            activeTypeId={activeTypeId}
                                            onDirtyChange={setIsDirty}
                                            onSelectedComponentsChange={setSelectedComponentIds}
                                        />
                                    </div>
                                    {showPreview && (
                                        <div className="min-w-0 lg:h-full lg:min-h-0">
                                            <Configuration3DPreview
                                                ref={previewRef}
                                                visualizations={visualizations}
                                                selectedComponentIds={selectedComponentIds}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-4 sm:h-6 lg:hidden" />
                    </div>
                </div>
            </div>

            <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur pt-4 sticky bottom-0 mt-3">
                <div className="mx-auto max-w-7xl flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                        {isDraft && (
                            <Button
                                variant="outline"
                                onClick={() => setShowSendDialog(true)}
                                disabled={isDirty}
                                title={isDirty ? "Sla de configuratie eerst op" : undefined}
                                className="w-full sm:w-auto"
                            >
                                Verstuur offerte
                            </Button>
                        )}

                        {existingConfig && (
                            <Button
                                variant="outline"
                                onClick={handleDownloadPdf}
                                disabled={isDownloadingPdf}
                                className="w-full sm:w-auto"
                            >
                                <RiFilePdf2Line className="h-4 w-4 mr-2" />
                                {isDownloadingPdf ? "Bezig..." : "Download PDF"}
                            </Button>
                        )}

                        <Button
                            variant={showGallery ? "default" : "outline"}
                            onClick={() => showGallery ? handleCloseGallery() : setShowGallery(true)}
                            className="w-full sm:w-auto"
                        >
                            <RiImageLine className="h-4 w-4 mr-2" />
                            Foto's{images.length > 0 ? ` (${images.length})` : ""}
                        </Button>

                        <Button
                            variant={showHistory ? "default" : "outline"}
                            onClick={() => setShowHistory(true)}
                            className="w-full sm:w-auto"
                        >
                            <RiTimeLine className="h-4 w-4 mr-2" />
                            Historie
                        </Button>

                        {!isLocked && (
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="preview-toggle"
                                    checked={showPreview}
                                    onCheckedChange={setShowPreview}
                                />
                                <label htmlFor="preview-toggle" className="text-sm font-medium leading-none">
                                    Preview tonen
                                </label>
                            </div>
                        )}
                    </div>

                    {!isLocked && isDirty && (
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => formRef.current?.reset()}
                                className="w-full sm:w-auto"
                            >
                                Reset
                            </Button>
                            <Button
                                type="button"
                                onClick={() => formRef.current?.submit()}
                                className="w-full sm:w-auto"
                            >
                                Opslaan
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Sheet open={showHistory} onOpenChange={setShowHistory}>
                <SheetContent side="right" className="w-full sm:max-w-[400px] p-0 flex flex-col">
                    <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
                        <SheetTitle>Statusgeschiedenis</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto">
                        <ProjectStatusTimeline events={statusHistory} />
                    </div>
                </SheetContent>
            </Sheet>

            <SendQuoteDialog
                open={showSendDialog}
                onOpenChange={setShowSendDialog}
                project={project}
                onSuccess={handleQuoteSent}
            />

            <Sheet open={showGallery} onOpenChange={(open) => { if (!open) handleCloseGallery() }}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-[448px] p-0 flex flex-col"
                    showCloseButton={false}
                    showOverlay={false}
                >
                    <ProjectGallery
                        projectId={project.id}
                        images={images}
                        onImagesChange={setImages}
                        selectedIndex={selectedImageIndex}
                        onSelect={setSelectedImageIndex}
                        onClose={handleCloseGallery}
                    />
                </SheetContent>
            </Sheet>

            {showGallery && selectedImage && (
                <div
                    className="fixed inset-y-0 left-0 hidden sm:flex items-center justify-center bg-background/95 backdrop-blur-sm z-40"
                    style={{ right: GALLERY_WIDTH }}
                >
                    <div className="relative w-full h-full flex items-center justify-center p-10">
                        <img
                            src={selectedImage.image_url}
                            alt={selectedImage.name || "Foto"}
                            className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                        />

                        <button
                            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                            onClick={() => setSelectedImageIndex(null)}
                            aria-label="Sluiten"
                        >
                            <RiCloseLine className="h-4 w-4" />
                        </button>

                        {images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                                    onClick={goPrevImage}
                                    aria-label="Vorige"
                                >
                                    <RiArrowLeftSLine className="h-6 w-6" />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                                    onClick={goNextImage}
                                    aria-label="Volgende"
                                >
                                    <RiArrowRightSLine className="h-6 w-6" />
                                </button>
                                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground/10 px-3 py-1 text-xs text-foreground/60 tabular-nums">
                                    {(selectedImageIndex ?? 0) + 1} / {images.length}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
