# Cozy-Keys-Libs

This lib allows your cozy to manage a bitwarden vault. It uses and embed the [official shared library from bitwarden](https://github.com/bitwarden/jslib).

## What is this?

This is component of the [Cozy Cloud](https://cozy.io) platform and not an component of [Bitwarden](https://bitwarden.com/).

## Usage

```javascript
const instance = 'https://myuser.mycozy.cloud'
vault = WebVaultClient(instance)
await vault.unlock(masterPassword)
await vault.sync()
const all = vault.getAllDecrypted({type: vault.cipherTypes.Login})
```


## Dev

```sh
yarn install
yarn build
```