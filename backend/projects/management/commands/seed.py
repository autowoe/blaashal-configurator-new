from django.core.management.base import BaseCommand
from faker import Faker

from projects.models import Project
from organizations.models import Organization


class Command(BaseCommand):
    help = "Seed projects"

    def handle(self, *args, **kwargs):
        fake = Faker()

        # create some organizations first
        organizations = []
        for _ in range(5):
            org, _ = Organization.objects.get_or_create(name=fake.company())
            organizations.append(org)

        # create projects
        for _ in range(50):
            Project.objects.create(
                name=fake.bs().title(),
                organization=fake.random_element(organizations),
            )

        self.stdout.write(self.style.SUCCESS("Projects seeded successfully"))
