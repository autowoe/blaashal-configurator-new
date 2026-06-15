from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from projects.models import Project, ProjectStatusEvent


@receiver(pre_save, sender=Project)
def detect_status_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Project.objects.get(pk=instance.pk)
    except Project.DoesNotExist:
        return
    if old.status != instance.status:
        instance._status_changed = True
        instance._old_status = old.status


@receiver(post_save, sender=Project)
def record_status_event(sender, instance, created, **kwargs):
    if created:
        ProjectStatusEvent.objects.create(
            project=instance,
            from_status=None,
            to_status=instance.status,
            changed_by=instance.created_by,
        )
    elif getattr(instance, "_status_changed", False):
        ProjectStatusEvent.objects.create(
            project=instance,
            from_status=instance._old_status,
            to_status=instance.status,
            changed_by=getattr(instance, "_changed_by", None),
        )
