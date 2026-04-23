from django.db import models
from django.conf import settings


class TransactionType(models.TextChoices):
    INCOME = 'INCOME', 'Kirim'
    EXPENSE = 'EXPENSE', 'Chiqim'


class Account(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='accounts'
    )
    name = models.CharField(max_length=100, help_text="Masalan: Asosiy karta, Naqd pul")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'
        verbose_name = 'Hisob'
        verbose_name_plural = 'Hisoblar'

    def __str__(self):
        return f"{self.name} ({self.balance} UZS)"


class Category(models.Model):
    """ Kirim va chiqim kategoriyalari """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    name = models.CharField(max_length=100, help_text="Masalan: Transport, Oziq-ovqat, Maosh")
    type = models.CharField(
        max_length=10,
        choices=TransactionType.choices,
        default=TransactionType.EXPENSE
    )

    class Meta:
        db_table = 'categories'
        verbose_name = 'Kategoriya'
        verbose_name_plural = 'Kategoriyalar'
        # Bir userda bir xil nomli ikkita bir xil turdagi kategoriya bo'lmasligi uchun:
        unique_together = ['user', 'name', 'type']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Transaction(models.Model):
    """ Asosiy kirim va chiqim operatsiyalari """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=10,
        choices=TransactionType.choices
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateTimeField(help_text="Operatsiya qilingan sana va vaqt")

    # Qo'shimcha ma'lumotlar
    comment = models.TextField(blank=True, null=True, help_text="Izoh qoldirish uchun")
    receipt_image = models.ImageField(upload_to='receipts/%Y/%m/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Tranzaksiya'
        verbose_name_plural = 'Tranzaksiyalar'
        ordering = ['-date']  # Eng yangilari birinchi chiqishi uchun

    def __str__(self):
        return f"{self.get_transaction_type_display()} | {self.amount} | {self.date.strftime('%Y-%m-%d')}"