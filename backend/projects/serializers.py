from core.serializers import UserSerializer
from rest_framework import serializers

from organizations.serializers import OrganizationSerializer
from organizations.models import Organization

from projects.models import (
    Project,
    ProjectImage,
    ProjectStatusEvent,
    ReferenceImage,
    Status,
)


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


class ProjectImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProjectImage
        fields = ["id", "project", "image", "image_url", "name", "created_at"]
        read_only_fields = ["id", "project", "created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class ProjectStatusEventSerializer(serializers.ModelSerializer):
    changed_by = UserSerializer(read_only=True)
    from_status_display = serializers.CharField(
        source="get_from_status_display", read_only=True
    )
    to_status_display = serializers.CharField(
        source="get_to_status_display", read_only=True
    )

    class Meta:
        model = ProjectStatusEvent
        fields = [
            "id",
            "from_status",
            "from_status_display",
            "to_status",
            "to_status_display",
            "changed_by",
            "created_at",
        ]


class ReferenceImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ReferenceImage
        fields = ["id", "image", "image_url", "name", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_image_url(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
