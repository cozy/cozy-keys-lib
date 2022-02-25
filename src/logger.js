import minilogLib from '@cozy/minilog'

const minilog =
  typeof window !== 'undefined' && window.minilog ? window.minilog : minilogLib

const logger = minilog('cozy-keys')

minilog.suggest.allow('cozy-keys', 'log')
minilog.suggest.allow('cozy-keys', 'info')

export default logger
