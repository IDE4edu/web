from django.contrib import admin
from django.forms import ModelForm
from mvle.models import Bs_Content

class BrainstormContentAdmin(admin.ModelAdmin):
    list_display = ('nodeId', 'name', 'json')
#    form = BrainstormContentForm


admin.site.register(Bs_Content, BrainstormContentAdmin)

## we should validate the json input, eh
#class BrainstormContentForm(ModelForm):
#    class Meta:
#        model = Bs_Content
#    
#    def clean_json(self):
#        #validate json string
#        thejson = self.cleaned_data["json"]
#        ummm...
        