import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  titulo: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
    marginBottom: 8,
  },
  mensagem: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  botoes: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoCancelar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textoCancelar: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#666666',
  },
  botaoConfirmar: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoConfirmar: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
})
