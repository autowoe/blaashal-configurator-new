import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { RiMagicLine, RiCloseLine, RiLoader4Line } from "@remixicon/react"
import type { ProjectImage } from "@/lib/types/project"

interface Point {
    x: number
    y: number
}

interface Props {
    image: ProjectImage
    isGenerating: boolean
    onConfirm: (maskDataUrl: string) => void
    onCancel: () => void
}

const HANDLE_RADIUS = 10
const HIT_RADIUS = 14

export function MaskSelector({ image, isGenerating, onConfirm, onCancel }: Props) {
    const imgRef = useRef<HTMLImageElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
    const [corners, setCorners] = useState<Point[]>([])
    const draggingIndex = useRef(-1)
    const cornersInitialized = useRef(false)

    useEffect(() => {
        const img = imgRef.current
        if (!img) return
        const update = () => {
            if (img.clientWidth > 0) setCanvasSize({ width: img.clientWidth, height: img.clientHeight })
        }
        if (img.complete) update()
        img.addEventListener("load", update)
        const observer = new ResizeObserver(update)
        observer.observe(img)
        return () => {
            img.removeEventListener("load", update)
            observer.disconnect()
        }
    }, [])

    // Initialize 4 corners once when canvas size becomes known
    useEffect(() => {
        if (canvasSize.width === 0 || cornersInitialized.current) return
        cornersInitialized.current = true
        const { width: w, height: h } = canvasSize
        setCorners([
            { x: w * 0.25, y: h * 0.25 }, // top-left
            { x: w * 0.75, y: h * 0.25 }, // top-right
            { x: w * 0.75, y: h * 0.75 }, // bottom-right
            { x: w * 0.25, y: h * 0.75 }, // bottom-left
        ])
    }, [canvasSize])

    // Redraw canvas whenever corners or size changes
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || corners.length < 4) return
        const ctx = canvas.getContext("2d")!
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.55)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Cut out the polygon so the image shows through
        ctx.globalCompositeOperation = "destination-out"
        ctx.beginPath()
        ctx.moveTo(corners[0].x, corners[0].y)
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
        ctx.closePath()
        ctx.fill()
        ctx.globalCompositeOperation = "source-over"

        // Polygon outline
        ctx.strokeStyle = "rgba(255,255,255,0.85)"
        ctx.lineWidth = 2
        ctx.setLineDash([6, 3])
        ctx.beginPath()
        ctx.moveTo(corners[0].x, corners[0].y)
        for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
        ctx.closePath()
        ctx.stroke()
        ctx.setLineDash([])

        // Corner handles
        corners.forEach((c) => {
            ctx.fillStyle = "white"
            ctx.beginPath()
            ctx.arc(c.x, c.y, HANDLE_RADIUS, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = "rgba(0,0,0,0.35)"
            ctx.lineWidth = 1.5
            ctx.stroke()
        })
    }, [corners, canvasSize])

    function getPos(e: React.MouseEvent<HTMLCanvasElement>): Point {
        const bounds = canvasRef.current!.getBoundingClientRect()
        return {
            x: Math.max(0, Math.min(e.clientX - bounds.left, canvasSize.width)),
            y: Math.max(0, Math.min(e.clientY - bounds.top, canvasSize.height)),
        }
    }

    function hitCorner(pos: Point): number {
        return corners.findIndex((c) => Math.hypot(c.x - pos.x, c.y - pos.y) < HIT_RADIUS)
    }

    function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
        if (isGenerating) return
        const idx = hitCorner(getPos(e))
        draggingIndex.current = idx
        if (idx !== -1 && canvasRef.current) canvasRef.current.style.cursor = "grabbing"
    }

    function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
        const pos = getPos(e)
        if (draggingIndex.current !== -1) {
            setCorners((prev) => prev.map((c, i) => (i === draggingIndex.current ? pos : c)))
        } else if (canvasRef.current) {
            canvasRef.current.style.cursor = hitCorner(pos) !== -1 ? "grab" : "default"
        }
    }

    function handleMouseUp() {
        draggingIndex.current = -1
        if (canvasRef.current) canvasRef.current.style.cursor = "default"
    }

    function handleConfirm() {
        if (!imgRef.current || corners.length < 4) return
        const img = imgRef.current
        const scaleX = img.naturalWidth / canvasSize.width
        const scaleY = img.naturalHeight / canvasSize.height

        const maskCanvas = document.createElement("canvas")
        maskCanvas.width = img.naturalWidth
        maskCanvas.height = img.naturalHeight
        const ctx = maskCanvas.getContext("2d")!

        // Black = keep unchanged, white = generate here (FLUX inpainting convention)
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

        ctx.fillStyle = "white"
        ctx.beginPath()
        ctx.moveTo(corners[0].x * scaleX, corners[0].y * scaleY)
        for (let i = 1; i < corners.length; i++) {
            ctx.lineTo(corners[i].x * scaleX, corners[i].y * scaleY)
        }
        ctx.closePath()
        ctx.fill()

        onConfirm(maskCanvas.toDataURL("image/png"))
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
                <div>
                    <p className="text-sm font-medium text-white">Selecteer locatie blaashal</p>
                    <p className="text-xs text-white/50 mt-0.5">
                        Sleep de 4 hoekpunten om het gebied te bepalen waar de blaashal moet komen
                    </p>
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={onCancel}
                    disabled={isGenerating}
                >
                    <RiCloseLine className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden min-h-0">
                <div className="relative inline-flex">
                    <img
                        ref={imgRef}
                        src={image.image_url}
                        alt="Omgevingsfoto"
                        className="block max-h-[calc(100vh-160px)] max-w-full object-contain select-none"
                        draggable={false}
                    />
                    {canvasSize.width > 0 && (
                        <canvas
                            ref={canvasRef}
                            width={canvasSize.width}
                            height={canvasSize.height}
                            style={{ width: canvasSize.width, height: canvasSize.height }}
                            className="absolute inset-0"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        />
                    )}
                    {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70 rounded">
                            <RiLoader4Line className="h-12 w-12 text-white animate-spin" />
                            <div className="text-center">
                                <p className="text-white font-medium text-sm">AI is bezig met genereren</p>
                                <p className="text-white/50 text-xs mt-1">Dit kan een minuut duren</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 shrink-0">
                <p className="text-xs text-white/40">
                    {isGenerating ? "Bezig met genereren..." : "Sleep de witte hoekpunten om de selectie aan te passen"}
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={onCancel}
                        disabled={isGenerating}
                    >
                        Annuleren
                    </Button>
                    <Button disabled={isGenerating || corners.length < 4} onClick={handleConfirm} className="gap-1.5">
                        {isGenerating ? (
                            <>
                                <RiLoader4Line className="h-4 w-4 animate-spin" />
                                Genereren...
                            </>
                        ) : (
                            <>
                                <RiMagicLine className="h-4 w-4" />
                                Genereren
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
