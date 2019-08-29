import React from 'react'
import PropTypes from 'prop-types'
import WebVaultClient from '../WebVaultClient'

const VaultContext = React.createContext()

class VaultProvider extends React.Component {
  state = {
    client: null,
    locked: true
  }

  componentDidMount() {
    const unsafeStorage = this.props.unsafeStorage
    const client = new WebVaultClient(this.props.instance, {unsafeStorage})

    const onLockEvent = async () => {
      const locked = await client.isLocked()
      if (locked != this.state.locked) {
        this.setState({ client, locked })
      }
    }
    client.on('unlock', onLockEvent)
    client.on('lock', onLockEvent)
    client.on('login', onLockEvent)

    this.setState({
      client,
      locked: this.state.locked
    })

    onLockEvent()
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
  unsafeStorage: PropTypes.bool
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

export { VaultContext, VaultProvider, withVaultClient }
