from django.urls import reverse_lazy
from django.views.generic import ListView, TemplateView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from .forms import TransactionForm, AccountForm
from .models import Transaction, TransactionType, Account


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
        if t_type:
            initial['transaction_type'] = t_type
        return initial

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