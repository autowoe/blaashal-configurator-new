from rest_framework import viewsets
from rest_framework.filters import SearchFilter, OrderingFilter

from projects.models import Project
from projects.serializers import ProjectSerializer
from projects.pagination import ProjectPagination


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "organization__name"]
    ordering_fields = ["name", "organization__name"]
    ordering = ["name"]
    pagination_class = ProjectPagination