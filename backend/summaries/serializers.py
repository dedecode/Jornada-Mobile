from rest_framework import serializers
from .models import DailySummary, WeeklySummary
from datetime import date

class DailySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DailySummary
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'date', 'ai_feedback', 'suggested_topics', 'is_processed_by_ai']

    def validate(self, attrs):
        attrs['date'] = date.today()
        return attrs

    def create(self, validated_data):
        today = date.today()
        validated_data['date'] = today
        return super().create(validated_data)


class WeeklySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklySummary
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'week_start', 'week_end']

    def create(self, validated_data):
        from datetime import timedelta
        
        today = date.today()
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        week_end = week_start + timedelta(days=6)
        
        validated_data['week_start'] = week_start
        validated_data['week_end'] = week_end
        return super().create(validated_data)