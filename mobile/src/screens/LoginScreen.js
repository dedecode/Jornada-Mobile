import React, { useState, useContext } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);
    const { signIn } = useContext(AuthContext);

    async function handleLogin() {
        if (!username.trim() || !password.trim()) {
            Alert.alert('Erro', 'Preencha todos os campos!');
            return;
        }
        setLoading(true);
        try {
            await signIn(username.trim(), password.trim());
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.detail
                || "Falha de conexão. Verifique se o servidor backend está rodando no IP correto.";
            Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="sparkles" size={32} color="#5a3cf3" />
                        </View>
                        <Text style={styles.appName}>Jornada</Text>
                        <Text style={styles.appSubtitle}>Seu companheiro inteligente de estudos</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Bem-vindo de volta!</Text>
                        <Text style={styles.cardSubtitle}>Faça login para continuar sua jornada.</Text>

                        {/* Input de Usuário */}
                        <Text style={styles.label}>Usuário</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Digite seu usuário"
                                placeholderTextColor="#9ca3af"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        {/* Input de Senha */}
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Digite sua senha"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={secureText}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Botão de Login */}
                        <TouchableOpacity 
                            style={styles.loginButton} 
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Entrar</Text>
                            )}
                        </TouchableOpacity>

                        {/* Link de Cadastro */}
                        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
                            <Text style={styles.registerText}>
                                Não tem uma conta? <Text style={styles.registerTextBold}>Cadastre-se</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f8f9fe' },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#eeebff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1a1a24',
    },
    appSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginTop: 6,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a1a24',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 20,
        height: 52,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: '#1f2937',
        height: '100%',
    },
    eyeIcon: {
        padding: 4,
    },
    loginButton: {
        backgroundColor: '#5a3cf3',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#5a3cf3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
        color: '#6b7280',
    },
    registerTextBold: {
        color: '#5a3cf3',
        fontWeight: '700',
    },
});
