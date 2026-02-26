from django.urls import path, include
from django.conf import settings
from django.contrib import admin
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/',     include('apps.usuarios.urls')),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/empresas/', include('apps.empresas.urls')),
]

if settings.DEBUG:
    urlpatterns += [
        path('api/schema/', SpectacularAPIView.as_view(),                      name='schema'),
        path('api/docs/',   SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    ]