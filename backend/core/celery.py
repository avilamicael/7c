import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'processar-lembretes-tarefas': {
        'task': 'apps.tarefas.tasks.processar_lembretes',
        'schedule': crontab(minute='*/5'),
    },
    'processar-vencimentos-tarefas': {
        'task': 'apps.tarefas.tasks.processar_vencimentos',
        'schedule': crontab(hour=8, minute=0),  # todo dia às 08:00
    },
}