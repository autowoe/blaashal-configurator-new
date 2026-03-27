# Create your views here.
from rest_framework import viewsets, mixins
from django_filters.rest_framework import DjangoFilterBackend

from configurations.models import Configuration
from configurations.serializers import ConfigurationSerializer


class ConfigurationViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ConfigurationSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        return Configuration.objects.filter(
            project_id=self.kwargs["project_pk"]
        ).select_related("configuration_type")
