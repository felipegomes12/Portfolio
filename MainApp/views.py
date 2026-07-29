from django.shortcuts import render
from django.views.generic import TemplateView, View
import json
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.paginator import Paginator
from .models import ProjectTopics, ProjectGallery, MyProjects, ProfileInfo, ProfessionalExp, Formation, Tags, AccessLog, Collaborator
from django.db.models import Count
from django.utils import timezone
from datetime import timedelta


# templates
class HomeTemplateView(TemplateView):
    template_name = "index.html"

    def get(self, request):
        profile = ProfileInfo.objects.first()
        projects = MyProjects.objects.prefetch_related("project_topics", "project_gallery").filter(is_active=True).order_by("-weight", "-id")
        experiences = ProfessionalExp.objects.all().order_by("-ini_date")
        formations = Formation.objects.all().order_by("-weight", "-ini_date")
        collaborators = Collaborator.objects.all().order_by("id")
        return render(request, self.template_name, {
            "profile": profile,
            "projects": projects,
            "experiences": experiences,
            "formations": formations,
            "collaborators": collaborators
        })


class DoomTemplateView(TemplateView):
    template_name = "doom.html"


class PrivacyPolicyTemplateView(TemplateView):
    template_name = "privacy_policy.html"


class AdminTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/dashboard.html"

    def get(self, request):
        stats = {
            "projects_count": MyProjects.objects.count(),
            "experience_count": ProfessionalExp.objects.count(),
            "formation_count": Formation.objects.count(),
            "collaborators_count": Collaborator.objects.count(),
        }
        return render(request, self.template_name, {"stats": stats})

class AdminAnalyticsTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/analytics.html"

    def get(self, request):
        stats = {
            "total_views": AccessLog.objects.count(),
            "unique_visitors": AccessLog.objects.values("ip_address").distinct().count(),
        }

        # Daily stats for the last 7 days
        today = timezone.now().date()
        day_names_pt = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
        day_names_en = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily_stats = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = AccessLog.objects.filter(
                accessed_at__date=day
            ).count()
            daily_stats.append({
                "date": day.strftime("%d/%m"),
                "day_name_pt": day_names_pt[day.weekday()],
                "day_name_en": day_names_en[day.weekday()],
                "count": count,
            })

        max_daily_count = max((d["count"] for d in daily_stats), default=1)
        if max_daily_count == 0:
            max_daily_count = 1

        # Top 10 visitors by total accesses
        top_visitors = (
            AccessLog.objects
            .values("ip_address")
            .annotate(total=Count("id"))
            .order_by("-total")[:10]
        )

        # Last 15 access logs
        recent_accesses = AccessLog.objects.all()[:15]

        return render(request, self.template_name, {
            "stats": stats,
            "daily_stats": daily_stats,
            "max_daily_count": max_daily_count,
            "top_visitors": top_visitors,
            "recent_accesses": recent_accesses,
        })

class AdminProjectsTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/projects.html"
    
    def get(self, request):
        return render(request, self.template_name)

class AdminProfileTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/profile.html"

    def get(self, request):
        profile = ProfileInfo.objects.first()
        tags = Tags.objects.all()
        return render(request, self.template_name, {
            "profile": profile,
            "tags": tags
        })

class AdminExperienceTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/experience.html"

    def get(self, request):
        return render(request, self.template_name)

class AdminFormationTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/formation.html"

    def get(self, request):
        return render(request, self.template_name)

class ProjectDetailView(TemplateView):
    template_name = "project_detail.html"

    def get(self, request, id):
        project = MyProjects.objects.prefetch_related("project_topics", "project_gallery").filter(id=id).first()
        if not project or (not project.is_active and not request.user.is_authenticated):
            from django.http import Http404
            raise Http404("Projeto não encontrado")
        return render(request, self.template_name, {"project": project})

# views
class CreateProjectTopicsView(LoginRequiredMixin, View):
    """
    CREATE ProjectTopics
    """
    def post(self, request):

        try:
            data = json.loads(request.body)

            topics_title = data.get("topics_title")
            topics_title_en = data.get("topics_title_en")
            topics = data.get("topics", [])
            topics_en = data.get("topics_en", [])

            if not topics_title:
                return JsonResponse({"error": "topics_title é obrigatório"}, status=400)

            obj = ProjectTopics.objects.create(
                topics_title=topics_title,
                topics_title_en=topics_title_en,
                topics=topics,
                topics_en=topics_en
            )

            return JsonResponse({
                "message": "Criado com sucesso",
                "id": obj.id
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class CreateProjectGalleryView(LoginRequiredMixin, View):
    """
    CREATE ProjectGallery
    (usa multipart/form-data)
    """
    def post(self, request):

        try:
            img = request.FILES.get("img")

            if not img:
                return JsonResponse({"error": "Imagem é obrigatória"}, status=400)

            obj = ProjectGallery.objects.create(img=img)

            return JsonResponse({
                "message": "Imagem enviada",
                "id": obj.id,
                "url": obj.img.url
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class CreateMyProjectView(LoginRequiredMixin, View):
    """
    CREATE MyProjects
    """
    def post(self, request):
        if request.method != "POST":
            return JsonResponse({"error": "Método não permitido"}, status=405)

        try:
            if request.content_type.startswith("multipart/form-data") or "multipart/form-data" in request.META.get("CONTENT_TYPE", ""):
                project_title = request.POST.get("project_title")
                project_title_en = request.POST.get("project_title_en")
                project_description = request.POST.get("project_description")
                project_description_en = request.POST.get("project_description_en")
                
                tags_raw = request.POST.get("project_tags", "")
                try:
                    project_tags = json.loads(tags_raw) if tags_raw.startswith("[") else [t.strip() for t in tags_raw.split(",") if t.strip()]
                except:
                    project_tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

                project_resorce_title = request.POST.get("project_resorce_title")
                project_resorce_title_en = request.POST.get("project_resorce_title_en")
                
                res_list_raw = request.POST.get("project_resorce_list", "")
                project_resorce_list = [r.strip() for r in res_list_raw.split("\n") if r.strip()]
                res_list_en_raw = request.POST.get("project_resorce_list_en", "")
                project_resorce_list_en = [r.strip() for r in res_list_en_raw.split("\n") if r.strip()]
                
                res_tags_raw = request.POST.get("project_resorce_tags", "")
                project_resorce_tags = [t.strip() for t in res_tags_raw.split("\n") if t.strip()]
                res_tags_en_raw = request.POST.get("project_resorce_tags_en", "")
                project_resorce_tags_en = [t.strip() for t in res_tags_en_raw.split("\n") if t.strip()]

                project_note = request.POST.get("project_note")
                project_note_en = request.POST.get("project_note_en")
                project_github_rep_link = request.POST.get("project_github_rep_link")
                
                weight_raw = request.POST.get("weight", "0")
                weight = int(weight_raw) if weight_raw and weight_raw.isdigit() else 0
                
                is_active_raw = request.POST.get("is_active")
                is_active = is_active_raw.lower() in ['true', '1', 'yes'] if is_active_raw is not None else False
                
                topics_raw = request.POST.get("project_topics", "[]")
                topics_ids = json.loads(topics_raw)
                
                gallery_raw = request.POST.get("project_gallery", "[]")
                gallery_ids = json.loads(gallery_raw)
            else:
                data = json.loads(request.body)
                project_title = data.get("project_title")
                project_title_en = data.get("project_title_en")
                project_description = data.get("project_description")
                project_description_en = data.get("project_description_en")
                project_tags = data.get("project_tags", [])
                project_resorce_title = data.get("project_resorce_title")
                project_resorce_title_en = data.get("project_resorce_title_en")
                project_resorce_list = data.get("project_resorce_list", [])
                project_resorce_list_en = data.get("project_resorce_list_en", [])
                project_resorce_tags = data.get("project_resorce_tags", [])
                project_resorce_tags_en = data.get("project_resorce_tags_en", [])
                project_note = data.get("project_note")
                project_note_en = data.get("project_note_en")
                project_github_rep_link = data.get("project_github_rep_link")
                weight = int(data.get("weight", 0) or 0)
                is_active = bool(data.get("is_active", False))
                topics_ids = data.get("project_topics", [])
                gallery_ids = data.get("project_gallery", [])

            if not project_title:
                return JsonResponse({"error": "project_title é obrigatório"}, status=400)

            project_icon = request.FILES.get("project_icon")

            obj = MyProjects.objects.create(
                project_title=project_title,
                project_title_en=project_title_en,
                project_description=project_description,
                project_description_en=project_description_en,
                project_tags=project_tags,
                project_resorce_title=project_resorce_title,
                project_resorce_title_en=project_resorce_title_en,
                project_resorce_list=project_resorce_list,
                project_resorce_list_en=project_resorce_list_en,
                project_resorce_tags=project_resorce_tags,
                project_resorce_tags_en=project_resorce_tags_en,
                project_note=project_note,
                project_note_en=project_note_en,
                project_github_rep_link=project_github_rep_link,
                project_icon=project_icon,
                weight=weight,
                is_active=is_active
            )

            if topics_ids:
                obj.project_topics.set(ProjectTopics.objects.filter(id__in=topics_ids))

            if gallery_ids:
                obj.project_gallery.set(ProjectGallery.objects.filter(id__in=gallery_ids))

            return JsonResponse({
                "message": "Projeto criado",
                "id": obj.id
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class UpdateProjectTopicsView(LoginRequiredMixin, View):
    def put(self, request, id):
        try:
            obj = ProjectTopics.objects.get(id=id)
            data = json.loads(request.body)

            obj.topics_title = data.get("topics_title", obj.topics_title)
            obj.topics_title_en = data.get("topics_title_en", obj.topics_title_en)
            obj.topics = data.get("topics", obj.topics)
            obj.topics_en = data.get("topics_en", obj.topics_en)

            obj.save()

            return JsonResponse({"message": "Atualizado com sucesso"})

        except ProjectTopics.DoesNotExist:
            return JsonResponse({"error": "Não encontrado"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
        
class UpdateProjectGalleryView(LoginRequiredMixin, View):
    def post(self, request, id):
        try:
            obj = ProjectGallery.objects.get(id=id)

            img = request.FILES.get("img")

            # Se enviar nova imagem, substitui
            if img:
                obj.img = img
                obj.save()

            return JsonResponse({
                "message": "Imagem atualizada",
                "url": obj.img.url
            })

        except ProjectGallery.DoesNotExist:
            return JsonResponse({"error": "Imagem não encontrada"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class UpdateMyProjectView(LoginRequiredMixin, View):
    def post(self, request, id):
        try:
            obj = MyProjects.objects.get(id=id)

            if request.content_type.startswith("multipart/form-data") or "multipart/form-data" in request.META.get("CONTENT_TYPE", ""):
                obj.project_title = request.POST.get("project_title", obj.project_title)
                obj.project_title_en = request.POST.get("project_title_en", obj.project_title_en)
                obj.project_description = request.POST.get("project_description", obj.project_description)
                obj.project_description_en = request.POST.get("project_description_en", obj.project_description_en)
                
                tags_raw = request.POST.get("project_tags")
                if tags_raw is not None:
                    try:
                        obj.project_tags = json.loads(tags_raw) if tags_raw.startswith("[") else [t.strip() for t in tags_raw.split(",") if t.strip()]
                    except:
                        obj.project_tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

                obj.project_resorce_title = request.POST.get("project_resorce_title", obj.project_resorce_title)
                obj.project_resorce_title_en = request.POST.get("project_resorce_title_en", obj.project_resorce_title_en)
                
                res_list_raw = request.POST.get("project_resorce_list")
                if res_list_raw is not None:
                    obj.project_resorce_list = [r.strip() for r in res_list_raw.split("\n") if r.strip()]
                res_list_en_raw = request.POST.get("project_resorce_list_en")
                if res_list_en_raw is not None:
                    obj.project_resorce_list_en = [r.strip() for r in res_list_en_raw.split("\n") if r.strip()]
                    
                res_tags_raw = request.POST.get("project_resorce_tags")
                if res_tags_raw is not None:
                    obj.project_resorce_tags = [t.strip() for t in res_tags_raw.split("\n") if t.strip()]
                res_tags_en_raw = request.POST.get("project_resorce_tags_en")
                if res_tags_en_raw is not None:
                    obj.project_resorce_tags_en = [t.strip() for t in res_tags_en_raw.split("\n") if t.strip()]

                obj.project_note = request.POST.get("project_note", obj.project_note)
                obj.project_note_en = request.POST.get("project_note_en", obj.project_note_en)
                obj.project_github_rep_link = request.POST.get("project_github_rep_link", obj.project_github_rep_link)
                
                weight_raw = request.POST.get("weight")
                if weight_raw is not None:
                    try:
                        obj.weight = int(weight_raw)
                    except ValueError:
                        pass
                
                is_active_raw = request.POST.get("is_active")
                if is_active_raw is not None:
                    obj.is_active = is_active_raw.lower() in ['true', '1', 'yes']
                
                topics_raw = request.POST.get("project_topics")
                if topics_raw is not None:
                    topics_ids = json.loads(topics_raw)
                    obj.project_topics.set(ProjectTopics.objects.filter(id__in=topics_ids))
                    
                gallery_raw = request.POST.get("project_gallery")
                if gallery_raw is not None:
                    gallery_ids = json.loads(gallery_raw)
                    obj.project_gallery.set(ProjectGallery.objects.filter(id__in=gallery_ids))
            else:
                data = json.loads(request.body)
                obj.project_title = data.get("project_title", obj.project_title)
                obj.project_title_en = data.get("project_title_en", obj.project_title_en)
                obj.project_description = data.get("project_description", obj.project_description)
                obj.project_description_en = data.get("project_description_en", obj.project_description_en)
                obj.project_tags = data.get("project_tags", obj.project_tags)
                obj.project_resorce_title = data.get("project_resorce_title", obj.project_resorce_title)
                obj.project_resorce_title_en = data.get("project_resorce_title_en", obj.project_resorce_title_en)
                obj.project_resorce_list = data.get("project_resorce_list", obj.project_resorce_list)
                obj.project_resorce_list_en = data.get("project_resorce_list_en", obj.project_resorce_list_en)
                obj.project_resorce_tags = data.get("project_resorce_tags", obj.project_resorce_tags)
                obj.project_resorce_tags_en = data.get("project_resorce_tags_en", obj.project_resorce_tags_en)
                obj.project_note = data.get("project_note", obj.project_note)
                obj.project_note_en = data.get("project_note_en", obj.project_note_en)
                obj.project_github_rep_link = data.get("project_github_rep_link", obj.project_github_rep_link)
                if "weight" in data:
                    try:
                        obj.weight = int(data.get("weight", 0))
                    except ValueError:
                        pass

                if "is_active" in data:
                    obj.is_active = bool(data.get("is_active"))

                if "project_topics" in data:
                    obj.project_topics.set(ProjectTopics.objects.filter(id__in=data.get("project_topics", [])))
                if "project_gallery" in data:
                    obj.project_gallery.set(ProjectGallery.objects.filter(id__in=data.get("project_gallery", [])))

            project_icon = request.FILES.get("project_icon")
            if project_icon:
                obj.project_icon = project_icon

            obj.save()
            return JsonResponse({"message": "Projeto atualizado"})

        except MyProjects.DoesNotExist:
            return JsonResponse({"error": "Projeto não encontrado"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def put(self, request, id):
        return self.post(request, id)
        
class DeleteProjectTopicsView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = ProjectTopics.objects.get(id=id)
            obj.delete()

            return JsonResponse({"message": "Deletado com sucesso"})

        except ProjectTopics.DoesNotExist:
            return JsonResponse({"error": "Não encontrado"}, status=404)
        
class DeleteProjectGalleryView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = ProjectGallery.objects.get(id=id)

            # Remove arquivo do disco
            if obj.img:
                obj.img.delete(save=False)

            obj.delete()

            return JsonResponse({"message": "Imagem deletada"})

        except ProjectGallery.DoesNotExist:
            return JsonResponse({"error": "Imagem não encontrada"}, status=404)

class DeleteMyProjectView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = MyProjects.objects.get(id=id)
            obj.delete()

            return JsonResponse({"message": "Projeto deletado"})

        except MyProjects.DoesNotExist:
            return JsonResponse({"error": "Projeto não encontrado"}, status=404)

class ListProjectTopicsView(LoginRequiredMixin, View):

    def get(self, request):

        try:

            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 10))
            search = request.GET.get("search", "")

            queryset = ProjectTopics.objects.all().order_by("-id")

            if search:
                queryset = queryset.filter(
                    topics_title__icontains=search
                )

            paginator = Paginator(queryset, limit)
            current_page = paginator.get_page(page)

            data = []

            for obj in current_page:

                data.append({
                    "id": obj.id,
                    "topics_title": obj.topics_title,
                    "topics": obj.topics,
                })

            return JsonResponse({
                "results": data,
                "pagination": {
                    "page": current_page.number,
                    "pages": paginator.num_pages,
                    "total": paginator.count,
                    "has_next": current_page.has_next(),
                    "has_previous": current_page.has_previous(),
                }
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DetailProjectTopicsView(LoginRequiredMixin, View):

    def get(self, request, id):

        try:

            obj = ProjectTopics.objects.get(id=id)

            return JsonResponse({
                "id": obj.id,
                "topics_title": obj.topics_title,
                "topics": obj.topics,
            })

        except ProjectTopics.DoesNotExist:
            return JsonResponse({"error": "Não encontrado"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class ListProjectGalleryView(LoginRequiredMixin, View):

    def get(self, request):

        try:

            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 10))

            queryset = ProjectGallery.objects.all().order_by("-id")

            paginator = Paginator(queryset, limit)
            current_page = paginator.get_page(page)

            data = []

            for obj in current_page:

                data.append({
                    "id": obj.id,
                    "img": obj.img.url if obj.img else None,
                })

            return JsonResponse({
                "results": data,
                "pagination": {
                    "page": current_page.number,
                    "pages": paginator.num_pages,
                    "total": paginator.count,
                    "has_next": current_page.has_next(),
                    "has_previous": current_page.has_previous(),
                }
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DetailProjectGalleryView(LoginRequiredMixin, View):

    def get(self, request, id):

        try:

            obj = ProjectGallery.objects.get(id=id)

            return JsonResponse({
                "id": obj.id,
                "img": obj.img.url if obj.img else None,
            })

        except ProjectGallery.DoesNotExist:
            return JsonResponse({"error": "Imagem não encontrada"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class ListMyProjectsView(LoginRequiredMixin, View):

    def get(self, request):

        try:

            page = int(request.GET.get("page", 1))
            limit = int(request.GET.get("limit", 10))
            search = request.GET.get("search", "")

            queryset = MyProjects.objects.prefetch_related(
                "project_topics",
                "project_gallery"
            ).all().order_by("-weight", "-id")

            if search:
                queryset = queryset.filter(
                    project_title__icontains=search
                )

            paginator = Paginator(queryset, limit)
            current_page = paginator.get_page(page)

            data = []

            for obj in current_page:

                data.append({

                    "id": obj.id,
                    "weight": obj.weight,
                    "is_active": obj.is_active,

                    "project_icon": (
                        obj.project_icon.url
                        if obj.project_icon else None
                    ),

                    "project_title": obj.project_title,

                    "project_description": obj.project_description,

                    "project_tags": obj.project_tags,

                    "project_resorce_title": obj.project_resorce_title,

                    "project_resorce_list": obj.project_resorce_list,

                    "project_resorce_tags": obj.project_resorce_tags,

                    "project_note": obj.project_note,

                    "project_github_rep_link": obj.project_github_rep_link,

                    "project_topics": [
                        {
                            "id": topic.id,
                            "topics_title": topic.topics_title,
                            "topics": topic.topics
                        }
                        for topic in obj.project_topics.all()
                    ],

                    "project_gallery": [
                        {
                            "id": gallery.id,
                            "img": gallery.img.url if gallery.img else None
                        }
                        for gallery in obj.project_gallery.all()
                    ],

                    "add_on": obj.add_on.strftime("%d/%m/%Y %H:%M:%S")

                })

            return JsonResponse({
                "results": data,
                "pagination": {
                    "page": current_page.number,
                    "pages": paginator.num_pages,
                    "total": paginator.count,
                    "has_next": current_page.has_next(),
                    "has_previous": current_page.has_previous(),
                }
            })

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DetailMyProjectsView(LoginRequiredMixin, View):

    def get(self, request, id):

        try:

            obj = MyProjects.objects.prefetch_related(
                "project_topics",
                "project_gallery"
            ).get(id=id)

            return JsonResponse({

                "id": obj.id,
                "weight": obj.weight,
                "is_active": obj.is_active,

                "project_icon": (
                    obj.project_icon.url
                    if obj.project_icon else None
                ),

                "project_title": obj.project_title,
                "project_title_en": obj.project_title_en,

                "project_description": obj.project_description,
                "project_description_en": obj.project_description_en,

                "project_tags": obj.project_tags,

                "project_resorce_title": obj.project_resorce_title,
                "project_resorce_title_en": obj.project_resorce_title_en,

                "project_resorce_list": obj.project_resorce_list,
                "project_resorce_list_en": obj.project_resorce_list_en,

                "project_resorce_tags": obj.project_resorce_tags,
                "project_resorce_tags_en": obj.project_resorce_tags_en,

                "project_note": obj.project_note,
                "project_note_en": obj.project_note_en,

                "project_github_rep_link": obj.project_github_rep_link,

                "project_topics": [
                    {
                        "id": topic.id,
                        "topics_title": topic.topics_title,
                        "topics_title_en": topic.topics_title_en,
                        "topics": topic.topics,
                        "topics_en": topic.topics_en
                    }
                    for topic in obj.project_topics.all()
                ],

                "project_gallery": [
                    {
                        "id": gallery.id,
                        "img": gallery.img.url if gallery.img else None
                    }
                    for gallery in obj.project_gallery.all()
                ],

                "add_on": obj.add_on.strftime("%d/%m/%Y %H:%M:%S")

            })

        except MyProjects.DoesNotExist:
            return JsonResponse({"error": "Projeto não encontrado"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# Profile API
class UpdateProfileView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            profile = ProfileInfo.objects.first()
            if not profile:
                profile = ProfileInfo.objects.create(
                    date_birth="1990-01-01",
                    ini_date_exp="2020-01-01"
                )

            # Get text fields
            profile.name = request.POST.get("name", profile.name)
            profile.about_me = request.POST.get("about_me", profile.about_me)
            profile.about_me_en = request.POST.get("about_me_en", profile.about_me_en)
            profile.bio = request.POST.get("bio", profile.bio)
            profile.bio_en = request.POST.get("bio_en", profile.bio_en)
            profile.location = request.POST.get("location", profile.location)
            profile.location_en = request.POST.get("location_en", profile.location_en)
            profile.expertise = request.POST.get("expertise", profile.expertise)
            profile.expertise_en = request.POST.get("expertise_en", profile.expertise_en)
            profile.github_user = request.POST.get("github_user", profile.github_user)
            profile.email = request.POST.get("email", profile.email)
            profile.contact = request.POST.get("contact", profile.contact)
            profile.linkedin_link = request.POST.get("linkedin_link", profile.linkedin_link)

            date_birth = request.POST.get("date_birth")
            if date_birth:
                profile.date_birth = date_birth
            ini_date_exp = request.POST.get("ini_date_exp")
            if ini_date_exp:
                profile.ini_date_exp = ini_date_exp

            # Handle file clearing or updating
            clear_img = request.POST.get("clear_profile_img")
            if clear_img == "true":
                if profile.profile_img:
                    try:
                        profile.profile_img.delete(save=False)
                    except:
                        pass
                profile.profile_img = ""
                profile.img_zoom = 1.0
                profile.img_x = 0.0
                profile.img_y = 0.0
            else:
                img = request.FILES.get("profile_img")
                if img:
                    profile.profile_img = img

            # Handle resume clearing or updating
            clear_resume = request.POST.get("clear_resume")
            if clear_resume == "true":
                if profile.resume:
                    try:
                        profile.resume.delete(save=False)
                    except:
                        pass
                profile.resume = None
            else:
                resume_file = request.FILES.get("resume")
                if resume_file:
                    if profile.resume:
                        try:
                            profile.resume.delete(save=False)
                        except:
                            pass
                    profile.resume = resume_file

            # Handle resume_en clearing or updating
            clear_resume_en = request.POST.get("clear_resume_en")
            if clear_resume_en == "true":
                if profile.resume_en:
                    try:
                        profile.resume_en.delete(save=False)
                    except:
                        pass
                profile.resume_en = None
            else:
                resume_en_file = request.FILES.get("resume_en")
                if resume_en_file:
                    if profile.resume_en:
                        try:
                            profile.resume_en.delete(save=False)
                        except:
                            pass
                    profile.resume_en = resume_en_file


            # Handle ManyToMany tags (skills)
            tags_raw = request.POST.get("tags")
            if tags_raw:
                try:
                    tag_ids = json.loads(tags_raw)
                    profile.tags.set(Tags.objects.filter(id__in=tag_ids))
                except:
                    pass

            # Handle image adjustments
            try:
                profile.img_zoom = float(request.POST.get("img_zoom", 1.0))
                profile.img_x = float(request.POST.get("img_x", 0.0))
                profile.img_y = float(request.POST.get("img_y", 0.0))
            except (ValueError, TypeError):
                pass

            profile.save()
            return JsonResponse({"message": "Perfil atualizado com sucesso"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# Tags API
class CreateTagView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            title = request.POST.get("title", "").strip()
            fontawesome_icon = request.POST.get("fontawesome_icon", "").strip()

            if not title:
                return JsonResponse({"error": "O título é obrigatório"}, status=400)

            # Define default icon if empty
            if not fontawesome_icon:
                fontawesome_icon = "fa-solid fa-code"

            tag = Tags.objects.create(title=title, fontawesome_icon=fontawesome_icon)
            return JsonResponse({
                "id": tag.id,
                "title": tag.title,
                "fontawesome_icon": tag.fontawesome_icon
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# Experience APIs
class ListProfessionalExpView(LoginRequiredMixin, View):
    def get(self, request):
        try:
            queryset = ProfessionalExp.objects.all().order_by("-ini_date")
            data = []
            for obj in queryset:
                data.append({
                    "id": obj.id,
                    "position": obj.position,
                    "position_en": obj.position_en,
                    "work_place": obj.work_place,
                    "description": obj.description,
                    "description_en": obj.description_en,
                    "ini_date": obj.ini_date.strftime("%Y-%m-%d") if obj.ini_date else "",
                    "end_date": obj.end_date.strftime("%Y-%m-%d") if obj.end_date else "",
                    "tags": obj.tags,
                })
            return JsonResponse({"results": data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class CreateProfessionalExpView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            obj = ProfessionalExp.objects.create(
                position=data.get("position", ""),
                position_en=data.get("position_en", ""),
                work_place=data.get("work_place", ""),
                description=data.get("description", ""),
                description_en=data.get("description_en", ""),
                ini_date=data.get("ini_date") or None,
                end_date=data.get("end_date") or None,
                tags=data.get("tags", "")
            )
            return JsonResponse({"message": "Experiência criada", "id": obj.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class UpdateProfessionalExpView(LoginRequiredMixin, View):
    def put(self, request, id):
        try:
            obj = ProfessionalExp.objects.get(id=id)
            data = json.loads(request.body)
            obj.position = data.get("position", obj.position)
            obj.position_en = data.get("position_en", obj.position_en)
            obj.work_place = data.get("work_place", obj.work_place)
            obj.description = data.get("description", obj.description)
            obj.description_en = data.get("description_en", obj.description_en)
            if "ini_date" in data:
                obj.ini_date = data.get("ini_date") or None
            if "end_date" in data:
                obj.end_date = data.get("end_date") or None
            obj.tags = data.get("tags", obj.tags)
            obj.save()
            return JsonResponse({"message": "Experiência atualizada"})
        except ProfessionalExp.DoesNotExist:
            return JsonResponse({"error": "Não encontrada"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DeleteProfessionalExpView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = ProfessionalExp.objects.get(id=id)
            obj.delete()
            return JsonResponse({"message": "Experiência deletada"})
        except ProfessionalExp.DoesNotExist:
            return JsonResponse({"error": "Não encontrada"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# Formation APIs
class ListFormationView(LoginRequiredMixin, View):
    def get(self, request):
        try:
            queryset = Formation.objects.all().order_by("-weight", "-ini_date")
            data = []
            for obj in queryset:
                data.append({
                    "id": obj.id,
                    "tipe": obj.tipe,
                    "tipe_en": obj.tipe_en,
                    "title": obj.title,
                    "title_en": obj.title_en,
                    "institution": obj.institution,
                    "ini_date": obj.ini_date.strftime("%Y-%m-%d") if obj.ini_date else "",
                    "end_date": obj.end_date.strftime("%Y-%m-%d") if obj.end_date else "",
                    "certificate": obj.certificate.url if obj.certificate else None,
                    "weight": obj.weight,
                })
            return JsonResponse({"results": data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class CreateFormationView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            tipe = request.POST.get("tipe", "")
            tipe_en = request.POST.get("tipe_en", "")
            title = request.POST.get("title", "")
            title_en = request.POST.get("title_en", "")
            institution = request.POST.get("institution", "")
            ini_date = request.POST.get("ini_date") or None
            end_date = request.POST.get("end_date") or None
            certificate = request.FILES.get("certificate")
            weight_raw = request.POST.get("weight", "0")
            weight = int(weight_raw) if weight_raw and weight_raw.isdigit() else 0

            obj = Formation.objects.create(
                tipe=tipe,
                tipe_en=tipe_en,
                title=title,
                title_en=title_en,
                institution=institution,
                ini_date=ini_date,
                end_date=end_date,
                certificate=certificate,
                weight=weight
            )
            return JsonResponse({"message": "Formação criada", "id": obj.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class UpdateFormationView(LoginRequiredMixin, View):
    def post(self, request, id):
        try:
            obj = Formation.objects.get(id=id)
            obj.tipe = request.POST.get("tipe", obj.tipe)
            obj.tipe_en = request.POST.get("tipe_en", obj.tipe_en)
            obj.title = request.POST.get("title", obj.title)
            obj.title_en = request.POST.get("title_en", obj.title_en)
            obj.institution = request.POST.get("institution", obj.institution)
            if "ini_date" in request.POST:
                obj.ini_date = request.POST.get("ini_date") or None
            if "end_date" in request.POST:
                obj.end_date = request.POST.get("end_date") or None
            
            weight_raw = request.POST.get("weight")
            if weight_raw is not None:
                obj.weight = int(weight_raw) if weight_raw.isdigit() else 0
            
            certificate = request.FILES.get("certificate")
            if certificate:
                obj.certificate = certificate
            
            obj.save()
            return JsonResponse({"message": "Formação atualizada"})
        except Formation.DoesNotExist:
            return JsonResponse({"error": "Não encontrada"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DeleteFormationView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = Formation.objects.get(id=id)
            if obj.certificate:
                obj.certificate.delete(save=False)
            obj.delete()
            return JsonResponse({"message": "Formação deletada"})
        except Formation.DoesNotExist:
            return JsonResponse({"error": "Não encontrada"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

# Collaborators API & Admin Views
class AdminCollaboratorsTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/collaborators.html"

    def get(self, request):
        return render(request, self.template_name)

class ListCollaboratorsView(LoginRequiredMixin, View):
    def get(self, request):
        try:
            queryset = Collaborator.objects.all().order_by("id")
            data = []
            for obj in queryset:
                data.append({
                    "id": obj.id,
                    "name": obj.name,
                    "bio": obj.bio,
                    "bio_en": obj.bio_en,
                    "photo": obj.photo.url if obj.photo else None,
                    "portfolio_link": obj.portfolio_link,
                    "github_link": obj.github_link,
                    "role": obj.role,
                    "role_en": obj.role_en,
                })
            return JsonResponse({"results": data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class CreateCollaboratorView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            name = request.POST.get("name", "").strip()
            bio = request.POST.get("bio", "").strip()
            bio_en = request.POST.get("bio_en", "").strip()
            portfolio_link = request.POST.get("portfolio_link", "").strip()
            github_link = request.POST.get("github_link", "").strip()
            role = request.POST.get("role", "").strip()
            role_en = request.POST.get("role_en", "").strip()
            photo = request.FILES.get("photo")

            if not name or not bio or not role:
                return JsonResponse({"error": "Nome, biografia e área de atuação são obrigatórios"}, status=400)

            obj = Collaborator.objects.create(
                name=name,
                bio=bio,
                bio_en=bio_en,
                portfolio_link=portfolio_link,
                github_link=github_link,
                role=role,
                role_en=role_en,
                photo=photo
            )
            return JsonResponse({"message": "Colaborador criado com sucesso", "id": obj.id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class UpdateCollaboratorView(LoginRequiredMixin, View):
    def post(self, request, id):
        try:
            obj = Collaborator.objects.get(id=id)
            obj.name = request.POST.get("name", obj.name).strip()
            obj.bio = request.POST.get("bio", obj.bio).strip()
            obj.bio_en = request.POST.get("bio_en", obj.bio_en).strip()
            obj.portfolio_link = request.POST.get("portfolio_link", obj.portfolio_link).strip()
            obj.github_link = request.POST.get("github_link", obj.github_link).strip()
            obj.role = request.POST.get("role", obj.role).strip()
            obj.role_en = request.POST.get("role_en", obj.role_en).strip()

            clear_photo = request.POST.get("clear_photo")
            if clear_photo == "true":
                if obj.photo:
                    try:
                        obj.photo.delete(save=False)
                    except:
                        pass
                obj.photo = None
            else:
                photo = request.FILES.get("photo")
                if photo:
                    obj.photo = photo

            obj.save()
            return JsonResponse({"message": "Colaborador atualizado com sucesso"})
        except Collaborator.DoesNotExist:
            return JsonResponse({"error": "Colaborador não encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

class DeleteCollaboratorView(LoginRequiredMixin, View):
    def delete(self, request, id):
        try:
            obj = Collaborator.objects.get(id=id)
            if obj.photo:
                try:
                    obj.photo.delete(save=False)
                except:
                    pass
            obj.delete()
            return JsonResponse({"message": "Colaborador deletado com sucesso"})
        except Collaborator.DoesNotExist:
            return JsonResponse({"error": "Colaborador não encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


# GitHub Sync & Schedule Views
from django_q.models import Schedule, Task
from .tasks import sync_github_stats

class AdminGithubSyncTemplateView(LoginRequiredMixin, TemplateView):
    template_name = "admin/github_sync.html"

    def get(self, request):
        return render(request, self.template_name)


class GitHubSyncStatusView(LoginRequiredMixin, View):
    def get(self, request):
        try:
            sched = Schedule.objects.filter(func="MainApp.tasks.sync_github_stats").first()
            enabled = bool(sched)
            minutes = sched.minutes if (sched and sched.minutes) else 60
            next_run = sched.next_run.strftime("%d/%m/%Y %H:%M:%S") if (sched and sched.next_run) else "-"

            tasks = Task.objects.filter(func="MainApp.tasks.sync_github_stats").order_by("-started")[:20]
            if not tasks.exists():
                tasks = Task.objects.all().order_by("-started")[:20]

            history = []
            for t in tasks:
                history.append({
                    "id": t.id,
                    "name": t.name or t.func,
                    "started": t.started.strftime("%d/%m/%Y %H:%M:%S") if t.started else "-",
                    "stopped": t.stopped.strftime("%d/%m/%Y %H:%M:%S") if t.stopped else "-",
                    "time_taken": round(t.time_taken(), 2) if hasattr(t, 'time_taken') and callable(t.time_taken) else 0,
                    "success": t.success,
                    "result": str(t.result) if t.result else ("Erro" if not t.success else "Concluído")
                })

            return JsonResponse({
                "enabled": enabled,
                "minutes": minutes,
                "next_run": next_run,
                "history": history
            })
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


class GitHubSyncConfigView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            enabled = request.POST.get("enabled") == "true"
            minutes = int(request.POST.get("minutes", 60))

            if not enabled:
                Schedule.objects.filter(func="MainApp.tasks.sync_github_stats").delete()
                return JsonResponse({"message": "Agendamento desabilitado com sucesso."})

            sched = Schedule.objects.filter(func="MainApp.tasks.sync_github_stats").first()
            if not sched:
                sched = Schedule.objects.create(
                    name="sync_github_stats",
                    func="MainApp.tasks.sync_github_stats",
                    schedule_type=Schedule.MINUTES,
                    minutes=minutes,
                    repeats=-1,
                    next_run=timezone.now()
                )
            else:
                sched.name = "sync_github_stats"
                sched.schedule_type = Schedule.MINUTES
                sched.minutes = minutes
                sched.repeats = -1
                sched.save()

            return JsonResponse({"message": "Configurações de agendamento salvas com sucesso."})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


class GitHubSyncRunNowView(LoginRequiredMixin, View):
    def post(self, request):
        start_time = timezone.now()
        try:
            res = sync_github_stats()
            end_time = timezone.now()
            Task.objects.create(
                name="sync_github_stats",
                func="MainApp.tasks.sync_github_stats",
                started=start_time,
                stopped=end_time,
                success=True,
                result=res
            )
            return JsonResponse({"message": res})
        except Exception as e:
            end_time = timezone.now()
            Task.objects.create(
                name="sync_github_stats",
                func="MainApp.tasks.sync_github_stats",
                started=start_time,
                stopped=end_time,
                success=False,
                result=str(e)
            )
            return JsonResponse({"error": str(e)}, status=500)

        