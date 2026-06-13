from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import date

class Task(models.Model):
    title = models.CharField(max_length=255)
    date = models.DateField(default=date.today)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.title} ({self.date})"
