from organizations.models import Organization
from organizations.serializers import OrganizationSerializer

from rest_framework import viewsets, filters


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all().order_by("name")
    serializer_class = OrganizationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "email"]
