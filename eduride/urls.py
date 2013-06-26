from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView
import website



# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'eduride.views.home', name='home'),
    # url(r'^eduride/', include('eduride.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', TemplateView.as_view(template_name='website/index.html')),
    url(r'^w/', include('website.urls')),
    url(r'^log/$', 'log.views.save_log'),
    url(r'^auth/', include('auth.urls')),
    
    #######
    ## MVLE
    
    url(r'^mvle/mc/$', 'mvle.views.process_mc'),
    url(r'^mvle/$', 'mvle.views.process_unknown_type'),
    
    ## brainstorm
    # pass json in url
    url(r'^mvle/bs/$', 'mvle.views.process_bs'),
    # get a particular brainstorm step
    url(r'^mvle/bs/(?P<nodeId>\d+)/$', 'mvle.views.process_bs'),
    # brainstorm callbacks
    #url(r'^mvle/bs/(?P<cid>\d+)/content/$', 'mvle.views.bs_get_content'),
    #url(r'^mvle/bs/(?P<swid>\d+)/studentwork/$', 'mvle.views.bs_get_studentWork'),
    #url(r'^mvle/bs/(?P<userinfoid>\d+)/userinfo/$', 'mvle.views.bs_get_userInfo'),
    # brainstorm get student data
    url(r'^mvle/bs/(?P<nodeId>\d+)/getStudentData/$', 'mvle.views.bs_getStudentData'),
    url(r'^mvle/bs/(?P<nodeId>\d+)/pushStudentVisit/$', 'mvle.views.bs_pushStudentVisit'),
    url(r'^mvle/bs/(?P<nodeId>\d+)/pushStudentState/$', 'mvle.views.bs_pushStudentState'),
    
    

    
    ## assignments
    url(r'^assignment/list/$', 'assignment.views.assignment_list'),
)
