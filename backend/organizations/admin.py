from django.contrib import admin
from .models import Organization


class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email")
    search_fields = ("name", "email")


admin.site.register(Organization, OrganizationAdmin)
