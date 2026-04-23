from django.urls import reverse_lazy
from django.views.generic import ListView, TemplateView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from .forms import TransactionForm
from .models import Transaction, TransactionType


class DashboardView(LoginRequiredMixin, TemplateView):
    template_name = 'finance/dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        now = timezone.now()

        transactions = user.transactions.all()

        context['total_income'] = transactions.filter(
            transaction_type=TransactionType.INCOME
        ).aggregate(total=Sum('amount'))['total'] or 0

        context['total_expense'] = transactions.filter(
            transaction_type=TransactionType.EXPENSE
        ).aggregate(total=Sum('amount'))['total'] or 0

        context['net_balance'] = context['total_income'] - context['total_expense']

        def get_stats(start_date):
            qs = transactions.filter(date__gte=start_date)
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

        return context


class TransactionReportView(LoginRequiredMixin, ListView):
    model = Transaction
    template_name = 'finance/report_list.html'
    context_object_name = 'transactions'

    def get_queryset(self):
        queryset = self.request.user.transactions.all()

        year = self.request.GET.get('year')
        month = self.request.GET.get('month')
        t_type = self.request.GET.get('type')

        if year:
            queryset = queryset.filter(date__year=year)
        if month:
            queryset = queryset.filter(date__month=month)
        if t_type:
            queryset = queryset.filter(transaction_type=t_type)

        return queryset.order_by('-date')


class TransactionCreateView(LoginRequiredMixin, CreateView):
    model = Transaction
    form_class = TransactionForm
    template_name = 'finance/transaction_create.html'
    success_url = reverse_lazy('dashboard')

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        form.instance.user = self.request.user

        transaction = form.save(commit=False)
        account = transaction.account

        if transaction.transaction_type == TransactionType.INCOME:
            account.balance += transaction.amount
        else:
            account.balance -= transaction.amount

        account.save()  # Hamyon balansini yangilaymiz
        return super().form_valid(form)