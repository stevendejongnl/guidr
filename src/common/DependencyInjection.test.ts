import { DependencyInjection, RealDependency, FakeDependency, REAL, FAKE } from './DependencyInjection'

describe('DependencyInjection', () => {
  let container: DependencyInjection

  beforeEach(() => {
    container = new DependencyInjection()
  })

  describe('register and resolve', () => {
    it('should register and resolve real dependency', () => {
      container.register(REAL, new RealDependency())
      const realDependency = container.resolve(REAL)
      expect(realDependency).toBeInstanceOf(RealDependency)
    })

    it('should register and resolve fake dependency', () => {
      container.register(FAKE, new FakeDependency())
      const fakeDependency = container.resolve(FAKE)
      expect(fakeDependency).toBeInstanceOf(FakeDependency)
    })

    it('should be able to resolve dependency multiple times', () => {
      const realDep = new RealDependency()
      container.register(REAL, realDep)

      const resolved1 = container.resolve(REAL)
      const resolved2 = container.resolve(REAL)

      expect(resolved1).toBe(realDep)
      expect(resolved2).toBe(realDep)
      expect(resolved1).toBe(resolved2)
    })
  })

  describe('error handling', () => {
    it('should throw an error when resolving an unregistered dependency', () => {
      expect(() => container.resolve('nonexistent')).toThrow('Dependency type \'nonexistent\' not found')
    })

    it('should provide meaningful error message', () => {
      const missingKey = 'SomeMissingService'
      expect(() => container.resolve(missingKey)).toThrow(`Dependency type '${missingKey}' not found`)
    })
  })

  describe('overwriting dependencies', () => {
    it('should allow overwriting a registered dependency', () => {
      const realDep = new RealDependency()
      const fakeDep = new FakeDependency()

      container.register(REAL, realDep)
      expect(container.resolve(REAL)).toBe(realDep)

      container.register(REAL, fakeDep)
      expect(container.resolve(REAL)).toBe(fakeDep)
    })
  })
})
