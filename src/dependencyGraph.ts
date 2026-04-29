import { DependencyMap } from './packageParser';

export interface GraphNode {
  name: string;
  version: string;
  depth: number;
  dependents: string[];
  dependencies: string[];
}

export type DependencyGraph = Map<string, GraphNode>;

export function buildGraph(deps: DependencyMap, depth = 0): DependencyGraph {
  const graph: DependencyGraph = new Map();

  for (const [name, version] of Object.entries(deps)) {
    const existing = graph.get(name);
    if (existing) {
      existing.depth = Math.min(existing.depth, depth);
    } else {
      graph.set(name, {
        name,
        version,
        depth,
        dependents: [],
        dependencies: [],
      });
    }
  }

  return graph;
}

export function linkDependents(graph: DependencyGraph): DependencyGraph {
  for (const [name, node] of graph.entries()) {
    for (const dep of node.dependencies) {
      const depNode = graph.get(dep);
      if (depNode && !depNode.dependents.includes(name)) {
        depNode.dependents.push(name);
      }
    }
  }
  return graph;
}

export function getTransitiveDependents(
  graph: DependencyGraph,
  packageName: string,
  visited = new Set<string>()
): string[] {
  if (visited.has(packageName)) return [];
  visited.add(packageName);

  const node = graph.get(packageName);
  if (!node) return [];

  const result: string[] = [...node.dependents];
  for (const dep of node.dependents) {
    result.push(...getTransitiveDependents(graph, dep, visited));
  }

  return [...new Set(result)];
}

export function graphToJson(graph: DependencyGraph): object {
  const obj: Record<string, object> = {};
  for (const [name, node] of graph.entries()) {
    obj[name] = { ...node };
  }
  return obj;
}
