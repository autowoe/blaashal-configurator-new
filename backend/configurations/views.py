# Create your views here.
from rest_framework import viewsets, mixins, serializers as drf_serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.core.mail import EmailMessage
from django.conf import settings
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

    @action(detail=False, methods=["post"], url_path="send-quote")
    def send_quote(self, request, project_pk=None):
        emails = request.data.get("emails", [])
        if not emails or not isinstance(emails, list):
            return Response({"detail": "Geef minimaal één e-mailadres op."}, status=400)

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

        mail = EmailMessage(
            subject=f"Offerte – {project.name}",
            body=(
                f"Beste,\n\n"
                f"Bijgevoegd vindt u de offerte voor project '{project.name}'.\n\n"
                f"Met vriendelijke groet,\n"
                f"Blaashal Configurator"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=emails,
        )
        mail.attach(filename, pdf_bytes, "application/pdf")
        mail.send()

        project.status = "quoted"
        project.save(update_fields=["status"])

        return Response({"detail": "Offerte verstuurd."})

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
