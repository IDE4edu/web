# Create your views here.
from django.http import HttpResponse, HttpResponseNotFound
from django.utils import simplejson
from django.shortcuts import render_to_response
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from mvle import models
import md5
import os

from django.core import serializers 



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
    # 0 is "anonymous" in the DB, lets allow it
    # will be None is 0 not in database!
    if (userId is not None) :
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
        # userId 0 doesn't exist in db, yo -- make 'anonymous'
        return error_response("Who are you?")
    

@csrf_exempt
def process_unknown_type(request):
    return error_response("Unknown step type")



## returns brainstormstate from this nodeId for users passed in (in this periodId)
# params
#  inOrder -- always true, so earliest should come first!
#  nodeId
#  periodId
#  type  -- 'brainstorm
#  userId   colon separated, first one is user, other ones are classmates.
@csrf_exempt
def bs_getStudentData(request, nodeId):
    R_nodeId = validate_int(request.REQUEST.get('nodeId'),0)
    R_periodId = validate_int(request.REQUEST.get('periodId'), 0)
    userIdString = request.REQUEST.get('userId')
    userIds = map(validate_int, userIdString.split(':'))

    if (validate_int(nodeId,0) != R_nodeId) :
        return error_response("I'm broke real bad, Pa -- nodeIds conflict: " + str(validate_int(nodeId,0)) + ":" + str(R_nodeId))
    
    userId = userIds[0]
    # could use userId and periodId to find foreign key visits, rather than userIdList
    states = models.Bs_State.objects.filter(nodeId=nodeId, userId__in=userIds)

    out = list()
    for state in states:
        out.append(state.json)
        
    return HttpResponse(simplejson.dumps(out), "application/json")


# only one visit for a given userId/nodeId/startTime? combo ... ?   hm.
# gets params
#  nodeId, 
#  userId, (gotten from request, or normal way)
#  userId_fromClass (gotten from classInfo stuff)
#  type (= BS)
#  json (node visit json)
#  visitStartTime: an int
#  visitEndTiem: probably null
@csrf_exempt
def bs_pushStudentVisit(request, nodeId):
    vdata = {}
    vdata['nodeId'] = validate_int(nodeId,0)
    vdata['userId'] = validate_int(request.REQUEST.get('userId'),0)
    R_userId_FromClass = validate_int(request.REQUEST.get('userId_fromClass'),0)
    R_nodeId = validate_int(request.REQUEST.get('nodeId'),0)
    vdata['periodId'] = validate_int(request.REQUEST.get('periodId'), 0)
    vdata['type'] = "brainstorm"
    vdata['visitStartTime'] = validate_int(request.REQUEST.get('visitStartTime')) 
    vdata['visitEndTime'] = validate_int(request.REQUEST.get('visitEndTime'),0)
    vdata['json'] = request.REQUEST.get('json', None)
    
    if (vdata['nodeId'] != R_nodeId) :
        return error_response("I'm broke real bad, Pa -- nodeIds conflict: " + str(vdata['nodeId']) + ":" + str(R_nodeId))
    if (vdata['userId'] != R_userId_FromClass):
        return error_response("I'm broke real bad, Pa -- userIds conflict: " + str(vdata['userId'])  + ":" + str(R_userId_FromClass))
    #return HttpResponse(simplejson.dumps(vdata), "application/json")

    v = models.Visit(**vdata)
    v.save();
    return HttpResponse("visit post successful, id: " + str(v.id),"application/json")


# gets a json array of nodeVisits, or nodeState? huh
@csrf_exempt
def bs_pushStudentState(request, nodeId):
    sdata = {}
    vdata = {}
    sdata['nodeId'] = validate_int(nodeId, 0)
    vdata['nodeId'] = sdata['nodeId']
    sdata['userId'] = validate_int(request.REQUEST.get('userId'), 0)
    vdata['userId'] = sdata['userId']
    R_nodeId = validate_int(request.REQUEST.get('nodeId'),0)
    sdata['json'] = request.REQUEST.get('json')
    
    if (sdata['nodeId'] != R_nodeId) :
        return error_response("I'm in a bad state, Pa -- nodeIds conflict: " + str(vdata['nodeId']) + ":" + str(R_nodeId))

    # get the visit with the latest start time...  could have the id, that'd be easier, yo
    v = models.Visit.objects.filter(**vdata).latest('visitStartTime')
    sdata['visit'] = v;
    
    s = models.Bs_State(**sdata)
    s.save()

    return HttpResponse("state post successful, id: " + str(s.id), "application/json")




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
    # a single BrainstormState json objects with userId/nodeId
    #  (in actuality, just get the latest one)
    nodeId = validate_int(nodeId)
    userId = validate_int(userId)
    try:
        states = models.Bs_State.objects.filter(userId=userId).filter(nodeId=nodeId)
        state = states[states.count() - 1]
    except:
        return simplejson.dumps([])
    return simplejson.dumps(state.json)



# probably need a runId here at some point, eh?  Right now, just based on userId we are
# going to be able to determine classmate ids in this students group, names, etc.
def getUserInfo(userId):
    userId=validate_int(userId)
    if (not(bs_user_exists(userId))):
        return "{}";
    user = models.Bs_User.objects.get(userId=userId)
    # gotta make some crazy ass json structure that Wise4 demands - see DataModelTemplate/userInfo.json
    
    myUserInfo = makeUserInfoDict(userId=user.userId, 
                                  userName=user.userName,
                                  periodId=user.periodId,
                                  periodName=user.periodName,
                                  studentIdentifier=user.studentIdentifier,
                                  )
    if (user.teacherId):
        teacherUserInfo = makeTeacherInfoDict(user.teacherId.userId, 
                                              user.teacherId.userName)
    else:
        teacherUserInfo = {}
    periodId = user.periodId
    classmates = models.Bs_User.objects.filter(periodId=periodId)
    classmateUserInfos = list()
    sharedTeacherUserInfos = list()
    for classmate in classmates:
        if (classmate.TA):
            sharedTeacherUserInfos.append(makeTeacherInfoDict(userId=classmate.userId,
                                                              userName=classmate.userName,
                                                              ))
        else:
            classmateUserInfos.append(makeUserInfoDict(userId=classmate.userId,
                                                       userName=classmate.userName,
                                                       periodId=classmate.periodId,
                                                       periodName=classmate.periodName,
                                                       studentIdentifier=classmate.studentIdentifier,
                                                       ))
    myClassInfo = {'classmateUserInfos':classmateUserInfos,
                   'sharedTeacherUserInfos':sharedTeacherUserInfos,
                   'teacherUserInfo':teacherUserInfo,
                   }
    myUserInfo['myClassInfo']=myClassInfo
    result = {'myUserInfo':myUserInfo}
    return simplejson.dumps(result)



def bs_getStudentDataURL(nodeId):
    url = settings.SITE_URL + "mvle/bs/" + nodeId + "/getStudentData/"
    return url

def bs_pushStudentVisitsURL(nodeId):
    url = settings.SITE_URL + "mvle/bs/" + nodeId + "/pushStudentVisit/"
    return url

def bs_pushStudentStateURL(nodeId):
    url = settings.SITE_URL + "mvle/bs/" + nodeId + "/pushStudentState/"
    return url


## user

def bs_user_exists(userId):
    try:
        userId = int(userId)
        if (models.Bs_User.objects.filter(userId=userId).exists()):
            return True
        else:
            return False
    except:
        return False



def getUserId(request, default):
    userId = validate_int(request.REQUEST.get('z'), default)
    if (not(bs_user_exists(userId))):
        if (bs_user_exists(default)):
            userId = default;
        else:
            return None
    
    # moodle inserts code to make sure server is who we think it is
    #  MOODLE_PASS is pre-generated, and lame
    #  ignore this for now
    code = str(request.REQUEST.get('c', 0))
    Xcode = str(md5.new(get_client_ip(request) + settings.MOODLE_PASS).digest())
    
    # also inserted by moodle; we'll require this, but it will often be empty
    identifier = str(request.REQUEST.get('n', None))
    Xidentifier = str(getUserIdentifier(userId))
    if (identifier == ""):
        identifier = None;
    if (Xidentifier == ""):
        Xidentifier = None;  
    #if ((code == Xcode) and (identifier == Xidentifier)):
    if (identifier == Xidentifier):
        return userId
    else:
        return default;



def getUserName(userId):
    if (userId == 1):
        return "joe"
    elif (userId == 2):
        return "mary"
    return "sam"


def getUserIdentifier(userId):
    try:
        user = models.Bs_User.objects.get(userId=userId)
        return user.studentIdentifier
    except:
        raise Exception("here")
        return None;


def makeUserInfoDict(userId, userName, periodId, periodName, studentIdentifier):
    result = {'workgroupId':userId,
              'userName':userName,
              'periodId':periodId,
              'periodName':periodName,
              'studentIds':studentIdentifier,
              }
    return result

def makeTeacherInfoDict(userId, userName):
    result = {'workgroupId':userId, 'userName':userName}
    return result


# util

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[-1].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def validate_int(input, return_on_error=None):
    try:
         value = int(input)
    except:
        return return_on_error
    return value


def error_response(msg):
    return HttpResponseNotFound(msg)
    
