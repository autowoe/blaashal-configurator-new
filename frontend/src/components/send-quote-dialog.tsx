import { useState, useRef, type KeyboardEvent } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RiSendPlaneLine, RiCloseLine, RiMailLine } from "@remixicon/react"
import { sendQuote } from "@/lib/api/services/configuration.service"
import { toast } from "react-toastify"
import type { Project } from "@/lib/types/project"

interface SendQuoteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    project: Project
    onSuccess: () => void
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function SendQuoteDialog({ open, onOpenChange, project, onSuccess }: SendQuoteDialogProps) {
    const orgEmail = project.organization.email ?? ""

    const [extraEmails, setExtraEmails] = useState<string[]>([])
    const [inputValue, setInputValue] = useState("")
    const [inputError, setInputError] = useState("")
    const [isSending, setIsSending] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const allEmails = orgEmail
        ? [orgEmail, ...extraEmails]
        : extraEmails

    function addEmail() {
        const trimmed = inputValue.trim()
        if (!trimmed) return
        if (!isValidEmail(trimmed)) {
            setInputError("Ongeldig e-mailadres")
            return
        }
        if (allEmails.includes(trimmed)) {
            setInputError("Dit adres staat er al bij")
            return
        }
        setExtraEmails((prev) => [...prev, trimmed])
        setInputValue("")
        setInputError("")
    }

    function removeExtra(email: string) {
        setExtraEmails((prev) => prev.filter((e) => e !== email))
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault()
            addEmail()
        }
        if (e.key === "Backspace" && inputValue === "" && extraEmails.length > 0) {
            setExtraEmails((prev) => prev.slice(0, -1))
        }
    }

    async function handleSend() {
        // Commit any typed-but-not-yet-added address
        const trimmed = inputValue.trim()
        let finalExtras = extraEmails
        if (trimmed) {
            if (!isValidEmail(trimmed)) {
                setInputError("Ongeldig e-mailadres")
                return
            }
            finalExtras = [...extraEmails, trimmed]
        }

        const recipients = orgEmail ? [orgEmail, ...finalExtras] : finalExtras
        if (recipients.length === 0) {
            setInputError("Voeg minimaal één e-mailadres toe")
            return
        }

        try {
            setIsSending(true)
            await sendQuote(project.id, recipients)
            toast("Offerte verstuurd", { type: "success" })
            onOpenChange(false)
            onSuccess()
        } catch {
            toast("Versturen mislukt", { type: "error" })
        } finally {
            setIsSending(false)
        }
    }

    function handleOpenChange(next: boolean) {
        if (!next) {
            setExtraEmails([])
            setInputValue("")
            setInputError("")
        }
        onOpenChange(next)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Offerte versturen</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        De offerte voor <span className="font-medium text-foreground">{project.name}</span> wordt
                        als PDF bijlage verstuurd naar de onderstaande ontvangers.
                    </p>

                    {/* Recipients */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium tracking-wider uppercase text-muted-foreground">
                            Ontvangers
                        </p>

                        <div
                            className="min-h-[44px] flex flex-wrap gap-1.5 rounded-lg border border-input bg-background px-3 py-2 cursor-text"
                            onClick={() => inputRef.current?.focus()}
                        >
                            {/* Organisation email — fixed, not removable */}
                            {orgEmail ? (
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                                    <RiMailLine className="h-3 w-3 shrink-0 text-muted-foreground" />
                                    {orgEmail}
                                </span>
                            ) : null}

                            {/* Extra emails — removable */}
                            {extraEmails.map((email) => (
                                <span
                                    key={email}
                                    className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                                >
                                    {email}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeExtra(email) }}
                                        className="ml-0.5 rounded hover:text-primary/70"
                                        aria-label={`Verwijder ${email}`}
                                    >
                                        <RiCloseLine className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}

                            <input
                                ref={inputRef}
                                type="email"
                                value={inputValue}
                                onChange={(e) => { setInputValue(e.target.value); setInputError("") }}
                                onKeyDown={handleKeyDown}
                                onBlur={addEmail}
                                placeholder={allEmails.length === 0 ? "Voeg e-mailadres toe..." : ""}
                                className="min-w-[160px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        {inputError && (
                            <p className="text-xs text-destructive">{inputError}</p>
                        )}

                        {!orgEmail && (
                            <p className="text-xs text-muted-foreground">
                                Geen e-mailadres ingesteld voor{" "}
                                <span className="font-medium">{project.organization.name}</span>.
                                Voeg er handmatig een toe of stel het in via de organisatie-instellingen.
                            </p>
                        )}

                        <p className="text-xs text-muted-foreground">
                            Druk op <kbd className="rounded border px-1 font-mono text-[10px]">Enter</kbd> of{" "}
                            <kbd className="rounded border px-1 font-mono text-[10px]">,</kbd> om een adres toe te voegen.
                        </p>
                    </div>
                </div>

                <DialogFooter showCloseButton>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || allEmails.length === 0}
                    >
                        <RiSendPlaneLine className="h-4 w-4 mr-2" />
                        {isSending ? "Versturen..." : "Verstuur offerte"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
