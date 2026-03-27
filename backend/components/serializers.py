from rest_framework import serializers
from .models import ConfigurationType, Component, ComponentPrice


class ConfigurationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationType
        fields = ["id", "name"]


class ComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Component
        fields = ["id", "name", "order"]


class ComponentPriceSerializer(serializers.ModelSerializer):
    component = ComponentSerializer()

    class Meta:
        model = ComponentPrice
        fields = ["id", "component", "inkoop", "verkoop"]
