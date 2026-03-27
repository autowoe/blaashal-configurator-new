from rest_framework import viewsets, mixins
from django_filters.rest_framework import DjangoFilterBackend

from components.models import ConfigurationType, ComponentPrice
from components.serializers import ConfigurationTypeSerializer, ComponentPriceSerializer


class ConfigurationTypeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = ConfigurationType.objects.all()
    serializer_class = ConfigurationTypeSerializer


class ComponentPriceViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ComponentPriceSerializer
    queryset = ComponentPrice.objects.select_related(
        "component", "configuration_type"
    ).order_by("component__order")
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["configuration_type"]
