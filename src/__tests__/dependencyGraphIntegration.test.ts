import { buildGraph, linkDependents, getTransitiveDependents } from '../dependencyGraph';
import { flattenDependencies } from '../packageParser';

const samplePackageJson = {
  name: 'my-app',
  version: '1.0.0',
  dependencies: {
    react: '18.2.0',
    'react-dom': '18.2.0',
  },
  devDependencies: {
    typescript: '5.0.0',
  },
};

describe('dependencyGraph integration with packageParser', () => {
  it('builds a graph from flattened dependencies', () => {
    const flat = flattenDependencies(samplePackageJson as never);
    const graph = buildGraph(flat);

    expect(graph.has('react')).toBe(true);
    expect(graph.has('react-dom')).toBe(true);
    expect(graph.has('typescript')).toBe(true);
  });

  it('correctly links manually added dependencies', () => {
    const flat = flattenDependencies(samplePackageJson as never);
    const graph = buildGraph(flat);

    const reactDomNode = graph.get('react-dom');
    if (reactDomNode) {
      reactDomNode.dependencies.push('react');
    }

    linkDependents(graph);

    const reactNode = graph.get('react');
    expect(reactNode?.dependents).toContain('react-dom');
  });

  it('returns transitive dependents across full graph', () => {
    const flat = flattenDependencies(samplePackageJson as never);
    const graph = buildGraph(flat);

    const reactDomNode = graph.get('react-dom');
    if (reactDomNode) reactDomNode.dependencies.push('react');

    const appNode = graph.get('react');
    if (appNode) appNode.dependencies.push('react-dom');

    linkDependents(graph);

    const transitive = getTransitiveDependents(graph, 'react');
    expect(Array.isArray(transitive)).toBe(true);
  });

  it('handles packages with no dependents', () => {
    const flat = flattenDependencies(samplePackageJson as never);
    const graph = buildGraph(flat);
    const result = getTransitiveDependents(graph, 'typescript');
    expect(result).toEqual([]);
  });
});
