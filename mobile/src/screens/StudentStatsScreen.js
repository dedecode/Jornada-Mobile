import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function StudentStatsScreen({ route, navigation }) {
    const { notes = [] } = route.params || {};

    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    // 1. Cálculo da Sequência Ativa de Estudos (Streak)
    const calculateStreak = () => {
        if (!notes.length) return 0;
        
        // Remove duplicatas de datas e ordena decrescentemente
        const uniqueDates = [...new Set(notes.map(n => n.date))].sort().reverse();
        
        const formatDate = (d) => {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        };

        const todayStr = formatDate(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = formatDate(yesterday);
        
        const mostRecent = uniqueDates[0];
        
        // Se a data mais recente não for hoje nem ontem, a sequência quebrou (0)
        if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
            return 0;
        }
        
        let streak = 0;
        let current = new Date(mostRecent);
        
        for (let i = 0; i < 30; i++) { // Limite preventivo de verificação de 30 dias
            const dateStr = formatDate(current);
            if (uniqueDates.includes(dateStr)) {
                streak++;
                current.setDate(current.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    };

    // 2. Cálculo do Progresso da Meta Semanal (Meta: 5 resumos na semana)
    const getWeeklyCount = () => {
        if (!notes.length) return 0;
        
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Domingo) a 6 (Sábado)
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajusta para Segunda-feira
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);

        return notes.filter(n => {
            const noteDate = new Date(n.date);
            return noteDate >= monday;
        }).length;
    };

    const totalNotes = notes.length;
    const weeklyCount = getWeeklyCount();
    const weeklyGoal = 5;
    const weeklyProgress = Math.min(weeklyCount / weeklyGoal, 1);
    const activeStreak = calculateStreak();

    // 3. Distribuição por Trilhas
    const categories = ['Desenvolvimento Web', 'Ciência de Dados', 'Inglês', 'Estruturas de Dados', 'Outros'];
    const getCountForCategory = (cat) => notes.filter(n => (n.category || 'Outros') === cat).length;

    // 4. Conquistas Dinâmicas (Medalhas)
    const achievements = [
        {
            id: 'first_step',
            title: 'Primeiro Passo',
            description: 'Escreveu seu primeiro resumo na plataforma.',
            icon: 'medal',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            unlocked: totalNotes >= 1
        },
        {
            id: 'polymath',
            title: 'Mente Aberta',
            description: 'Criou anotações em pelo menos 2 trilhas de estudo.',
            icon: 'ribbon',
            color: '#10b981',
            bgColor: '#e6fcf5',
            unlocked: new Set(notes.map(n => n.category || 'Outros')).size >= 2
        },
        {
            id: 'tutor_friend',
            title: 'Cérebro de Silício',
            description: 'Recebeu feedback do Tutor de IA em um resumo.',
            icon: 'sparkles',
            color: '#a855f7',
            bgColor: '#f5f3ff',
            unlocked: notes.some(n => n.is_processed_by_ai)
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header Customizado */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a24" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Desempenho</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Cartão de Resumo de Progresso */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryColumn}>
                        <Text style={styles.summaryNum}>{totalNotes}</Text>
                        <Text style={styles.summaryLabel}>Total de Resumos</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryColumn}>
                        <View style={styles.streakRow}>
                            <Ionicons name="flame" size={22} color="#f59e0b" style={{ marginRight: 4 }} />
                            <Text style={styles.summaryNum}>{activeStreak}</Text>
                        </View>
                        <Text style={styles.summaryLabel}>Dias Seguidos</Text>
                    </View>
                </View>

                {/* Bloco de Meta Semanal */}
                <Text style={styles.sectionTitle}>Meta Semanal</Text>
                <View style={styles.card}>
                    <View style={styles.metaHeader}>
                        <Text style={styles.metaTitle}>Foco Semanal</Text>
                        <Text style={styles.metaStatus}>{weeklyCount} de {weeklyGoal} resumos</Text>
                    </View>
                    
                    {/* Barra de Progresso */}
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressBar, { width: `${weeklyProgress * 100}%` }]} />
                    </View>
                    
                    <Text style={styles.metaSubtitle}>
                        {weeklyProgress >= 1 
                            ? "Parabéns! Meta da semana atingida! 🎉" 
                            : `Crie mais ${weeklyGoal - weeklyCount} resumos esta semana para atingir sua meta.`}
                    </Text>
                </View>

                {/* Progresso por Trilha */}
                <Text style={styles.sectionTitle}>Sua Jornada por Trilhas</Text>
                <View style={styles.card}>
                    {categories.map((cat, idx) => {
                        const count = getCountForCategory(cat);
                        const share = totalNotes > 0 ? count / totalNotes : 0;
                        return (
                            <View key={cat} style={[styles.trackRow, idx === categories.length - 1 && { marginBottom: 0 }]}>
                                <View style={styles.trackInfo}>
                                    <Text style={styles.trackName}>{cat}</Text>
                                    <Text style={styles.trackCount}>{count} {count === 1 ? 'resumo' : 'resumos'}</Text>
                                </View>
                                <View style={styles.trackProgressTrack}>
                                    <View style={[styles.trackProgressBar, { width: `${share * 100}%` }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Quadro de Conquistas */}
                <Text style={styles.sectionTitle}>Medalhas de Estudo</Text>
                <View style={styles.card}>
                    {achievements.map((ach) => (
                        <View key={ach.id} style={styles.achievementRow}>
                            <View style={[
                                styles.achievementIconContainer, 
                                { backgroundColor: ach.unlocked ? ach.bgColor : '#f3f4f6' }
                            ]}>
                                <Ionicons 
                                    name={ach.unlocked ? ach.icon : 'lock-closed'} 
                                    size={22} 
                                    color={ach.unlocked ? ach.color : '#9ca3af'} 
                                />
                            </View>
                            <View style={styles.achievementTextContainer}>
                                <Text style={[
                                    styles.achievementTitle, 
                                    !ach.unlocked && { color: '#9ca3af' }
                                ]}>
                                    {ach.title}
                                </Text>
                                <Text style={styles.achievementDesc}>{ach.description}</Text>
                            </View>
                            {ach.unlocked && (
                                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                            )}
                        </View>
                    ))}
                </View>

                {/* Dicas Acadêmicas */}
                <Text style={styles.sectionTitle}>Dicas do Tutor de IA</Text>
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <Ionicons name="bulb-outline" size={20} color="#5a3cf3" style={{ marginRight: 8 }} />
                        <Text style={styles.tipTitle}>Técnica Feynman</Text>
                    </View>
                    <Text style={styles.tipText}>
                        Grave uma explicação em áudio do resumo como se estivesse ensinando para uma criança. Explicar com termos simples ajuda a consolidar o aprendizado em 80% mais eficiência.
                    </Text>
                </View>
                
                <View style={[styles.tipCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <View style={styles.tipHeader}>
                        <Ionicons name="repeat-outline" size={20} color="#10b981" style={{ marginRight: 8 }} />
                        <Text style={[styles.tipTitle, { color: '#10b981' }]}>Revisão Espaçada</Text>
                    </View>
                    <Text style={[styles.tipText, { color: '#14532d' }]}>
                        Utilize o Quiz gerado pela IA 24 horas após criar uma anotação. Essa rotina combate a curva do esquecimento do cérebro.
                    </Text>
                </View>

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
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a24' },
    container: { padding: 24, paddingBottom: 40 },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 28,
    },
    summaryColumn: {
        flex: 1,
        alignItems: 'center',
    },
    summaryNum: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1a1a24',
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 6,
        fontWeight: '500',
    },
    summaryDivider: {
        width: 1,
        backgroundColor: '#e5e7eb',
        marginVertical: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginBottom: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    metaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    metaTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    metaStatus: {
        fontSize: 13,
        fontWeight: '600',
        color: '#5a3cf3',
    },
    progressTrack: {
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#5a3cf3',
        borderRadius: 5,
    },
    metaSubtitle: {
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 18,
    },
    trackRow: {
        marginBottom: 16,
    },
    trackInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    trackName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    trackCount: {
        fontSize: 12,
        color: '#6b7280',
    },
    trackProgressTrack: {
        height: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 3,
        overflow: 'hidden',
    },
    trackProgressBar: {
        height: '100%',
        backgroundColor: '#5a3cf3',
        borderRadius: 3,
    },
    achievementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    achievementIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    achievementTextContainer: {
        flex: 1,
    },
    achievementTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    achievementDesc: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    tipCard: {
        backgroundColor: '#f5f3ff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#ddd6fe',
        marginBottom: 16,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#5a3cf3',
    },
    tipText: {
        fontSize: 13,
        color: '#5b21b6',
        lineHeight: 20,
    },
});
