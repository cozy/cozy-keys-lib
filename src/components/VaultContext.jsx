import React from 'react'
import VaultClient from '../VaultClient'

const VaultContext = React.createContext()

class VaultProvider extends React.Component {
  state = {
    client: null
  }

  componentDidMount() {
    const client = new VaultClient(this.props.url)
    client.onUnlock = () => {
      console.log('force update')
      this.forceUpdate()
    }
    this.setState({
      client
    })
  }

  render() {
    const { client } = this.state
    return client ? (
      <VaultContext.Provider value={{ client }}>
        {this.props.children}
      </VaultContext.Provider>
    ) : null
  }
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
