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
        id: "2026-03-31-3d-configurator",
        date: "2026-03-31",
        title: "3D Visualisatie (in ontwikkeling)",
        description: "Een eerste versie van de 3D configurator is beschikbaar als preview. De visualisatie toont een 3D-weergave van de installatie op basis van de geselecteerde componenten. De preview is nog in ontwikkeling.",
        type: "feature",
    },
    {
        id: "2026-03-30-offerte-versturen",
        date: "2026-03-30",
        title: "Offerte versturen",
        description: "Vanuit een project kan nu een offerte verstuurd worden. De configuratieprijzen worden hierbij vastgelegd.",
        type: "feature",
    },
    {
        id: "2026-03-30-project-edit",
        date: "2026-03-30",
        title: "Projecten bewerken",
        description: "Projecten kunnen nu bewerkt worden vanuit de projecttabel. Naam, organisatie en status zijn aanpasbaar.",
        type: "feature",
    },
    {
        id: "2026-03-30-configuration-type-label",
        date: "2026-03-30",
        title: "Configuratietype zichtbaar bij vastgelegde prijzen",
        description: "Het type installatie wordt nu getoond bij vastgelegde configuraties.",
        type: "improvement",
    },
    {
        id: "2026-03-30-configuration-dirty",
        date: "2026-03-30",
        title: "Opslaan knop verborgen zonder wijzigingen",
        description: "De opslaan en reset knoppen in de configuratie zijn nu alleen zichtbaar wanneer er onopgeslagen wijzigingen zijn.",
        type: "improvement",
    },
    {
        id: "2026-03-29-project-delete",
        date: "2026-03-29",
        title: "Projecten verwijderen",
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