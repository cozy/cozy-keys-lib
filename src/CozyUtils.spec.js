import { getEmail } from './CozyUtils'

describe('CozyUtils', () => {
  describe('getEmail', () => {
    it('should leave as is real emails', () => {
      const email = 'eric@example.org'
      expect(getEmail(email)).toBe(email)
    })

    it('should convert instance to email', () => {
      const instance = 'https://my.example.org/hello'
      const email = 'me@my.example.org'
      expect(getEmail(instance)).toBe(email)
    })
  })
})
