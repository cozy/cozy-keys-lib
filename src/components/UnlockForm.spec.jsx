import React from 'react'
import { render, fireEvent, act, waitFor, screen } from '@testing-library/react'

import CozyClient, { CozyProvider } from 'cozy-client'
import I18n from 'cozy-ui/transpiled/react/providers/I18n'
import { BreakpointsProvider } from 'cozy-ui/transpiled/react/providers/Breakpoints'

import { VaultProvider, useVaultClient } from './VaultContext'
import UnlockForm from './UnlockForm'

jest.mock('./VaultContext', () => {
  const { VaultProvider } = jest.requireActual('./VaultContext')
  const useVaultClient = jest.fn()
  return { VaultProvider, useVaultClient }
})

const sleep = duration => new Promise(resolve => setTimeout(resolve, duration))
describe('unlock form', () => {
  it('should unlock the form', async () => {
    const client = new CozyClient({
      uri: 'http://cozy.tools:8080'
    })
    const vaultUnlock = jest.fn().mockResolvedValue(true)
    useVaultClient.mockReturnValue({
      unlock: vaultUnlock
    })
    const onUnlock = jest.fn()
    const root = render(
      <CozyProvider client={client}>
        <BreakpointsProvider>
          <VaultProvider instance="cozy.tools:8080">
            <I18n dictRequire={() => ({})} lang="en">
              <UnlockForm
                closable={true}
                onDismiss={jest.fn()}
                onUnlock={onUnlock}
              />
            </I18n>
          </VaultProvider>
        </BreakpointsProvider>
      </CozyProvider>
    )

    const password = await waitFor(() =>
      screen.getByLabelText(/password/i, { selector: 'input' })
    )
    await act(async () => {
      fireEvent.change(password, { target: { value: 'my-password' } })
    })
    await sleep(1)
    const btn = root.getByText('Unlock')
    await act(async () => {
      fireEvent.click(btn)
    })
    expect(vaultUnlock).toHaveBeenCalledWith('my-password')
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })
})
