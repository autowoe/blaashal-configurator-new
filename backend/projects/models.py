from django.db import models

from core.models import TimeStampedModel
from organizations.models import Organization


class Project(TimeStampedModel):
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
