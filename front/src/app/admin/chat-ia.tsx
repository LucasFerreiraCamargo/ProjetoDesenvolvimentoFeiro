/**
 * Tela: Assistente IA (área admin / feirante).
 *
 * Chat com uma IA que responde via webhook do n8n (chatIaService →
 * EXPO_PUBLIC_N8N_CHAT_URL). É acessada pelo botão de IA na tela de Conversas.
 *
 * Estado é local (a conversa vive só enquanto a tela está aberta). Cada envio
 * manda a mensagem + o histórico atual pro webhook, que devolve a resposta.
 */

import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import React from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAdmin, useAdminGuard, useAdminTitulo } from '../../contexts/AdminContext'
import { chatIaService, type MensagemIa } from '../../services/chatIa'
import { cadastroMultimodalService } from '../../services/cadastroMultimodal'

function novaMensagem(autor: MensagemIa['autor'], texto: string): MensagemIa {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    autor,
    texto,
    createdAt: new Date().toISOString(),
  }
}

/** Converte o asset do ImagePicker em data URI base64 (aceito pelo webhook). */
function resultadoParaDataUri(asset: ImagePicker.ImagePickerAsset): string | null {
  if (!asset?.base64) return null
  const mime =
    asset.mimeType ||
    (asset.fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
  return `data:${mime};base64,${asset.base64}`
}

// Detecta URLs (http/https) dentro do texto. Usado pra transformar links —
// ex.: rota do Google Maps — em trechos azuis clicáveis.
const REGEX_URL = /(https?:\/\/[^\s]+)/g

async function abrirLink(url: string) {
  // Remove pontuação final que costuma "grudar" no fim da URL (., ), etc.)
  const limpa = url.replace(/[.,);]+$/, '')
  try {
    await Linking.openURL(limpa)
  } catch {
    Alert.alert('Link', 'Não consegui abrir este link.')
  }
}

/**
 * Quebra o texto em trechos comuns e links, renderizando as URLs como <Text>
 * azul clicável. O <Text> pai é `selectable`, então o usuário também consegue
 * copiar qualquer resposta.
 */
function renderTextoComLinks(texto: string, estiloLink: object) {
  const partes = texto.split(REGEX_URL)
  return partes.map((parte, i) => {
    if (i % 2 === 1) {
      return (
        <Text key={i} style={estiloLink} onPress={() => abrirLink(parte)}>
          {parte}
        </Text>
      )
    }
    return parte
  })
}

/** Sugestões da tela inicial. `foto` dispara o cadastro por imagem (Gemini). */
const SUGESTOES: { label: string; foto?: boolean; texto?: string }[] = [
  { label: '📷 Cadastrar por foto', foto: true },
  { label: 'Consultar pedidos', texto: '3' },
  { label: 'Menu', texto: 'Menu' },
]

export default function ChatIaScreen() {
  useAdminGuard(2)
  useAdminTitulo('Assistente IA')
  const insets = useSafeAreaInsets()
  const { admin } = useAdmin()

  const [mensagens, setMensagens] = React.useState<MensagemIa[]>([])
  const [texto, setTexto] = React.useState('')
  const [enviando, setEnviando] = React.useState(false)
  // Foto (base64) capturada aguardando o feirante informar qtd/preço.
  // Com a foto pendente, a próxima mensagem de texto fecha o cadastro numa
  // única chamada ao webhook (imagem + texto juntos).
  const [fotoPendente, setFotoPendente] = React.useState<string | null>(null)
  const [tecladoVisivel, setTecladoVisivel] = React.useState(false)
  const [alturaTeclado, setAlturaTeclado] = React.useState(0)
  const listaRef = React.useRef<FlatList<MensagemIa>>(null)
  // Travas SÍNCRONAS anti-rajada. `enviando` (state) atualiza de forma
  // assíncrona e deixa um duplo-toque escapar; refs bloqueiam na hora.
  const requisicaoEmCurso = React.useRef(false)
  const pickerAberto = React.useRef(false)

  const configurado = chatIaService.configurado

  React.useEffect(() => {
    const showEvt = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow'
    const hideEvt = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide'
    const s = Keyboard.addListener(showEvt, (e) => {
      setTecladoVisivel(true)
      setAlturaTeclado(e.endCoordinates?.height ?? 0)
    })
    const h = Keyboard.addListener(hideEvt, () => {
      setTecladoVisivel(false)
      setAlturaTeclado(0)
    })
    return () => {
      s.remove()
      h.remove()
    }
  }, [])

  React.useEffect(() => {
    if (mensagens.length === 0) return
    setTimeout(() => listaRef.current?.scrollToEnd({ animated: true }), 50)
  }, [mensagens.length])

  const padInferior = tecladoVisivel ? 8 : insets.bottom + 8

  // Guarda a foto e pede quantidade/preço. Nenhuma chamada de rede aqui:
  // a foto só é enviada (com o texto) quando o feirante responder.
  const processarFoto = React.useCallback((dataUri: string) => {
    setFotoPendente(dataUri)
    setMensagens((a) => [
      ...a,
      novaMensagem('usuario', '📷 Foto enviada'),
      novaMensagem(
        'ia',
        'Foto recebida! Agora me diga a quantidade e o preço. Ex.: "20 caixas a 5 reais".',
      ),
    ])
  }, [])

  // Ponto de entrada do cadastro por foto: pede câmera ou galeria.
  const iniciarCadastroFoto = React.useCallback(() => {
    if (enviando || requisicaoEmCurso.current || pickerAberto.current) return
    if (!admin?.feiranteId) {
      setMensagens((a) => [
        ...a,
        novaMensagem('ia', '⚠️ Não encontrei seu cadastro de feirante. Faça login novamente.'),
      ])
      return
    }
    // quality baixo + crop quadrado reduzem MUITO o base64 enviado ao Gemini
    // (o reconhecimento não precisa de alta resolução).
    const opcoes: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.35,
      base64: true,
    }
    const abrir = async (fonte: 'camera' | 'galeria') => {
      if (pickerAberto.current || requisicaoEmCurso.current) return
      pickerAberto.current = true
      try {
        const perm =
          fonte === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!perm.granted) {
          setMensagens((a) => [
            ...a,
            novaMensagem('ia', '⚠️ Permissão negada. Habilite o acesso nas configurações do app.'),
          ])
          return
        }
        const result =
          fonte === 'camera'
            ? await ImagePicker.launchCameraAsync(opcoes)
            : await ImagePicker.launchImageLibraryAsync(opcoes)
        if (result.canceled) return
        const uri = resultadoParaDataUri(result.assets[0])
        if (uri) processarFoto(uri)
      } catch {
        setMensagens((a) => [
          ...a,
          novaMensagem('ia', '⚠️ Não consegui abrir a imagem. Tente novamente.'),
        ])
      } finally {
        pickerAberto.current = false
      }
    }
    Alert.alert('Cadastrar por foto', 'Escolha a origem da imagem do produto:', [
      { text: 'Câmera', onPress: () => abrir('camera') },
      { text: 'Galeria', onPress: () => abrir('galeria') },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }, [enviando, admin?.feiranteId, processarFoto])

  const enviar = React.useCallback(
    async (corpoBruto?: string) => {
      const corpo = (corpoBruto ?? texto).trim()
      if (!corpo || enviando || !configurado) return
      if (requisicaoEmCurso.current) return // trava anti-duplo-envio

      // Cadastro por foto: há uma foto pendente e o texto traz qtd/preço.
      // Envia imagem + texto numa ÚNICA chamada ao webhook.
      if (fotoPendente) {
        requisicaoEmCurso.current = true
        setMensagens((a) => [...a, novaMensagem('usuario', corpo)])
        setTexto('')
        setEnviando(true)
        try {
          const r = await cadastroMultimodalService.cadastrar(
            admin?.feiranteId ?? 0,
            fotoPendente,
            corpo,
          )
          // Resposta vazia/sem `status` = webhook não devolveu nada
          // (ex.: Gemini estourou a quota e o fluxo parou antes de responder).
          if (!r || typeof r.status !== 'string') {
            setFotoPendente(null)
            setMensagens((a) => [
              ...a,
              novaMensagem(
                'ia',
                '⚠️ O servidor não respondeu. Verifique se o workflow do n8n está ativo e se a cota do Gemini está disponível, depois tente de novo.',
              ),
            ])
          } else if (r.status === 'cadastrado') {
            setFotoPendente(null)
            setMensagens((a) => [
              ...a,
              novaMensagem('ia', '✅ Produto cadastrado com sucesso!'),
            ])
          } else if (r.status === 'faltam_dados') {
            // Mantém a foto: o feirante só precisa repetir a qtd/preço.
            setMensagens((a) => [...a, novaMensagem('ia', r.mensagem)])
          } else if (r.status === 'nao_identificado') {
            // Foto ruim: descarta e pede uma nova.
            setFotoPendente(null)
            setMensagens((a) => [...a, novaMensagem('ia', `⚠️ ${r.mensagem}`)])
          } else {
            setFotoPendente(null)
            setMensagens((a) => [
              ...a,
              novaMensagem('ia', `⚠️ ${r.mensagem || 'Não consegui cadastrar.'}`),
            ])
          }
        } catch (e: any) {
          setMensagens((a) => [
            ...a,
            novaMensagem(
              'ia',
              e?.message
                ? `⚠️ ${e.message}`
                : '⚠️ Não consegui concluir o cadastro. Tente novamente.',
            ),
          ])
        } finally {
          setEnviando(false)
          requisicaoEmCurso.current = false
        }
        return
      }

      // Opção 1 do menu → cadastro guiado por foto (Gemini), sem texto.
      if (corpo === '1') {
        setTexto('')
        iniciarCadastroFoto()
        return
      }

      requisicaoEmCurso.current = true
      const minha = novaMensagem('usuario', corpo)
      setMensagens((atual) => [...atual, minha])
      setTexto('')
      setEnviando(true)

      try {
        const resposta = await chatIaService.enviar(
          corpo,
          admin?.telefone ?? '',
          admin?.nome ?? 'Feirante',
        )
        setMensagens((atual) => [...atual, novaMensagem('ia', resposta)])
      } catch (e: any) {
        setMensagens((atual) => [
          ...atual,
          novaMensagem(
            'ia',
            e?.message
              ? `⚠️ ${e.message}`
              : '⚠️ Não consegui responder agora. Tente novamente.',
          ),
        ])
      } finally {
        setEnviando(false)
        requisicaoEmCurso.current = false
      }
    },
    [
      texto,
      enviando,
      configurado,
      admin?.telefone,
      admin?.nome,
      admin?.feiranteId,
      fotoPendente,
      iniciarCadastroFoto,
    ],
  )

  function renderItem({ item }: { item: MensagemIa }) {
    const ehMeu = item.autor === 'usuario'
    const hora = new Date(item.createdAt).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
    return (
      <View style={[styles.balaoLinha, ehMeu ? styles.dir : styles.esq]}>
        {!ehMeu && (
          <View style={styles.iaAvatar}>
            <Ionicons name="sparkles" size={14} color="#4A7C59" />
          </View>
        )}
        <View style={[styles.balao, ehMeu ? styles.balaoMeu : styles.balaoIa]}>
          <Text
            selectable
            style={[styles.balaoTexto, ehMeu ? styles.txtMeu : styles.txtIa]}
          >
            {renderTextoComLinks(item.texto, ehMeu ? styles.linkMeu : styles.linkIa)}
          </Text>
          <Text style={[styles.hora, ehMeu ? styles.horaMeu : styles.horaIa]}>
            {hora}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/conversas' as any))}
          style={styles.headerBtn}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color="#255336" />
        </TouchableOpacity>
        <View style={styles.headerTituloBox}>
          <Ionicons name="sparkles" size={16} color="#4A7C59" />
          <Text style={styles.headerTitulo}>Assistente IA</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      <View style={{ flex: 1, marginBottom: alturaTeclado }}>
        <FlatList
          ref={listaRef}
          data={mensagens}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <View style={styles.vazioIcone}>
                <Ionicons name="sparkles" size={30} color="#4A7C59" />
              </View>
              <Text style={styles.vazioTitulo}>
                {configurado ? 'Como posso ajudar?' : 'Assistente não configurado'}
              </Text>
              <Text style={styles.vazioSub}>
                {configurado
                  ? 'Toque na câmera ou envie "1" para cadastrar um produto por foto. Envie "Menu" para ver todas as opções.'
                  : 'Defina EXPO_PUBLIC_N8N_CHAT_URL no .env para ativar o chat.'}
              </Text>
              {configurado && (
                <View style={styles.sugestoes}>
                  {SUGESTOES.map((s) => (
                    <TouchableOpacity
                      key={s.label}
                      style={styles.chip}
                      onPress={() => (s.foto ? iniciarCadastroFoto() : enviar(s.texto))}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipTexto}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          }
        />

        {enviando && (
          <View style={styles.digitando}>
            <ActivityIndicator size="small" color="#4A7C59" />
            <Text style={styles.digitandoTexto}>Assistente está digitando…</Text>
          </View>
        )}

        <View style={[styles.barraInput, { paddingBottom: padInferior }]}>
          <TouchableOpacity
            style={styles.botaoFoto}
            onPress={iniciarCadastroFoto}
            disabled={!configurado || enviando}
            accessibilityRole="button"
            accessibilityLabel="Cadastrar produto por foto"
            hitSlop={{ top: 6, right: 6, bottom: 6, left: 6 }}
          >
            <Ionicons
              name="camera"
              size={22}
              color={!configurado || enviando ? '#B7C3B7' : '#4A7C59'}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder={
              fotoPendente
                ? 'Informe quantidade e preço…'
                : configurado
                  ? 'Escreva sua pergunta…'
                  : 'Chat indisponível'
            }
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={2000}
            editable={configurado && !enviando}
          />
          <TouchableOpacity
            style={[
              styles.botaoEnviar,
              (!configurado || enviando || !texto.trim()) && styles.botaoDesab,
            ]}
            onPress={() => enviar()}
            disabled={!configurado || enviando || !texto.trim()}
          >
            {enviando ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEFEA',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  headerTituloBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitulo: { fontSize: 16, fontFamily: 'Poppins-SemiBold', color: '#255336' },

  lista: { padding: 12, paddingBottom: 20, flexGrow: 1 },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 24 },
  vazioIcone: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F5E8',
    alignItems: 'center', justifyContent: 'center',
  },
  vazioTitulo: { marginTop: 14, fontSize: 17, fontFamily: 'Poppins-SemiBold', color: '#255336' },
  vazioSub: { marginTop: 6, fontSize: 13, color: '#7A8A7C', textAlign: 'center', lineHeight: 18 },
  sugestoes: { marginTop: 18, gap: 8, alignSelf: 'stretch' },
  chip: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D8E4D8',
    borderRadius: 20, paddingVertical: 10, paddingHorizontal: 14,
  },
  chipTexto: { color: '#255336', fontSize: 13, textAlign: 'center' },

  balaoLinha: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end', gap: 6 },
  esq: { justifyContent: 'flex-start' },
  dir: { justifyContent: 'flex-end' },
  iaAvatar: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#E8F5E8',
    alignItems: 'center', justifyContent: 'center',
  },
  balao: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  balaoMeu: { backgroundColor: '#4A7C59', borderBottomRightRadius: 4 },
  balaoIa: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#EAEFEA' },
  balaoTexto: { fontSize: 14, lineHeight: 19 },
  txtMeu: { color: '#FFF' },
  txtIa: { color: '#333' },
  // Links clicáveis: azul sublinhado. No balão verde (meu), um azul claro
  // pra manter contraste sobre o fundo escuro.
  linkIa: { color: '#1B6FE0', textDecorationLine: 'underline' },
  linkMeu: { color: '#BFE0FF', textDecorationLine: 'underline' },
  hora: { fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  horaMeu: { color: '#D8E4D8' },
  horaIa: { color: '#999' },

  digitando: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 6 },
  digitandoTexto: { color: '#7A8A7C', fontSize: 12, fontStyle: 'italic' },

  barraInput: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FFF',
    borderTopWidth: 1, borderTopColor: '#EAEFEA',
  },
  input: {
    flex: 1, minHeight: 40, maxHeight: 100, paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, borderRadius: 20,
    backgroundColor: '#F7F9F7', fontSize: 14, color: '#333',
  },
  botaoFoto: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  botaoEnviar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#4A7C59',
    alignItems: 'center', justifyContent: 'center',
  },
  botaoDesab: { opacity: 0.4 },
})
