from django.db import models

from organizations.models import Organization

# Create your models here.
class Project(models.Model):
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    def __str__(self):
        return self.name