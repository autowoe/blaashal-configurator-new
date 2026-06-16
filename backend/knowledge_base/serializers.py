from rest_framework import serializers

from core.serializers import UserSerializer
from knowledge_base.models import KbDocument, KbFolder, KbMessage, KbSession


class KbFolderSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()

    class Meta:
        model = KbFolder
        fields = ["id", "name", "document_count", "created_at"]
        read_only_fields = ["id", "created_at"]

    def get_document_count(self, obj):
        return obj.documents.count()


class KbDocumentSerializer(serializers.ModelSerializer):
    folder_name = serializers.CharField(
        source="folder.name", read_only=True, default=None
    )
    uploaded_by = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = KbDocument
        fields = [
            "id",
            "name",
            "description",
            "folder",
            "folder_name",
            "file_url",
            "file_ext",
            "file_size",
            "status",
            "error_message",
            "chunk_count",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "file_ext",
            "file_size",
            "status",
            "error_message",
            "chunk_count",
            "uploaded_by",
            "created_at",
        ]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class KbDocumentUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField()
    folder = serializers.PrimaryKeyRelatedField(
        queryset=KbFolder.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = KbDocument
        fields = ["file", "folder", "description"]
        extra_kwargs = {"description": {"required": False, "default": ""}}


class KbMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = KbMessage
        fields = ["id", "role", "content", "sources", "created_at"]


class KbSessionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = KbSession
        fields = ["id", "title", "created_by", "message_count", "created_at"]
        read_only_fields = ["id", "created_by", "created_at"]

    def get_message_count(self, obj):
        return obj.messages.count()


class KbSessionDetailSerializer(KbSessionSerializer):
    messages = KbMessageSerializer(many=True, read_only=True)

    class Meta(KbSessionSerializer.Meta):
        fields = KbSessionSerializer.Meta.fields + ["messages"]  # type: ignore[operator]
