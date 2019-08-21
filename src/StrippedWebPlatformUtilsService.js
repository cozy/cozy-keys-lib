/*
 * This file is a modified version of /src/services/webPlatformUtils.service.ts
 * in https://github.com/bitwarden/web which is licensed with the terms of the
 * Gnu Public License 3.0 (GPL 3.0)
 */

import { DeviceType } from './@bitwarden/jslib/enums/deviceType'

export default class StrippedWebPlatformUtilsService {
  constructor() {
    this.identityClientId = 'web'
    this.browserCache = null
  }

  getDevice() {
    if (this.browserCache != null) {
      return this.browserCache
    }

    if (
      navigator.userAgent.indexOf(' Firefox/') !== -1 ||
      navigator.userAgent.indexOf(' Gecko/') !== -1
    ) {
      this.browserCache = DeviceType.FirefoxBrowser
    } else if (navigator.userAgent.indexOf(' OPR/') >= 0) {
      this.browserCache = DeviceType.OperaBrowser
    } else if (navigator.userAgent.indexOf(' Edge/') !== -1) {
      this.browserCache = DeviceType.EdgeBrowser
    } else if (navigator.userAgent.indexOf(' Vivaldi/') !== -1) {
      this.browserCache = DeviceType.VivaldiBrowser
    } else if (
      navigator.userAgent.indexOf(' Safari/') !== -1 &&
      navigator.userAgent.indexOf('Chrome') === -1
    ) {
      this.browserCache = DeviceType.SafariBrowser
    } else if (
      window.chrome &&
      navigator.userAgent.indexOf(' Chrome/') !== -1
    ) {
      this.browserCache = DeviceType.ChromeBrowser
    } else if (navigator.userAgent.indexOf(' Trident/') !== -1) {
      this.browserCache = DeviceType.IEBrowser
    } else {
      this.browserCache = DeviceType.UnknownBrowser
    }
    return this.browserCache
  }

  getDeviceString() {
    const device = DeviceType[this.getDevice()].toLowerCase()
    return device.replace('browser', '')
  }

  isFirefox() {
    return this.getDevice() === DeviceType.FirefoxBrowser
  }

  isChrome() {
    return this.getDevice() === DeviceType.ChromeBrowser
  }

  isEdge() {
    return false
    return this.getDevice() === DeviceType.EdgeBrowser
  }

  isOpera() {
    return this.getDevice() === DeviceType.OperaBrowser
  }

  isVivaldi() {
    return this.getDevice() === DeviceType.VivaldiBrowser
  }

  isSafari() {
    return this.getDevice() === DeviceType.SafariBrowser
  }

  isIE() {
    return this.getDevice() === DeviceType.IEBrowser
  }

  isMacAppStore() {
    return false
  }

  isDev() {
    const env = process.env.NODE_ENV || process.env.ENV
    return env && env.match(/\bdevelopment\b/)
  }

  isSelfHost() {
    return true
  }
}
