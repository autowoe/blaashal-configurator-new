import type { User } from "@/lib/types/user"

export type KbFolder = {
    id: number
    name: string
    document_count: number
    created_at: string
}

export type KbDocument = {
    id: number
    name: string
    description: string
    folder: number | null
    folder_name: string | null
    file_url: string | null
    file_ext: string
    file_size: number
    status: "indexed" | "reference" | "error"
    error_message: string
    chunk_count: number
    uploaded_by: User | null
    created_at: string
}

export type KbMessageSource = {
    doc_name: string
    chunk_label: string
    doc_id: number
}

export type KbMessage = {
    id: number
    role: "user" | "assistant"
    content: string
    sources: KbMessageSource[]
    created_at: string
}

export type KbSession = {
    id: number
    title: string
    created_by: User | null
    message_count: number
    created_at: string
}

export type KbSessionDetail = KbSession & {
    messages: KbMessage[]
}
