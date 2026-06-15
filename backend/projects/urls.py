from rest_framework.routers import DefaultRouter

from projects.views import ProjectViewSet, ReferenceImageViewSet

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"reference-images", ReferenceImageViewSet, basename="reference-image")
urlpatterns = router.urls
