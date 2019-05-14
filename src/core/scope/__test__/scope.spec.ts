import 'reflect-metadata'
import { Injectable } from '@asuka/di'

import { getInstanceWithScope, TransientScope, SameScope } from '../'
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

    describe('Injection scope', () => {
      describe('default behavior', () => {
        @Injectable()
        class A {}

        @Injectable()
        class B {
          constructor(public a: A) {}
        }

        @Injectable()
        class C {
          constructor(public a: A) {}
        }

        @Injectable()
        class D {
          constructor(public a: A) {}
        }

        it('should return same instance whether scope is same or not', () => {
          const b = getInstanceWithScope(B, { scope: 'b' })
          const c1 = getInstanceWithScope(C, { scope: 'c1' })
          const c2 = getInstanceWithScope(C, { scope: 'c2' })
          const d = getInstanceWithScope(D, { scope: 'c2' })

          expect(b.a).toBeInstanceOf(A)
          expect(b.a).toBe(c1.a)
          expect(c1.a).toBe(c2.a)
          expect(c2.a).toBe(d.a)
        })
      })

      describe('with SameScope decorator', () => {
        @Injectable()
        class A {}

        @Injectable()
        class B {
          constructor(@SameScope() public a: A) {}
        }

        @Injectable()
        class C {
          constructor(@SameScope() public a: A) {}
        }

        it('should return same instance if is same scope', () => {
          const scope = 'scope'
          const b = getInstanceWithScope(B, { scope })
          const c = getInstanceWithScope(C, { scope })

          expect(b.a).toBeInstanceOf(A)
          expect(b.a).toBe(c.a)
        })

        it('should return different instance if is different scope', () => {
          const b = getInstanceWithScope(B, { scope: 'b' })
          const c1 = getInstanceWithScope(C, { scope: 'c1' })
          const c2 = getInstanceWithScope(C, { scope: 'c2' })

          expect(b.a).toBeInstanceOf(A)
          expect(c1.a).toBeInstanceOf(A)
          expect(c2.a).toBeInstanceOf(A)
          expect(b.a === c1.a).toBeFalsy()
          expect(c1.a === c2.a).toBeFalsy()
        })
      })
    })
  })
})
