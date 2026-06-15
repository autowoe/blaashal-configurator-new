import { getReferenceImages } from "@/lib/api/services/reference-images.service"
import type { ReferenceImage } from "@/lib/types/reference-image"

export async function ReferenceImagesLoader(): Promise<ReferenceImage[]> {
    return getReferenceImages()
}
