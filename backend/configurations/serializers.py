from rest_framework import serializers

from configurations.models import Configuration
from components.serializers import ConfigurationTypeSerializer
from projects.models import Project

LOCKED_STATUSES = ["quoted", "accepted", "done", "denied"]


class ConfigurationSerializer(serializers.ModelSerializer):
    configuration_type = ConfigurationTypeSerializer(read_only=True)

    class Meta:
        model = Configuration
        fields = ["id", "configuration_type", "is_active", "data", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        project_id = self.context["view"].kwargs["project_pk"]
        Configuration.objects.filter(project_id=project_id).update(is_active=False)
        return Configuration.objects.create(project_id=project_id, **validated_data)

    def validate(self, attrs):
        project_id = self.context["view"].kwargs["project_pk"]
        project = Project.objects.get(pk=project_id)
        if project.status in LOCKED_STATUSES:
            raise serializers.ValidationError(
                "Configuration is locked once a quote has been sent."
            )
        return attrs


class ConfigurationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Configuration
        fields = ["id", "configuration_type", "is_active", "data", "created_at"]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        project_id = self.context["view"].kwargs["project_pk"]
        Configuration.objects.filter(project_id=project_id).update(is_active=False)
        return Configuration.objects.create(project_id=project_id, **validated_data)

    def validate(self, attrs):
        project_id = self.context["view"].kwargs["project_pk"]
        project = Project.objects.get(pk=project_id)
        if project.status in LOCKED_STATUSES:
            raise serializers.ValidationError(
                "Configuration is locked once a quote has been sent."
            )
        return attrs
