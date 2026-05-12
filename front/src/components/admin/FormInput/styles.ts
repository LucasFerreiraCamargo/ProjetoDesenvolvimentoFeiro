import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  container: { gap: 8 },
  label: {
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
  inputError: {
    borderColor: '#DC2626',
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#DC2626',
  },
})
