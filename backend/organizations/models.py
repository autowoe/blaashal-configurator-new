from django.db import models

from core.models import TimeStampedModel


class Organization(TimeStampedModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default="")

    def __str__(self):
        return self.name
