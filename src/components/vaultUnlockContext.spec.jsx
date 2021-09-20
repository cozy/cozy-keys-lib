import React from 'react'
import { render, act, fireEvent } from '@testing-library/react'
import {
  VaultUnlockProvider,
  useVaultUnlockContext
} from './vaultUnlockContext'
import { useVaultClient } from './VaultContext'

jest.mock('./VaultContext', () => ({
  useVaultClient: jest.fn()
}))

describe('vault unlock context', () => {
  const Component = ({ onUnlock }) => {
    const { showingUnlockForm, showUnlockForm } = useVaultUnlockContext()
    return (
      <div>
        {'showingUnlockForm: ' + showingUnlockForm.toString()}
        <button onClick={() => showUnlockForm({ onUnlock })} role="button">
          show unlock form
        </button>
      </div>
    )
  }

  const setup = async () => {
    const onUnlock = jest.fn()
    const root = render(
      <VaultUnlockProvider>
        <Component onUnlock={onUnlock} />
      </VaultUnlockProvider>
    )

    await act(async () => {
      toggleUnlockForm(root)
    })

    return { root, onUnlock }
  }

  const toggleUnlockForm = root => {
    fireEvent.click(root.getByText('show unlock form'))
  }

  it('should show unlock form if vault should be unlocked', async () => {
    useVaultClient.mockReturnValue({
      isLocked: jest.fn().mockResolvedValue(true)
    })
    const { root, onUnlock } = await setup()
    root.getByText('showingUnlockForm: true')
    expect(onUnlock).not.toHaveBeenCalled()
  })

  it('should not show unlock form and call onUnlock if vault is unlocked', async () => {
    useVaultClient.mockReturnValue({
      isLocked: jest.fn().mockResolvedValue(false)
    })
    const { root, onUnlock } = await setup()
    expect(root.getByText('showingUnlockForm: false')).toBeTruthy()
    expect(onUnlock).toHaveBeenCalled()
  })
})
