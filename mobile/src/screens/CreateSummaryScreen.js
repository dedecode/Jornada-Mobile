import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    ScrollView, 
    Alert, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function CreateSummaryScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [activeTab, setActiveTab] = useState('Texto'); // 'Texto', 'Imagem', 'Áudio'
    
    // Estados do Gemini
    const [isImproving, setIsImproving] = useState(false);
    const [improvedPreview, setImprovedPreview] = useState(null);
    const [wordCount, setWordCount] = useState(0);

    // Atualiza contagem de palavras
    useEffect(() => {
        if (!content.trim()) {
            setWordCount(0);
        } else {
            const words = content.trim().split(/\s+/);
            setWordCount(words.length);
        }
    }, [content]);

    // Função para tirar foto ou selecionar da galeria
    const pickImage = async (fromCamera = false) => {
        let result;
        const options = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        };

        if (fromCamera) {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permissão necessária", "Precisamos de acesso à câmera para tirar foto.");
                return;
            }
            result = await ImagePicker.launchCameraAsync(options);
        } else {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para escolher foto.");
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync(options);
        }

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Disparar o Alert de opções para câmera/galeria
    const handlePressAttachment = () => {
        Alert.alert(
            "Adicionar Imagem",
            "Como deseja adicionar a imagem?",
            [
                { text: "Câmera", onPress: () => pickImage(true) },
                { text: "Galeria", onPress: () => pickImage(false) },
                { text: "Cancelar", style: "cancel" }
            ]
        );
    };

    // FUNÇÃO QUE VALIDA A API DO GEMINI EM TEMPO REAL!
    const handleImproveWithAI = async () => {
        if (!content.trim()) {
            Alert.alert("Ops!", "Digite algum texto no resumo antes de pedir a ajuda da IA.");
            return;
        }

        setIsImproving(true);
        try {
            const response = await api.post('summaries/daily/improve_content/', { content });
            if (response.data && response.data.improved_content) {
                const cleaned = response.data.improved_content
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#+\s/g, '')
                    .trim();
                setImprovedPreview(cleaned);
            } else {
                Alert.alert("Erro", "Formato de resposta inesperado da IA.");
            }
        } catch (error) {
            console.error("Erro na melhoria por IA:", error.response?.data || error.message);
            const errMsg = error.response?.data?.error || "Não foi possível conectar com o Gemini. Verifique sua chave no backend.";
            Alert.alert("Erro com o Tutor de IA", errMsg);
        } finally {
            setIsImproving(false);
        }
    };

    // Aplicar a melhoria gerada pela IA localmente
    const handleApplyImprovement = () => {
        if (!improvedPreview) return;
        setContent(improvedPreview);
        setImprovedPreview(null);
        Alert.alert("Sucesso!", "Sua anotação foi refinada e organizada didaticamente pelo Gemini! ✨");
    };

    // Salvar o resumo final
    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Erro", "O título do resumo é obrigatório.");
            return;
        }
        if (!content.trim() && !imageUri) {
            Alert.alert("Erro", "Escreva um conteúdo ou adicione uma imagem para o resumo.");
            return;
        }

        try {
            if (imageUri) {
                const formData = new FormData();
                formData.append('title', title.trim());
                formData.append('content', content.trim());

                let filename = imageUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let ext = match ? match[1].toLowerCase() : 'jpeg';
                if (ext === 'jpg') ext = 'jpeg';
                let type = `image/${ext}`;
                formData.append('photo', { uri: imageUri, name: filename, type });

                await api.post('summaries/daily/', formData);
            } else {
                // Se não há imagem, envia como JSON simples para evitar problemas com FormData
                await api.post('summaries/daily/', {
                    title: title.trim(),
                    content: content.trim()
                });
            }
            Alert.alert("Sucesso", "Resumo salvo e adicionado na sua trilha! 🚀");
            navigation.navigate('SummariesList');
        } catch (error) {
            Alert.alert("Erro", "Não foi possível salvar o resumo.");
            console.error("Erro ao salvar resumo:", error.response?.data || error.message || error);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    
                    {/* Abas Superiores (Texto, Áudio) */}
                    <View style={styles.tabsContainer}>
                        {['Texto', 'Áudio'].map((tab) => (
                            <TouchableOpacity 
                                key={tab} 
                                style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                                onPress={() => {
                                    setActiveTab(tab);
                                    if (tab === 'Áudio') {
                                        Alert.alert("Gravação de Áudio", "O recurso de transcrição de áudio está sendo modelado. Use Texto para os testes atuais do Gemini.");
                                    }
                                }}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Input do Título */}
                    <Text style={styles.fieldLabel}>Título do resumo</Text>
                    <TextInput 
                        style={styles.titleInput} 
                        placeholder="Ex: APIs REST" 
                        placeholderTextColor="#9ca3af"
                        value={title} 
                        onChangeText={setTitle} 
                    />

                    {/* Área de Texto / Conteúdo */}
                    <Text style={styles.fieldLabel}>Conteúdo</Text>
                    <View style={styles.contentBox}>
                        <TextInput 
                            style={styles.contentInput} 
                            placeholder="APIs REST (Representational State Transfer) é um estilo arquitetural para construção de APIs..." 
                            placeholderTextColor="#9ca3af"
                            multiline
                            textAlignVertical="top"
                            value={content} 
                            onChangeText={setContent} 
                        />
                        <View style={styles.contentFooter}>
                            <TouchableOpacity onPress={handlePressAttachment} style={styles.attachButton}>
                                <Ionicons 
                                    name={imageUri ? "checkmark-circle" : "camera-outline"} 
                                    size={18} 
                                    color={imageUri ? "#10b981" : "#5a3cf3"} 
                                    style={{ marginRight: 6 }} 
                                />
                                <Text style={[styles.attachButtonText, { color: imageUri ? "#10b981" : "#5a3cf3" }]}>
                                    {imageUri ? "Foto anexada" : "Anexar foto"}
                                </Text>
                            </TouchableOpacity>
                            <Text style={styles.wordCounter}>{wordCount} palavras</Text>
                        </View>
                    </View>

                    {/* Exibição se houver imagem carregada */}
                    {imageUri && (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                                <Ionicons name="close-circle" size={28} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Visualização da Sugestão da IA (Gemini Preview Card) */}
                    {improvedPreview && (
                        <View style={styles.previewCard}>
                            <View style={styles.previewHeader}>
                                <Ionicons name="sparkles" size={18} color="#a855f7" />
                                <Text style={styles.previewTitle}>Sugestão do Gemini</Text>
                            </View>
                            <Text style={styles.previewText}>{improvedPreview}</Text>
                            <View style={styles.previewActions}>
                                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyImprovement}>
                                    <Text style={styles.applyBtnText}>Aplicar Aprimoramento</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.discardBtn} onPress={() => setImprovedPreview(null)}>
                                    <Text style={styles.discardBtnText}>Descartar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Botão Aprimorar com IA */}
                    {!improvedPreview && (
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
                    )}

                    {/* Botão de Salvar */}
                    <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Salvar resumo</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    container: { padding: 20, paddingBottom: 40 },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#eef2f6',
        borderRadius: 12,
        padding: 4,
        marginBottom: 20
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    activeTabButton: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2
    },
    tabText: { fontSize: 14, fontWeight: 'bold', color: '#6b7280' },
    activeTabText: { color: '#5a3cf3' },
    fieldLabel: { fontSize: 14, fontWeight: 'bold', color: '#1a1a24', marginBottom: 8 },
    titleInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        color: '#1a1a24',
        marginBottom: 20,
        fontWeight: '500'
    },
    contentBox: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 14,
        minHeight: 180,
        marginBottom: 20,
    },
    contentInput: {
        flex: 1,
        fontSize: 15,
        color: '#1a1a24',
        lineHeight: 22,
    },
    wordCounter: {
        fontSize: 12,
        color: '#9ca3af',
    },
    contentFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    attachButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    imagePreviewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        position: 'relative'
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ffffff',
        borderRadius: 14
    },
    improveButton: {
        backgroundColor: '#a855f7',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 24,
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
    // Preview Card styles
    previewCard: {
        backgroundColor: '#faf5ff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#e9d5ff',
        marginBottom: 24,
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
    saveButton: {
        backgroundColor: '#5a3cf3',
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4
    },
    saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' }
});
