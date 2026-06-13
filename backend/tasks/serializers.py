from rest_framework import serializers
from .models import Task
from datetime import date

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['user', 'date']  

    def validate(self, attrs):
        attrs['date'] = date.today()
        return attrs

    def create(self, validated_data):
        validated_data['date'] = date.today()
        return super().create(validated_data)