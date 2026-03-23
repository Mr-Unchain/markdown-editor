import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initNetworkStatus, destroyNetworkStatus, getIsOnline, checkConnectivity } from '../network-status.svelte'

describe('network-status', () => {
  beforeEach(() => {
    initNetworkStatus()
  })

  afterEach(() => {
    destroyNetworkStatus()
  })

  describe('getIsOnline', () => {
    it('returns initial online status', () => {
      // jsdom defaults navigator.onLine to true
      expect(getIsOnline()).toBe(true)
    })
  })

  describe('checkConnectivity', () => {
    it('returns true when test function succeeds', async () => {
      const result = await checkConnectivity(async () => true)
      expect(result).toBe(true)
    })

    it('returns false when test function fails', async () => {
      const result = await checkConnectivity(async () => {
        throw new Error('connection failed')
      })
      expect(result).toBe(false)
    })

    it('returns false on timeout', async () => {
      const result = await checkConnectivity(
        () => new Promise((resolve) => setTimeout(() => resolve(true), 5000)),
        100, // 100ms timeout
      )
      expect(result).toBe(false)
    }, 1000)
  })
})
