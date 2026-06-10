from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import permissions
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView #swagger
from django.conf import settings
from django.conf.urls.static import static

class APIRootView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, format=None):
        return Response({
            "users_register": request.build_absolute_uri("/api/users/register/"),
            "users_login": request.build_absolute_uri("/api/users/login/"),
            "tasks": request.build_absolute_uri("/api/tasks/"),
            "summaries_daily": request.build_absolute_uri("/api/summaries/daily/"),
            "summaries_weekly": request.build_absolute_uri("/api/summaries/weekly/"),
        })


urlpatterns = [
    path('admin/', admin.site.urls),

    # Swagger schema e interface interativa
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API personalizada
    path('api/', APIRootView.as_view(), name='api-root'), #quando estava sem swagger
    path('api/tasks/', include('tasks.urls')),
    path('api/users/', include('users.urls')),
    path('api/summaries/', include('summaries.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
