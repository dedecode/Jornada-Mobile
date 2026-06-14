from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DailySummaryViewSet, WeeklySummaryViewSet

router = DefaultRouter()
router.register(r'daily', DailySummaryViewSet, basename='daily-summary')
router.register(r'weekly', WeeklySummaryViewSet, basename='weekly-summary')

urlpatterns = [
    path('', include(router.urls)),
]
