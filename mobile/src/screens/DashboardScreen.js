import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    // Dados estáticos das trilhas baseados no mockup do Figma
    const trilhas = [
        { id: 1, title: 'Desenvolvimento Web', icon: 'code-slash', color: '#5a3cf3', bgColor: '#eeebff', count: 12 },
        { id: 2, title: 'Ciência de Dados', icon: 'bar-chart', color: '#10b981', bgColor: '#e6fcf5', count: 8 },
        { id: 3, title: 'Inglês', icon: 'language', color: '#f59e0b', bgColor: '#fffbeb', count: 6 },
        { id: 4, title: 'Estruturas de Dados', icon: 'cube', color: '#3b82f6', bgColor: '#eff6ff', count: 5 },
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header "Olá, Lara!" */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Olá, Lara! 👋</Text>
                        <Text style={styles.subWelcomeText}>Bora continuar aprendendo hoje?</Text>
                    </View>
                    <TouchableOpacity style={styles.notificationButton}>
                        <Ionicons name="notifications-outline" size={24} color="#1a1a24" />
                        <View style={styles.badge} />
                    </TouchableOpacity>
                </View>

                {/* Seção Suas Trilhas */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Suas trilhas</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>Ver todas</Text>
                    </TouchableOpacity>
                </View>

                {trilhas.map((trilha) => (
                    <TouchableOpacity key={trilha.id} style={styles.trilhaCard} activeOpacity={0.7}>
                        <View style={styles.trilhaLeft}>
                            <View style={[styles.iconWrapper, { backgroundColor: trilha.bgColor }]}>
                                <Ionicons name={trilha.icon} size={20} color={trilha.color} />
                            </View>
                            <View style={styles.trilhaTextWrapper}>
                                <Text style={styles.trilhaTitle}>{trilha.title}</Text>
                                <Text style={styles.trilhaCount}>{trilha.count} temas</Text>
                            </View>
                        </View>
                        <Ionicons name="ellipsis-horizontal" size={20} color="#b1b1b8" />
                    </TouchableOpacity>
                ))}

                {/* Seção Ações Rápidas */}
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Ações rápidas</Text>
                <View style={styles.actionsRow}>
                    {/* Botão 1: Criar resumo */}
                    <TouchableOpacity 
                        style={styles.actionCard} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('CreateSummary')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#eeebff' }]}>
                            <Ionicons name="add" size={24} color="#5a3cf3" />
                        </View>
                        <Text style={styles.actionText}>Criar resumo</Text>
                    </TouchableOpacity>

                    {/* Botão 2: Tutor de IA */}
                    <TouchableOpacity 
                        style={styles.actionCard} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ActiveRecallQuiz')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#f5f3ff' }]}>
                            <Ionicons name="sparkles" size={22} color="#a855f7" />
                        </View>
                        <Text style={styles.actionText}>Tutor de IA</Text>
                    </TouchableOpacity>

                    {/* Botão 3: Nova trilha */}
                    <TouchableOpacity 
                        style={styles.actionCard} 
                        activeOpacity={0.8}
                        onPress={() => alert('Nova trilha: Funcionalidade de modelagem futura!')}
                    >
                        <View style={[styles.actionIconWrapper, { backgroundColor: '#eef2f6' }]}>
                            <Ionicons name="folder-open" size={20} color="#64748b" />
                        </View>
                        <Text style={styles.actionText}>Nova trilha</Text>
                    </TouchableOpacity>
                </View>

                {/* Seção Recentes */}
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Recentes</Text>
                <TouchableOpacity 
                    style={styles.recentCard} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('SummariesList')}
                >
                    <View style={styles.recentLeft}>
                        <View style={styles.recentIconWrapper}>
                            <Ionicons name="document-text-outline" size={22} color="#5a3cf3" />
                        </View>
                        <View style={styles.recentTextWrapper}>
                            <Text style={styles.recentTitle}>APIs REST</Text>
                            <Text style={styles.recentMeta}>Resumo • Hoje</Text>
                        </View>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#b1b1b8" />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    container: { padding: 20, paddingBottom: 40 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10
    },
    welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#1a1a24' },
    subWelcomeText: { fontSize: 14, color: '#6b7280', marginTop: 4 },
    notificationButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    badge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444'
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a24' },
    seeAllText: { fontSize: 14, color: '#5a3cf3', fontWeight: '600' },
    trilhaCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    trilhaLeft: { flexDirection: 'row', alignItems: 'center' },
    iconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trilhaTextWrapper: { marginLeft: 16 },
    trilhaTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a24' },
    trilhaCount: { fontSize: 13, color: '#6b7280', marginTop: 2 },
    actionsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    actionCard: {
        width: (width - 60) / 3,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    actionText: { fontSize: 12, fontWeight: 'bold', color: '#1a1a24', textAlign: 'center' },
    recentCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    recentLeft: { flexDirection: 'row', alignItems: 'center' },
    recentIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#eeebff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    recentTextWrapper: { marginLeft: 16 },
    recentTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a24' },
    recentMeta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});