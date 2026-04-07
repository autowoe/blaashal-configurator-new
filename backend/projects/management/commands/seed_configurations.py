from django.core.management.base import BaseCommand

from components.models import ConfigurationType, Component, ComponentPrice
from visualization.models import (
    ComponentVisualization,
    SceneObjectType,
    PrimitiveShape,
)

CONFIGURATION_DATA = {
    "Tennis - 2 Baans": {
        "RVS kabelnet": {"inkoop": 8492, "verkoop": 12313},
        "Halhuid en deuren": {"inkoop": 46551, "verkoop": 67499},
        "Verankering": {"inkoop": 21843, "verkoop": 31672},
        "Ventilatorunit incl. behuizing": {"inkoop": 48937, "verkoop": 70958},
        "Isolatie": {"inkoop": 4789, "verkoop": 6944},
        "UV beschermfolie": {"inkoop": 887, "verkoop": 1286},
        "Verlichting": {"inkoop": 21575, "verkoop": 31283},
    },
    "Tennis - 3 Baans": {
        "RVS kabelnet": {"inkoop": 19188, "verkoop": 27823},
        "Halhuid en deuren": {"inkoop": 55948, "verkoop": 81125},
        "Verankering": {"inkoop": 26427, "verkoop": 38319},
        "Ventilatorunit incl. behuizing": {"inkoop": 52236, "verkoop": 75742},
        "Isolatie": {"inkoop": 5175, "verkoop": 7503},
        "UV beschermfolie": {"inkoop": 1109, "verkoop": 1608},
        "Verlichting": {"inkoop": 27983, "verkoop": 40575},
    },
    "Tennis - 4 Baans": {
        "RVS kabelnet": {"inkoop": 27773, "verkoop": 40271},
        "Halhuid en deuren": {"inkoop": 74972, "verkoop": 108710},
        "Verankering": {"inkoop": 27323, "verkoop": 39618},
        "Ventilatorunit incl. behuizing": {"inkoop": 51295, "verkoop": 74378},
        "Isolatie": {"inkoop": 6580, "verkoop": 9541},
        "UV beschermfolie": {"inkoop": 1426, "verkoop": 2067},
        "Verlichting": {"inkoop": 35341, "verkoop": 51245},
    },
}


VISUALIZATION_DATA = {
    "Tennis - 2 Baans": {
        "Halhuid en deuren": [
            {
                "name": "Main hall",
                "object_key": "main-hall",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 0,
                "pos_x": 0,
                "pos_y": 4,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 18,
                "height": 8,
                "depth": 36,
                "color": "#d9d9d9",
            },
            {
                "name": "Front door",
                "object_key": "front-door",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 1,
                "pos_x": 0,
                "pos_y": 1.5,
                "pos_z": 18.1,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 0.2,
                "color": "#666666",
            },
        ],
        "Ventilatorunit incl. behuizing": [
            {
                "name": "Ventilation unit",
                "object_key": "ventilation-unit",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 2,
                "pos_x": 6,
                "pos_y": 1.5,
                "pos_z": 16,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 2,
                "color": "#999999",
            }
        ],
        "Verlichting": [
            {
                "name": "Lighting rig left",
                "object_key": "lighting-left",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 3,
                "pos_x": -4,
                "pos_y": 6,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
            {
                "name": "Lighting rig right",
                "object_key": "lighting-right",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 4,
                "pos_x": 4,
                "pos_y": 6,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
        ],
    },
    "Tennis - 3 Baans": {
        "Halhuid en deuren": [
            {
                "name": "Main hall",
                "object_key": "main-hall",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 0,
                "pos_x": 0,
                "pos_y": 4.5,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 24,
                "height": 9,
                "depth": 48,
                "color": "#d9d9d9",
            },
            {
                "name": "Front door",
                "object_key": "front-door",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 1,
                "pos_x": 0,
                "pos_y": 1.5,
                "pos_z": 24.1,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 0.2,
                "color": "#666666",
            },
        ],
        "Ventilatorunit incl. behuizing": [
            {
                "name": "Ventilation unit",
                "object_key": "ventilation-unit",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 2,
                "pos_x": 8,
                "pos_y": 1.5,
                "pos_z": 22,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 2,
                "color": "#999999",
            }
        ],
        "Verlichting": [
            {
                "name": "Lighting rig left",
                "object_key": "lighting-left",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 3,
                "pos_x": -6,
                "pos_y": 7,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
            {
                "name": "Lighting rig right",
                "object_key": "lighting-right",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 4,
                "pos_x": 6,
                "pos_y": 7,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
        ],
    },
    "Tennis - 4 Baans": {
        "Halhuid en deuren": [
            {
                "name": "Main hall",
                "object_key": "main-hall",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 0,
                "pos_x": 0,
                "pos_y": 5,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 30,
                "height": 10,
                "depth": 60,
                "color": "#d9d9d9",
            },
            {
                "name": "Front door",
                "object_key": "front-door",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 1,
                "pos_x": 0,
                "pos_y": 1.5,
                "pos_z": 30.1,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 0.2,
                "color": "#666666",
            },
        ],
        "Ventilatorunit incl. behuizing": [
            {
                "name": "Ventilation unit",
                "object_key": "ventilation-unit",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.BOX,
                "visible": True,
                "order": 2,
                "pos_x": 10,
                "pos_y": 1.5,
                "pos_z": 28,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 2,
                "height": 3,
                "depth": 2,
                "color": "#999999",
            }
        ],
        "Verlichting": [
            {
                "name": "Lighting rig left",
                "object_key": "lighting-left",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 3,
                "pos_x": -8,
                "pos_y": 8,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
            {
                "name": "Lighting rig right",
                "object_key": "lighting-right",
                "object_type": SceneObjectType.PRIMITIVE,
                "primitive_shape": PrimitiveShape.SPHERE,
                "visible": True,
                "order": 4,
                "pos_x": 8,
                "pos_y": 8,
                "pos_z": 0,
                "rot_x": 0,
                "rot_y": 0,
                "rot_z": 0,
                "width": 0.5,
                "height": 0.5,
                "depth": 0.5,
                "color": "#fff4cc",
            },
        ],
    },
}


class Command(BaseCommand):
    help = "Seed component configuration types, prices, and visualization placeholders"

    def handle(self, *args, **kwargs):
        self.seed_components()
        self.seed_prices()
        self.seed_visualizations()
        self.stdout.write(
            self.style.SUCCESS("Component and visualization data seeded successfully")
        )

    def seed_components(self):
        first_config = next(iter(CONFIGURATION_DATA.values()))

        for order, component_name in enumerate(first_config):
            Component.objects.get_or_create(
                name=component_name,
                defaults={"order": order},
            )

    def seed_prices(self):
        for type_name, components in CONFIGURATION_DATA.items():
            config_type, _ = ConfigurationType.objects.get_or_create(name=type_name)

            for component_name, prices in components.items():
                component = Component.objects.get(name=component_name)

                ComponentPrice.objects.get_or_create(
                    configuration_type=config_type,
                    component=component,
                    defaults={
                        "inkoop": prices["inkoop"],
                        "verkoop": prices["verkoop"],
                    },
                )

    def seed_visualizations(self):
        for type_name, component_visuals in VISUALIZATION_DATA.items():
            config_type = ConfigurationType.objects.get(name=type_name)

            for component_name, visuals in component_visuals.items():
                component = Component.objects.get(name=component_name)

                for visual in visuals:
                    ComponentVisualization.objects.get_or_create(
                        component=component,
                        configuration_type=config_type,
                        object_key=visual["object_key"],
                        defaults={
                            "name": visual["name"],
                            "object_type": visual["object_type"],
                            "primitive_shape": visual["primitive_shape"],
                            "visible": visual["visible"],
                            "order": visual["order"],
                            "pos_x": visual["pos_x"],
                            "pos_y": visual["pos_y"],
                            "pos_z": visual["pos_z"],
                            "rot_x": visual["rot_x"],
                            "rot_y": visual["rot_y"],
                            "rot_z": visual["rot_z"],
                            "width": visual["width"],
                            "height": visual["height"],
                            "depth": visual["depth"],
                            "color": visual["color"],
                        },
                    )
