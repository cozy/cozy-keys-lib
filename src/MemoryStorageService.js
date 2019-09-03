/*
 * This file is a modified version of /services/memoryStorageService.service.ts
 * in https://github.com/bitwarden/web which is licensed with the terms of the
 * Gnu Public License 3.0 (GPL 3.0)
 */

export default class MemoryStorageService {
  constructor() {
    this.store = new Map()
  }

  get(key) {
    if (this.store.has(key)) {
      const obj = this.store.get(key)
      return Promise.resolve(obj)
    }
    return Promise.resolve(null)
  }

  save(key, obj) {
    if (obj == null) {
      return this.remove(key)
    }
    this.store.set(key, obj)
    return Promise.resolve()
  }

  remove(key) {
    this.store.delete(key)
    return Promise.resolve()
  }
}
