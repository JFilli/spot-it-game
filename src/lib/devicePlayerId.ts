import { storageKeys, readStorage, writeStorage } from './storage'

export function getDevicePlayerId(): string {
  const existing = readStorage(storageKeys.devicePlayerId)
  if (existing) return existing

  const id = crypto.randomUUID()
  writeStorage(storageKeys.devicePlayerId, id)
  return id
}
