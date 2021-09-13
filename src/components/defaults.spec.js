import { checkHasInstalledExtension } from '../CozyUtils'
import { checkShouldUnlock } from './defaults'
import WebVaultClient from '../WebVaultClient'

jest.mock('../CozyUtils', () => ({
  checkHasInstalledExtension: jest.fn(),
  getEmail: jest.fn().mockReturnValue('me@test.fr'),
  isInstance: jest.fn().mockReturnValue(true)
}))

describe('checkShouldUnlock', () => {
  const client = {}

  it('should unlock if extension is installed and locked', async () => {
    const vaultClient = new WebVaultClient('https://me.cozy.wtf')
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(true)
    checkHasInstalledExtension.mockReturnValue(true)

    const shouldUnlock = await checkShouldUnlock(vaultClient, client)
    expect(shouldUnlock).toBe(true)
  })

  it('should not unlock if extension is installed and unlocked', async () => {
    const vaultClient = new WebVaultClient('https://me.cozy.wtf')
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(false)
    checkHasInstalledExtension.mockReturnValue(true)
    const shouldUnlock = await checkShouldUnlock(vaultClient, client)
    expect(shouldUnlock).toBe(false)
  })

  it('should unlock if vault is unlocked and not in a pass context', async () => {
    const vaultClient = new WebVaultClient('https://me.cozy.wtf', {
      isPassContext: false
    })
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(true)
    const shouldUnlock = await checkShouldUnlock(vaultClient, client)
    expect(shouldUnlock).toBe(true)
  })

  it('should not unlock if vault is unlocked and not in a pass context', async () => {
    const vaultClient = new WebVaultClient('https://me.cozy.wtf', {
      isPassContext: false
    })
    jest.spyOn(vaultClient, 'isLocked').mockResolvedValue(false)
    const shouldUnlock = await checkShouldUnlock(vaultClient, client)
    expect(shouldUnlock).toBe(false)
  })
})
