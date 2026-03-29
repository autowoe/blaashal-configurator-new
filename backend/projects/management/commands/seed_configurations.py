from django.core.management.base import BaseCommand
from components.models import ConfigurationType, Component, ComponentPrice

CONFIGURATION_DATA = {
    "2b tennis": {
        "RVS kabelnet": {"inkoop": 8492, "verkoop": 12313},
        "Halhuid en deuren": {"inkoop": 46551, "verkoop": 67499},
        "Verankering": {"inkoop": 21843, "verkoop": 31672},
        "Ventilatorunit incl. behuizing": {"inkoop": 48937, "verkoop": 70958},
        "Isolatie": {"inkoop": 4789, "verkoop": 6944},
        "UV beschermfolie": {"inkoop": 887, "verkoop": 1286},
        "Verlichting": {"inkoop": 21575, "verkoop": 31283},
    },
    "3b tennis": {
        "RVS kabelnet": {"inkoop": 19188, "verkoop": 27823},
        "Halhuid en deuren": {"inkoop": 55948, "verkoop": 81125},
        "Verankering": {"inkoop": 26427, "verkoop": 38319},
        "Ventilatorunit incl. behuizing": {"inkoop": 52236, "verkoop": 75742},
        "Isolatie": {"inkoop": 5175, "verkoop": 7503},
        "UV beschermfolie": {"inkoop": 1109, "verkoop": 1608},
        "Verlichting": {"inkoop": 27983, "verkoop": 40575},
    },
    "4b tennis": {
        "RVS kabelnet": {"inkoop": 27773, "verkoop": 40271},
        "Halhuid en deuren": {"inkoop": 74972, "verkoop": 108710},
        "Verankering": {"inkoop": 27323, "verkoop": 39618},
        "Ventilatorunit incl. behuizing": {"inkoop": 51295, "verkoop": 74378},
        "Isolatie": {"inkoop": 6580, "verkoop": 9541},
        "UV beschermfolie": {"inkoop": 1426, "verkoop": 2067},
        "Verlichting": {"inkoop": 35341, "verkoop": 51245},
    },
}


class Command(BaseCommand):
    help = "Seed component configuration types and prices"

    def handle(self, *args, **kwargs):
        for order, component_name in enumerate(next(iter(CONFIGURATION_DATA.values()))):
            Component.objects.get_or_create(
                name=component_name, defaults={"order": order}
            )

        for type_name, components in CONFIGURATION_DATA.items():
            config_type, _ = ConfigurationType.objects.get_or_create(name=type_name)
            for component_name, prices in components.items():
                component = Component.objects.get(name=component_name)
                ComponentPrice.objects.get_or_create(
                    configuration_type=config_type,
                    component=component,
                    defaults={"inkoop": prices["inkoop"], "verkoop": prices["verkoop"]},
                )

        self.stdout.write(self.style.SUCCESS("Component data seeded successfully"))
