from django.db import models
from django.contrib.auth import get_user_model

from core.models import TimeStampedModel
from organizations.models import Organization

User = get_user_model()


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
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    def __str__(self):
        return self.name
