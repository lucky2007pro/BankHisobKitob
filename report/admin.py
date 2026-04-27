from django.contrib import admin
from .models import Account, Category, Transaction

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'balance', 'created_at')
    list_filter = ('user',)
    search_fields = ('name', 'user__username')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'type')
    list_filter = ('type',)
    search_fields = ('name',)

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_type', 'user', 'amount', 'account', 'category', 'date')
    list_filter = ('user', 'transaction_type', 'date', 'account', 'category')
    search_fields = ('comment', 'user__username', 'account__name', 'category__name')
    date_hierarchy = 'date'
