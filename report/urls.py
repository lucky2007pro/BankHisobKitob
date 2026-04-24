from django.urls import path
from .views import DashboardView, TransactionReportView, TransactionCreateView

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('reports/', TransactionReportView.as_view(), name='transaction_list'),
    path('add/', TransactionCreateView.as_view(), name='transaction_add'),
]