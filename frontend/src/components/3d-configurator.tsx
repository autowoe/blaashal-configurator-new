import { Canvas } from "@react-three/fiber"
import { OrbitControls, Grid, PerspectiveCamera } from "@react-three/drei"
import type { Visualization } from "@/lib/types/visualization"
import { Badge } from "./ui/badge"

type Props = {
    visualizations: Visualization[]
    selectedComponentIds: number[]
    className?: string
}

function toNumber(value: string | number | null | undefined, fallback = 0) {
    if (value === null || value === undefined) return fallback
    const parsed = typeof value === "number" ? value : parseFloat(value)
    return Number.isNaN(parsed) ? fallback : parsed
}

function degToRad(value: string | number | null | undefined) {
    return (toNumber(value, 0) * Math.PI) / 180
}

function VisualizationObject({ item }: { item: Visualization }) {
    const position: [number, number, number] = [
        toNumber(item.pos_x),
        toNumber(item.pos_y),
        toNumber(item.pos_z),
    ]

    const rotation: [number, number, number] = [
        degToRad(item.rot_x),
        degToRad(item.rot_y),
        degToRad(item.rot_z),
    ]

    const width = Math.max(toNumber(item.width, 1), 0.01)
    const height = Math.max(toNumber(item.height, 1), 0.01)
    const depth = Math.max(toNumber(item.depth, 1), 0.01)
    const color = item.color || "#cfcfcf"

    if (item.object_type === "model") {
        return (
            <mesh position={position} rotation={rotation}>
                <boxGeometry args={[width, height, depth]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>
        )
    }

    switch (item.primitive_shape) {
        case "box":
            return (
                <mesh position={position} rotation={rotation} castShadow receiveShadow>
                    <boxGeometry args={[width, height, depth]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )

        case "plane":
            return (
                <mesh position={position} rotation={rotation} receiveShadow>
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial color={color} side={2} />
                </mesh>
            )

        case "sphere": {
            const radius = Math.max(width / 2, 0.01)
            return (
                <mesh position={position} rotation={rotation} castShadow receiveShadow>
                    <sphereGeometry args={[radius, 32, 32]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )
        }

        case "cylinder": {
            const radiusTop = Math.max(width / 2, 0.01)
            const radiusBottom = Math.max(depth / 2, 0.01)
            return (
                <mesh position={position} rotation={rotation} castShadow receiveShadow>
                    <cylinderGeometry args={[radiusTop, radiusBottom, height, 32]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )
        }

        case "capsule": {
            const radius = Math.max(width / 2, 0.01)
            return (
                <mesh position={position} rotation={rotation} castShadow receiveShadow>
                    <capsuleGeometry args={[radius, Math.max(height - radius * 2, 0.01), 8, 16]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )
        }

        default:
            return (
                <mesh position={position} rotation={rotation} castShadow receiveShadow>
                    <boxGeometry args={[width, height, depth]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            )
    }
}

function Scene({ visualizations }: { visualizations: Visualization[] }) {
    return (
        <>
            <PerspectiveCamera makeDefault position={[35, 22, 35]} fov={45} />
            <ambientLight intensity={0.8} />
            <directionalLight
                position={[20, 30, 20]}
                intensity={1.2}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
            />
            <Grid
                args={[120, 120]}
                cellSize={2}
                cellThickness={0.5}
                sectionSize={10}
                sectionThickness={1}
                infiniteGrid
                fadeDistance={150}
                fadeStrength={1}
            />
            {visualizations.map((item) => (
                <VisualizationObject key={item.id} item={item} />
            ))}
            <OrbitControls enableDamping />
        </>
    )
}

export function Configuration3DPreview({
    visualizations,
    selectedComponentIds,
    className,
}: Props) {
    const visibleVisualizations = visualizations.filter(
        (item) => item.visible && selectedComponentIds.includes(item.component)
    )

    return (
        <div
            className={[
                "rounded-xl border border-border bg-card text-card-foreground overflow-hidden flex flex-col",
                "h-[260px] sm:h-[320px] lg:h-full lg:min-h-0",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5 shrink-0">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                        <span className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                            3D visualisatie
                        </span>
                    </div>
                </div>

                <Badge variant="destructive" className="shrink-0">
                    In ontwikkeling
                </Badge>
            </div>

            <div className="flex-1 min-h-0 w-full bg-muted/20">
                <Canvas shadows className="h-full w-full">
                    <Scene visualizations={visibleVisualizations} />
                </Canvas>
            </div>
        </div>
    )
}