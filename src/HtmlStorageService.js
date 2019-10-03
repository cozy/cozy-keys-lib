/*
 * This file is a modified version of /services/htmlStorageService.service.ts
 * in https://github.com/bitwarden/web which is licensed with the terms of the
 * Gnu Public License 3.0 (GPL 3.0)
 */

import { ConstantsService } from './@bitwarden/jslib/services/constants.service'

export default class HtmlStorageService {
  constructor(platformUtilsService) {
    this.platformUtilsService = platformUtilsService

    this.localStorageKeys = new Set([
      'appId',
      'anonymousAppId',
      'rememberedEmail',
      'passwordGenerationOptions',
      ConstantsService.disableFaviconKey,
      ConstantsService.lockOptionKey,
      'rememberEmail',
      'enableGravatars',
      ConstantsService.localeKey,
      ConstantsService.lockOptionKey,
      ConstantsService.autoConfirmFingerprints
    ])
    this.localStorageStartsWithKeys = [
      'twoFactorToken_',
      ConstantsService.collapsedGroupingsKey + '_'
    ]
  }

  async init() {
    const lockOption = await this.get(ConstantsService.lockOptionKey)
    if (lockOption == null && !this.platformUtilsService.isDev()) {
      await this.save(ConstantsService.lockOptionKey, 15)
    }
  }

  get(key) {
    let json = null
    if (this.isLocalStorage(key)) {
      json = window.localStorage.getItem(key)
    } else {
      json = window.sessionStorage.getItem(key)
    }
    if (json != null) {
      const obj = JSON.parse(json)
      return Promise.resolve(obj)
    }
    return Promise.resolve(null)
  }

  save(key, obj) {
    if (obj == null) {
      return this.remove(key)
    }

    const json = JSON.stringify(obj)
    if (this.isLocalStorage(key)) {
      window.localStorage.setItem(key, json)
    } else {
      window.sessionStorage.setItem(key, json)
    }
    return Promise.resolve()
  }

  remove(key) {
    if (this.isLocalStorage(key)) {
      window.localStorage.removeItem(key)
    } else {
      window.sessionStorage.removeItem(key)
    }
    return Promise.resolve()
  }

  isLocalStorage(key) {
    if (this.localStorageKeys.has(key)) {
      return true
    }
    for (let swKey of this.localStorageStartsWithKeys) {
      if (key.startsWith(swKey)) {
        return true
      }
    }
    return false
  }
}
