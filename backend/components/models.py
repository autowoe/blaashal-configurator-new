from django.db import models

from core.models import TimeStampedModel


class ConfigurationType(TimeStampedModel):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class Component(TimeStampedModel):
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)


class ComponentPrice(TimeStampedModel):
    configuration_type = models.ForeignKey(ConfigurationType, on_delete=models.CASCADE)
    component = models.ForeignKey(Component, on_delete=models.CASCADE)
    inkoop = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    verkoop = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    def __str__(self):
        return f"{self.configuration_type.name} - {self.component.name}"

    class Meta:
        unique_together = ("configuration_type", "component")
