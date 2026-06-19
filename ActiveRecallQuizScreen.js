import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

export default function ActiveRecallQuizScreen({ route, navigation }) {
    // Estados do quiz
    const [isLoading, setIsLoading] = useState(false);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    
    // Texto de fallback para simular ou usar se não houver resumos salvos no banco
    const samplePrompt = "APIs REST (Representational State Transfer) é um estilo arquitetural de APIs que utiliza os métodos HTTP (GET, POST, PUT, DELETE) para realizar operações. Métodos seguros como GET não alteram o estado do servidor, enquanto POST cria recursos, PUT atualiza e DELETE remove.";

    // Função que chama o backend para gerar perguntas reais via Gemini!
    const fetchQuizFromAI = async () => {
        setIsLoading(true);
        setSelectedOptionId(null);
        setIsAnswered(false);
        setCurrentQuestionIndex(0);
        
        try {
            let contentToUse = samplePrompt;
            let summaryTitle = "APIs REST";

            // Se receber conteúdo específico por parâmetro de navegação, usa-o diretamente
            if (route.params?.content) {
                contentToUse = route.params.content;
                summaryTitle = route.params.title || "Tema Selecionado";
            } else {
                // Senão, tenta colher o resumo mais recente do banco de dados
                try {
                    const summariesResponse = await api.get('summaries/daily/');
                    const results = summariesResponse.data.results ? summariesResponse.data.results : summariesResponse.data;
                    if (results && results.length > 0) {
                        const latestSummary = results[0];
                        contentToUse = `Título: ${latestSummary.title}\nConteúdo: ${latestSummary.content}`;
                        summaryTitle = latestSummary.title;
                    }
                } catch (dbError) {
                    console.warn("Falha ao puxar resumos do BD, usando fallback padrão.", dbError);
                }
            }

            // Faz a chamada para a nossa nova API de IA
            const response = await api.post('summaries/daily/generate_quiz/', { content: contentToUse });
            
            if (response.data && response.data.quiz) {
                setQuizData({
                    title: summaryTitle,
                    welcome_message: response.data.welcome_message || "Ótimo! Com base nos seus resumos, gerei algumas perguntas para testar seu aprendizado. Vamos começar? 🚀",
                    questions: response.data.quiz
                });
            } else {
                Alert.alert("Erro", "A IA não retornou um formato de quiz estruturado válido.");
            }
        } catch (error) {
            console.error("Erro ao gerar quiz com Gemini:", error.response?.data || error.message);
            const errMsg = error.response?.data?.error || "Verifique sua chave de API do Gemini no arquivo .env do Backend.";
            Alert.alert("Erro no Tutor de IA", errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    // Lógica para quando o usuário seleciona uma opção de resposta
    const handleSelectOption = (optionId) => {
        if (isAnswered) return; // Não deixa responder de novo a mesma pergunta
        setSelectedOptionId(optionId);
        setIsAnswered(true);
    };

    // Avançar para a próxima pergunta
    const handleNextQuestion = () => {
        if (!quizData) return;
        if (currentQuestionIndex + 1 < quizData.questions.length) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setSelectedOptionId(null);
            setIsAnswered(false);
        } else {
            // Fim do quiz
            Alert.alert("Quiz Concluído!", "Parabéns por praticar o aprendizado ativo! Deseja gerar novas perguntas?", [
                { text: "Gerar novo quiz", onPress: fetchQuizFromAI },
                { text: "Voltar ao Início", onPress: () => navigation.navigate('Root') }
            ]);
        }
    };

    // Obter pergunta atual
    const currentQuestion = quizData?.questions[currentQuestionIndex];

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a24" />
                </TouchableOpacity>
                <Text style={styles.topTitle}>Tutor de IA</Text>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="time-outline" size={24} color="#1a1a24" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Se não houver quiz carregado, exibe tela para carregar */}
                {!quizData && !isLoading && (
                    <View style={styles.welcomeContainer}>
                        <View style={styles.robotGlowWrapper}>
                            <Ionicons name="sparkles" size={40} color="#5a3cf3" />
                        </View>
                        <Text style={styles.welcomeTitle}>Seu Tutor Pessoal de IA</Text>
                        <Text style={styles.welcomeDesc}>
                            Pronto para fixar o conhecimento do caderno? A nossa inteligência lerá seus resumos mais recentes e gerará perguntas dinâmicas sob medida.
                        </Text>
                        <TouchableOpacity style={styles.generateButton} activeOpacity={0.8} onPress={fetchQuizFromAI}>
                            <Ionicons name="play" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                            <Text style={styles.generateButtonText}>Iniciar Sessão de Estudo</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#5a3cf3" />
                        <Text style={styles.loadingText}>O Gemini está analisando seus resumos...</Text>
                        <Text style={styles.loadingSub}>Montando perguntas estruturadas personalizadas</Text>
                    </View>
                )}

                {/* QUIZ ATIVO */}
                {quizData && !isLoading && currentQuestion && (
                    <View style={{ flex: 1 }}>
                        {/* Indicador de Resumo Usado */}
                        <View style={styles.summaryUsedCard}>
                            <View style={styles.summaryIconWrapper}>
                                <Ionicons name="document-text" size={20} color="#5a3cf3" />
                            </View>
                            <View>
                                <Text style={styles.summaryMetaText}>Resumo usado:</Text>
                                <Text style={styles.summaryTitleText}>{quizData.title}</Text>
                            </View>
                        </View>

                        {/* Balão do Tutor de IA */}
                        {currentQuestionIndex === 0 && !isAnswered && (
                            <View style={styles.tutorBalloon}>
                                <View style={styles.robotMiniWrapper}>
                                    <Ionicons name="sparkles" size={16} color="#5a3cf3" />
                                </View>
                                <View style={styles.balloonContent}>
                                    <Text style={styles.balloonText}>
                                        {quizData.welcome_message}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Pergunta */}
                        <View style={styles.questionCard}>
                            <Text style={styles.questionIndex}>
                                Pergunta {currentQuestionIndex + 1} de {quizData.questions.length}
                            </Text>
                            <Text style={styles.questionText}>
                                {currentQuestion.question}
                            </Text>
                        </View>

                        {/* Opções de Resposta */}
                        <View style={styles.optionsContainer}>
                            {currentQuestion.options.map((option) => {
                                const isSelected = selectedOptionId === option.id;
                                const isCorrect = option.id === currentQuestion.correct_option;
                                
                                // Determina estilos dinâmicos de cor baseados na resposta
                                let optionStyle = styles.optionButton;
                                let optionTextStyle = styles.optionText;
                                let iconName = null;
                                let iconColor = null;

                                if (isAnswered) {
                                    if (isCorrect) {
                                        // Opção correta (destaca em verde)
                                        optionStyle = [styles.optionButton, styles.optionCorrect];
                                        optionTextStyle = [styles.optionText, styles.optionTextCorrect];
                                        iconName = "checkmark-circle";
                                        iconColor = "#10b981";
                                    } else if (isSelected && !isCorrect) {
                                        // Opção errada que o usuário clicou (destaca em vermelho)
                                        optionStyle = [styles.optionButton, styles.optionIncorrect];
                                        optionTextStyle = [styles.optionText, styles.optionTextIncorrect];
                                        iconName = "close-circle";
                                        iconColor = "#ef4444";
                                    } else {
                                        // Opções neutras após respondido
                                        optionStyle = [styles.optionButton, styles.optionDisabled];
                                    }
                                } else if (isSelected) {
                                    optionStyle = [styles.optionButton, styles.optionSelected];
                                    optionTextStyle = [styles.optionText, styles.optionTextSelected];
                                }

                                return (
                                    <TouchableOpacity 
                                        key={option.id}
                                        style={optionStyle}
                                        activeOpacity={0.8}
                                        onPress={() => handleSelectOption(option.id)}
                                        disabled={isAnswered}
                                    >
                                        <View style={styles.optionContent}>
                                            <View style={styles.optionBadge}>
                                                <Text style={[
                                                    styles.optionBadgeText,
                                                    isSelected && styles.optionBadgeTextSelected,
                                                    isAnswered && isCorrect && styles.optionBadgeTextCorrect
                                                ]}>
                                                    {option.id.toUpperCase()}
                                                </Text>
                                            </View>
                                            <Text style={optionTextStyle}>{option.text}</Text>
                                        </View>
                                        {iconName && <Ionicons name={iconName} size={20} color={iconColor} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* BLOCO DE FEEDBACK DO GEMINI APÓS RESPONDER */}
                        {isAnswered && (
                            <View style={[
                                styles.feedbackCard, 
                                selectedOptionId === currentQuestion.correct_option ? styles.feedbackCardCorrect : styles.feedbackCardIncorrect
                            ]}>
                                <View style={styles.feedbackHeader}>
                                    <Ionicons 
                                        name={selectedOptionId === currentQuestion.correct_option ? "checkmark-circle" : "alert-circle"} 
                                        size={22} 
                                        color={selectedOptionId === currentQuestion.correct_option ? "#10b981" : "#ef4444"} 
                                    />
                                    <Text style={[
                                        styles.feedbackHeaderText,
                                        { color: selectedOptionId === currentQuestion.correct_option ? "#10b981" : "#ef4444" }
                                    ]}>
                                        {selectedOptionId === currentQuestion.correct_option ? "Correto! 🥳" : "Quase lá! 💡"}
                                    </Text>
                                </View>
                                <Text style={styles.feedbackExplanation}>
                                    {currentQuestion.explanation}
                                </Text>
                            </View>
                        )}

                        {/* Botões de Ação */}
                        <View style={styles.actionsContainer}>
                            {isAnswered && (
                                <TouchableOpacity style={styles.nextButton} activeOpacity={0.8} onPress={handleNextQuestion}>
                                    <Text style={styles.nextButtonText}>
                                        {currentQuestionIndex + 1 === quizData.questions.length ? "Finalizar Quiz" : "Próxima pergunta"}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.resetButton} activeOpacity={0.8} onPress={fetchQuizFromAI}>
                                <Ionicons name="refresh" size={18} color="#5a3cf3" style={{ marginRight: 6 }} />
                                <Text style={styles.resetButtonText}>Gerar novas perguntas</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderColor: '#e5e7eb',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    topTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a24' },
    container: { padding: 20, paddingBottom: 40 },
    
    // Welcome Styles
    welcomeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 10,
    },
    robotGlowWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0eeff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2
    },
    welcomeTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a24', marginBottom: 12, textAlign: 'center' },
    welcomeDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
    generateButton: {
        flexDirection: 'row',
        backgroundColor: '#5a3cf3',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    generateButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },

    // Loading Styles
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    loadingText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a24', marginTop: 20 },
    loadingSub: { fontSize: 13, color: '#6b7280', marginTop: 8, textAlign: 'center' },

    // Quiz Active Styles
    summaryUsedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb'
    },
    summaryIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#eeebff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    summaryMetaText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
    summaryTitleText: { fontSize: 14, fontWeight: 'bold', color: '#1a1a24' },
    
    tutorBalloon: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    robotMiniWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f0eeff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    balloonContent: { flex: 1 },
    balloonText: { fontSize: 14, color: '#1a1a24', lineHeight: 20 },
    
    questionCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    questionIndex: { fontSize: 12, fontWeight: 'bold', color: '#5a3cf3', marginBottom: 10 },
    questionText: { fontSize: 16, fontWeight: 'bold', color: '#1a1a24', lineHeight: 24 },
    
    optionsContainer: { marginBottom: 10 },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    optionSelected: {
        borderColor: '#5a3cf3',
        backgroundColor: '#eeebff',
    },
    optionCorrect: {
        borderColor: '#10b981',
        backgroundColor: '#e6fcf5',
    },
    optionIncorrect: {
        borderColor: '#ef4444',
        backgroundColor: '#fdf2f2',
    },
    optionDisabled: {
        opacity: 0.6,
    },
    optionContent: { flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 10 },
    optionBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    optionBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#6b7280' },
    optionBadgeTextSelected: { color: '#5a3cf3' },
    optionBadgeTextCorrect: { color: '#10b981' },
    optionText: { fontSize: 14, color: '#1a1a24', fontWeight: '500', flex: 1 },
    optionTextSelected: { color: '#5a3cf3', fontWeight: 'bold' },
    optionTextCorrect: { color: '#065f46', fontWeight: 'bold' },
    optionTextIncorrect: { color: '#991b1b', fontWeight: 'bold' },
    
    feedbackCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    feedbackCardCorrect: {
        backgroundColor: '#e6fcf5',
        borderColor: '#10b981',
    },
    feedbackCardIncorrect: {
        backgroundColor: '#fff9db',
        borderColor: '#f59e0b',
    },
    feedbackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    feedbackHeaderText: { fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
    feedbackExplanation: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
    
    actionsContainer: { marginTop: 10 },
    nextButton: {
        flexDirection: 'row',
        backgroundColor: '#5a3cf3',
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3
    },
    nextButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
    resetButton: {
        flexDirection: 'row',
        backgroundColor: '#eeebff',
        paddingVertical: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#dcd8ff'
    },
    resetButtonText: { fontSize: 14, fontWeight: 'bold', color: '#5a3cf3' },
});
