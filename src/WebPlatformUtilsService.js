/*
 * This file is a modified version of /src/services/webPlatformUtils.service.ts
 * in https://github.com/bitwarden/web which is licensed with the terms of the
 * Gnu Public License 3.0 (GPL 3.0)
 */

import manifest from '../package.json'

import swal from 'sweetalert'

import StrippedWebPlatformUtilsService from './StrippedWebPlatformUtilsService'

import { Utils } from './@bitwarden/jslib/misc/utils'

export default class WebPlatformUtilsService extends StrippedWebPlatformUtilsService {
  constructor(i18nService, messagingService) {
    super()
    this.i18nService = i18nService
    this.messagingService = messagingService
  }

  analyticsId() {
    // eslint-disable-next-line no-console
    console.warn('No analytics, please fix the caller')
    return ''
  }

  isViewOpen() {
    return false
  }

  lockTimeout() {
    return null
  }

  launchUri(uri) {
    const a = document.createElement('a')
    a.href = uri
    a.target = '_blank'
    a.rel = 'noreferrer noopener'
    a.classList.add('d-none')
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  saveFile(win, blobData, blobOptions, fileName) {
    let blob = null
    let type = null
    const fileNameLower = fileName.toLowerCase()
    let doDownload = true
    if (fileNameLower.endsWith('.pdf')) {
      type = 'application/pdf'
      doDownload = false
    } else if (fileNameLower.endsWith('.xlsx')) {
      type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (fileNameLower.endsWith('.docx')) {
      type =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (fileNameLower.endsWith('.pptx')) {
      type =
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    } else if (fileNameLower.endsWith('.csv')) {
      type = 'text/csv'
    } else if (fileNameLower.endsWith('.png')) {
      type = 'image/png'
    } else if (
      fileNameLower.endsWith('.jpg') ||
      fileNameLower.endsWith('.jpeg')
    ) {
      type = 'image/jpeg'
    } else if (fileNameLower.endsWith('.gif')) {
      type = 'image/gif'
    }
    if (type != null) {
      blobOptions = blobOptions || {}
      if (blobOptions.type == null) {
        blobOptions.type = type
      }
    }
    if (blobOptions != null && !this.isIE()) {
      blob = new Blob([blobData], blobOptions)
    } else {
      blob = new Blob([blobData])
    }
    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveBlob(blob, fileName)
    } else {
      const a = win.document.createElement('a')
      if (doDownload) {
        a.download = fileName
      } else {
        a.target = '_blank'
      }
      a.href = win.URL.createObjectURL(blob)
      a.style.position = 'fixed'
      win.document.body.appendChild(a)
      a.click()
      win.document.body.removeChild(a)
    }
  }

  getApplicationVersion() {
    return manifest.version
  }

  supportsU2f(win) {
    if (win != null && win.u2f != null) {
      return true
    }
    return (
      this.isChrome() ||
      ((this.isOpera() || this.isVivaldi()) && !Utils.isMobileBrowser)
    )
  }

  supportsDuo() {
    return true
  }

  showToast(type, title, text, options) {
    this.messagingService.send('showToast', {
      text,
      title,
      type,
      options
    })
  }

  async showDialog(text, title, confirmText, cancelText, type) {
    const buttons = [
      confirmText == null ? this.i18nService.t('ok') : confirmText
    ]
    if (cancelText != null) {
      buttons.unshift(cancelText)
    }

    const contentDiv = document.createElement('div')
    if (type != null) {
      const icon = document.createElement('i')
      icon.classList.add('swal-custom-icon')
      switch (type) {
        case 'success':
          icon.classList.add('fa', 'fa-check', 'text-success')
          break
        case 'warning':
          icon.classList.add('fa', 'fa-warning', 'text-warning')
          break
        case 'error':
          icon.classList.add('fa', 'fa-bolt', 'text-danger')
          break
        case 'info':
          icon.classList.add('fa', 'fa-info-circle', 'text-info')
          break
        default:
          break
      }
      if (icon.classList.contains('fa')) {
        contentDiv.appendChild(icon)
      }
    }

    if (title != null) {
      const titleDiv = document.createElement('div')
      titleDiv.classList.add('swal-title')
      titleDiv.appendChild(document.createTextNode(title))
      contentDiv.appendChild(titleDiv)
    }

    if (text != null) {
      const textDiv = document.createElement('div')
      textDiv.classList.add('swal-text')
      textDiv.appendChild(document.createTextNode(text))
      contentDiv.appendChild(textDiv)
    }

    const confirmed =
      buttons.length > 1
        ? await swal({
            content: { element: contentDiv },
            buttons: buttons
          })
        : await swal({
            content: { element: contentDiv },
            button: buttons[0]
          })
    return confirmed
  }

  eventTrack(action, label, options) {
    this.messagingService.send('analyticsEventTrack', {
      action: action,
      label: label,
      options: options
    })
  }

  isDev() {
    const env = process.env.NODE_ENV || process.env.ENV
    return env && env.match(/\bdevelopment\b/)
  }

  isSelfHost() {
    return true
  }

  copyToClipboard(text, options) {
    let win = window
    let doc = window.document
    if (options && (options.window || options.win)) {
      win = options.window || options.win
      doc = win.document
    } else if (options && options.doc) {
      doc = options.doc
    }
    if (win.clipboardData && win.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is visible.
      win.clipboardData.setData('Text', text)
    } else if (doc.queryCommandSupported && doc.queryCommandSupported('copy')) {
      const textarea = doc.createElement('textarea')
      textarea.textContent = text
      // Prevent scrolling to bottom of page in MS Edge.
      textarea.style.position = 'fixed'
      let copyEl = doc.body
      // For some reason copy command won't work in Firefox when modal is open if appending to body
      if (this.isFirefox() && doc.body.classList.contains('modal-open')) {
        copyEl = doc.body.querySelector < HTMLElement > '.modal'
      }
      copyEl.appendChild(textarea)
      textarea.select()
      try {
        // Security exception may be thrown by some browsers.
        doc.execCommand('copy')
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Copy to clipboard failed.', e)
      } finally {
        copyEl.removeChild(textarea)
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  readFromClipboard(options) {
    throw new Error('Cannot read from clipboard on web.')
  }
}
