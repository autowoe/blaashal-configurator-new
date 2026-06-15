from django.db import models
from django.contrib.auth import get_user_model

from core.models import TimeStampedModel

User = get_user_model()


class KbFolder(TimeStampedModel):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class KbDocument(TimeStampedModel):
    class Status(models.TextChoices):
        INDEXED = "indexed", "Geïndexeerd"
        REFERENCE = "reference", "Referentie"
        ERROR = "error", "Fout"

    folder = models.ForeignKey(
        KbFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="documents",
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="knowledge_base/")
    file_ext = models.CharField(max_length=20)
    file_size = models.PositiveBigIntegerField()
    extracted_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.INDEXED
    )
    error_message = models.TextField(blank=True)
    chunk_count = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    def __str__(self):
        return self.name


class KbChunk(models.Model):
    document = models.ForeignKey(
        KbDocument, on_delete=models.CASCADE, related_name="chunks"
    )
    chunk_index = models.PositiveIntegerField()
    chunk_label = models.CharField(max_length=100, blank=True)
    text = models.TextField()
    term_frequencies = models.JSONField(default=dict)
    word_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["chunk_index"]


class KbSession(TimeStampedModel):
    title = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL
    )

    def __str__(self):
        return self.title or f"Sessie {self.pk}"


class KbMessage(models.Model):
    session = models.ForeignKey(
        KbSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10)  # user | assistant
    content = models.TextField()
    sources = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
