import { checkHasInstalledExtension } from '../CozyUtils'

export const checkShouldUnlock = async (vaultClient, client) => {
  return (
    (await checkHasInstalledExtension(client)) && (await vaultClient.isLocked())
  )
}
