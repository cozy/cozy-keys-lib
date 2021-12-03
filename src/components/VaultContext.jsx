import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import WebVaultClient from '../WebVaultClient'
import memoize from 'lodash/memoize'

const VaultContext = React.createContext()

const getVaultClient = memoize(
  (instance, unsafeStorage, vaultData) =>
    new WebVaultClient(instance, { unsafeStorage }, vaultData)
)

class VaultProvider extends React.Component {
  constructor(props) {
    super(props)

    let vaultClient = this.props.vaultClient
    if (this.props.client) {
      vaultClient = this.props.client
      // eslint-disable-next-line no-console
      console.warn(
        'Passing client in props is deprecated, please use vaultClient instead.'
      )
    }
    this.state = {
      vaultClient: vaultClient,
      locked: true
    }

    this.updateLockedState = this.updateLockedState.bind(this)
    this.setupClient = this.setupClient.bind(this)
  }

  componentDidMount() {
    const { cozyClient, instance } = this.props
    if (cozyClient) {
      const uri = cozyClient.getStackClient().uri
      if (!uri) {
        cozyClient.on('login', () => {
          this.setupClient(cozyClient.getStackClient().uri)
        })
      }
    }
    if (instance) {
      this.setupClient(this.props.instance)
    }
  }

  componentWillUnmount() {
    const { vaultClient } = this.state
    if (!vaultClient) {
      return
    }
    vaultClient.removeListener('unlock', this.updateLockedState)
    vaultClient.removeListener('lock', this.updateLockedState)
    vaultClient.removeListener('login', this.updateLockedState)
  }

  async updateLockedState() {
    const { vaultClient } = this.state
    const locked = await vaultClient.isLocked()
    if (locked != this.state.locked) {
      this.setState({ locked })
    }
  }

  setupClient(instance) {
    const unsafeStorage = this.props.unsafeStorage
    const vaultClient =
      this.props.vaultClient ||
      this.props.client ||
      getVaultClient(instance, unsafeStorage, this.props.vaultData)

    this.setState(
      {
        vaultClient,
        locked: true
      },
      () => {
        vaultClient.on('unlock', this.updateLockedState)
        vaultClient.on('lock', this.updateLockedState)
        vaultClient.on('login', this.updateLockedState)

        this.updateLockedState()
      }
    )

    if (this.props.setClient) {
      this.props.setClient(vaultClient)
    }
  }

  render() {
    return (
      <VaultContext.Provider value={this.state}>
        {this.props.children}
      </VaultContext.Provider>
    )
  }
}

VaultProvider.propTypes = {
  instance: PropTypes.string,
  vaultClient: PropTypes.object,
  client: PropTypes.object, // deprecated
  unsafeStorage: PropTypes.bool,
  setClient: PropTypes.func,
  cozyClient: PropTypes.object
}

const withVaultClient = BaseComponent => {
  const Component = props => (
    <VaultContext.Consumer>
      {({ vaultClient }) => (
        <BaseComponent vaultClient={vaultClient} {...props} />
      )}
    </VaultContext.Consumer>
  )

  Component.displayName = `withVaultClient(${BaseComponent.displayName ||
    BaseComponent.name})`

  return Component
}

const useVaultClient = () => {
  const ctx = useContext(VaultContext)
  return ctx.vaultClient
}

export { VaultContext, VaultProvider, withVaultClient, useVaultClient }
