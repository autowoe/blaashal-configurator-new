import type { ReferenceImage } from "@/lib/types/reference-image"
import { apiFetch, apiFetchJson } from "@/lib/api/client"

export async function getReferenceImages(): Promise<ReferenceImage[]> {
    return apiFetchJson<ReferenceImage[]>("/reference-images/")
}

export async function uploadReferenceImage(file: File, name?: string): Promise<ReferenceImage> {
    const formData = new FormData()
    formData.append("image", file)
    if (name) formData.append("name", name)
    const response = await apiFetch("/reference-images/", { method: "POST", body: formData })
    if (!response.ok) throw new Error("Upload mislukt")
    return response.json() as Promise<ReferenceImage>
}

export async function toggleReferenceImage(id: number, is_active: boolean): Promise<ReferenceImage> {
    return apiFetchJson<ReferenceImage>(`/reference-images/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active }),
    })
}

export async function deleteReferenceImage(id: number): Promise<void> {
    await apiFetch(`/reference-images/${id}/`, { method: "DELETE" })
}
