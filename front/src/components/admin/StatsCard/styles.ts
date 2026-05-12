import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    shadowColor: 'rgba(0,0,0,0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
    shadowOpacity: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  valor: {
    fontSize: 28,
    fontFamily: 'Poppins-SemiBold',
    color: '#255336',
    marginBottom: 4,
  },
  titulo: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666666',
  },
})
