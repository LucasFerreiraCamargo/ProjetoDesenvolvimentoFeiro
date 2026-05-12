import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  base: {
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primary: {
    backgroundColor: '#255336',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#255336',
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: '#FFF3F3',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  disabled: {
    opacity: 0.6,
  },
  textPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  textOutline: {
    color: '#255336',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  textDanger: {
    color: '#FF5722',
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
  },
})
