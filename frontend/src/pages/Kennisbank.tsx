import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { toast } from "react-toastify"
import type { KbDocument, KbFolder, KbMessage, KbSession, KbSessionDetail } from "@/lib/types/knowledge-base"
import {
    createFolder, createSession, deleteDocument, deleteFolder, deleteSession,
    getFolders, getDocuments, getSession, getSessions,
    moveDocument, reindexDocument, renameFolder, sendChatMessage, uploadDocument,
} from "@/lib/api/services/knowledge-base.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    RiAddLine, RiChat1Line, RiDeleteBinLine, RiFileLine, RiFolder2Line,
    RiFolderOpenLine, RiFolderUploadLine, RiLoader4Line, RiPencilLine, RiRefreshLine, RiSendPlaneLine, RiUploadLine,
} from "@remixicon/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ── helpers ──────────────────────────────────────────────────────────────────
const FILE_ICONS: Record<string, string> = {
    ".pdf": "📑", ".docx": "📄", ".doc": "📄",
    ".xlsx": "📊", ".xls": "📊", ".xlsm": "📊",
    ".pptx": "📽", ".txt": "📝", ".md": "📝",
    ".csv": "📊", ".json": "📋", ".xml": "📋",
}
const fileIcon = (ext: string) => FILE_ICONS[ext] ?? "📄"

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const STATUS_CONFIG = {
    indexed: { label: "Geïndexeerd", className: "border-green-500 text-green-600" },
    reference: { label: "Referentie", className: "border-yellow-500 text-yellow-600" },
    error: { label: "Fout", className: "border-red-500 text-red-500" },
}

type Tab = "documents" | "chat"

// ── Kennisbank page ───────────────────────────────────────────────────────────
export function Kennisbank() {
    const [tab, setTab] = useState<Tab>("documents")

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Tab switcher */}
            <div className="shrink-0 border-b border-border bg-background flex gap-1">
                <button
                    onClick={() => setTab("documents")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${tab === "documents"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Documenten
                </button>
                <button
                    onClick={() => setTab("chat")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${tab === "chat"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    Chat
                </button>
            </div>

            <div className="flex-1 min-h-0">
                {tab === "documents" ? <DocumentsTab /> : <ChatTab />}
            </div>
        </div>
    )
}

// ── Folder-recursive file reading via FileSystemEntry API ────────────────────
async function readAllEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
    const entries: FileSystemEntry[] = []
    while (true) {
        const batch = await new Promise<FileSystemEntry[]>((resolve) => {
            reader.readEntries(resolve, () => resolve([]))
        })
        if (batch.length === 0) break
        entries.push(...batch)
    }
    return entries
}

async function readEntryFiles(entry: FileSystemEntry): Promise<File[]> {
    if (entry.isFile) {
        return new Promise((resolve) => {
            (entry as FileSystemFileEntry).file(
                (file) => resolve([file]),
                () => resolve([]),
            )
        })
    }
    if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()
        const children = await readAllEntries(reader)
        const nested = await Promise.all(children.map(readEntryFiles))
        return nested.flat()
    }
    return []
}

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTS TAB
// ════════════════════════════════════════════════════════════════════════════
function DocumentsTab() {
    const [folders, setFolders] = useState<KbFolder[]>([])
    const [documents, setDocuments] = useState<KbDocument[]>([])
    const [activeFolderId, setActiveFolderId] = useState<number | "all">("all")
    const [search, setSearch] = useState("")
    const [isUploading, setIsUploading] = useState(false)
    const [newFolderOpen, setNewFolderOpen] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [editingFolderId, setEditingFolderId] = useState<number | null>(null)
    const [editingFolderName, setEditingFolderName] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement>(null)
    const dragCounterRef = useRef(0)

    useEffect(() => {
        folderInputRef.current?.setAttribute("webkitdirectory", "")
    }, [])

    const loadAll = async () => {
        const [f, d] = await Promise.all([getFolders(), getDocuments()])
        setFolders(f)
        setDocuments(d)
    }

    useEffect(() => { loadAll() }, [])

    const activeDocuments = documents
        .filter(d => activeFolderId === "all" || d.folder === activeFolderId)
        .filter(d => d.name.toLowerCase().includes(search.toLowerCase()))

    const uploadFiles = async (files: File[]) => {
        if (!files.length) return
        setIsUploading(true)
        setUploadProgress({ done: 0, total: files.length })
        let failed = 0
        try {
            for (const file of files) {
                const folderId = activeFolderId === "all" ? undefined : activeFolderId
                try {
                    await uploadDocument(file, folderId)
                } catch {
                    failed++
                }
                setUploadProgress(prev => prev ? { ...prev, done: prev.done + 1 } : null)
            }
            const succeeded = files.length - failed
            if (succeeded > 0) {
                toast(
                    `${succeeded} bestand${succeeded !== 1 ? "en" : ""} geüpload${failed > 0 ? `, ${failed} mislukt` : ""}`,
                    { type: failed > 0 ? "warning" : "success" },
                )
            } else {
                toast("Upload mislukt", { type: "error" })
            }
            await loadAll()
        } finally {
            setIsUploading(false)
            setUploadProgress(null)
        }
    }

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        e.target.value = ""
        uploadFiles(files)
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        dragCounterRef.current++
        if (dragCounterRef.current === 1) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        dragCounterRef.current--
        if (dragCounterRef.current === 0) setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        dragCounterRef.current = 0
        setIsDragging(false)
        const entries = Array.from(e.dataTransfer.items)
            .map(item => item.webkitGetAsEntry())
            .filter((entry): entry is FileSystemEntry => entry !== null)
        if (entries.length > 0) {
            const nested = await Promise.all(entries.map(readEntryFiles))
            uploadFiles(nested.flat())
        } else {
            uploadFiles(Array.from(e.dataTransfer.files))
        }
    }

    const handleDelete = async (doc: KbDocument) => {
        if (!confirm(`"${doc.name}" definitief verwijderen?`)) return
        await deleteDocument(doc.id)
        toast(`"${doc.name}" verwijderd`)
        setDocuments(prev => prev.filter(d => d.id !== doc.id))
    }

    const handleReindex = async (doc: KbDocument) => {
        const updated = await reindexDocument(doc.id)
        setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
        toast(`"${doc.name}" opnieuw geïndexeerd (${updated.chunk_count} chunks)`)
    }

    const handleMove = async (docId: number, folderId: number | null) => {
        const updated = await moveDocument(docId, folderId)
        setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d))
        await getFolders().then(setFolders)
    }

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return
        const folder = await createFolder(newFolderName.trim())
        setFolders(prev => [...prev, folder])
        setNewFolderName("")
        setNewFolderOpen(false)
    }

    const handleDeleteFolder = async (folder: KbFolder) => {
        if (!confirm(`Map "${folder.name}" verwijderen? Documenten blijven bewaard.`)) return
        await deleteFolder(folder.id)
        setFolders(prev => prev.filter(f => f.id !== folder.id))
        if (activeFolderId === folder.id) setActiveFolderId("all")
        await getDocuments().then(setDocuments)
    }

    const startEditFolder = (folder: KbFolder) => {
        setEditingFolderId(folder.id)
        setEditingFolderName(folder.name)
    }

    const commitRenameFolder = async () => {
        if (!editingFolderId) return
        const name = editingFolderName.trim()
        if (name) {
            const updated = await renameFolder(editingFolderId, name)
            setFolders(prev => prev.map(f => f.id === updated.id ? updated : f))
        }
        setEditingFolderId(null)
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Folder sidebar */}
            <div className="w-52 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mappen</span>
                    <button
                        onClick={() => setNewFolderOpen(true)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RiAddLine className="h-4 w-4" />
                    </button>
                </div>
                <button
                    onClick={() => setActiveFolderId("all")}
                    className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left w-full ${activeFolderId === "all"
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                >
                    <RiFolderOpenLine className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">Alle documenten</span>
                    <span className="text-xs text-muted-foreground">{documents.length}</span>
                </button>
                {folders.map(folder => (
                    <div key={folder.id} className={`group flex items-center transition-colors ${activeFolderId === folder.id ? "bg-muted" : "hover:bg-muted/50"}`}>
                        {editingFolderId === folder.id ? (
                            <input
                                autoFocus
                                value={editingFolderName}
                                onChange={e => setEditingFolderName(e.target.value)}
                                onBlur={commitRenameFolder}
                                onKeyDown={e => {
                                    if (e.key === "Enter") commitRenameFolder()
                                    if (e.key === "Escape") setEditingFolderId(null)
                                }}
                                className="flex-1 min-w-0 mx-2 my-1 px-2 py-1 text-sm rounded border border-border bg-background outline-none focus:border-ring"
                            />
                        ) : (
                            <button
                                onClick={() => setActiveFolderId(folder.id)}
                                className={`flex flex-1 items-center gap-2.5 pl-4 pr-2 py-2.5 text-sm transition-colors text-left min-w-0 ${activeFolderId === folder.id
                                    ? "font-medium text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <RiFolder2Line className="h-4 w-4 shrink-0" />
                                <span className="flex-1 truncate">{folder.name}</span>
                            </button>
                        )}
                        <div className="relative shrink-0 flex items-center gap-0.5 pr-2">
                            <span className="text-xs text-muted-foreground transition-opacity duration-150 group-hover:opacity-0 pointer-events-none px-1">
                                {folder.document_count}
                            </span>
                            <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <button
                                    onClick={() => startEditFolder(folder)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                >
                                    <RiPencilLine className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteFolder(folder)}
                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <RiDeleteBinLine className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main area */}
            <div
                className="flex-1 flex flex-col overflow-hidden relative"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/90 border-2 border-dashed border-primary rounded-lg pointer-events-none">
                        <RiUploadLine className="h-10 w-10 text-primary opacity-70" />
                        <p className="text-sm font-medium text-primary">
                            {activeFolderId === "all"
                                ? "Bestanden of mappen neerzetten om te uploaden"
                                : `Neerzetten in "${folders.find(f => f.id === activeFolderId)?.name}"`}
                        </p>
                    </div>
                )}
                {/* Toolbar */}
                <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-border bg-background">
                    <Input
                        placeholder="Documenten zoeken..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-8 w-56 text-sm"
                    />
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading
                            ? <RiLoader4Line className="h-4 w-4 mr-2 animate-spin" />
                            : <RiUploadLine className="h-4 w-4 mr-2" />
                        }
                        {uploadProgress
                            ? `${uploadProgress.done}/${uploadProgress.total} bestanden...`
                            : isUploading ? "Uploaden..." : "Bestand uploaden"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => folderInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        <RiFolderUploadLine className="h-4 w-4 mr-2" />
                        Map uploaden
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.xlsm,.pptx,.txt,.md,.csv,.json,.xml,.png,.jpg,.jpeg,.gif,.webp"
                        className="hidden"
                        onChange={handleUpload}
                    />
                    <input
                        ref={folderInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleUpload}
                    />
                </div>

                {/* File table */}
                <div className="flex-1 overflow-auto">
                    {activeDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                            <RiFileLine className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">
                                {search ? "Geen documenten gevonden" : "Geen documenten in deze map"}
                            </p>
                            <p className="text-xs">
                                {search ? "Pas je zoekterm aan." : "Klik op \"Bestand uploaden\" om te beginnen."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-background z-10">
                                <tr className="border-b border-border">
                                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Naam</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Map</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Grootte</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Toegevoegd</th>
                                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-3 py-2.5" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {activeDocuments.map(doc => (
                                    <DocumentRow
                                        key={doc.id}
                                        doc={doc}
                                        folders={folders}
                                        onDelete={handleDelete}
                                        onReindex={handleReindex}
                                        onMove={handleMove}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* New folder dialog */}
            <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Nieuwe map</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 pt-2">
                        <Input
                            placeholder="Naam van de map..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Annuleren</Button>
                            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Aanmaken</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function DocumentRow({
    doc, folders, onDelete, onReindex, onMove,
}: {
    doc: KbDocument
    folders: KbFolder[]
    onDelete: (doc: KbDocument) => void
    onReindex: (doc: KbDocument) => void
    onMove: (docId: number, folderId: number | null) => void
}) {
    const cfg = STATUS_CONFIG[doc.status]
    const date = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" })
        .format(new Date(doc.created_at))

    return (
        <tr className="group hover:bg-muted/30 transition-colors">
            <td className="px-5 py-3">
                <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{fileIcon(doc.file_ext)}</span>
                    <span className="font-medium text-foreground truncate max-w-xs" title={doc.name}>{doc.name}</span>
                </div>
            </td>
            <td className="px-3 py-3">
                <Select
                    value={String(doc.folder ?? "")}
                    onValueChange={val => onMove(doc.id, val ? Number(val) : null)}
                >
                    <SelectTrigger size="sm" className="text-xs text-muted-foreground h-7" onClick={e => e.stopPropagation()}>
                        <SelectValue placeholder="Geen map">
                            {doc.folder ? folders.find(f => f.id === doc.folder)?.name : undefined}
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">Geen map</SelectItem>
                        {folders.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </td>
            <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatBytes(doc.file_size)}</td>
            <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
            <td className="px-3 py-3">
                <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                    {cfg.label}{doc.status === "indexed" && doc.chunk_count > 0 ? ` · ${doc.chunk_count} chunks` : ""}
                </Badge>
            </td>
            <td className="px-3 py-3">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {doc.status === "indexed" && (
                        <button
                            onClick={() => onReindex(doc)}
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Opnieuw indexeren"
                        >
                            <RiRefreshLine className="h-3.5 w-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onDelete(doc)}
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Verwijderen"
                    >
                        <RiDeleteBinLine className="h-3.5 w-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}

// ════════════════════════════════════════════════════════════════════════════
// CHAT TAB
// ════════════════════════════════════════════════════════════════════════════
function ChatTab() {
    const [sessions, setSessions] = useState<KbSession[]>([])
    const [activeSession, setActiveSession] = useState<KbSessionDetail | null>(null)
    const [question, setQuestion] = useState("")
    const [isSending, setIsSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const loadSessions = async () => {
        const list = await getSessions()
        setSessions(list)
    }

    useEffect(() => { loadSessions() }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [activeSession?.messages])

    const handleNewSession = async () => {
        const session = await createSession()
        const detail = await getSession(session.id)
        setSessions(prev => [session, ...prev])
        setActiveSession(detail)
    }

    const handleSelectSession = async (id: number) => {
        const detail = await getSession(id)
        setActiveSession(detail)
    }

    const handleDeleteSession = async (session: KbSession) => {
        await deleteSession(session.id)
        setSessions(prev => prev.filter(s => s.id !== session.id))
        if (activeSession?.id === session.id) setActiveSession(null)
    }

    const handleSend = async () => {
        if (!question.trim() || isSending) return

        let session = activeSession
        if (!session) {
            const newS = await createSession()
            const detail = await getSession(newS.id)
            setSessions(prev => [newS, ...prev])
            session = detail
            setActiveSession(detail)
        }

        const userMsg: KbMessage = {
            id: Date.now(),
            role: "user",
            content: question,
            sources: [],
            created_at: new Date().toISOString(),
        }
        setActiveSession(prev => prev ? { ...prev, messages: [...prev.messages, userMsg] } : prev)
        setQuestion("")
        setIsSending(true)

        try {
            const result = await sendChatMessage(session.id, question)
            const assistantMsg: KbMessage = {
                id: Date.now() + 1,
                role: "assistant",
                content: result.answer,
                sources: result.sources,
                created_at: new Date().toISOString(),
            }
            setActiveSession(prev => prev ? {
                ...prev,
                title: result.session_title || prev.title,
                messages: [...prev.messages, assistantMsg],
            } : prev)
            setSessions(prev => prev.map(s =>
                s.id === session!.id ? { ...s, title: result.session_title || s.title } : s
            ))
        } catch {
            toast("Bericht versturen mislukt", { type: "error" })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className="flex h-full overflow-hidden">
            {/* Session sidebar */}
            <div className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
                <div className="shrink-0 p-3 border-b border-border">
                    <Button size="sm" className="w-full" onClick={handleNewSession}>
                        <RiAddLine className="h-4 w-4 mr-2" />
                        Nieuwe sessie
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                    {sessions.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center px-4 py-6">Nog geen sessies</p>
                    ) : sessions.map(s => (
                        <div key={s.id} className="group relative">
                            <button
                                onClick={() => handleSelectSession(s.id)}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${activeSession?.id === s.id
                                    ? "bg-muted font-medium text-foreground"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    <RiChat1Line className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" />
                                    <span className="truncate leading-snug">
                                        {s.title || "Nieuwe sessie"}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground/60 mt-0.5 pl-5">
                                    {s.message_count} berichten
                                </p>
                            </button>
                            <button
                                onClick={() => handleDeleteSession(s)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            >
                                <RiDeleteBinLine className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {!activeSession ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground px-8">
                        <RiChat1Line className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium text-foreground">Kennisbank chat</p>
                        <p className="text-sm text-center max-w-sm">
                            Stel vragen over de geüploade documenten. De AI antwoordt uitsluitend op basis van jouw kennisbank.
                        </p>
                        <Button onClick={handleNewSession}>
                            <RiAddLine className="h-4 w-4 mr-2" />
                            Nieuwe sessie starten
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
                            {activeSession.messages.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center mt-8">
                                    Stel een vraag om te beginnen.
                                </p>
                            )}
                            {activeSession.messages.map(msg => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                            {isSending && (
                                <div className="self-start max-w-prose bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground italic flex items-center gap-2">
                                    <RiLoader4Line className="h-4 w-4 animate-spin shrink-0" />
                                    Bezig met zoeken en antwoorden...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="shrink-0 border-t border-border bg-background px-4 py-3 flex gap-2">
                            <Input
                                placeholder="Stel een vraag aan de kennisbank..."
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                                disabled={isSending}
                                className="flex-1"
                            />
                            <Button onClick={handleSend} disabled={!question.trim() || isSending}>
                                <RiSendPlaneLine className="h-4 w-4" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function ChatMessage({ message }: { message: KbMessage }) {
    const isUser = message.role === "user"

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-prose rounded-xl px-4 py-3 text-sm leading-relaxed ${isUser
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-card border border-border rounded-bl-sm"
                    }`}
            >
                <div className="[&_strong]:font-semibold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-medium">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {!isUser && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground font-medium mr-1">Bronnen:</span>
                        {message.sources.map((s, i) => (
                            <span
                                key={i}
                                className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 border border-border"
                            >
                                {s.doc_name} — {s.chunk_label}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
