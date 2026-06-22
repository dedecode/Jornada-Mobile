import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('summaries/daily/');
            const data = response.data.results ? response.data.results : response.data;
            setNotes(data);
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchDashboardData();
        });
        return unsubscribe;
    }, [navigation]);

    // Definição das trilhas/categorias do Figma com contagem dinâmica
    const categoriesMetadata = [
        { id: 'web', title: 'Desenvolvimento Web', icon: 'code-slash', color: '#5a3cf3', bgColor: '#eeebff' },
        { id: 'data', title: 'Ciência de Dados', icon: 'bar-chart', color: '#10b981', bgColor: '#e6fcf5' },
        { id: 'english', title: 'Inglês', icon: 'language', color: '#f59e0b', bgColor: '#fffbeb' },
        { id: 'structures', title: 'Estruturas de Dados', icon: 'cube', color: '#3b82f6', bgColor: '#eff6ff' },
        { id: 'others', title: 'Outros', icon: 'folder-open', color: '#6b7280', bgColor: '#f3f4f6' },
    ];

    // Computa dinamicamente a quantidade de temas para cada categoria
    const getCountForCategory = (catTitle) => {
        return notes.filter(note => (note.category || 'Outros') === catTitle).length;
    };

    // Resumo recente (o mais recente da lista)
    const recentSummary = notes.length > 0 ? notes[0] : null;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Header Dinâmico */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Olá, {user?.username ? capitalize(user.username) : 'Estudante'}! 👋</Text>
                        <Text style={styles.subWelcomeText}>Bora continuar aprendendo hoje?</Text>
                    </View>
                </View>

                {/* Seção Suas Trilhas */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Suas trilhas</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('SummariesList')}>
                        <Text style={styles.seeAllText}>Ver anotações</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="small" color="#5a3cf3" style={{ marginVertical: 20 }} />
                ) : (
                    categoriesMetadata.map((trilha) => {
                        const count = getCountForCategory(trilha.title);
                        return (
                            <TouchableOpacity 
                                key={trilha.id} 
                                style={styles.trilhaCard} 
                                activeOpacity={0.7}
                                onPress={() => navigation.navigate('SummariesList', { category: trilha.title })}
                            >
                                <View style={styles.trilhaLeft}>
                                    <View style={[styles.iconWrapper, { backgroundColor: trilha.bgColor }]}>
                                        <Ionicons name={trilha.icon} size={20} color={trilha.color} />
                                    </View>
                                    <View style={styles.trilhaTextWrapper}>
                                        <Text style={styles.trilhaTitle}>{trilha.title}</Text>
                                        <Text style={styles.trilhaCount}>{count} {count === 1 ? 'tema' : 'temas'}</Text>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color="#b1b1b8" />
                            </TouchableOpacity>
                        );
                    })
                )}

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

                </View>

                {/* Seção Recentes */}
                <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Recentes</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#5a3cf3" style={{ marginVertical: 20 }} />
                ) : recentSummary ? (
                    <TouchableOpacity 
                        style={styles.recentCard} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('SummaryDetail', { noteId: recentSummary.id })}
                    >
                        <View style={styles.recentLeft}>
                            <View style={styles.recentIconWrapper}>
                                <Ionicons name="document-text-outline" size={22} color="#5a3cf3" />
                            </View>
                            <View style={styles.recentTextWrapper}>
                                <Text style={styles.recentTitle}>{recentSummary.title}</Text>
                                <Text style={styles.recentMeta}>{recentSummary.category} • {recentSummary.date}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#b1b1b8" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.recentCard, { justifyContent: 'center', paddingVertical: 24, borderStyle: 'dashed' }]} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('CreateSummary')}
                    >
                        <View style={{ alignItems: 'center' }}>
                            <Ionicons name="document-text-outline" size={32} color="#b1b1b8" style={{ marginBottom: 8 }} />
                            <Text style={[styles.recentTitle, { color: '#6b7280', fontSize: 14 }]}>Nenhum resumo criado ainda</Text>
                            <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Toque aqui para começar a estudar!</Text>
                        </View>
                    </TouchableOpacity>
                )}

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
        width: (width - 56) / 2,
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
