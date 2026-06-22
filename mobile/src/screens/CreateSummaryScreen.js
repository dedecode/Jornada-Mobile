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
import { Audio } from 'expo-av';
import api from '../services/api';

export default function CreateSummaryScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [activeTab, setActiveTab] = useState('Texto'); // 'Texto', 'Áudio'
    const [category, setCategory] = useState('Outros');
    
    // Estados do Gemini e IA
    const [isImproving, setIsImproving] = useState(false);
    const [improvedPreview, setImprovedPreview] = useState(null);
    const [wordCount, setWordCount] = useState(0);

    // Estados de Gravação de Áudio
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const categories = ['Desenvolvimento Web', 'Ciência de Dados', 'Inglês', 'Estruturas de Dados', 'Outros'];

    // Atualiza contagem de palavras
    useEffect(() => {
        if (!content.trim()) {
            setWordCount(0);
        } else {
            const words = content.trim().split(/\s+/);
            setWordCount(words.length);
        }
    }, [content]);

    // Contagem de tempo da gravação
    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            setRecordingDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatDuration = (sec) => {
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Gravação de Áudio
    const startRecording = async () => {
        try {
            const permission = await Audio.requestPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert("Permissão necessária", "Precisamos de acesso ao microfone para gravar áudio.");
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            console.log('Iniciando gravação...');
            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            setIsRecording(true);
            console.log('Gravação iniciada.');
        } catch (err) {
            console.error('Falha ao iniciar gravação:', err);
            Alert.alert("Erro", "Não foi possível iniciar a gravação.");
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        console.log('Parando gravação...');
        setIsRecording(false);
        try {
            await recording.stopAndUnloadAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
            });
            const uri = recording.getURI();
            setRecording(null);
            console.log('Gravação salva em:', uri);
            
            await transcribeAudioFile(uri);
        } catch (err) {
            console.error('Falha ao parar gravação:', err);
            Alert.alert("Erro", "Erro ao salvar gravação.");
        }
    };

    const transcribeAudioFile = async (uri) => {
        setIsTranscribing(true);
        try {
            const formData = new FormData();
            
            let filename = uri.split('/').pop() || 'recording.m4a';
            let match = /\.(\w+)$/.exec(filename);
            let ext = match ? match[1].toLowerCase() : 'm4a';
            let type = `audio/${ext}`;
            if (ext === 'm4a') type = 'audio/mp4'; 

            formData.append('audio', { uri, name: filename, type });

            const response = await api.post('summaries/daily/transcribe_audio/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.transcription) {
                setContent(prev => prev ? `${prev}\n\n${response.data.transcription}` : response.data.transcription);
                Alert.alert("Sucesso!", "Áudio transcrito com sucesso e adicionado ao conteúdo! 🎙️");
                setActiveTab('Texto');
            } else {
                Alert.alert("Erro", "Não foi possível transcrever o áudio.");
            }
        } catch (error) {
            console.error("Erro ao transcrever:", error.response?.data || error.message);
            const errMsg = error.response?.data?.error || "Erro de comunicação com o Gemini.";
            Alert.alert("Erro na Transcrição", errMsg);
        } finally {
            setIsTranscribing(false);
        }
    };

    // Imagem da galeria ou câmera
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

    // Aprimoramento pelo Gemini
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

    const handleApplyImprovement = () => {
        if (!improvedPreview) return;
        setContent(improvedPreview);
        setImprovedPreview(null);
        Alert.alert("Sucesso!", "Sua anotação foi refinada e organizada didaticamente pelo Gemini! ✨");
    };

    // Salvar resumo
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
                formData.append('category', category);

                let filename = imageUri.split('/').pop();
                let match = /\.(\w+)$/.exec(filename);
                let ext = match ? match[1].toLowerCase() : 'jpeg';
                if (ext === 'jpg') ext = 'jpeg';
                let type = `image/${ext}`;
                formData.append('photo', { uri: imageUri, name: filename, type });

                await api.post('summaries/daily/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
            } else {
                await api.post('summaries/daily/', {
                    title: title.trim(),
                    content: content.trim(),
                    category: category
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
                                onPress={() => setActiveTab(tab)}
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

                    {/* Seletor de Categoria */}
                    <Text style={styles.fieldLabel}>Selecione a Trilha</Text>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.categoriesContainer}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.categoryChip,
                                    category === cat && styles.activeCategoryChip
                                ]}
                                onPress={() => setCategory(cat)}
                                activeOpacity={0.8}
                            >
                                <Text style={[
                                    styles.categoryChipText,
                                    category === cat && styles.activeCategoryChipText
                                ]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Bloco de Gravação de Áudio */}
                    {activeTab === 'Áudio' && (
                        <View style={styles.audioCard}>
                            <View style={styles.audioCardHeader}>
                                <Ionicons name="mic-outline" size={24} color="#5a3cf3" />
                                <Text style={styles.audioCardTitle}>Gravador de Estudos (IA)</Text>
                            </View>
                            <Text style={styles.audioCardSubtitle}>
                                Grave sua explicação de estudos. O Gemini transcreverá e adicionará o texto abaixo automaticamente.
                            </Text>

                            <View style={styles.recordingArea}>
                                {isRecording ? (
                                    <View style={styles.pulsingIndicatorContainer}>
                                        <View style={styles.pulsingDot} />
                                        <Text style={styles.durationText}>{formatDuration(recordingDuration)}</Text>
                                        <Text style={styles.recordingStatusText}>Gravando sua voz...</Text>
                                    </View>
                                ) : isTranscribing ? (
                                    <View style={styles.transcribingContainer}>
                                        <ActivityIndicator size="large" color="#5a3cf3" style={{ marginBottom: 8 }} />
                                        <Text style={styles.transcribingText}>Gemini transcrevendo áudio...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.recordingStatusText}>Pronto para gravar</Text>
                                )}

                                <TouchableOpacity 
                                    style={[
                                        styles.recordBtn,
                                        isRecording && styles.recordBtnRecording,
                                        isTranscribing && styles.recordBtnDisabled
                                    ]}
                                    onPress={isRecording ? stopRecording : startRecording}
                                    disabled={isTranscribing}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons 
                                        name={isRecording ? "stop" : "mic"} 
                                        size={32} 
                                        color="#ffffff" 
                                    />
                                </TouchableOpacity>
                                
                                <Text style={styles.recordBtnLabel}>
                                    {isRecording ? "Tocar para parar" : "Tocar para gravar"}
                                </Text>
                            </View>
                        </View>
                    )}

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
    categoriesContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        paddingVertical: 4,
    },
    categoryChip: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    activeCategoryChip: {
        backgroundColor: '#5a3cf3',
        borderColor: '#5a3cf3',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4b5563',
    },
    activeCategoryChipText: {
        color: '#ffffff',
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
        minHeight: 120,
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
    saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
    
    // Estilos do gravador de áudio
    audioCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    audioCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    audioCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginLeft: 8,
    },
    audioCardSubtitle: {
        fontSize: 13,
        color: '#6b7280',
        lineHeight: 18,
        marginBottom: 16,
    },
    recordingArea: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    recordingStatusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4b5563',
        marginBottom: 16,
    },
    durationText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 4,
    },
    pulsingIndicatorContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    pulsingDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#ef4444',
        marginBottom: 8,
    },
    transcribingContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    transcribingText: {
        fontSize: 14,
        color: '#5a3cf3',
        fontWeight: '600',
        marginTop: 8,
    },
    recordBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#5a3cf3',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
        marginBottom: 8,
    },
    recordBtnRecording: {
        backgroundColor: '#ef4444',
        shadowColor: '#ef4444',
    },
    recordBtnDisabled: {
        backgroundColor: '#9ca3af',
        shadowColor: '#9ca3af',
    },
    recordBtnLabel: {
        fontSize: 12,
        color: '#6b7280',
        fontWeight: '500',
    },
});
