from django.db import models
from django.conf import settings


class TransactionType(models.TextChoices):
    INCOME = 'INCOME', 'Kirim'
    EXPENSE = 'EXPENSE', 'Chiqim'


class CurrencyType(models.TextChoices):
    UZS = 'UZS', "So'm (UZS)"
    USD = 'USD', 'Dollar (USD)'
    RUB = 'RUB', 'Rubl (RUB)'


class Account(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='accounts')
    name = models.CharField(max_length=100, help_text="Masalan: Asosiy karta, Naqd pul")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=3, choices=CurrencyType.choices, default=CurrencyType.UZS)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'accounts'
        verbose_name = 'Hisob'
        verbose_name_plural = 'Hisoblar'

    def __str__(self):
        return f"{self.name} ({self.balance} {self.currency})"


class Category(models.Model):
    name = models.CharField(max_length=100, help_text="Masalan: Transport, Oziq-ovqat, Maosh")
    type = models.CharField(max_length=10, choices=TransactionType.choices, default=TransactionType.EXPENSE)

    class Meta:
        db_table = 'categories'
        verbose_name = 'Kategoriya'
        verbose_name_plural = 'Kategoriyalar'
        unique_together = ['name', 'type']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class Transaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TransactionType.choices)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CurrencyType.choices, default=CurrencyType.UZS)
    date = models.DateTimeField(help_text="Operatsiya qilingan sana va vaqt")

    comment = models.TextField(blank=True, null=True, help_text="Izoh qoldirish uchun")
    receipt_image = models.ImageField(upload_to='receipts/%Y/%m/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Tranzaksiya'
        verbose_name_plural = 'Tranzaksiyalar'
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_transaction_type_display()} | {self.amount} {self.currency} | {self.date.strftime('%Y-%m-%d')}"