from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets

from projects.models import Project
from projects.filters import ProjectFilter
from projects.serializers import ProjectSerializer
from projects.pagination import ProjectPagination


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = ProjectFilter
    pagination_class = ProjectPagination

    class Meta:
        ordering = ["created_at"]
