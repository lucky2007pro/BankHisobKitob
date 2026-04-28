from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report', '0003_alter_category_unique_together_remove_category_user'),
    ]

    operations = [
        migrations.AddField(
            model_name='account',
            name='currency',
            field=models.CharField(
                choices=[('UZS', "So'm (UZS)"), ('USD', 'Dollar (USD)'), ('RUB', 'Rubl (RUB)')],
                default='UZS',
                max_length=3,
            ),
        ),
        migrations.AddField(
            model_name='transaction',
            name='currency',
            field=models.CharField(
                choices=[('UZS', "So'm (UZS)"), ('USD', 'Dollar (USD)'), ('RUB', 'Rubl (RUB)')],
                default='UZS',
                max_length=3,
            ),
        ),
    ]
