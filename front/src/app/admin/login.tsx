import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { NIVEL_MINIMO_ADMIN_AREA, useAdmin } from '../../contexts/AdminContext'
import BotaoVoltar from '../../components/BotaoVoltar'

export default function AdminLogin() {
  const router = useRouter()
  const { admin, login, loading } = useAdmin()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Se já houver admin logado, pula direto para o dashboard
  useEffect(() => {
    if (!loading && admin) {
      router.replace('/admin/dashboard')
    }
  }, [admin, loading])

  const handleLogin = async () => {
    if (isLoading) return

    if (!email || !senha) {
      alert('Preencha e-mail e senha')
      return
    }

    setIsLoading(true)
    try {
      console.log('[AdminLogin] Tentando login para', email, '(nível mínimo exigido:', NIVEL_MINIMO_ADMIN_AREA, ')')
      await login(email, senha)
      console.log('[AdminLogin] Acesso liberado, redirecionando para /admin/dashboard')
      router.replace('/admin/dashboard')
    } catch (err: any) {
      console.warn('[AdminLogin] Falha no login:', err?.message || err)
      alert(err?.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Fallback do botão Voltar: área do cliente. Se o feirante abriu o
          login admin direto (deep link) e desistir, vai pra home pública. */}
      <BotaoVoltar destinoFallback="/home" />
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Painel Administrativo</Text>
      </View>

      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Acesso Administrativo</Text>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#999"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <Pressable
            style={[styles.entrarButton, isLoading && styles.entrarButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.entrarButtonText}>Entrar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7E4',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 60,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#4A4A4A',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#FAFAFA',
    color: '#333333',
  },
  entrarButton: {
    backgroundColor: '#255336',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  entrarButtonDisabled: {
    opacity: 0.7,
  },
  entrarButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
})
