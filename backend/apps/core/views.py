# apps/core/views.py

from rest_framework import mixins, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from .models import NotificacaoDestinatario
from .serializers import NotificacaoDestinatarioSerializer


class NotificacaoViewSet(
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes  = [IsAuthenticated]
    serializer_class    = NotificacaoDestinatarioSerializer

    def get_queryset(self):
        qs = (
            NotificacaoDestinatario.objects
            .filter(
                usuario=self.request.user,
                canal=NotificacaoDestinatario.Canal.WEB,
            )
            .select_related("notificacao")
            .order_by("-notificacao__data_criacao")
        )
        if self.request.query_params.get("nao_lidas") == "true":
            qs = qs.filter(lida=False)
        return qs

    @action(detail=True, methods=["post"])
    def ler(self, request, pk=None):
        dest = self.get_object()
        if not dest.lida:
            dest.lida         = True
            dest.data_leitura = timezone.now()
            dest.save(update_fields=["lida", "data_leitura"])
        return Response({"detail": "Marcada como lida."})

    @action(detail=False, methods=["post"], url_path="ler-todas")
    def ler_todas(self, request):
        NotificacaoDestinatario.objects.filter(
            usuario=request.user,
            canal=NotificacaoDestinatario.Canal.WEB,
            lida=False,
        ).update(lida=True, data_leitura=timezone.now())
        return Response({"detail": "Todas marcadas como lidas."})

    @action(detail=False, methods=["get"], url_path="nao-lidas-count")
    def nao_lidas_count(self, request):
        count = NotificacaoDestinatario.objects.filter(
            usuario=request.user,
            canal=NotificacaoDestinatario.Canal.WEB,
            lida=False,
        ).count()
        return Response({"count": count})
