from django.apps import AppConfig


class TarefasConfig(AppConfig):
    name = 'apps.tarefas'

    def ready(self):
        import apps.tarefas.signals  # noqa
