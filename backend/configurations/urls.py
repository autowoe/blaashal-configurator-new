from rest_framework_nested import routers
from projects.views import ProjectViewSet
from configurations.views import ConfigurationViewSet

router = routers.DefaultRouter()
router.register("projects", ProjectViewSet, basename="project")

projects_router = routers.NestedDefaultRouter(router, "projects", lookup="project")
projects_router.register(
    "configurations", ConfigurationViewSet, basename="project-configurations"
)
