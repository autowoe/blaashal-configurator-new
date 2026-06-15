from rest_framework.routers import DefaultRouter

from knowledge_base.views import KbDocumentViewSet, KbFolderViewSet, KbSessionViewSet

router = DefaultRouter()
router.register(r"kb/folders", KbFolderViewSet, basename="kb-folder")
router.register(r"kb/documents", KbDocumentViewSet, basename="kb-document")
router.register(r"kb/sessions", KbSessionViewSet, basename="kb-session")

urlpatterns = router.urls
