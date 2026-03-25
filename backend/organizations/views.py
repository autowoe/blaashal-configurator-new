from organizations.models import Organization
from organizations.serializers import OrganizationSerializer

from rest_framework import viewsets

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer