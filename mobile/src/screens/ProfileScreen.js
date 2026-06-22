import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
    const { user, signOut } = useContext(AuthContext);
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const capitalize = (str) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    const fetchProfileData = async () => {
        try {
            const response = await api.get('summaries/daily/');
            const data = response.data.results ? response.data.results : response.data;
            setNotes(data);
        } catch (error) {
            console.error("Erro ao buscar dados do perfil:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchProfileData();
        });
        return unsubscribe;
    }, [navigation]);

    const userInitial = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Meu Perfil</Text>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                {/* Cartão de Identidade */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{userInitial}</Text>
                    </View>
                    <Text style={styles.userName}>{user?.username ? capitalize(user.username) : 'Estudante'}</Text>
                    <Text style={styles.userEmail}>{user?.email || `${user?.username || 'estudante'}@jornada.com`}</Text>
                </View>

                {/* Estatísticas de Estudos */}
                <Text style={styles.sectionTitle}>Estatísticas de Estudos</Text>
                <View style={styles.statsRow}>
                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconWrapper, { backgroundColor: '#eeebff' }]}>
                            <Ionicons name="document-text" size={24} color="#5a3cf3" />
                        </View>
                        {loading ? (
                            <ActivityIndicator size="small" color="#5a3cf3" style={{ marginTop: 8 }} />
                        ) : (
                            <Text style={styles.statsValue}>{notes.length}</Text>
                        )}
                        <Text style={styles.statsLabel}>Resumos criados</Text>
                    </View>

                    <View style={styles.statsCard}>
                        <View style={[styles.statsIconWrapper, { backgroundColor: '#e6fcf5' }]}>
                            <Ionicons name="sparkles" size={24} color="#10b981" />
                        </View>
                        <Text style={styles.statsValue}>Ativo</Text>
                        <Text style={styles.statsLabel}>Tutor de IA</Text>
                    </View>
                </View>

                {/* Preferências e Configurações Simples */}
                <Text style={styles.sectionTitle}>Opções</Text>
                <View style={styles.optionsCard}>
                    <TouchableOpacity 
                        style={styles.optionRow} 
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('StudentStats', { notes })}
                    >
                        <View style={styles.optionLeft}>
                            <Ionicons name="analytics-outline" size={20} color="#5a3cf3" style={{ marginRight: 12 }} />
                            <Text style={[styles.optionText, { color: '#5a3cf3', fontWeight: '600' }]}>Estatísticas & Progresso</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#5a3cf3" />
                    </TouchableOpacity>

                    <View style={styles.optionDivider} />

                    <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
                        <View style={styles.optionLeft}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#4b5563" style={{ marginRight: 12 }} />
                            <Text style={styles.optionText}>Privacidade</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>

                    <View style={styles.optionDivider} />

                    <TouchableOpacity style={styles.optionRow} activeOpacity={0.7}>
                        <View style={styles.optionLeft}>
                            <Ionicons name="help-circle-outline" size={20} color="#4b5563" style={{ marginRight: 12 }} />
                            <Text style={styles.optionText}>Central de Ajuda</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                </View>

                {/* Botão de Logout */}
                <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={signOut}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutButtonText}>Sair da Conta</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    header: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f4',
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
    profileCard: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 28,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#eeebff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#5a3cf3',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#5a3cf3',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a24',
    },
    userEmail: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    statsCard: {
        width: '48%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    statsIconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statsValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a24',
    },
    statsLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 4,
    },
    optionsCard: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 8,
        marginBottom: 32,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    optionDivider: {
        height: 1,
        backgroundColor: '#e5e7eb',
        marginHorizontal: 16,
    },
    logoutButton: {
        backgroundColor: '#fef2f2',
        borderWidth: 1.5,
        borderColor: '#fca5a5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 16,
    },
    logoutButtonText: {
        color: '#ef4444',
        fontSize: 15,
        fontWeight: '700',
    },
});
