import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#333333',
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  rowPressed: {
    backgroundColor: '#F9FFF9',
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#333333',
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#999999',
    paddingVertical: 40,
  },
  loading: {
    paddingVertical: 40,
  },
})
