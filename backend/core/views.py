from rest_framework.views import APIView
from rest_framework.response import Response

from projects.models import Project
from projects.serializers import ProjectSerializer


class DashboardView(APIView):
    def get(self, request):
        return Response(
            {
                "project_count": Project.objects.count(),
                "recent_projects": ProjectSerializer(
                    Project.objects.order_by("-created_at")[:5], many=True
                ).data,
            }
        )
