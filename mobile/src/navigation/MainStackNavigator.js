import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SummariesListScreen from '../screens/SummariesListScreen';
import CreateSummaryScreen from '../screens/CreateSummaryScreen';
import SummaryDetailScreen from '../screens/SummaryDetailScreen';
import ActiveRecallQuizScreen from '../screens/ActiveRecallQuizScreen';
import AISuggestionsScreen from '../screens/AISuggestionsScreen';
import StudentStatsScreen from '../screens/StudentStatsScreen';
import BottomTabNavigator from './BottomTabNavigator';

const Stack = createNativeStackNavigator();

export default function MainStackNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="SummariesList" component={SummariesListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateSummary" component={CreateSummaryScreen} options={{ title: 'Criar Anotação' }} />
            <Stack.Screen name="SummaryDetail" component={SummaryDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ActiveRecallQuiz" component={ActiveRecallQuizScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} options={{ title: 'Seu Tutor' }} />
            <Stack.Screen name="StudentStats" component={StudentStatsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}
