from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConfigurationTypeViewSet, ComponentPriceViewSet

router = DefaultRouter()
router.register("types", ConfigurationTypeViewSet, basename="configuration-type")
router.register("components", ComponentPriceViewSet, basename="component")

urlpatterns = [
    path("configuration/", include(router.urls)),
]
