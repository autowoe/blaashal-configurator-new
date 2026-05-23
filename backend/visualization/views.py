from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, viewsets

from components.models import ConfigurationType
from visualization.models import ComponentVisualization
from visualization.serializers import ComponentVisualizationSerializer


class VisualizationFilter(filters.FilterSet):
    configuration_type = filters.ModelChoiceFilter(
        queryset=ConfigurationType.objects.all(),
        field_name="configuration_type",
    )

    class Meta:
        model = ComponentVisualization
        fields = ["configuration_type"]

    def filter_queryset(self, queryset):
        ct_value = self.data.get("configuration_type")
        if ct_value and not ConfigurationType.objects.filter(pk=ct_value).exists():
            return queryset.none()
        return super().filter_queryset(queryset)


class ComponentVisualizationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ComponentVisualizationSerializer
    pagination_class = None
    queryset = ComponentVisualization.objects.select_related(
        "component",
        "configuration_type",
    ).order_by("order", "id")
    filter_backends = [DjangoFilterBackend]
    filterset_class = VisualizationFilter
