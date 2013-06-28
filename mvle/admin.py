from django.contrib import admin
from django.forms import ModelForm
from mvle.models import Bs_Content, Visit, Bs_State, Bs_User


class BrainstormContentAdmin(admin.ModelAdmin):
    list_display = ('nodeId', 'name', 'json')
#    form = BrainstormContentForm

class VisitAdmin(admin.ModelAdmin):
    list_display = ('id','nodeId', 'userId', 'periodId', 'visitStartTime', 'visitEndTime', 'json')
    
class StateAdmin(admin.ModelAdmin):
    list_display = ('visit', 'nodeId', 'userId', 'json')

class UserDisplay(admin.ModelAdmin):
    list_display = ('userName','userId','TA','periodId','periodName','teacherId','studentIdentifier')

admin.site.register(Bs_Content, BrainstormContentAdmin)
admin.site.register(Visit, VisitAdmin)
admin.site.register(Bs_State, StateAdmin)
admin.site.register(Bs_User, UserDisplay)



## we should validate the json input, eh
#class BrainstormContentForm(ModelForm):
#    class Meta:
#        model = Bs_Content
#    
#    def clean_json(self):
#        #validate json string
#        thejson = self.cleaned_data["json"]
#        ummm...
        