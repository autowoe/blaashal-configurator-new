from core.serializers import UserSerializer
from rest_framework import serializers

from organizations.serializers import OrganizationSerializer
from organizations.models import Organization

from projects.models import Project, Status


class ProjectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    status = serializers.CharField(max_length=255)
    created_by = UserSerializer()
    organization = OrganizationSerializer()

    class Meta:
        model = Project
        fields = ["id", "name", "status", "created_by", "organization", "created_at"]


class ProjectCreateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all()
    )

    class Meta:
        model = Project
        fields = ["id", "name", "organization", "created_by", "status", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProjectUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(max_length=255)
    organization = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all()
    )
    status = serializers.ChoiceField(choices=Status.choices)

    class Meta:
        model = Project
        fields = ["id", "name", "organization", "status", "created_at"]
        read_only_fields = ["id", "created_at"]
