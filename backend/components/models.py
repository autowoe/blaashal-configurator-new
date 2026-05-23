from django.db import models

from core.models import TimeStampedModel


class ConfigurationType(TimeStampedModel):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Component(TimeStampedModel):
    INPUT_TYPE_BOOLEAN = "boolean"
    INPUT_TYPE_QUANTITY = "quantity"
    INPUT_TYPE_SELECT = "select"
    INPUT_TYPE_FORMULA = "formula"

    INPUT_TYPE_CHOICES = [
        (INPUT_TYPE_BOOLEAN, "Boolean"),
        (INPUT_TYPE_QUANTITY, "Quantity"),
        (INPUT_TYPE_SELECT, "Select"),
        (INPUT_TYPE_FORMULA, "Formula"),
    ]

    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    input_type = models.CharField(
        max_length=20, choices=INPUT_TYPE_CHOICES, default=INPUT_TYPE_BOOLEAN
    )
    group_key = models.CharField(max_length=50, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="children",
    )

    def __str__(self):
        return self.name


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
