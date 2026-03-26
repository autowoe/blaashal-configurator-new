from rest_framework import serializers

from organizations.serializers import OrganizationSerializer
from projects.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    organization = OrganizationSerializer()

    class Meta:
        model = Project
        fields = ["id", "name", "organization"]
