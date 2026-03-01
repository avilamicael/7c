from rest_framework.routers import DefaultRouter
from django.urls import path, include
from apps.kanban.views import KanbanBoardViewSet, KanbanColunaViewSet, KanbanCardViewSet

router = DefaultRouter()
router.register(r"boards", KanbanBoardViewSet, basename="kanban-board")
router.register(r"cards", KanbanCardViewSet, basename="kanban-card")

boards_router = DefaultRouter()
boards_router.register(r"colunas", KanbanColunaViewSet, basename="kanban-coluna")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "boards/<uuid:board_public_id>/",
        include(boards_router.urls),
    ),
]