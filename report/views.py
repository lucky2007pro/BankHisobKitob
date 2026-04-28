from django.urls import reverse_lazy
from django.views.generic import ListView, TemplateView, CreateView, FormView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import transaction as db_transaction
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal, ROUND_HALF_UP

from .forms import TransactionForm, AccountForm, TransferForm
from .models import Transaction, TransactionType, Account, Category, CurrencyType


CURRENCY_TO_UZS = {
    CurrencyType.UZS: Decimal('1'),
    CurrencyType.USD: Decimal('12800'),
    CurrencyType.RUB: Decimal('140'),
}


def convert_currency(amount, from_currency, to_currency):
    if from_currency == to_currency:
        return amount

    amount_in_uzs = Decimal(amount) * CURRENCY_TO_UZS[from_currency]
    converted = amount_in_uzs / CURRENCY_TO_UZS[to_currency]
    return converted.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'dashboard.html'
    login_url = '/users/login/'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        now = timezone.now()

        transactions = user.transactions.all()

        year = self.request.GET.get('year')
        month = self.request.GET.get('month')
        day = self.request.GET.get('day')
        start_date_str = self.request.GET.get('start_date')
        end_date_str = self.request.GET.get('end_date')

        filtered_tx = transactions
        if year:
            filtered_tx = filtered_tx.filter(date__year=year)
        if month:
            filtered_tx = filtered_tx.filter(date__month=month)
        if day:
            filtered_tx = filtered_tx.filter(date__day=day)
        if start_date_str:
            filtered_tx = filtered_tx.filter(date__date__gte=start_date_str)
        if end_date_str:
            filtered_tx = filtered_tx.filter(date__date__lte=end_date_str)

        context['total_income'] = filtered_tx.filter(
            transaction_type=TransactionType.INCOME
        ).aggregate(total=Sum('amount'))['total'] or 0

        context['total_expense'] = filtered_tx.filter(
            transaction_type=TransactionType.EXPENSE
        ).aggregate(total=Sum('amount'))['total'] or 0

        context['net_balance'] = context['total_income'] - context['total_expense']

        def get_stats(start_date):
            qs = filtered_tx.filter(date__gte=start_date)
            income = qs.filter(transaction_type=TransactionType.INCOME).aggregate(Sum('amount'))['amount__sum'] or 0
            expense = qs.filter(transaction_type=TransactionType.EXPENSE).aggregate(Sum('amount'))['amount__sum'] or 0
            return income, expense

        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        context['daily_inc'], context['daily_exp'] = get_stats(today_start)

        week_start = now - timedelta(days=7)
        context['weekly_inc'], context['weekly_exp'] = get_stats(week_start)

        month_start = now.replace(day=1, hour=0, minute=0, second=0)
        context['monthly_inc'], context['monthly_exp'] = get_stats(month_start)

        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0)
        context['yearly_inc'], context['yearly_exp'] = get_stats(year_start)

        context['accounts'] = user.accounts.all()
        account_totals = {
            CurrencyType.UZS: Decimal('0.00'),
            CurrencyType.USD: Decimal('0.00'),
            CurrencyType.RUB: Decimal('0.00'),
        }
        for account in context['accounts']:
            account_totals[account.currency] += account.balance

        total_balance_uzs = Decimal('0.00')
        for currency_code, balance in account_totals.items():
            total_balance_uzs += convert_currency(balance, currency_code, CurrencyType.UZS)

        context['balance_by_currency'] = [
            {'currency': CurrencyType.UZS, 'amount': account_totals[CurrencyType.UZS]},
            {'currency': CurrencyType.USD, 'amount': account_totals[CurrencyType.USD]},
            {'currency': CurrencyType.RUB, 'amount': account_totals[CurrencyType.RUB]},
        ]
        context['total_balance_uzs'] = total_balance_uzs

        chart_labels = []
        chart_income = []
        chart_expense = []
        
        months_oz = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
        
        for i in range(5, -1, -1):
            temp_date = now - timedelta(days=i*30)
            m_idx = temp_date.month - 1
            yr = temp_date.year
            mn = temp_date.month
            
            qs_month = filtered_tx.filter(date__year=yr, date__month=mn)
            inc = qs_month.filter(transaction_type=TransactionType.INCOME).aggregate(Sum('amount'))['amount__sum'] or 0
            exp = qs_month.filter(transaction_type=TransactionType.EXPENSE).aggregate(Sum('amount'))['amount__sum'] or 0
            
            chart_labels.append(months_oz[m_idx])
            chart_income.append(float(inc))
            chart_expense.append(float(exp))
            
        context['chart_labels'] = chart_labels
        context['chart_income'] = chart_income
        context['chart_expense'] = chart_expense

        return context


class TransactionReportView(LoginRequiredMixin, ListView):
    model = Transaction
    template_name = 'report_list.html'
    context_object_name = 'transactions'
    login_url = '/users/login/'

    def get_queryset(self):
        queryset = self.request.user.transactions.all()

        year = self.request.GET.get('year')
        month = self.request.GET.get('month')
        day = self.request.GET.get('day')
        t_type = self.request.GET.get('type')
        start_date = self.request.GET.get('start_date')
        end_date = self.request.GET.get('end_date')

        if year:
            queryset = queryset.filter(date__year=year)
        if month:
            queryset = queryset.filter(date__month=month)
        if day:
            queryset = queryset.filter(date__day=day)
        if t_type:
            queryset = queryset.filter(transaction_type=t_type)
        if start_date:
            queryset = queryset.filter(date__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__date__lte=end_date)

        return queryset.order_by('-date')


class TransactionCreateView(LoginRequiredMixin, CreateView):
    model = Transaction
    form_class = TransactionForm
    template_name = 'finance/transaction_form.html'
    login_url = '/users/login/'
    success_url = reverse_lazy('dashboard')

    def get_initial(self):
        initial = super().get_initial()
        account_id = self.request.GET.get('account')
        t_type = self.request.GET.get('type')
        if account_id:
            initial['account'] = account_id
            try:
                account = Account.objects.get(pk=account_id, user=self.request.user)
                initial['currency'] = account.currency
            except Account.DoesNotExist:
                initial['currency'] = CurrencyType.UZS
        if t_type:
            initial['transaction_type'] = t_type
        return initial

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories_data'] = list(Category.objects.values('id', 'name', 'type'))
        return context

    def form_valid(self, form):
        form.instance.user = self.request.user
        transaction = form.save(commit=False)

        with db_transaction.atomic():
            account = Account.objects.select_for_update().get(pk=transaction.account_id, user=self.request.user)

            if transaction.currency != account.currency:
                form.add_error('currency', 'Tranzaksiya valyutasi hisob valyutasi bilan bir xil bo‘lishi kerak')
                return self.form_invalid(form)

            if transaction.transaction_type == TransactionType.EXPENSE:
                if transaction.amount > account.balance:
                    form.add_error('amount', "Hisobda mablag' yetarli emas!")
                    return self.form_invalid(form)
                account.balance -= transaction.amount
            else:
                account.balance += transaction.amount

            account.save()
            return super().form_valid(form)


class AccountCreateView(LoginRequiredMixin, CreateView):
    model = Account
    form_class = AccountForm
    template_name = 'finance/account_form.html'
    login_url = '/users/login/'
    success_url = reverse_lazy('dashboard')

    def form_valid(self, form):
        form.instance.user = self.request.user
        return super().form_valid(form)


class TransferCreateView(LoginRequiredMixin, FormView):
    form_class = TransferForm
    template_name = 'finance/transfer_form.html'
    login_url = '/users/login/'
    success_url = reverse_lazy('dashboard')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def get_initial(self):
        initial = super().get_initial()
        initial['date'] = timezone.now().strftime('%Y-%m-%dT%H:%M')
        return initial

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['transfer_rates'] = [
            ('1 USD', f"{CURRENCY_TO_UZS[CurrencyType.USD]:,.0f} UZS"),
            ('1 RUB', f"{CURRENCY_TO_UZS[CurrencyType.RUB]:,.2f} UZS"),
        ]
        return context

    def form_valid(self, form):
        from_account = form.cleaned_data['from_account']
        to_account = form.cleaned_data['to_account']
        amount = form.cleaned_data['amount']
        date = form.cleaned_data['date']
        comment = (form.cleaned_data.get('comment') or '').strip()

        with db_transaction.atomic():
            account_ids = sorted([from_account.pk, to_account.pk])
            locked_accounts = Account.objects.select_for_update().filter(pk__in=account_ids, user=self.request.user)
            accounts_map = {acc.pk: acc for acc in locked_accounts}
            from_locked = accounts_map.get(from_account.pk)
            to_locked = accounts_map.get(to_account.pk)

            if not from_locked or not to_locked:
                form.add_error(None, 'Hisoblar topilmadi')
                return self.form_invalid(form)

            if amount > from_locked.balance:
                form.add_error('amount', "Tanlangan hisobda mablag' yetarli emas")
                return self.form_invalid(form)

            converted_amount = convert_currency(amount, from_locked.currency, to_locked.currency)

            from_locked.balance -= amount
            to_locked.balance += converted_amount
            from_locked.save(update_fields=['balance', 'updated_at'])
            to_locked.save(update_fields=['balance', 'updated_at'])

            expense_comment = f"O‘tkazma -> {to_locked.name}"
            income_comment = f"O‘tkazma <- {from_locked.name}"

            if from_locked.currency != to_locked.currency:
                rate_info = f"Konvertatsiya: {amount} {from_locked.currency} = {converted_amount} {to_locked.currency}"
                expense_comment = f"{expense_comment}. {rate_info}"
                income_comment = f"{income_comment}. {rate_info}"

            if comment:
                expense_comment = f"{expense_comment}. {comment}"
                income_comment = f"{income_comment}. {comment}"

            Transaction.objects.create(
                user=self.request.user,
                account=from_locked,
                category=None,
                transaction_type=TransactionType.EXPENSE,
                amount=amount,
                currency=from_locked.currency,
                date=date,
                comment=expense_comment,
            )
            Transaction.objects.create(
                user=self.request.user,
                account=to_locked,
                category=None,
                transaction_type=TransactionType.INCOME,
                amount=converted_amount,
                currency=to_locked.currency,
                date=date,
                comment=income_comment,
            )

        return super().form_valid(form)