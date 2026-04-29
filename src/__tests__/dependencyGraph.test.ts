import {
  buildGraph,
  linkDependents,
  getTransitiveDependents,
  graphToJson,
  DependencyGraph,
} from '../dependencyGraph';

describe('buildGraph', () => {
  it('creates nodes for each dependency', () => {
    const deps = { react: '18.0.0', lodash: '4.17.21' };
    const graph = buildGraph(deps);
    expect(graph.size).toBe(2);
    expect(graph.get('react')?.version).toBe('18.0.0');
    expect(graph.get('lodash')?.depth).toBe(0);
  });

  it('preserves minimum depth for duplicate entries', () => {
    const deps = { react: '18.0.0' };
    const graph = buildGraph(deps, 2);
    const graph2 = buildGraph(deps, 0);
    // depth from second call should be lower
    expect(graph2.get('react')?.depth).toBe(0);
    expect(graph.get('react')?.depth).toBe(2);
  });

  it('returns empty graph for empty deps', () => {
    const graph = buildGraph({});
    expect(graph.size).toBe(0);
  });
});

describe('linkDependents', () => {
  it('links dependents correctly', () => {
    const graph: DependencyGraph = new Map([
      ['react', { name: 'react', version: '18.0.0', depth: 0, dependents: [], dependencies: [] }],
      ['react-dom', { name: 'react-dom', version: '18.0.0', depth: 0, dependents: [], dependencies: ['react'] }],
    ]);
    linkDependents(graph);
    expect(graph.get('react')?.dependents).toContain('react-dom');
  });

  it('does not duplicate dependents', () => {
    const graph: DependencyGraph = new Map([
      ['react', { name: 'react', version: '18.0.0', depth: 0, dependents: ['react-dom'], dependencies: [] }],
      ['react-dom', { name: 'react-dom', version: '18.0.0', depth: 0, dependents: [], dependencies: ['react'] }],
    ]);
    linkDependents(graph);
    expect(graph.get('react')?.dependents.filter(d => d === 'react-dom').length).toBe(1);
  });
});

describe('getTransitiveDependents', () => {
  it('returns all transitive dependents', () => {
    const graph: DependencyGraph = new Map([
      ['a', { name: 'a', version: '1.0.0', depth: 0, dependents: ['b'], dependencies: [] }],
      ['b', { name: 'b', version: '1.0.0', depth: 1, dependents: ['c'], dependencies: ['a'] }],
      ['c', { name: 'c', version: '1.0.0', depth: 2, dependents: [], dependencies: ['b'] }],
    ]);
    const result = getTransitiveDependents(graph, 'a');
    expect(result).toContain('b');
    expect(result).toContain('c');
  });

  it('handles cycles gracefully', () => {
    const graph: DependencyGraph = new Map([
      ['a', { name: 'a', version: '1.0.0', depth: 0, dependents: ['b'], dependencies: ['b'] }],
      ['b', { name: 'b', version: '1.0.0', depth: 0, dependents: ['a'], dependencies: ['a'] }],
    ]);
    expect(() => getTransitiveDependents(graph, 'a')).not.toThrow();
  });
});

describe('graphToJson', () => {
  it('converts graph to plain object', () => {
    const graph = buildGraph({ lodash: '4.0.0' });
    const json = graphToJson(graph) as Record<string, unknown>;
    expect(json['lodash']).toBeDefined();
  });
});
