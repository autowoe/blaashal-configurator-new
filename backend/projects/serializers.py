from rest_framework import serializers

from organizations.serializers import OrganizationSerializer
from organizations.models import Organization
from projects.models import Project


class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    status = serializers.CharField(max_length=255)
    organization = OrganizationSerializer()

    class Meta:
        model = Project
        fields = ["id", "name", "status", "organization", "created_at"]


class ProjectCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all()
    )

    class Meta:
        model = Project
        fields = ["id", "name", "organization", "status", "created_at"]
        read_only_fields = ["id", "created_at"]
