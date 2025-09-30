from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('api/chat/', views.home, name='chat_api'),  # Use home view for chat API
    # path('health/', views.health_check, name='health_check'),  # Remove or define
]
