from django.urls import path
from .views import *

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard'),
    path('reports/', TransactionReportView.as_view(), name='transaction_report'),

]