import { describe, it, expect, vi } from 'vitest'
import { safeRegisterExtensions } from '../extension-registry'

describe('safeRegisterExtensions', () => {
  it('正常なエクステンションを全て登録する', () => {
    const core = [{ name: 'core1' }, { name: 'core2' }] as any[]
    const optional = [{ name: 'opt1' }, { name: 'opt2' }] as any[]

    const result = safeRegisterExtensions(core, optional)

    expect(result.extensions).toHaveLength(4)
    expect(result.failed).toHaveLength(0)
  })

  it('コアエクステンションは常に含まれる', () => {
    const core = [{ name: 'core1' }] as any[]
    const result = safeRegisterExtensions(core, [])

    expect(result.extensions).toHaveLength(1)
    expect(result.extensions[0]).toEqual({ name: 'core1' })
  })

  it('空の入力で空の結果を返す', () => {
    const result = safeRegisterExtensions([], [])

    expect(result.extensions).toHaveLength(0)
    expect(result.failed).toHaveLength(0)
  })

  it('失敗リストにエクステンション名が空でも記録される', () => {
    const core = [{ name: 'core1' }] as any[]
    const result = safeRegisterExtensions(core, [])

    expect(result.failed).toHaveLength(0)
  })
})
