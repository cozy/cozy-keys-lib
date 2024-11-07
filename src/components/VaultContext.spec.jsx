import React from 'react'
import { EventEmitter } from 'events'
import {
  VaultContext,
  VaultProvider,
  withVaultClient,
  useVaultClient
} from './VaultContext'
import WebVaultClient from '../WebVaultClient'
import { render, waitFor } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('../WebVaultClient')

const createFakeVaultClient = () => {
  const vaultClient = new EventEmitter()

  vaultClient.on('lock', () => {
    vaultClient.locked = true
  })
  vaultClient.on('unlock', () => {
    vaultClient.locked = false
  })
  vaultClient.isLocked = () => vaultClient.locked

  return vaultClient
}

describe('VaultProvider', () => {
  it('should rerender when the locked state changes', async () => {
    const ChildComponent = jest.fn(() => null)
    const vaultClient = createFakeVaultClient()

    render(
      <VaultProvider vaultClient={vaultClient} instance={'test@example.com'}>
        <VaultContext.Consumer>{ChildComponent}</VaultContext.Consumer>
      </VaultProvider>
    )

    expect(ChildComponent).toHaveBeenCalledWith({
      vaultClient,
      locked: true
    })

    vaultClient.emit('unlock')

    await waitFor(() => {
      expect(ChildComponent).toHaveBeenCalledWith({
        vaultClient,
        locked: false
      })
    })

    vaultClient.emit('lock')

    await waitFor(() => {
      expect(ChildComponent).toHaveBeenCalledWith({
        vaultClient,
        locked: true
      })
    })
  })
})

describe('withVaultClient', () => {
  it('should inject vaultClient as a prop', async () => {
    const ChildComponent = jest.fn(() => null)

    const ChildWithClient = withVaultClient(ChildComponent)

    render(
      <VaultProvider instance={'test@example.com'}>
        <ChildWithClient />
      </VaultProvider>
    )

    // Check if the vault is correctly injected as a prop
    const propsPassedToChildComponent = Object.keys(
      ChildComponent.mock.calls[0][0]
    )
    expect(propsPassedToChildComponent).toContain('vaultClient')
  })
})

describe('useVaultClient', () => {
  it('should return the vault client from the context', () => {
    const wrapper = ({ children }) => (
      <VaultProvider instance="test@example.com">{children}</VaultProvider>
    )
    const { result } = renderHook(() => useVaultClient(), { wrapper })
    expect(result.current).toBeInstanceOf(WebVaultClient)
  })
})
