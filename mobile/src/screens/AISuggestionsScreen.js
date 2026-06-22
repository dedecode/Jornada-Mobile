import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AISuggestionsScreen({ route, navigation }) {
    const { feedback, suggestedTopics } = route.params || {};

    const hasData = !!feedback;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a24" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Análise do Tutor</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.decorIconContainer}>
                    <Ionicons name="sparkles" size={40} color="#a855f7" />
                </View>

                {hasData ? (
                    <View>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Feedback Pedagógico</Text>
                            <Text style={styles.feedbackText}>{feedback}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Próximos Passos Recomendados</Text>
                        {suggestedTopics && suggestedTopics.map((topic, index) => (
                            <View key={index} style={styles.topicCard}>
                                <View style={styles.topicIconWrapper}>
                                    <Ionicons name="bulb" size={20} color="#f59e0b" />
                                </View>
                                <View style={styles.topicTextWrapper}>
                                    <Text style={styles.topicLabel}>Tópico {index + 1}</Text>
                                    <Text style={styles.topicValue}>{topic}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="alert-circle-outline" size={64} color="#b1b1b8" />
                        <Text style={styles.emptyTitle}>Sem Dados para Exibir</Text>
                        <Text style={styles.emptyText}>
                            Acesse a tela de detalhes de um de seus resumos e clique em "Analisar com Tutor de IA" para visualizar seu feedback personalizado aqui.
                        </Text>
                        <TouchableOpacity 
                            style={styles.actionBtn}
                            onPress={() => navigation.navigate('Root')}
                        >
                            <Text style={styles.actionBtnText}>Voltar para o Início</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    header: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f4',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a24',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    decorIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f5f3ff',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 8,
    },
    feedbackText: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginBottom: 16,
    },
    topicCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    topicIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fffbeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    topicTextWrapper: {
        flex: 1,
    },
    topicLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9ca3af',
        textTransform: 'uppercase',
    },
    topicValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#d97706',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    actionBtn: {
        backgroundColor: '#5a3cf3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 3,
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
