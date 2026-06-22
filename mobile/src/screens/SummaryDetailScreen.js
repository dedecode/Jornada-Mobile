import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    Image, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api, { getImageUrl } from '../services/api';

export default function SummaryDetailScreen({ route, navigation }) {
    const { noteId } = route.params;

    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Estados de Edição
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados do Gemini e IA Tutor
    const [isImproving, setIsImproving] = useState(false);
    const [improvedPreview, setImprovedPreview] = useState(null);
    const [isRequestingAi, setIsRequestingAi] = useState(false);

    // Carrega a anotação
    const fetchNoteDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`summaries/daily/${noteId}/`);
            setNote(response.data);
            setTitle(response.data.title);
            setContent(response.data.content);
        } catch (error) {
            console.error("Erro ao puxar detalhe da anotação:", error);
            Alert.alert("Erro", "Não foi possível carregar os detalhes da anotação.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNoteDetail();
    }, [noteId]);

    // Excluir anotação
    const handleDelete = () => {
        Alert.alert(
            "Confirmar Exclusão",
            "Deseja realmente excluir esta anotação permanentemente?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Excluir", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await api.delete(`summaries/daily/${noteId}/`);
                            Alert.alert("Sucesso", "Anotação removida!");
                            navigation.goBack();
                        } catch (error) {
                            console.error("Erro ao excluir:", error);
                            Alert.alert("Erro", "Não foi possível remover a anotação.");
                        }
                    } 
                }
            ]
        );
    };

    // Salvar modificações (PUT)
    const handleSaveChanges = async () => {
        if (!title.trim()) {
            Alert.alert("Erro", "O título não pode ser vazio.");
            return;
        }
        setIsSaving(true);
        try {
            const response = await api.put(`summaries/daily/${noteId}/`, {
                title: title.trim(),
                content: content.trim(),
                category: note?.category || 'Outros'
            });
            setNote(response.data);
            setIsEditing(false);
            Alert.alert("Sucesso", "Anotação atualizada!");
        } catch (error) {
            console.error("Erro ao atualizar anotação:", error);
            Alert.alert("Erro", "Não foi possível salvar as alterações.");
        } finally {
            setIsSaving(false);
        }
    };

    // Aprimorar Texto com IA (Gemini)
    const handleImproveWithAI = async () => {
        if (!content.trim()) {
            Alert.alert("Ops!", "Escreva algum conteúdo antes de chamar a IA.");
            return;
        }
        setIsImproving(true);
        try {
            const response = await api.post('summaries/daily/improve_content/', { content });
            if (response.data && response.data.improved_content) {
                const cleanedText = response.data.improved_content
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#+\s/g, '')
                    .trim();
                
                setImprovedPreview(cleanedText);
            } else {
                Alert.alert("Erro", "Resposta em formato inesperado da IA.");
            }
        } catch (error) {
            console.error("Erro ao aprimorar anotação:", error.response?.data || error.message);
            Alert.alert("Erro com o Gemini", "Não foi possível aprimorar a anotação. Verifique sua chave de API.");
        } finally {
            setIsImproving(false);
        }
    };

    // Aplicar a melhoria gerada pela IA
    const handleApplyImprovement = async () => {
        if (!improvedPreview) return;
        setIsSaving(true);
        try {
            const response = await api.put(`summaries/daily/${noteId}/`, {
                title: title.trim(),
                content: improvedPreview,
                category: note?.category || 'Outros'
            });
            setNote(response.data);
            setContent(improvedPreview);
            setImprovedPreview(null);
            Alert.alert("Sucesso!", "Anotação aprimorada e salva com sucesso! ✨");
        } catch (error) {
            console.error("Erro ao salvar melhoria da IA:", error);
            Alert.alert("Erro", "A IA gerou o texto, mas não conseguimos salvar no banco de dados.");
        } finally {
            setIsSaving(false);
        }
    };

    // Solicitar Análise do Tutor de IA
    const handleRequestAiFeedback = async () => {
        setIsRequestingAi(true);
        try {
            const response = await api.post(`summaries/daily/${noteId}/generate_feedback/`);
            setNote(response.data);
            Alert.alert("Sucesso!", "Análise do Tutor de IA concluída com sucesso! ✨");
        } catch (error) {
            console.error("Erro ao gerar feedback do Tutor:", error);
            const errMsg = error.response?.data?.error || "Não foi possível conectar com o Tutor de IA. Verifique as configurações.";
            Alert.alert("Erro no Tutor", errMsg);
        } finally {
            setIsRequestingAi(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5a3cf3" />
                <Text style={styles.loadingText}>Carregando anotação...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header Customizado */}
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a24" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>{isEditing ? "Editando" : "Leitura"}</Text>
                
                <View style={styles.topRightActions}>
                    {!isEditing ? (
                        <>
                            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.topBarButton}>
                                <Ionicons name="create-outline" size={22} color="#5a3cf3" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDelete} style={[styles.topBarButton, { marginLeft: 12 }]}>
                                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={handleSaveChanges} disabled={isSaving} style={styles.saveHeaderButton}>
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.saveHeaderText}>Salvar</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    
                    {/* Visualização de Imagem se houver */}
                    {note?.photo && !isEditing && (
                        <Image source={{ uri: getImageUrl(note.photo) }} style={styles.noteImage} />
                    )}

                    {/* Exibição dos Inputs / Textos */}
                    <View style={styles.card}>
                        {isEditing ? (
                            <View>
                                <Text style={styles.inputLabel}>Título da Anotação</Text>
                                <TextInput
                                    style={styles.titleInput}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Título"
                                    placeholderTextColor="#9ca3af"
                                />
                                
                                <Text style={styles.inputLabel}>Conteúdo</Text>
                                <TextInput
                                    style={styles.contentInput}
                                    value={content}
                                    onChangeText={setContent}
                                    placeholder="Conteúdo..."
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        ) : (
                            <View>
                                <View style={styles.categoryBadgeContainer}>
                                    <View style={styles.categoryBadgeDetail}>
                                        <Text style={styles.categoryBadgeDetailText}>{note?.category || 'Outros'}</Text>
                                    </View>
                                </View>
                                <Text style={styles.noteTitle}>{note?.title}</Text>
                                <Text style={styles.noteDate}>Estudado em: {note?.date}</Text>
                                <View style={styles.divider} />
                                <Text style={styles.noteContent}>{note?.content || "Sem conteúdo disponível."}</Text>
                            </View>
                        )}
                    </View>

                    {/* Bloco de Feedback do Tutor de IA */}
                    {!isEditing && !improvedPreview && (
                        <View style={styles.aiFeedbackCard}>
                            <View style={styles.aiFeedbackHeader}>
                                <Ionicons name="sparkles" size={20} color="#a855f7" />
                                <Text style={styles.aiFeedbackTitle}>Tutor de IA</Text>
                            </View>

                            {note?.is_processed_by_ai ? (
                                <View>
                                    <Text style={styles.aiFeedbackText}>{note.ai_feedback}</Text>
                                    
                                    <Text style={styles.suggestedTopicsTitle}>Próximos passos sugeridos:</Text>
                                    {note.suggested_topics && note.suggested_topics.map((topic, index) => (
                                        <View key={index} style={styles.topicRow}>
                                            <Ionicons name="bulb-outline" size={16} color="#d97706" style={{ marginRight: 8 }} />
                                            <Text style={styles.topicText}>{topic}</Text>
                                        </View>
                                    ))}

                                    <TouchableOpacity 
                                        style={styles.fullAnalysisBtn}
                                        onPress={() => navigation.navigate('AISuggestions', { 
                                            feedback: note.ai_feedback, 
                                            suggestedTopics: note.suggested_topics 
                                        })}
                                    >
                                        <Text style={styles.fullAnalysisBtnText}>Ver Análise em Tela Cheia</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.noAiContainer}>
                                    <Text style={styles.noAiText}>
                                        Você ainda não solicitou o feedback do Tutor de IA para este resumo.
                                    </Text>
                                    
                                    <TouchableOpacity 
                                        style={styles.requestAiBtn}
                                        onPress={handleRequestAiFeedback}
                                        disabled={isRequestingAi}
                                        activeOpacity={0.8}
                                    >
                                        {isRequestingAi ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <>
                                                <Ionicons name="sparkles-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                                                <Text style={styles.requestAiBtnText}>Analisar com Tutor de IA</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Área de Visualização do Aprimoramento da IA */}
                    {improvedPreview && (
                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <Ionicons name="sparkles" size={18} color="#a855f7" />
                                <Text style={styles.previewTitle}>Sugestão do Gemini</Text>
                            </View>
                            <Text style={styles.previewText}>{improvedPreview}</Text>
                            <View style={styles.previewActions}>
                                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyImprovement} disabled={isSaving}>
                                    <Text style={styles.applyBtnText}>Aplicar Aprimoramento</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.discardBtn} onPress={() => setImprovedPreview(null)}>
                                    <Text style={styles.discardBtnText}>Descartar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Ações Inteligentes e Prática */}
                    {!isEditing && !improvedPreview && (
                        <View style={styles.smartActions}>
                            {/* 1. Botão Aprimorar com IA */}
                            <TouchableOpacity 
                                style={styles.improveButton} 
                                onPress={handleImproveWithAI}
                                disabled={isImproving}
                                activeOpacity={0.8}
                            >
                                {isImproving ? (
                                    <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                    <>
                                        <Ionicons name="sparkles-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>Aprimorar com Gemini</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* 2. Botão Praticar com Quiz */}
                            <TouchableOpacity 
                                style={styles.quizButton} 
                                onPress={() => navigation.navigate('ActiveRecallQuiz', { 
                                    content: note.content, 
                                    title: note.title 
                                })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="play-circle-outline" size={20} color="#5a3cf3" style={{ marginRight: 8 }} />
                                <Text style={styles.quizButtonText}>Treinar com Quiz (IA)</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Botão de Cancelar Edição */}
                    {isEditing && (
                        <TouchableOpacity style={styles.cancelEditBtn} onPress={() => {
                            setTitle(note.title);
                            setContent(note.content);
                            setIsEditing(false);
                        }}>
                            <Text style={styles.cancelEditBtnText}>Cancelar Edição</Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f9f9fb' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9fb' },
    loadingText: { marginTop: 12, fontSize: 14, color: '#767680' },
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
    topBarButton: {
        padding: 4,
    },
    topTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a24',
    },
    topRightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    saveHeaderButton: {
        backgroundColor: '#5a3cf3',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        minWidth: 60,
        alignItems: 'center',
    },
    saveHeaderText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    container: { padding: 16, paddingBottom: 40 },
    noteImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
        resizeMode: 'cover',
    },
    card: {
        backgroundColor: '#ffffff',
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f1f4',
        marginBottom: 16,
    },
    categoryBadgeContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    categoryBadgeDetail: {
        backgroundColor: '#eeebff',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#d8b4fe',
    },
    categoryBadgeDetailText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5a3cf3',
    },
    noteTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1a1a24',
        marginBottom: 4,
    },
    noteDate: {
        fontSize: 12,
        color: '#767680',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f1f4',
        marginBottom: 14,
    },
    noteContent: {
        fontSize: 15,
        color: '#3a3a4a',
        lineHeight: 24,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#767680',
        marginBottom: 4,
        marginTop: 8,
    },
    titleInput: {
        borderWidth: 1,
        borderColor: '#e1e1e6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#1a1a24',
        backgroundColor: '#f9f9fb',
        marginBottom: 12,
    },
    contentInput: {
        borderWidth: 1,
        borderColor: '#e1e1e6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: '#3a3a4a',
        backgroundColor: '#f9f9fb',
        minHeight: 180,
        lineHeight: 22,
    },
    smartActions: {
        width: '100%',
    },
    improveButton: {
        backgroundColor: '#a855f7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 12,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 15,
        fontWeight: '600',
    },
    quizButton: {
        backgroundColor: '#ffffff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#5a3cf3',
        marginBottom: 12,
    },
    quizButtonText: {
        color: '#5a3cf3',
        fontSize: 15,
        fontWeight: '600',
    },
    cancelEditBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 4,
    },
    cancelEditBtnText: {
        color: '#ef4444',
        fontSize: 14,
        fontWeight: '600',
    },
    previewCard: {
        backgroundColor: '#faf5ff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#e9d5ff',
        marginBottom: 16,
    },
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#a855f7',
        marginLeft: 6,
    },
    previewText: {
        fontSize: 14,
        color: '#581c87',
        lineHeight: 22,
        marginBottom: 16,
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    applyBtn: {
        backgroundColor: '#a855f7',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#ffffff',
        fontSize: 13,
        fontWeight: '600',
    },
    discardBtn: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#d8b4fe',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    discardBtnText: {
        color: '#a855f7',
        fontSize: 13,
        fontWeight: '600',
    },

    // AI Feedback card styles
    aiFeedbackCard: {
        backgroundColor: '#ffffff',
        padding: 18,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#f1f1f4',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    aiFeedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    aiFeedbackTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#a855f7',
        marginLeft: 8,
    },
    aiFeedbackText: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 22,
        marginBottom: 16,
    },
    suggestedTopicsTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
    },
    topicRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#fdfbf7',
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    topicText: {
        fontSize: 13,
        color: '#d97706',
        fontWeight: '600',
    },
    fullAnalysisBtn: {
        marginTop: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1.5,
        borderColor: '#a855f7',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    fullAnalysisBtnText: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: '600',
    },
    noAiContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    noAiText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    requestAiBtn: {
        backgroundColor: '#a855f7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        shadowColor: '#a855f7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    requestAiBtnText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
});
