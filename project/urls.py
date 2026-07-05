"""
URL configuration for project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth.views import LoginView
from django.http import FileResponse
from django.views.generic import TemplateView, RedirectView
from pathlib import Path
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LogoutView

BASE_DIR = Path(__file__).resolve().parent.parent


def openapi(request):
    return FileResponse(open(BASE_DIR / "openapi.yaml", "rb"))

urlpatterns = [
    path('favicon.ico', RedirectView.as_view(url=settings.STATIC_URL + 'favicon.ico')),
    path("openapi.yaml", openapi),
    path(
        "panel/docs/",
        login_required(
            TemplateView.as_view(template_name="admin/redoc.html")
        ),
    ),

    path('admin/', admin.site.urls),
    path('panel/login/', LoginView.as_view(template_name='admin/login.html'), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('i18n/', include('django.conf.urls.i18n')),
    path('', include('MainApp.urls')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
