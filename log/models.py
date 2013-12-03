from django.db import models
from django.contrib.auth.models import User

class MediumBlobField(models.Field):
    description = "MediumBlob"
    def db_type(self, connection):
        return 'mediumblob'

class BlobField(models.Field):
    description = "Text"
    def db_type(self, connection):
        return 'text'

#class Verb(models.Model):
#    verb = models.CharField(max_length=30)

class ActivityLog(models.Model):
    subject = models.CharField(max_length=36)
    action = models.CharField(max_length=256) #models.ForeignKey(Verb)
    message = TextField()
    serialized = MediumBlobField()
    time = models.DateTimeField() #models.DateTimeField()

