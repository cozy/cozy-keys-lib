/**
 * Check whether or not the vault should be unlocked
 *
 * @param {object} vaultClient - The vault client
 * @param {function} addCheckShouldUnlock - An additional check method to unlock
 * @returns {boolean} True if the vault should be unlocked
 */
export const checkShouldUnlock = async (
  vaultClient,
  addCheckShouldUnlock = () => true
) => {
  return (await addCheckShouldUnlock()) && (await vaultClient.isLocked())
}
