import React, { useState } from 'react';
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
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [secureText, setSecureText] = useState(true);

    async function handleRegister() {
        if (!username.trim() || !password.trim() || !email.trim()) {
            Alert.alert('Erro', 'Preencha todos os campos!');
            return;
        }

        setLoading(true);
        try {
            await api.post('users/register/', {
                username: username.trim(),
                email: email.trim(),
                password: password.trim(),
            });
            Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login.');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Register Error:', error);
            const msg = error.response?.data?.username?.[0] || error.response?.data?.detail || 'Erro ao criar conta. Tente outro usuário.';
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
                            <Ionicons name="person-add" size={32} color="#10b981" />
                        </View>
                        <Text style={styles.appName}>Criar Conta</Text>
                        <Text style={styles.appSubtitle}>Junte-se à comunidade inteligente de estudos</Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Comece agora!</Text>
                        <Text style={styles.cardSubtitle}>Preencha os dados abaixo para registrar-se.</Text>

                        {/* Input de E-mail */}
                        <Text style={styles.label}>E-mail</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="exemplo@email.com"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Input de Usuário */}
                        <Text style={styles.label}>Usuário</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Escolha um nome de usuário"
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
                                placeholder="Crie uma senha forte"
                                placeholderTextColor="#9ca3af"
                                secureTextEntry={secureText}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeIcon}>
                                <Ionicons name={secureText ? "eye-off-outline" : "eye-outline"} size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        {/* Botão de Registro */}
                        <TouchableOpacity 
                            style={styles.registerButton} 
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.registerButtonText}>Cadastrar</Text>
                            )}
                        </TouchableOpacity>

                        {/* Link para o Login */}
                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                            <Text style={styles.loginText}>
                                Já tem uma conta? <Text style={styles.loginTextBold}>Entre aqui</Text>
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
        marginBottom: 24,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: '#e6fcf5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#10b981',
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
    registerButton: {
        backgroundColor: '#10b981',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: '#6b7280',
    },
    loginTextBold: {
        color: '#10b981',
        fontWeight: '700',
    },
});
