import os

from django.core.management.base import BaseCommand, CommandError

from components.importer import run_import


class Command(BaseCommand):
    help = "Importeer componenten en prijzen vanuit een Excel-bestand. Elke sheet = één configuratietype."

    def add_arguments(self, parser):
        parser.add_argument("file", type=str, help="Pad naar het Excel-bestand (.xlsx)")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Voer een droge run uit zonder wijzigingen op te slaan",
        )

    def handle(self, *args, **options):
        filepath = options["file"]
        dry_run = options["dry_run"]

        if not os.path.exists(filepath):
            raise CommandError(f"Bestand niet gevonden: {filepath}")

        result = run_import(filepath, dry_run=dry_run)

        for line in result["log"]:
            self.stdout.write(line)

        if result["errors"]:
            self.stdout.write(self.style.ERROR("\nFouten tijdens import:"))
            for error in result["errors"]:
                self.stdout.write(self.style.ERROR(f"  - {error}"))

        prefix = "[DRY-RUN] " if dry_run else ""
        self.stdout.write(
            self.style.SUCCESS(
                f"\n{prefix}Import voltooid: {result['total_components']} nieuwe componenten, "
                f"{result['total_prices']} prijsregels verwerkt."
            )
        )
