from django.db import models

# Create your models here.

STEP_TYPES = (
              ('BS', 'Brainstorm'),
              )


class Bs_Content(models.Model):
    nodeId = models.AutoField(primary_key=True)
    name = models.CharField(max_length=256)
    json = models.TextField()
    
    class Meta:
        verbose_name = 'Brainstorm Content'
        verbose_name_plural = 'Brainstorm Content'



class Visit(models.Model):
    type = models.CharField(max_length=2, choices=STEP_TYPES)
    periodId = models.IntegerField()
    userId = models.IntegerField()
    nodeId = models.IntegerField()
    visitStartTime = models.DateTimeField()
    visitEndTime = models.DateTimeField()
    
    
    
class Bs_State(models.Model):
    visit = models.ForeignKey(Visit)
    json = models.TextField()
    
    
    
    
    