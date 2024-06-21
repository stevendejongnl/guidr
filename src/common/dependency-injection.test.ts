import { expect } from '@open-wc/testing'
import { DependencyInjection, RealDependency, FakeDependency } from './dependency-injection.js'
import { REAL, FAKE } from './dependency-injection.js'

describe('DependencyInjection', () => {
  let container: DependencyInjection

  beforeEach(() => {
    container = new DependencyInjection()
  })

  it('should register and resolve real dependency', () => {
    container.register(REAL, new RealDependency())
    const realDependency = container.resolve(REAL)
    expect(realDependency).to.be.instanceof(RealDependency)
  })

  it('should register and resolve fake dependency', () => {
    container.register(FAKE, new FakeDependency())
    const fakeDependency = container.resolve(FAKE)
    expect(fakeDependency).to.be.instanceof(FakeDependency)
  })

  it('should throw an error when resolving an unregistered dependency', () => {
    expect(() => container.resolve('nonexistent')).to.throw('Dependency type \'nonexistent\' not found')
  })
})

