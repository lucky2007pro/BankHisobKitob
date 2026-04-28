from django.urls import path
from .views import DashboardView, TransactionReportView, TransactionCreateView, AccountCreateView, TransferCreateView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('reports/', TransactionReportView.as_view(), name='transaction_list'),
    path('add/', TransactionCreateView.as_view(), name='transaction_add'),
    path('transfer/', TransferCreateView.as_view(), name='transfer_add'),
    path('accounts/add/', AccountCreateView.as_view(), name='account_add'),
]