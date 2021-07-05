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

    this.state = {
      client: null,
      locked: true
    }

    this.updateLockedState = this.updateLockedState.bind(this)
    this.setupClient = this.setupClient.bind(this)
  }

  componentDidMount() {
    if (this.props.instance) {
      this.setupClient()
    }
  }

  componentWillUnmount() {
    const { client } = this.state
    if (!client) {
      return
    }
    client.removeListener('unlock', this.updateLockedState)
    client.removeListener('lock', this.updateLockedState)
    client.removeListener('login', this.updateLockedState)
  }

  async updateLockedState() {
    const { client } = this.state
    const locked = await client.isLocked()
    if (locked != this.state.locked) {
      this.setState({ locked })
    }
  }

  setupClient() {
    const unsafeStorage = this.props.unsafeStorage

    const client = getVaultClient(
      this.props.instance,
      unsafeStorage,
      this.props.vaultData
    )

    this.setState(
      {
        client,
        locked: true
      },
      () => {
        client.on('unlock', this.updateLockedState)
        client.on('lock', this.updateLockedState)
        client.on('login', this.updateLockedState)

        this.updateLockedState()
      }
    )

    if (this.props.setClient) {
      this.props.setClient(client)
    }
  }

  render() {
    const { client } = this.state
    return client ? (
      <VaultContext.Provider value={this.state}>
        {this.props.children}
      </VaultContext.Provider>
    ) : null
  }
}

VaultProvider.propTypes = {
  instance: PropTypes.string.isRequired,
  unsafeStorage: PropTypes.bool,
  setClient: PropTypes.func
}

const withVaultClient = BaseComponent => {
  const Component = props => (
    <VaultContext.Consumer>
      {({ client }) => <BaseComponent vaultClient={client} {...props} />}
    </VaultContext.Consumer>
  )

  Component.displayName = `withVaultClient(${BaseComponent.displayName ||
    BaseComponent.name})`

  return Component
}

const useVaultClient = () => {
  const ctx = useContext(VaultContext)
  return ctx.client
}

export { VaultContext, VaultProvider, withVaultClient, useVaultClient }
