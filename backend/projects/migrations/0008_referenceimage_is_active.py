from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0007_referenceimage"),
    ]

    operations = [
        migrations.AddField(
            model_name="referenceimage",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
