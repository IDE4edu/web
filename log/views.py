# Create your views here.
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.utils import simplejson as json
from log.models import *
from datetime import datetime

@csrf_exempt
def save_log(request):
    status = {'status': "failure"}
    if request.method == 'POST':
        try:
            input = json.loads(request.body)
            w_id = input['w']
            log_items = input['logs']
            for log_item in log_items:
                verb = log_item[0] #Verb.objects.get(verb=log_item['verb'])
                object = log_item[1]
                time = datetime.fromtimestamp(float(log_item[2])/1000)
                aLog = ActivityLog(subject=w_id, verb=verb, object=object, time=time)
                aLog.save()
            
            status['status'] = "success"

        except KeyError as e:
            status['message'] = "Malformed Request"
    else:            
        status['message'] = "Bad HTTP request type: Use POST instead"

    return HttpResponse(json.dumps(status), mimetype="application/json")
