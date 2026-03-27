from django.db import models

from core.models import TimeStampedModel
from projects.models import Project


class Configuration(TimeStampedModel):
    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="price_configurations"
    )
    configuration_type = models.ForeignKey(
        "components.ConfigurationType",
        on_delete=models.PROTECT,
    )
    is_active = models.BooleanField(default=True)
    data = models.JSONField()

    @property
    def price(self):
        return 5000

    def __str__(self):
        return f"Configuration for {self.project.name}"

    class Meta:
        ordering = ["-created_at"]
