export type AppUpdateType = "feature" | "fix" | "improvement"

export interface AppUpdate {
    id: string
    date: string
    title: string
    description: string
    type: AppUpdateType
}

export const updates: AppUpdate[] = [
    {
        id: "2026-03-29-project-delete",
        date: "2026-03-29",
        title: "Project verwijderen toegevoegd",
        description: "Projecten kunnen nu verwijderd worden vanuit de projecttabel.",
        type: "feature",
    },
    {
        id: "2026-03-29-organization-combobox",
        date: "2026-03-29",
        title: "Organisatie combobox",
        description: "Bij het aanmaken van een project kun je nu bestaande organisaties zoeken en nieuwe direct aanmaken.",
        type: "improvement",
    },
    {
        id: "2026-03-28-configuration-snapshot",
        date: "2026-03-28",
        title: "Prijs snapshot opgeslagen",
        description: "Configuraties slaan nu een prijs snapshot op zodat prijzen later niet ongemerkt veranderen.",
        type: "feature",
    },
]