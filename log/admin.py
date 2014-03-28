from django.contrib import admin
from log.models import *

class LogAdmin(admin.ModelAdmin):
    list_display = ('subject', 'action', 'time')


admin.site.register(ActivityLog, LogAdmin)
