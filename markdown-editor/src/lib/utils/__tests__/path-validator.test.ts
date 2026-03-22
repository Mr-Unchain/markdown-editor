import { describe, it, expect } from 'vitest'
import { PathValidator } from '../path-validator'

describe('PathValidator', () => {
  const validator = new PathValidator('/workspace/project')

  describe('validatePath', () => {
    it('ワークスペース内の正常なパスを許可する', () => {
      const result = validator.validatePath('/workspace/project/src/file.ts')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('/workspace/project/src/file.ts')
      }
    })

    it('ワークスペースルート自体を許可する', () => {
      const result = validator.validatePath('/workspace/project')
      expect(result.ok).toBe(true)
    })

    it('相対パスの上位参照（..）を拒否する', () => {
      const result = validator.validatePath('/workspace/project/../secret')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('中間ディレクトリでの上位参照を拒否する', () => {
      const result = validator.validatePath('/workspace/project/src/../../etc/passwd')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('ワークスペース外のパスを拒否する', () => {
      const result = validator.validatePath('/other/directory/file.ts')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('ワークスペース名を前方一致で偽装するパスを拒否する', () => {
      const result = validator.validatePath('/workspace/project-evil/file.ts')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('バックスラッシュを正規化して検証する', () => {
      const result = validator.validatePath('\\workspace\\project\\src\\file.ts')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('/workspace/project/src/file.ts')
      }
    })

    it('末尾スラッシュを正規化する', () => {
      const result = validator.validatePath('/workspace/project/src/')
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value).toBe('/workspace/project/src')
      }
    })
  })

  describe('validateNoADS', () => {
    it('通常のパスを許可する', () => {
      const result = validator.validateNoADS('/workspace/project/file.ts')
      expect(result.ok).toBe(true)
    })

    it('Windows代替データストリーム（ADS）を拒否する', () => {
      const result = validator.validateNoADS('/workspace/project/file.ts:hidden')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })

    it('Windowsドライブレターは許可する', () => {
      const result = validator.validateNoADS('C:/workspace/project/file.ts')
      expect(result.ok).toBe(true)
    })

    it('ドライブレター付きのADSは拒否する', () => {
      const result = validator.validateNoADS('C:/workspace/file.ts:stream')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('PERMISSION_DENIED')
      }
    })
  })

  describe('isWithinWorkspace', () => {
    it('ワークスペース内のパスでtrueを返す', () => {
      expect(validator.isWithinWorkspace('/workspace/project/src')).toBe(true)
    })

    it('ワークスペースルートでtrueを返す', () => {
      expect(validator.isWithinWorkspace('/workspace/project')).toBe(true)
    })

    it('ワークスペース外のパスでfalseを返す', () => {
      expect(validator.isWithinWorkspace('/other/path')).toBe(false)
    })
  })

  describe('getRelativePath', () => {
    it('ワークスペースルートからの相対パスを返す', () => {
      expect(validator.getRelativePath('/workspace/project/src/file.ts')).toBe('src/file.ts')
    })

    it('ワークスペースルート自体の場合は空文字を返す', () => {
      expect(validator.getRelativePath('/workspace/project')).toBe('')
    })
  })

  describe('updateRoot', () => {
    it('ワークスペースルートを更新して新しいルートで検証する', () => {
      const v = new PathValidator('/old/root')
      expect(v.isWithinWorkspace('/new/root/file.ts')).toBe(false)

      v.updateRoot('/new/root')
      expect(v.isWithinWorkspace('/new/root/file.ts')).toBe(true)
      expect(v.isWithinWorkspace('/old/root/file.ts')).toBe(false)
    })
  })
})
