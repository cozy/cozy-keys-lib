import React from 'react'
import WebVaultClient from '../WebVaultClient'

const VaultContext = React.createContext()

class VaultProvider extends React.Component {
  state = {
    client: null
  }

  componentDidMount() {
    console.log('vault provider instance', this.props.instance)
    const client = new WebVaultClient(this.props.instance)
    
    const onEvent = () => {
      console.log('force update')
      this.forceUpdate()
    }
    client.on('unlock', onEvent)
    client.on('lock', onEvent)
    client.on('login', onEvent)

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
