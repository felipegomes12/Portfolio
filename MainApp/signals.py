from django.db.models.signals import post_delete
from django.dispatch import receiver
from django.db.models.signals import pre_save
from .models import ProjectGallery, MyProjects

@receiver(post_delete, sender=ProjectGallery)
def delete_gallery_image(sender, instance, **kwargs):
    if instance.img:
        instance.img.delete(save=False)

@receiver(post_delete, sender=MyProjects)
def delete_project_icon(sender, instance, **kwargs):
    if instance.project_icon:
        instance.project_icon.delete(save=False)

@receiver(pre_save, sender=ProjectGallery)
def delete_old_image_on_update(sender, instance, **kwargs):
    if not instance.pk:
        return

    try:
        old = ProjectGallery.objects.get(pk=instance.pk)
    except ProjectGallery.DoesNotExist:
        return

    if old.img and old.img != instance.img:
        old.img.delete(save=False)
