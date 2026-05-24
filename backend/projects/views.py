from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from projects.models import Project, ProjectImage
from projects.filters import ProjectFilter
from projects.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectImageSerializer,
)
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
        if self.action == "partial_update":
            return ProjectUpdateSerializer
        return ProjectSerializer

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="images",
        parser_classes=[MultiPartParser],
    )
    def images(self, request, **_kwargs):
        project = self.get_object()
        if request.method == "GET":
            qs = project.images.order_by("-created_at")
            serializer = ProjectImageSerializer(
                qs, many=True, context={"request": request}
            )
            return Response(serializer.data)
        serializer = ProjectImageSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(project=project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[^/.]+)")
    def delete_image(self, _request, image_id=None, **_kwargs):
        project = self.get_object()
        image = get_object_or_404(ProjectImage, id=image_id, project=project)
        image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    class Meta:
        ordering = ["created_at"]
