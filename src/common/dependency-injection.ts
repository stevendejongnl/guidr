interface InjectionDependency {
  doSomething(): void;
}

export const REAL = 'REAL'
export const FAKE = 'FAKE'

export class RealDependency implements InjectionDependency {
  doSomething(): void {
    console.log('Real Dependency: Doing something...');
  }
}

export class FakeDependency implements InjectionDependency {
  doSomething(): void {
    console.log('Fake Dependency: Doing something...');
  }
}

export class DependencyInjection {
  private dependencies: Map<string, InjectionDependency>;

  constructor() {
    this.dependencies = new Map<string, InjectionDependency>();
  }

  register(name: string, dependency: InjectionDependency): void {
    this.dependencies.set(name, dependency);
  }

  resolve(name: string): InjectionDependency {
    const dependency = this.dependencies.get(name);
    if (!dependency) {
      throw new Error(`Dependency type '${name}' not found`);
    }
    return dependency;
  }
}
