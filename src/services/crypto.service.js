import { CryptoService as CryptoServiceBase } from '../@bitwarden/jslib/services/crypto.service'

export class CryptoService extends CryptoServiceBase {
  constructor(
    storageService,
    secureStorageService,
    cryptoFunctionService,
    platformUtilService
  ) {
    super(
      storageService,
      secureStorageService,
      cryptoFunctionService,
      platformUtilService
    )
  }

  setOrgKeys(orgs) {
    const validOrgs = orgs.filter(org => org.key !== '')

    return super.setOrgKeys(validOrgs)
  }
}
