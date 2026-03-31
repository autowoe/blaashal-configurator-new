export interface Visualization {
    id: number
    component: number
    configuration_type: number | null
    name: string
    object_key: string
    object_type: "primitive" | "model"
    primitive_shape: "box" | "plane" | "sphere" | "cylinder" | "capsule" | null
    model_key: string | null
    visible: boolean
    order: number
    pos_x: string
    pos_y: string
    pos_z: string
    rot_x: string
    rot_y: string
    rot_z: string
    width: string
    height: string
    depth: string
    color: string | null
    created_at: string
    updated_at: string
}