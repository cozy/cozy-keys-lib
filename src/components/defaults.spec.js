import { checkShouldUnlock } from './defaults'
import WebVaultClient from '../WebVaultClient'

jest.mock('../CozyUtils', () => ({
  checkHasInstalledExtension: jest.fn(),
  getEmail: jest.fn().mockReturnValue('me@test.fr'),
  isInstance: jest.fn().mockReturnValue(true)
}))

describe('checkShouldUnlock', () => {
  const vaultClient = new WebVaultClient('https://me.cozy.wtf')

  it('should return true when the vault is locked', async () => {
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(true)
    const shouldUnlock = await checkShouldUnlock(vaultClient)
    expect(shouldUnlock).toBe(true)
  })

  it('should return false when the vault is already unlocked', async () => {
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(false)
    const shouldUnlock = await checkShouldUnlock(vaultClient)
    expect(shouldUnlock).toBe(false)
  })

  it('should return false when additional check function return false', async () => {
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(true)
    const additionalUnlockCheck = () => false
    const shouldUnlock = await checkShouldUnlock(
      vaultClient,
      additionalUnlockCheck
    )
    expect(shouldUnlock).toBe(false)
  })
})
