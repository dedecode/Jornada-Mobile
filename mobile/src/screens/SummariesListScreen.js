import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    StyleSheet, 
    ActivityIndicator, 
    Image, 
    TouchableOpacity, 
    Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../services/api';

export default function SummariesListScreen({ route, navigation }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState(null);

    useEffect(() => {
        if (route.params?.category) {
            setActiveCategory(route.params.category);
        } else {
            setActiveCategory(null);
        }
    }, [route.params?.category]);

    const fetchNotes = async () => {
        try {
            const response = await api.get('summaries/daily/');
            const dataFeita = response.data.results ? response.data.results : response.data;
            setNotes(dataFeita);
        } catch (error) {
            console.error("Erro ao puxar anotações:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchNotes();
        });
        return unsubscribe;
    }, [navigation]);

    const handleDelete = (id) => {
        Alert.alert(
            "Confirmar Exclusão",
            "Deseja realmente excluir esta anotação?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await api.delete(`summaries/daily/${id}/`);
                            setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
                            Alert.alert("Sucesso", "Anotação excluída com sucesso.");
                        } catch (error) {
                            console.error("Erro ao deletar anotação:", error);
                            Alert.alert("Erro", "Não foi possível excluir a anotação.");
                        }
                    } 
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('SummaryDetail', { noteId: item.id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <TouchableOpacity 
                    style={styles.deleteButton} 
                    onPress={() => handleDelete(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
            </View>
            
            <View style={styles.metaRow}>
                <Text style={styles.date}>Estudado em: {item.date}</Text>
                <View style={styles.categoryBadgeCard}>
                    <Text style={styles.categoryBadgeCardText}>{item.category || 'Outros'}</Text>
                </View>
            </View>
            
            {item.photo && (
                <Image source={{ uri: getImageUrl(item.photo) }} style={styles.image} />
            )}
            
            <Text style={styles.content} numberOfLines={2}>
                {item.content || "Sem descrição."}
            </Text>
            
            {item.is_processed_by_ai && (
                <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.aiBadgeText}>Tutor de IA ativado</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    const filteredNotes = activeCategory 
        ? notes.filter(note => (note.category || 'Outros') === activeCategory)
        : notes;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a24" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Anotações</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CreateSummary')} style={styles.backButton}>
                    <Ionicons name="add" size={26} color="#5a3cf3" />
                </TouchableOpacity>
            </View>

            {/* Chip de Filtro Ativo */}
            {activeCategory && (
                <View style={styles.filterContainer}>
                    <View style={styles.filterChip}>
                        <Ionicons name="funnel-outline" size={14} color="#5a3cf3" style={{ marginRight: 6 }} />
                        <Text style={styles.filterText}>Trilha: {activeCategory}</Text>
                        <TouchableOpacity 
                            style={styles.clearFilterBtn} 
                            onPress={() => {
                                setActiveCategory(null);
                                navigation.setParams({ category: undefined });
                            }}
                        >
                            <Ionicons name="close" size={16} color="#5a3cf3" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#5a3cf3" />
                </View>
            ) : (
                <FlatList
                    data={filteredNotes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#b1b1b8" />
                            <Text style={styles.emptyText}>
                                {activeCategory 
                                    ? `Nenhum resumo na trilha "${activeCategory}"`
                                    : "Nenhuma anotação criada."}
                            </Text>
                            <Text style={styles.emptySub}>
                                {activeCategory
                                    ? "Comece criando um resumo nesta trilha!"
                                    : "Comece criando uma anotação de estudos!"}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9fb' },
    topBar: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f4',
    },
    backButton: {
        padding: 4,
    },
    topTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a24',
    },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContainer: { padding: 16, paddingBottom: 40 },
    card: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f1f4',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: { 
        fontSize: 17, 
        fontWeight: '700',
        color: '#1a1a24',
        flex: 1,
        marginRight: 8,
    },
    deleteButton: {
        padding: 4,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    date: { 
        fontSize: 12, 
        color: '#767680',
    },
    categoryBadgeCard: {
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    categoryBadgeCardText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#4b5563',
    },
    image: { 
        width: '100%', 
        height: 160, 
        borderRadius: 8, 
        marginBottom: 12,
        resizeMode: 'cover',
    },
    content: { 
        fontSize: 14, 
        color: '#4e4e5e',
        lineHeight: 20,
    },
    aiBadge: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12, 
        backgroundColor: '#a855f7', 
        paddingVertical: 4,
        paddingHorizontal: 8, 
        borderRadius: 6, 
        alignSelf: 'flex-start',
    },
    aiBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#ffffff',
    },
    emptyContainer: { 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyText: { 
        fontSize: 16, 
        fontWeight: '600',
        color: '#1a1a24', 
        marginTop: 16,
        textAlign: 'center',
    },
    emptySub: { 
        fontSize: 14, 
        color: '#767680', 
        marginTop: 8,
        textAlign: 'center',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        flexDirection: 'row',
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eeebff',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#d8b4fe',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#5a3cf3',
        marginRight: 6,
    },
    clearFilterBtn: {
        padding: 2,
    },
});
