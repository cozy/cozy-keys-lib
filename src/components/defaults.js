import { checkHasInstalledExtension } from '../CozyUtils'

export const checkShouldUnlock = async (vaultClient, client) => {
  if (vaultClient.isPassContext) {
    return (
      (await checkHasInstalledExtension(client)) &&
      (await vaultClient.isLocked())
    )
  }
  return vaultClient.isLocked()
}
