export interface ConfigurationType {
    id: number
    name: string
}

export type InputType = "boolean" | "quantity" | "select" | "formula"

export interface Component {
    id: number
    name: string
    order: number
    input_type: InputType
    group_key: string
    unit: string
}

export interface ComponentPrice {
    id: number
    component: Component
    inkoop: string
    verkoop: string
    children: ComponentPrice[]
}

export interface PriceSnapshotItem {
    name: string
    inkoop: string
    verkoop: string
    value: boolean | number
}

export interface ConfigurationDataComponent {
    id: number
    value: boolean | number
}

export interface ExistingConfiguration {
    id: number
    configuration_type: ConfigurationType
    data: {
        components: ConfigurationDataComponent[]
        price_snapshot: Record<string, PriceSnapshotItem>
    }
}
