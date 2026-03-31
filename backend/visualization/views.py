from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets

from visualization.models import ComponentVisualization
from visualization.serializers import ComponentVisualizationSerializer


class ComponentVisualizationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ComponentVisualizationSerializer
    pagination_class = None
    queryset = ComponentVisualization.objects.select_related(
        "component",
        "configuration_type",
    ).order_by("order", "id")
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["configuration_type"]
