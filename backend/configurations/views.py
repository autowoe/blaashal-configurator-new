# Create your views here.
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django_filters.rest_framework import DjangoFilterBackend

from configurations.models import Configuration
from configurations.serializers import (
    ConfigurationSerializer,
    ConfigurationCreateSerializer,
)
from configurations.pdf import generate_quote_pdf
from projects.models import Project


class ConfigurationViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["is_active"]

    def get_serializer_class(self):
        if self.action == "create":
            return ConfigurationCreateSerializer
        if self.action == "partial_update":
            return ConfigurationCreateSerializer

        return ConfigurationSerializer

    def get_queryset(self):
        return Configuration.objects.filter(
            project_id=self.kwargs["project_pk"]
        ).select_related("configuration_type")

    @action(detail=False, methods=["get"], url_path="quote-pdf")
    def quote_pdf(self, request, project_pk=None):
        project = Project.objects.select_related(
            "organization", "created_by"
        ).get(pk=project_pk)

        configuration = (
            Configuration.objects.filter(project_id=project_pk, is_active=True)
            .select_related("configuration_type")
            .first()
        )

        if configuration is None:
            return Response({"detail": "Geen actieve configuratie gevonden."}, status=404)

        pdf_bytes = generate_quote_pdf(project, configuration)
        safe_name = project.name.replace(" ", "_")
        filename = f"offerte_{safe_name}.pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
