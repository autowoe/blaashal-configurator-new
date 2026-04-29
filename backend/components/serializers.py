from rest_framework import serializers
from .models import ConfigurationType, Component, ComponentPrice


class ConfigurationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationType
        fields = ["id", "name"]


class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = ["id", "name", "order", "input_type", "group_key", "unit"]


class ComponentPriceSerializer(serializers.ModelSerializer):
    component = ComponentSerializer()
    children = serializers.SerializerMethodField()

    class Meta:
        model = ComponentPrice
        fields = ["id", "component", "inkoop", "verkoop", "children"]

    def get_children(self, obj):
        child_prices = (
            ComponentPrice.objects.filter(
                configuration_type=obj.configuration_type,
                component__parent=obj.component,
            )
            .select_related("component")
            .order_by("component__order")
        )
        return ComponentPriceSerializer(child_prices, many=True).data
