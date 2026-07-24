from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.contrib.postgres.fields import ArrayField


class UserManager(BaseUserManager):
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("O usuário precisa de um email")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=150, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email
    
class ProjectTopics(models.Model):
    id = models.BigAutoField(primary_key=True)
    topics_title = models.CharField(max_length=255)
    topics_title_en = models.CharField(max_length=255, null=True, blank=True)
    topics = ArrayField(models.CharField(max_length=255))
    topics_en = ArrayField(models.CharField(max_length=255), null=True, blank=True)

class ProjectGallery(models.Model):
    id = models.BigAutoField(primary_key=True)
    img = models.ImageField(upload_to="gallery/")

class MyProjects(models.Model):

    id = models.BigAutoField(primary_key=True)
    project_icon = models.ImageField(null=True, upload_to="icons/")
    project_title = models.CharField(max_length=255)
    project_title_en = models.CharField(max_length=255, null=True, blank=True)
    project_description = models.TextField(null=True)
    project_description_en = models.TextField(null=True, blank=True)
    project_topics = models.ManyToManyField(ProjectTopics, blank=True)
    project_tags = ArrayField(models.CharField(max_length=255), null=True)
    project_resorce_title = models.CharField(max_length=255)
    project_resorce_title_en = models.CharField(max_length=255, null=True, blank=True)
    project_resorce_list = ArrayField(models.CharField(max_length=255))
    project_resorce_list_en = ArrayField(models.CharField(max_length=255), null=True, blank=True)
    project_resorce_tags = ArrayField(models.CharField(max_length=255))
    project_resorce_tags_en = ArrayField(models.CharField(max_length=255), null=True, blank=True)
    project_note = models.TextField(null=True)
    project_note_en = models.TextField(null=True, blank=True)
    project_github_rep_link = models.TextField(null=True)
    project_gallery = models.ManyToManyField(ProjectGallery, blank=True)
    weight = models.IntegerField(default=0)
    add_on = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=False)

class Tags(models.Model):
    title = models.CharField(max_length=255)
    fontawesome_icon = models.CharField(max_length=255)

class ProfileInfo(models.Model):

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, blank=True)
    about_me = models.TextField(blank=True)
    about_me_en = models.TextField(blank=True, null=True)
    profile_img = models.ImageField(blank=True)
    bio = models.TextField(blank=True)
    bio_en = models.TextField(blank=True, null=True)
    topics = models.CharField(max_length=255, blank=True)
    tags = models.ManyToManyField(Tags, blank=True)
    location = models.TextField(blank=True)
    location_en = models.TextField(blank=True, null=True)
    expertise = models.CharField(max_length=255, blank=True)
    expertise_en = models.CharField(max_length=255, blank=True, null=True)
    github_user = models.CharField(max_length=255, blank=True)
    email = models.CharField(max_length=255, blank=True)
    date_birth = models.DateField(blank=True)
    ini_date_exp = models.DateField(blank=True)
    contact = models.CharField(max_length=255, blank=True)
    linkedin_link = models.CharField(max_length=255, blank=True)
    img_zoom = models.FloatField(default=1.0, null=True, blank=True)
    img_x = models.FloatField(default=0.0, null=True, blank=True)
    img_y = models.FloatField(default=0.0, null=True, blank=True)
    resume = models.FileField(upload_to="resumes/", blank=True, null=True)


class ProfessionalExp(models.Model):

    id = models.BigAutoField(primary_key=True)
    position = models.CharField(max_length=255, blank=True)
    position_en = models.CharField(max_length=255, blank=True, null=True)
    work_place = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    description_en = models.TextField(blank=True, null=True)
    ini_date = models.DateField(blank=True)
    end_date = models.DateField(blank=True, null=True)
    tags = models.TextField(blank=True)

class Formation(models.Model):

    id = models.BigAutoField(primary_key=True)
    tipe = models.CharField(max_length=255, blank=True)
    tipe_en = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255, blank=True)
    title_en = models.CharField(max_length=255, blank=True, null=True)
    institution = models.CharField(max_length=255, blank=True)
    ini_date = models.DateField(blank=True)
    end_date = models.DateField(blank=True, null=True)
    certificate = models.ImageField(blank=True, upload_to="certifications/")
    weight = models.IntegerField(default=0)


class AccessLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    ip_address = models.CharField(max_length=45)
    user_agent = models.TextField(blank=True, null=True)
    accessed_at = models.DateTimeField(auto_now_add=True)
    page_path = models.CharField(max_length=255, default="/")

    class Meta:
        ordering = ["-accessed_at"]

    def __str__(self):
        return f"{self.ip_address} - {self.page_path} ({self.accessed_at})"

class Collaborator(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    bio = models.TextField()
    bio_en = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to="collaborators/", blank=True, null=True)
    portfolio_link = models.CharField(max_length=255, blank=True, null=True)
    github_link = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=255)
    role_en = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name