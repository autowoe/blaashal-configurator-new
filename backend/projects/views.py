import base64
import io
import mimetypes
import os
import urllib.request

import fal_client
from PIL import Image as PILImage
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.response import Response

from projects.models import Project, ProjectImage, ReferenceImage
from projects.filters import ProjectFilter
from projects.serializers import (
    ProjectSerializer,
    ProjectCreateSerializer,
    ProjectUpdateSerializer,
    ProjectImageSerializer,
    ProjectStatusEventSerializer,
    ReferenceImageSerializer,
)
from projects.pagination import ProjectPagination

FAL_APP_ID = "openai/gpt-image-2/edit"



def _mask_location_hint(mask_bytes: bytes) -> str:
    """Return a rough spatial description of the masked area for the prompt."""
    img = PILImage.open(io.BytesIO(mask_bytes)).convert("L")
    w, h = img.size
    pixels = list(img.getdata())
    white = [(i % w, i // w) for i, p in enumerate(pixels) if p > 128]
    if not white:
        return ""
    cx = sum(x for x, _ in white) / len(white) / w
    cy = sum(y for _, y in white) / len(white) / h
    v = "upper" if cy < 0.4 else "lower" if cy > 0.6 else "middle"
    h_pos = "left" if cx < 0.4 else "right" if cx > 0.6 else "center"
    return f" The field is in the {v}-{h_pos} part of the image."


def build_generation_prompt(has_references=False, location_hint=""):
    ref_hint = (
        " Match the dome's exact style, color and shape to the reference dome images provided."
        if has_references
        else ""
    )

    return (
        f"Place a large white inflatable air-supported sports dome (blaashal) "
        f"over the sports field in the masked/transparent area of this image. {location_hint}{ref_hint} "
        "The dome must fill the entire masked area completely — size it to match the full extent of the transparent region. "
        "Do not modify anything outside the masked area. "
        "The dome has a smooth white PVC membrane roof and a blue base band at the bottom. With a diamond-shaped netting over it like in the provided reference images."
        "Keep all surroundings (fences, trees, buildings, light poles, sky) exactly as they are. "
        "Match the existing lighting, shadows, and perspective. "
        "The result must look photorealistic, as if the dome was actually built here."
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

    def perform_update(self, serializer):
        serializer.instance._changed_by = self.request.user
        serializer.save()

    @action(detail=True, methods=["get"], url_path="status-history")
    def status_history(self, _request, **_kwargs):
        project = self.get_object()
        events = project.status_events.order_by("created_at")
        serializer = ProjectStatusEventSerializer(events, many=True)
        return Response(serializer.data)

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
        mask_data_url = request.data.get("mask")
        reference_image_ids = request.data.get("reference_image_ids", [])

        if not image_id:
            return Response(
                {"detail": "environment_image_id required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not mask_data_url:
            return Response(
                {"detail": "mask required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        env_image = get_object_or_404(ProjectImage, id=image_id, project=project)
        with env_image.image.open("rb") as f:
            image_bytes = f.read()
        file_name = env_image.image.name.split("/")[-1]
        mime_type = mimetypes.guess_type(file_name)[0] or "image/jpeg"

        _, b64data = mask_data_url.split(",", 1)
        raw_mask_bytes = base64.b64decode(b64data)
        location_hint = _mask_location_hint(raw_mask_bytes)

        reference_images = ReferenceImage.objects.filter(is_active=True).order_by(
            "-created_at"
        )[:10]
        ref_image_urls = []
        for ref in reference_images:
            with ref.image.open("rb") as f:
                ref_bytes = f.read()
            ref_mime = (
                mimetypes.guess_type(ref.image.name.split("/")[-1])[0] or "image/jpeg"
            )
            ref_image_urls.append(fal_client.encode(ref_bytes, ref_mime))

        handle = fal_client.submit(
            FAL_APP_ID,
            arguments={
                "image_urls": [fal_client.encode(image_bytes, mime_type)]
                + ref_image_urls,
                "mask_url": fal_client.encode(raw_mask_bytes, "image/png"),
                "prompt": build_generation_prompt(
                    has_references=len(ref_image_urls) > 0,
                    location_hint=location_hint,
                ),
                "quality": "high",
                "output_format": "jpeg",
                "openai_api_key": os.environ["OPENAI_API_KEY"],
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

        with urllib.request.urlopen(generated_url) as img_resp:
            img_bytes = img_resp.read()

        image_file = ContentFile(img_bytes, name=f"ai_preview_{request_id[:8]}.jpg")
        project_image = ProjectImage(project=project, name="AI Preview")
        project_image.image.save(image_file.name, image_file, save=True)

        serializer = ProjectImageSerializer(project_image, context={"request": request})
        return Response({"status": "COMPLETED", "image": serializer.data})

    class Meta:
        ordering = ["created_at"]


class ReferenceImageViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, JSONParser]

    def list(self, request):
        qs = ReferenceImage.objects.order_by("-created_at")
        serializer = ReferenceImageSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def create(self, request):
        serializer = ReferenceImageSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        image = get_object_or_404(ReferenceImage, pk=pk)
        serializer = ReferenceImageSerializer(
            image, data=request.data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def destroy(self, _request, pk=None):
        image = get_object_or_404(ReferenceImage, pk=pk)
        image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
