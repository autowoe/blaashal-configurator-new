from rest_framework import serializers

from visualization.models import ComponentVisualization


class ComponentVisualizationSerializer(serializers.ModelSerializer):
    component_name = serializers.CharField(source="component.name", read_only=True)
    configuration_type_name = serializers.CharField(
        source="configuration_type.name",
        read_only=True,
    )

    class Meta:
        model = ComponentVisualization
        fields = [
            "id",
            "name",
            "object_key",
            "object_type",
            "primitive_shape",
            "model_key",
            "visible",
            "order",
            "pos_x",
            "pos_y",
            "pos_z",
            "rot_x",
            "rot_y",
            "rot_z",
            "width",
            "height",
            "depth",
            "color",
            "component",
            "component_name",
            "configuration_type",
            "configuration_type_name",
        ]
