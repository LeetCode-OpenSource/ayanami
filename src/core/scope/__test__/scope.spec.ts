import { getInstanceWithScope, TransientScope } from '../'
import { createNewInstance, createOrGetInstanceInScope } from '../utils'

describe('Scope spec:', () => {
  describe('createNewInstance', () => {
    it('should always return new instance', () => {
      class Test {}

      expect(createNewInstance(Test)).toBeInstanceOf(Test)
      expect(createNewInstance(Test) === createNewInstance(Test)).toBeFalsy()
    })
  })

  describe('createOrGetInstanceInScope', () => {
    class Test {}
    const scope = 'Scope'

    it('should create a new instance if not in scope', () => {
      expect(createOrGetInstanceInScope(Test, scope)).toBeInstanceOf(Test)
    })

    it('should return a same instance if in scope', () => {
      expect(createOrGetInstanceInScope(Test, scope)).toBe(createOrGetInstanceInScope(Test, scope))
    })
  })

  describe('getInstanceWithScope', () => {
    it('should accept any valid variable as scope', () => {
      const scopes = ['', 0, Symbol('symbol'), {}, null]

      scopes.forEach((scope) => {
        class Test {}
        expect(getInstanceWithScope(Test, { scope })).toBeInstanceOf(Test)
      })
    })

    it('should always return same instance if same scope', () => {
      const scope = 'scope'
      class Test {}

      expect(getInstanceWithScope(Test, { scope })).toBe(getInstanceWithScope(Test, { scope }))
    })

    it('should always return new instance if scope is TransientScope', () => {
      class Test {}

      expect(getInstanceWithScope(Test, { scope: TransientScope })).toBeInstanceOf(Test)

      expect(
        getInstanceWithScope(Test, { scope: TransientScope }) ===
          getInstanceWithScope(Test, { scope: TransientScope }),
      ).toBeFalsy()
    })
  })
})
