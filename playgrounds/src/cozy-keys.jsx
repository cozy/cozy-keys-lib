import React from 'react'
import ReactDOM from 'react-dom'
import { Route } from 'react-router'
import { createStore, combineReducers } from 'redux'
import { Provider } from 'react-redux'
import App from './common/App'
import client from './common/client'
import 'cozy-ui/transpiled/react/stylesheet.css'
import { Sprite } from 'cozy-ui/transpiled/react/Icon'
//import 'cozy-ui/dist/cozy-ui.min.css'
import { withClient } from 'cozy-client'

import { VaultProvider, VaultUnlocker } from '../../transpiled'

const reducer = combineReducers({
  cozy: client.reducer()
})

const store = createStore(reducer)

function VaultComponent({ client }) {
  //const instance = client.getStackClient().uri
  const instance = "eric.daspet@survol.fr"
  return (
    <VaultProvider instance={instance}>
      <Sprite />
      <VaultUnlocker>
        <div>Unlocked</div>
      </VaultUnlocker>
    </VaultProvider>
  )
}


const VaultWithClient = withClient(VaultComponent)

ReactDOM.render(
  <App client={client} existingStore={store}>
    <Route path="/" component={VaultWithClient} />
  </App>,
  document.querySelector('#app')
)
