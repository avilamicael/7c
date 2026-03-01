from django.urls import path, include
from django.conf import settings
from django.contrib import admin
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',     include('apps.usuarios.urls')),   
    path('api/usuarios/', include('apps.usuarios.urls')), 
    path('api/empresas/', include('apps.empresas.urls')),
    path('api/clientes/', include('apps.clientes.urls')),
    path('api/fornecedores/', include('apps.fornecedores.urls')),
    path('api/financeiro/', include('apps.financeiro.urls')),
    path("api/kanban/", include("apps.kanban.urls")),

]

if settings.DEBUG:
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
        path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]

    ##USAR URL ASSINADAS PARA ACESSAR AVATAR DO USUÁRIO
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)