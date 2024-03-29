import React from 'react'
import ReactDOM from 'react-dom'
import { Route } from 'react-router'
import { createStore, combineReducers } from 'redux'
import App from './common/App'
import client from './common/client'
import 'cozy-ui/transpiled/react/stylesheet.css'
import Sprite from 'cozy-ui/transpiled/react/Icon/Sprite'
import { withClient } from 'cozy-client'

import { VaultProvider, VaultUnlocker } from '../../transpiled'

let localConfig = {}
try {
  localConfig = require('../local.config.json')
} catch (e) {
  // nothing
}

const reducer = combineReducers({
  cozy: client.reducer()
})

const store = createStore(reducer)

const setToWindow = client => {
  window.vaultClient = client
}

function VaultComponent({ client }) {
  const uri = client.getStackClient().uri
  const cfg = localConfig.keysInstance
  return (
    <VaultProvider instance={cfg || uri} setClient={setToWindow}>
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
