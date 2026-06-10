import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import api from '../services/api';

export default function RegisterScreen({ navigation }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    async function handleRegister() {
        if (!username || !password || !email) {
            Alert.alert('Erro', 'Preencha todos os campos!');
            return;
        }

        try {
            await api.post('users/register/', {
                username,
                email,
                password,
            });
            Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login.');
            navigation.navigate('Login');
        } catch (error) {
            console.error('Register Error:', error);
            const msg = error.response?.data?.username?.[0] || error.response?.data?.detail || 'Erro ao criar conta. Tente outro usuário.';
            Alert.alert('Erro', msg);
        }
    }

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.container}>
                    <Text style={styles.title}>Criar Nova Conta</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
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
                        <Button title="Cadastrar" onPress={handleRegister} color="#28a745" />
                    </View>

                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Já tem uma conta? Entre aqui.</Text>
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
