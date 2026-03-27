from django.contrib import admin
from .models import Configuration


@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ["project", "configuration_type", "is_active", "created_at"]
    list_filter = ["is_active", "configuration_type"]
    search_fields = ["project__name"]
    readonly_fields = ["created_at", "updated_at"]
