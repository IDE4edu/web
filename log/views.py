# Create your views here.
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from django.utils import simplejson as json
from log.models import *
from datetime import datetime

from django.conf import settings

import hashlib
# for make_sure_path_exists
import os
import errno
import os.path

@csrf_exempt
def save_log(request):
    status = {'status': "failure", 'inserted':"0"}
    if request.method == 'POST':
        da_input = json.loads(request.body)
        
        try:
            w_id = da_input['w']
        except KeyError:
            status['message'] = "Malformed Request save_log: required workspace id missing"
            return HttpResponse(json.dumps(status), mimetype="application/json")

        try:    
            log_items = da_input['logs']
        except KeyError:
            status['message'] = "Malformed Request save_log: required logs array missing"
            return HttpResponse(json.dumps(status), mimetype="application/json")

        index = 1
        count_ok = 0
        bad_rows = list()
        for log_item in log_items:
            # can be missing
            action = log_item.get('action', '')
            message = log_item.get('message', '')
            serialized = log_item.get('serialized','')
            try:
                # time is required - skip this entry if missing
                timevalue = log_item['time']
                time = datetime.fromtimestamp(float(timevalue)/1000)
                #save it
                aLog = ActivityLog(subject=w_id, action=action, message=message, serialized=serialized, time=time)
                aLog.save()
                count_ok += 1
            except KeyError:
                bad_rows.append(index)
            index += 1
        if (len(bad_rows) != 0):    
            status['message'] = "Missing time field in log rows:" +  (','.join(map(str, bad_rows)))
        else:    
            status['status'] = "success"
        status['inserted'] = str(count_ok);    
    else:            
        status['message'] = "Bad HTTP request type: Use POST instead"
        
    return HttpResponse(json.dumps(status), mimetype="application/json")



# FLUORITE_XML_ROOTDIR from settings.py



@csrf_exempt
def save_fluorite_xml(request, wsid):
    status = {'status': "failure"}
    if request.method != 'POST':
        status['message'] = "Bad HTTP request type: Use POST instead"
        return HttpResponse(json.dumps(status), mimetype="application/json")
    # TODO -- error check wsid?

    # make directory if necessary.
    da_dir = settings.FLUORITE_XML_ROOTDIR + wsid
    make_sure_path_exists(da_dir)
    try:
        da_xml = request.body
        #error check xml?
        thehash = hashlib.sha1(da_xml).hexdigest()
        da_path = da_dir + "/" + thehash
        #check if path exists, how about
        if ( os.path.isfile(da_path) ) :
            status['message'] = "Ignored: log file " + thehash + "already exists "
            status['status'] = 'ignored'
            return HttpResponse(json.dumps(status), mimetype="application/json")
        fobj = open(da_path, 'w')
        fobj.write(da_xml)
        fobj.close()
        status['status'] = "success"
    except:
        status['message'] = "Uh oh, kaboom"
        

    return HttpResponse(json.dumps(status), mimetype="application/json")



def make_sure_path_exists(path):
    try:
        os.makedirs(path)
    except OSError as exception:
        if exception.errno != errno.EEXIST:
            raise


