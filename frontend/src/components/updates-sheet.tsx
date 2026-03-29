import * as React from "react"
import { RiMegaphoneFill } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { updates, type AppUpdate } from "@/lib/updates"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"

const LAST_SEEN_UPDATE_KEY = "app:last-seen-update-id"

function getLatestUpdateId(): string | null {
    return updates[0]?.id ?? null
}

function getStoredLastSeenUpdateId(): string | null {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(LAST_SEEN_UPDATE_KEY)
}

function setStoredLastSeenUpdateId(updateId: string) {
    if (typeof window === "undefined") return
    window.localStorage.setItem(LAST_SEEN_UPDATE_KEY, updateId)
}

function isUpdateNew(update: AppUpdate, lastSeenId: string | null): boolean {
    if (!lastSeenId) return true

    const lastSeenIndex = updates.findIndex((item) => item.id === lastSeenId)
    const currentIndex = updates.findIndex((item) => item.id === update.id)

    if (lastSeenIndex === -1) return true
    return currentIndex !== -1 && currentIndex < lastSeenIndex
}

function getUpdateTypeLabel(type: AppUpdate["type"]) {
    switch (type) {
        case "feature":
            return "Feature"
        case "fix":
            return "Fix"
        case "improvement":
            return "Verbetering"
        default:
            return type
    }
}

function groupUpdatesByDate(items: AppUpdate[]) {
    return items.reduce<Record<string, AppUpdate[]>>((acc, update) => {
        if (!acc[update.date]) acc[update.date] = []
        acc[update.date].push(update)
        return acc
    }, {})
}

function formatDate(date: string) {
    return new Intl.DateTimeFormat("nl-NL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(date))
}

function getBadgeClass(type: "feature" | "fix" | "improvement") {
    switch (type) {
        case "feature":
            return "bg-blue-500/10 text-blue-300 border-blue-500/20"
        case "improvement":
            return "bg-green-500/10 text-green-300 border-green-500/20"
        case "fix":
            return "bg-amber-500/10 text-amber-300 border-amber-500/20"
        default:
            return ""
    }
}

export function UpdatesSheet() {
    const [open, setOpen] = React.useState(false)
    const [lastSeenId, setLastSeenId] = React.useState<string | null>(null)

    React.useEffect(() => {
        setLastSeenId(getStoredLastSeenUpdateId())
    }, [])

    const latestUpdateId = getLatestUpdateId()
    const hasNewUpdates =
        latestUpdateId !== null && latestUpdateId !== lastSeenId

    React.useEffect(() => {
        if (!open || !latestUpdateId) return

        setStoredLastSeenUpdateId(latestUpdateId)
        setLastSeenId(latestUpdateId)
    }, [open, latestUpdateId])

    const groupedUpdates = groupUpdatesByDate(updates)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger>
                <Button variant="outline" size="icon" className="relative">
                    <RiMegaphoneFill className="h-4 w-4" />
                    <span className="sr-only">Open updates</span>

                    {hasNewUpdates && (
                        <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent className="sm:max-w-md p-4">
                <SheetHeader className="p-0 pt-4">
                    <SheetTitle>Updates</SheetTitle>
                    <SheetDescription>
                        Recente wijzigingen en verbeteringen in de applicatie.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="mt-6 h-[calc(100vh-8rem)] pr-4">
                    <div className="space-y-6">
                        {Object.entries(groupedUpdates).map(([date, items]) => (
                            <section key={date} className="space-y-3">
                                <div className="sticky top-0 z-10 py-1 backdrop-blur">
                                    <p className="text-xs font-medium uppercase tracking-wider">
                                        {formatDate(date)}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {items.map((update) => {
                                        const isNew = isUpdateNew(update, lastSeenId)

                                        return (
                                            <Card
                                                key={update.id}
                                            >
                                                <CardHeader className="flex flex-row justify-between">
                                                    <CardTitle>
                                                        {update.title}
                                                    </CardTitle>
                                                    <Badge
                                                        variant="outline"
                                                        className={getBadgeClass(update.type)}
                                                    >
                                                        {getUpdateTypeLabel(update.type)}
                                                    </Badge>
                                                </CardHeader>
                                                <CardContent>
                                                    {isNew && (
                                                        <Badge
                                                            className={cn(
                                                                "border-transparent bg-red-500 text-white hover:bg-red-500"
                                                            )}
                                                        >
                                                            Nieuw
                                                        </Badge>
                                                    )}
                                                    <CardDescription className="text-sm text-muted-foreground">
                                                        {update.description}
                                                    </CardDescription>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}