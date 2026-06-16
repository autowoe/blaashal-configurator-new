from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("knowledge_base", "0002_kbchunk_embedding"),
    ]

    operations = [
        migrations.AddField(
            model_name="kbdocument",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
    ]
