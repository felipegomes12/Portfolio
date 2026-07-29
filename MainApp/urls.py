from django.urls import path
from .views import *

urlpatterns = [
    path("", HomeTemplateView.as_view(), name="Home"),
    path("doom/", DoomTemplateView.as_view(), name="Doom"),
    path("privacy-policy/", PrivacyPolicyTemplateView.as_view(), name="PrivacyPolicy"),
    path("projects/<int:id>/", ProjectDetailView.as_view(), name="ProjectDetail"),
    
    # Custom Admin Pages
    path("panel/admin/", AdminTemplateView.as_view(), name="Admin"),
    path("panel/admin/projects/", AdminProjectsTemplateView.as_view(), name="AdminProjects"),
    path("panel/admin/profile/", AdminProfileTemplateView.as_view(), name="AdminProfile"),
    path("panel/admin/experience/", AdminExperienceTemplateView.as_view(), name="AdminExperience"),
    path("panel/admin/formation/", AdminFormationTemplateView.as_view(), name="AdminFormation"),
    path("panel/admin/analytics/", AdminAnalyticsTemplateView.as_view(), name="AdminAnalytics"),
    path("panel/admin/collaborators/", AdminCollaboratorsTemplateView.as_view(), name="AdminCollaborators"),

    # API CRUD - Topics, Gallery, Projects
    path("topics/create/", CreateProjectTopicsView.as_view(), name="Topics"),
    path("projects/create", CreateMyProjectView.as_view(), name="Projects"),
    path("gallery/create/", CreateProjectGalleryView.as_view(), name="Galery"),
    path("api/topics/<int:id>/update/", UpdateProjectTopicsView.as_view()),
    path("api/topics/<int:id>/delete/", DeleteProjectTopicsView.as_view()),
    path("api/projects/<int:id>/update/", UpdateMyProjectView.as_view()),
    path("api/projects/<int:id>/delete/", DeleteMyProjectView.as_view()),
    path("api/gallery/<int:id>/update/", UpdateProjectGalleryView.as_view()),
    path("api/gallery/<int:id>/delete/", DeleteProjectGalleryView.as_view()),
    path("api/topics/list/", ListProjectTopicsView.as_view()),
    path("api/topics/details/<int:id>/", DetailProjectTopicsView.as_view()),
    path("api/gallery/list/", ListProjectGalleryView.as_view()),
    path("api/gallery/details/<int:id>/", DetailProjectGalleryView.as_view()),
    path("api/projects/list/", ListMyProjectsView.as_view()),
    path("api/project/details/<int:id>/", DetailMyProjectsView.as_view()),

    # API CRUD - Profile, Experience, Formation, Tags
    path("api/profile/update/", UpdateProfileView.as_view()),
    path("api/tags/create/", CreateTagView.as_view()),
    path("api/experience/list/", ListProfessionalExpView.as_view()),
    path("api/experience/create/", CreateProfessionalExpView.as_view()),
    path("api/experience/<int:id>/update/", UpdateProfessionalExpView.as_view()),
    path("api/experience/<int:id>/delete/", DeleteProfessionalExpView.as_view()),
    path("api/formation/list/", ListFormationView.as_view()),
    path("api/formation/create/", CreateFormationView.as_view()),
    path("api/formation/<int:id>/update/", UpdateFormationView.as_view()),
    path("api/formation/<int:id>/delete/", DeleteFormationView.as_view()),

    # API CRUD - Collaborators
    path("api/collaborators/list/", ListCollaboratorsView.as_view()),
    path("api/collaborators/create/", CreateCollaboratorView.as_view()),
    path("api/collaborators/<int:id>/update/", UpdateCollaboratorView.as_view()),
    path("api/collaborators/<int:id>/delete/", DeleteCollaboratorView.as_view()),

    # GitHub Sync & Scheduler
    path("panel/admin/github-sync/", AdminGithubSyncTemplateView.as_view(), name="AdminGithubSync"),
    path("api/github-sync/status/", GitHubSyncStatusView.as_view()),
    path("api/github-sync/config/", GitHubSyncConfigView.as_view()),
    path("api/github-sync/run/", GitHubSyncRunNowView.as_view()),
]