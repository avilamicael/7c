from rest_framework.routers import DefaultRouter
from .views import TarefaViewSet

router = DefaultRouter()
router.register(r"", TarefaViewSet, basename="tarefa")

urlpatterns = router.urls
