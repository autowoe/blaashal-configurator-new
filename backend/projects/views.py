from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from projects.models import Project
from projects.filters import ProjectFilter
from projects.serializers import ProjectSerializer, ProjectCreateSerializer
from projects.pagination import ProjectPagination


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProjectFilter
    pagination_class = ProjectPagination

    def get_serializer_class(self):
        if self.action == "create":
            return ProjectCreateSerializer

        return ProjectSerializer

    class Meta:
        ordering = ["created_at"]
