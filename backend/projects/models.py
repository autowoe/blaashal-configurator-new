from django.db import models

from core.models import TimeStampedModel
from organizations.models import Organization


class Status(models.TextChoices):
    DRAFT = "draft", "Concept"
    QUOTED = "quoted", "Offerte"
    DENIED = "denied", "Afgewezen"
    ACCEPTED = "accepted", "Geaccepteerd"
    DONE = "done", "Afgerond"


class Project(TimeStampedModel):
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    def __str__(self):
        return self.name
