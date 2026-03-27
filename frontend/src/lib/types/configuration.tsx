export interface ConfigurationType {
    id: number
    name: string
}

export interface Component {
    id: number
    name: string
    order: number
}

export interface ComponentPrice {
    id: number
    component: Component
    inkoop: string
    verkoop: string
}

export interface PriceSnapshotItem {
    name: string
    inkoop: string
    verkoop: string
}

export interface ExistingConfiguration {
    id: number
    configuration_type: number
    data: {
        selected_components: number[]
        price_snapshot: Record<string, PriceSnapshotItem>
    }
}