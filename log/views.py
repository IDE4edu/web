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
                action = log_item['action']
                message = log_item['message']
                serialized = log_item['serialized']
                time = datetime.fromtimestamp(float(log_item['time'])/1000)
                aLog = ActivityLog(subject=w_id, action=action, message=message, serialized=serialized, time=time)
                aLog.save()
            
            status['status'] = "success"

        except KeyError as e:
            status['message'] = "Malformed Request"
    else:            
        status['message'] = "Bad HTTP request type: Use POST instead"

    return HttpResponse(json.dumps(status), mimetype="application/json")
