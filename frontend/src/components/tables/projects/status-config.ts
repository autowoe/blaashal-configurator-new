export const statusConfig = {
    draft: { label: "Concept", variant: "outline", className: "text-muted-foreground" },
    quoted: { label: "Offerte", variant: "outline", className: "border-yellow-500 text-yellow-500" },
    accepted: { label: "Geaccepteerd", variant: "outline", className: "border-green-500 text-green-500" },
    done: { label: "Afgerond", variant: "outline", className: "border-blue-500 text-blue-500" },
    denied: { label: "Afgewezen", variant: "outline", className: "border-red-500 text-red-500" },
} as const