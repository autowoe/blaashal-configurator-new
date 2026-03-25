from rest_framework import viewsets
from rest_framework.filters import SearchFilter

from projects.models import Project
from projects.serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    filter_backends = [SearchFilter]
    search_fields = ["name", "organization__name"]