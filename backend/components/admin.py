from django.contrib import admin
from .models import ConfigurationType, Component, ComponentPrice


@admin.register(ConfigurationType)
class ConfigurationTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at"]
    search_fields = ["name"]


@admin.register(Component)
class ComponentAdmin(admin.ModelAdmin):
    list_display = ["name", "order"]
    search_fields = ["name"]
    ordering = ["order"]


@admin.register(ComponentPrice)
class ComponentPriceAdmin(admin.ModelAdmin):
    list_display = ["component", "configuration_type", "inkoop", "verkoop"]
    list_filter = ["configuration_type"]
    search_fields = ["component__name"]
