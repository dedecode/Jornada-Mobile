from django.db import models
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from django.core.exceptions import ValidationError

User = get_user_model()

class DailySummary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=False)
    content = models.TextField(blank=True)
    photo = models.ImageField(upload_to='daily_summaries/photos/', blank=True, null=True)
    date = models.DateField(default=date.today)
    
    category = models.CharField(max_length=100, default='Outros')
    
    # IA integration fields
    is_processed_by_ai = models.BooleanField(default=False, null=True, blank=True)
    ai_feedback = models.TextField(blank=True, null=True)
    suggested_topics = models.JSONField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resumo diário de {self.date} - {self.user.username}"


class WeeklySummary(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=False)
    content = models.TextField(blank=True)
    photo = models.ImageField(upload_to='weekly_summaries/photos/', blank=True, null=True)
    week_start = models.DateField()
    week_end = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id and not self.week_start and not self.week_end:
            today = date.today()
            days_since_monday = today.weekday() 
            self.week_start = today - timedelta(days=days_since_monday)
            self.week_end = self.week_start + timedelta(days=6)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Resumo semanal ({self.week_start} a {self.week_end}) - {self.user.username}"