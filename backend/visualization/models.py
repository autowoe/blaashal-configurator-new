from django.db import models

from core.models import TimeStampedModel
from components.models import Component
from components.models import ConfigurationType


class SceneObjectType(models.TextChoices):
    PRIMITIVE = "primitive", "Primitive"
    MODEL = "model", "3D Model"


class PrimitiveShape(models.TextChoices):
    BOX = "box", "Box"
    PLANE = "plane", "Plane"
    SPHERE = "sphere", "Sphere"
    CYLINDER = "cylinder", "Cylinder"
    CAPSULE = "capsule", "Capsule"


class ComponentVisualization(TimeStampedModel):
    component = models.ForeignKey(
        Component,
        on_delete=models.CASCADE,
        related_name="visualizations",
    )
    configuration_type = models.ForeignKey(
        ConfigurationType,
        on_delete=models.CASCADE,
        related_name="visualizations",
        null=True,
        blank=True,
        help_text="Leave empty if this visualization applies to all configuration types.",
    )

    name = models.CharField(max_length=100)
    object_key = models.SlugField(
        help_text="Stable key used by the frontend, e.g. main-hall, left-door."
    )

    object_type = models.CharField(
        max_length=20,
        choices=SceneObjectType.choices,
        default=SceneObjectType.PRIMITIVE,
    )
    primitive_shape = models.CharField(
        max_length=20,
        choices=PrimitiveShape.choices,
        blank=True,
        null=True,
        help_text="Used when object_type = primitive.",
    )

    model_key = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Used later for real 3D assets, e.g. dome_basic_v1.",
    )

    visible = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)

    pos_x = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pos_y = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pos_z = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    rot_x = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rot_y = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rot_z = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    width = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    height = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    depth = models.DecimalField(max_digits=10, decimal_places=2, default=1)

    color = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Hex color, e.g. #CCCCCC",
    )

    class Meta:
        ordering = ["order", "id"]
        unique_together = ("component", "configuration_type", "object_key")

    def __str__(self):
        config = self.configuration_type.name if self.configuration_type else "All"
        return f"{self.component.name} - {self.name} ({config})"
