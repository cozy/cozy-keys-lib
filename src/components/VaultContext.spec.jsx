import React from 'react'
import { mount } from 'enzyme'
import {
  VaultContext,
  VaultProvider,
  withVaultClient,
  useVaultClient
} from './VaultContext'
import WebVaultClient from '../WebVaultClient'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('../WebVaultClient')

describe('VaultProvider', () => {
  it('should rerender when the locked state changes', async () => {
    const ChildComponent = jest.fn()

    const component = mount(
      <VaultProvider instance={'test@example.com'}>
        <VaultContext.Consumer>{ChildComponent}</VaultContext.Consumer>
      </VaultProvider>
    )

    const client = component.state('client')

    expect(ChildComponent).toHaveBeenCalledWith({ client, locked: true })

    client.unlock()

    await new Promise(resolve =>
      setTimeout(() => {
        expect(ChildComponent).toHaveBeenCalledTimes(2)
        expect(ChildComponent).toHaveBeenCalledWith({ client, locked: false })
        resolve()
      })
    )

    client.lock()

    await new Promise(resolve =>
      setTimeout(() => {
        expect(ChildComponent).toHaveBeenCalledTimes(3)
        expect(ChildComponent).toHaveBeenCalledWith({ client, locked: true })
        resolve()
      })
    )
  })
})

describe('withVaultClient', () => {
  it('should inject vaultClient as a prop', () => {
    const ChildComponent = () => <div />
    const ChildWithClient = withVaultClient(ChildComponent)

    const component = mount(
      <VaultProvider instance={'test@example.com'}>
        <ChildWithClient />
      </VaultProvider>
    )

    const child = component.find(ChildComponent)
    expect(child.prop('vaultClient')).toBeDefined()
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
