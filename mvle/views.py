# Create your views here.
from django.http import HttpResponse
from django.utils import simplejson
from django.shortcuts import render_to_response
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from mvle import models
import md5
import os





# going to need refactoring for pages with mutliple interactions, yo

@csrf_exempt
def process_mc(request):
    # multiple choice request
    content = request.REQUEST.get('content', None)
    if content is None :
        return error_response("Null data parameter")
    # little bit of error checking on data might be in order, yo
    return render_to_response('mvle/single-mc.html', {'content': content})
 

@csrf_exempt
def process_bs(request, nodeId=0):
    if nodeId == 0 :
        # url didn't specify nodeId, yo
        content = request.REQUEST.get('content', None)
    else :
        content = getBrainstormContent(nodeId)
    if content is None :
        return error_response("Bad brainstorm content (" + str(nodeId) + ")")
    
    userId = getUserId(request, 0)
    if userId != 0 :
        return render_to_response('mvle/brainstorm.html', 
                              {'nodeId': nodeId, 
                               'userId': userId,
                               'getStudentDataURL': bs_getStudentDataURL(nodeId),
                               'pushStudentVisitsURL': bs_pushStudentVisitsURL(nodeId),
                               'pushStudentStateURL' : bs_pushStudentStateURL(nodeId),
                               'content': content,
                               'studentWork': getStudentWork(nodeId, userId),
                               'userInfo': getUserInfo(userId)
                               })
    else :
        # unknown user?  should do brainlite.html here maybe
        return error_response("Who are you?  Check with your teacher, please; they know these things.")
    

@csrf_exempt
def process_unknown_type(request):
    return error_response("Unknown step type")



## returns responses from other students for this nodeID in this group
@csrf_exempt
def bs_getStudentData(request, nodeId):
    # get userId and section, yo, then pull nodeVisits for that group
    return ""


# gets a json array of nodeVisits, or nodeState? huh
@csrf_exempt
def bs_pushStudentVisit(request, nodeId):
    return HttpResponse(simplejson.dumps(request),"application/json")


# gets a json array of nodeVisits, or nodeState? huh
@csrf_exempt
def bs_pushStudentState(request, nodeId):
    return HttpResponse(simplejson.dumps(request),"application/json")




#####################
# brainstorm specific

def getBrainstormContent(nodeId):

    content_queryset = models.Bs_Content.objects.filter(nodeId=nodeId)
    if (content_queryset.count() == 0):
        return None;
    
    content_json = content_queryset[0].json
    
    # testing
    #dirname = os.path.dirname(__file__)
    #with open(os.path.join(dirname, 'DataModelTemplates', 'brainstorm.json'), 'rb') as f:
    #    content_db=f.read();

    content = simplejson.loads(content_json)
    return simplejson.dumps(content)



def getStudentWork(nodeId, userId):
    # an array of BrainstormState json objects
    studentWork_db="[]"
    
    #testing
    if userId == 1 :
        studentWork_db=simplejson.dumps([])
                
    studentWork = simplejson.loads(studentWork_db)
    return simplejson.dumps(studentWork)



# probably need a runId here at some point, eh?  Right now, just based on userId we are
# going to be able to determine classmate ids in this students group, names, etc.
def getUserInfo(userId):
    # some crazy ass json structure that Wise4 demands
    userInfo_db = ""
    
    #testing
    if userId==1:
        dirname = os.path.dirname(__file__)
        with open(os.path.join(dirname, 'DataModelTemplates', 'userInfo.json'), 'rb') as f:
            userInfo_db = f.read()
    
    userInfo = simplejson.loads(userInfo_db)
    return simplejson.dumps(userInfo)



def bs_getStudentDataURL(nodeId):
    url = settings.SITE_URL + "mlve/bs/" + nodeId + "/getStudentData/"
    return url

def bs_pushStudentVisitsURL(nodeId):
    url = settings.SITE_URL + "mlve/bs/" + nodeId + "/pushStudentVisit/"
    return url

def bs_pushStudentStateURL(nodeId):
    url = settings.SITE_URL + "mlve/bs/" + nodeId + "/pushStudentState/"
    return url


## user

def getUserId(request, default):
    userId = int(request.REQUEST.get('z', 0))
    code = request.REQUEST.get('c', 0)
    Xcode = md5.new(get_client_ip(request) + settings.MOODLE_PASS).digest()
    identifier = request.REQUEST.get('n', 0)
    Xidentifier = getUserIdentifier(userId)
    if ((code == Xcode) and (identifier == Xidentifier)):
        return userId
    else:
        # to change!!
        return userId



def getUserName(userId):
    if (userId == 1):
        return "joe"
    elif (userId == 2):
        return "mary"
    return "sam"


def getUserIdentifier(userId):
    return ""



# util

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[-1].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def error_response(msg):
    return HttpResponse("Yoiks: " + msg)
    