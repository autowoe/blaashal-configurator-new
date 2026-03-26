import django_filters
from projects.models import Status, Project
from django.db.models import Q


class ProjectFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    status = django_filters.MultipleChoiceFilter(choices=Status.choices)
    ordering = django_filters.OrderingFilter(
        fields=(
            ("name", "name"),
            ("organization__name", "organization__name"),
            ("created_at", "created_at"),
        )
    )

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(name__icontains=value) | Q(organization__name__icontains=value)
        )

    class Meta:
        model = Project
        fields = ["status"]
