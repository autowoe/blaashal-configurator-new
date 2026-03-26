from rest_framework.views import APIView
from rest_framework.response import Response

from projects.models import Project
from projects.serializers import ProjectSerializer


class DashboardView(APIView):
    def get(self, request):
        return Response(
            {
                "project_count": Project.objects.count(),
                "accepted_count": Project.objects.filter(status="accepted").count(),
                "pending_count": Project.objects.filter(
                    status__in=["draft", "quoted"]
                ).count(),
                "done_count": Project.objects.filter(status="done").count(),
                "recent_projects": ProjectSerializer(
                    Project.objects.order_by("-created_at")[:5], many=True
                ).data,
            }
        )
