from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect

from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework import status

from core.serializers import UserSerializer
from projects.models import Project
from projects.serializers import ProjectSerializer


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_view(request):
    return Response({"detail": "CSRF cookie set"})


@csrf_protect
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    user = authenticate(request, email=email, password=password)
    if not user:
        return Response(
            {"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
        )

    login(request, user)
    return Response({"detail": "Logged in"})


@csrf_protect
@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out"})


class MeView(APIView):
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

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
