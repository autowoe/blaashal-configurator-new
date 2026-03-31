from rest_framework.routers import DefaultRouter

from visualization.views import ComponentVisualizationViewSet

router = DefaultRouter()
router.register(
    r"visualizations", ComponentVisualizationViewSet, basename="visualization"
)
urlpatterns = router.urls
