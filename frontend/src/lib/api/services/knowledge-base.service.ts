import type { KbDocument, KbFolder, KbSession, KbSessionDetail } from "@/lib/types/knowledge-base"
import { apiFetch, apiFetchJson } from "@/lib/api/client"

// ── Folders ──────────────────────────────────────────────────────────────────

export async function getFolders(): Promise<KbFolder[]> {
    return apiFetchJson<KbFolder[]>("/kb/folders/")
}

export async function createFolder(name: string): Promise<KbFolder> {
    return apiFetchJson<KbFolder>("/kb/folders/", {
        method: "POST",
        body: JSON.stringify({ name }),
    })
}

export async function renameFolder(id: number, name: string): Promise<KbFolder> {
    return apiFetchJson<KbFolder>(`/kb/folders/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
    })
}

export async function deleteFolder(id: number): Promise<void> {
    await apiFetch(`/kb/folders/${id}/`, { method: "DELETE" })
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function getDocuments(folderId?: number): Promise<KbDocument[]> {
    const qs = folderId ? `?folder=${folderId}` : ""
    return apiFetchJson<KbDocument[]>(`/kb/documents/${qs}`)
}

export async function uploadDocument(file: File, folderId?: number): Promise<KbDocument> {
    const formData = new FormData()
    formData.append("file", file)
    if (folderId) formData.append("folder", String(folderId))
    const res = await apiFetch("/kb/documents/", { method: "POST", body: formData })
    if (!res.ok) throw new Error("Upload mislukt")
    return res.json() as Promise<KbDocument>
}

export async function deleteDocument(id: number): Promise<void> {
    await apiFetch(`/kb/documents/${id}/`, { method: "DELETE" })
}

export async function moveDocument(id: number, folderId: number | null): Promise<KbDocument> {
    return apiFetchJson<KbDocument>(`/kb/documents/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ folder: folderId }),
    })
}

export async function reindexDocument(id: number): Promise<KbDocument> {
    return apiFetchJson<KbDocument>(`/kb/documents/${id}/reindex/`, { method: "POST" })
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions(): Promise<KbSession[]> {
    return apiFetchJson<KbSession[]>("/kb/sessions/")
}

export async function getSession(id: number): Promise<KbSessionDetail> {
    return apiFetchJson<KbSessionDetail>(`/kb/sessions/${id}/`)
}

export async function createSession(): Promise<KbSession> {
    return apiFetchJson<KbSession>("/kb/sessions/", { method: "POST", body: JSON.stringify({}) })
}

export async function deleteSession(id: number): Promise<void> {
    await apiFetch(`/kb/sessions/${id}/`, { method: "DELETE" })
}

export async function sendChatMessage(
    sessionId: number,
    question: string,
): Promise<{ answer: string; sources: { doc_name: string; chunk_label: string; doc_id: number }[]; session_title: string }> {
    return apiFetchJson(`/kb/sessions/${sessionId}/chat/`, {
        method: "POST",
        body: JSON.stringify({ question }),
    })
}
