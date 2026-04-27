from django import forms
from .models import Transaction, Category, Account


class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['account', 'category', 'transaction_type', 'amount', 'date', 'comment', 'receipt_image']

        widgets = {
            'date': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'placeholder': 'Summani kiriting', 'class': 'form-control'}),
            'comment': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'account': forms.Select(attrs={'class': 'form-select'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'transaction_type': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['account'].queryset = user.accounts.all()
            self.fields['category'].queryset = Category.objects.all()


class AccountForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ['name', 'balance']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Masalan: Uzcard, Naqd pul', 'class': 'form-control'}),
            'balance': forms.NumberInput(attrs={'placeholder': 'Boshlang\'ich qoldiq', 'class': 'form-control'}),
        }