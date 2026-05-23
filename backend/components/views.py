import tempfile
import os

from django_filters import rest_framework as filters
from rest_framework import viewsets, mixins, permissions
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from components.importer import run_import
from components.models import ConfigurationType, ComponentPrice
from components.serializers import ConfigurationTypeSerializer, ComponentPriceSerializer


class ConfigurationTypeFilter(filters.FilterSet):
    configuration_type = filters.ModelChoiceFilter(
        queryset=ConfigurationType.objects.all(),
        field_name="configuration_type",
    )

    class Meta:
        model = ComponentPrice
        fields = ["configuration_type"]

    def filter_queryset(self, queryset):
        ct_value = self.data.get("configuration_type")
        if ct_value and not ConfigurationType.objects.filter(pk=ct_value).exists():
            return queryset.none()
        return super().filter_queryset(queryset)


class ConfigurationTypeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = ConfigurationType.objects.all()
    serializer_class = ConfigurationTypeSerializer


class ComponentPriceViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ComponentPriceSerializer
    queryset = (
        ComponentPrice.objects.select_related("component", "configuration_type")
        .filter(component__parent__isnull=True)
        .order_by("component__order")
    )
    filter_backends = [DjangoFilterBackend]
    filterset_class = ConfigurationTypeFilter


class ImportComponentsView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [permissions.IsAdminUser]

    def post(self, request: Request) -> Response:
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "Geen bestand meegestuurd."}, status=400)

        if not file.name.endswith(".xlsx"):
            return Response({"detail": "Alleen .xlsx bestanden zijn toegestaan."}, status=400)

        with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
            for chunk in file.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        try:
            result = run_import(tmp_path)
        finally:
            os.unlink(tmp_path)

        status_code = 200 if not result["errors"] else 207
        return Response(
            {
                "total_components": result["total_components"],
                "total_prices": result["total_prices"],
                "errors": result["errors"],
            },
            status=status_code,
        )
