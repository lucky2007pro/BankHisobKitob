from django import forms
from .models import Transaction, Category, Account


class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['account', 'transaction_type', 'category', 'amount', 'currency', 'date', 'comment', 'receipt_image']

        widgets = {
            'date': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'placeholder': 'Summani kiriting', 'class': 'form-control'}),
            'comment': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'account': forms.Select(attrs={'class': 'form-select'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'transaction_type': forms.Select(attrs={'class': 'form-select'}),
            'currency': forms.Select(attrs={'class': 'form-select'}),
        }

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            self.fields['account'].queryset = user.accounts.all()
            self.fields['category'].queryset = Category.objects.all()

    def clean(self):
        cleaned_data = super().clean()
        account = cleaned_data.get('account')
        transaction_type = cleaned_data.get('transaction_type')
        amount = cleaned_data.get('amount')
        currency = cleaned_data.get('currency')

        if account and currency and currency != account.currency:
            self.add_error('currency', 'Tranzaksiya valyutasi hisob valyutasi bilan bir xil bo‘lishi kerak')

        if account and transaction_type == 'EXPENSE' and amount and amount > account.balance:
            self.add_error('amount', "Hisobda mablag' yetarli emas")

        return cleaned_data


class AccountForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ['name', 'balance', 'currency']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Masalan: Uzcard, Naqd pul', 'class': 'form-control'}),
            'balance': forms.NumberInput(attrs={'placeholder': 'Boshlang\'ich qoldiq', 'class': 'form-control'}),
            'currency': forms.Select(attrs={'class': 'form-select'}),
        }


class TransferForm(forms.Form):
    from_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        label='Qaysi hisobdan',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    to_account = forms.ModelChoiceField(
        queryset=Account.objects.none(),
        label='Qaysi hisobga',
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    amount = forms.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=0.01,
        label='Summa',
        widget=forms.NumberInput(attrs={'placeholder': 'O‘tkazma summasi', 'class': 'form-control'})
    )
    date = forms.DateTimeField(
        label='Sana va vaqt',
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'})
    )
    comment = forms.CharField(
        required=False,
        label='Izoh',
        widget=forms.Textarea(attrs={'rows': 3, 'class': 'form-control'})
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        if user:
            accounts = user.accounts.all()
            self.fields['from_account'].queryset = accounts
            self.fields['to_account'].queryset = accounts

    def clean(self):
        cleaned_data = super().clean()
        from_account = cleaned_data.get('from_account')
        to_account = cleaned_data.get('to_account')
        amount = cleaned_data.get('amount')

        if from_account and to_account and from_account.pk == to_account.pk:
            self.add_error('to_account', 'O‘tkazma uchun boshqa hisobni tanlang')

        if from_account and amount and amount > from_account.balance:
            self.add_error('amount', "Tanlangan hisobda mablag' yetarli emas")

        return cleaned_data