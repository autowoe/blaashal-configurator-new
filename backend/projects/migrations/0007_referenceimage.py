from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0006_project_image"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReferenceImage",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("image", models.ImageField(upload_to="reference_images/")),
                ("name", models.CharField(blank=True, max_length=255)),
            ],
            options={
                "abstract": False,
            },
        ),
    ]
