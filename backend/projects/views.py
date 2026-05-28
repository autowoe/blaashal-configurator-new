import mimetypes
import re

import fal_client
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from projects.models import Project, ProjectImage
from projects.filters import ProjectFilter
from projects.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectImageSerializer,
)
from projects.pagination import ProjectPagination

FAL_APP_ID = "openai/gpt-image-2/edit"


def build_generation_prompt(config_type_name=None):
    # Parse "Xb sport" format, e.g. "3b tennis" → 3 tennis courts
    size_desc = "covering the sports courts"
    if config_type_name:
        match = re.match(r"(\d+)b\s+(\w+)", config_type_name, re.IGNORECASE)
        if match:
            num_fields = int(match.group(1))
            sport = match.group(2).lower()
            size_desc = f"sized to cover exactly {num_fields} {sport} {'court' if num_fields == 1 else 'courts'} side by side"

    return (
        f"Add a large inflatable sports dome structure over the sports area in this image, {size_desc}. "
        "Air-supported architecture with a smooth tensioned membrane exterior, "
        "reinforced base skirt around the perimeter, modular inflatable sports hall, "
        "realistic construction details, temporary yet professional athletic facility, "
        "modern engineering, photorealistic, realistic materials and structural proportions, "
        "soft natural lighting matching the scene. "
        "Do not alter any other part of the image — keep fences, trees, buildings, and ground completely unchanged."
    )


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

    @action(detail=True, methods=["post"], url_path="generate-preview")
    def generate_preview(self, request, **_kwargs):
        project = self.get_object()
        image_id = request.data.get("environment_image_id")
        if not image_id:
            return Response(
                {"detail": "environment_image_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        env_image = get_object_or_404(ProjectImage, id=image_id, project=project)

        with env_image.image.open("rb") as f:
            image_bytes = f.read()

        file_name = env_image.image.name.split("/")[-1]
        mime_type = mimetypes.guess_type(file_name)[0] or "image/jpeg"
        fal_image_url = fal_client.encode(image_bytes, mime_type)

        config = (
            project.price_configurations.filter(is_active=True)
            .select_related("configuration_type")
            .first()
        )
        config_type_name = (
            config.configuration_type.name
            if config and config.configuration_type
            else None
        )
        prompt = build_generation_prompt(config_type_name)

        handle = fal_client.submit(
            FAL_APP_ID,
            arguments={
                "image_urls": [fal_image_url],
                "prompt": prompt,
                "quality": "high",
            },
        )

        return Response(
            {"request_id": handle.request_id}, status=status.HTTP_202_ACCEPTED
        )

    @action(
        detail=True, methods=["get"], url_path=r"preview-status/(?P<request_id>[^/.]+)"
    )
    def preview_status(self, request, request_id=None, **_kwargs):
        project = self.get_object()

        job_status = fal_client.status(FAL_APP_ID, request_id)

        if not isinstance(job_status, fal_client.Completed):
            return Response({"status": type(job_status).__name__.upper()})

        result = fal_client.result(FAL_APP_ID, request_id)
        generated_url = result["images"][0]["url"]

        import urllib.request

        with urllib.request.urlopen(generated_url) as img_resp:
            img_bytes = img_resp.read()

        image_file = ContentFile(img_bytes, name=f"ai_preview_{request_id[:8]}.jpg")
        project_image = ProjectImage(project=project, name="AI Preview")
        project_image.image.save(image_file.name, image_file, save=True)

        serializer = ProjectImageSerializer(project_image, context={"request": request})
        return Response({"status": "COMPLETED", "image": serializer.data})

    class Meta:
        ordering = ["created_at"]
