from django.db import models

# Create your models here.


class Bs_Content(models.Model):
    nodeId = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    json = models.TextField()
    
    class Meta:
        verbose_name = 'Brainstorm Content'
        verbose_name_plural = 'Brainstorm Content'
        
    def __unicode__(self):
        return u'%s (%s)' % (self.name, self.nodeId)


class Visit(models.Model):
    type = models.CharField(max_length=256)
    periodId = models.IntegerField()
    userId = models.IntegerField()
    nodeId = models.IntegerField()
    visitStartTime = models.BigIntegerField(null=True)
    visitEndTime = models.BigIntegerField(null=True)
    json = models.TextField(null=True)
            
    def __unicode__(self):
        return u'Visit %s (u:%s n:%s)' % (self.id, self.userId, self.nodeId)

    
    
class Bs_State(models.Model):
    visit = models.ForeignKey(Visit)
    userId = models.IntegerField(db_index=True)
    nodeId = models.IntegerField(db_index=True)
    json = models.TextField()
    
    
## eventually going to need a classId, etc...  right now periodId needs to be unique!
class Bs_User(models.Model):
    userId = models.IntegerField(unique=True, db_index=True)
    userName = models.CharField(max_length=255)
    TA = models.BooleanField(default=False)
    periodId = models.IntegerField(db_index=True, null=True, blank=True)
    periodName = models.CharField(max_length=15, null=True, blank=True)
    studentIdentifier = models.CharField(max_length=255, null=True, blank=True)
    teacherId = models.ForeignKey('self', null=True, blank=True)
    
    def __unicode__(self):
        return u'%s (%s)' % (self.userName, self.userId)

    
    
    
    