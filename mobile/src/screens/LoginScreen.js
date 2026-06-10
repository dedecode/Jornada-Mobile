import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { signIn } = useContext(AuthContext);

    async function handleLogin() {
        if (!username || !password) {
            Alert.alert('Erro', 'Preencha todos os campos!');
            return;
        }
        try {
            await signIn(username, password);
        } catch (error) {
            const msg = error.response?.data?.detail
                || "Falha de conexão. Verifique se o servidor backend está rodando no IP correto.";
            Alert.alert('Erro', msg);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                    <Text style={styles.title}>Jornada - Login</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Usuário"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Senha"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    <View style={styles.buttonContainer}>
                        <Button title="Entrar" onPress={handleLogin} />
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Não tem conta? Cadastre-se</Text>
                    </TouchableOpacity>
                </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        marginBottom: 15,
        borderRadius: 5
    },
    buttonContainer: {
        marginBottom: 15
    },
    linkText: {
        color: '#007bff',
        textAlign: 'center',
        marginTop: 10
    }
});
