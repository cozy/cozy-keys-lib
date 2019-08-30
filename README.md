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
const all = vault.getAllDecrypted({ type: vault.cipherTypes.Login })
```

## Dev

```sh
yarn
yarn setup:submodule
yarn build:jslib

yarn build:keys
```

## Testing in an app

cozy-keys-lib relies on cryptographic APIs that are only enabled on secure locations, such as pages served with https or `localhost`. This means that running it on `http://cozy.tools:8080` will not work.

It may be possible to force your browser to consider this location as secure anyway and enable the crypto APIs. In Chrome for example, go to `chrome://flags`, find the "Insecure origins treated as secure" section and add `http://cozy.tools:8080`.
