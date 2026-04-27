import { diffDependencies, DependencyChange } from "../diffEngine";

describe("diffDependencies", () => {
  it("returns empty array when maps are identical", () => {
    const deps = { react: "18.0.0", lodash: "4.17.21" };
    expect(diffDependencies(deps, deps)).toEqual([]);
  });

  it("detects added packages", () => {
    const base = { react: "18.0.0" };
    const head = { react: "18.0.0", axios: "1.4.0" };
    const result = diffDependencies(base, head);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<DependencyChange>>({
      name: "axios",
      changeType: "added",
      fromVersion: null,
      toVersion: "1.4.0",
      isBreaking: false,
    });
  });

  it("detects removed packages as breaking", () => {
    const base = { react: "18.0.0", lodash: "4.17.21" };
    const head = { react: "18.0.0" };
    const result = diffDependencies(base, head);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<DependencyChange>>({
      name: "lodash",
      changeType: "removed",
      isBreaking: true,
    });
  });

  it("detects major version upgrade as breaking", () => {
    const base = { react: "17.0.0" };
    const head = { react: "18.0.0" };
    const result = diffDependencies(base, head);
    expect(result[0]).toMatchObject<Partial<DependencyChange>>({
      name: "react",
      changeType: "upgraded",
      isBreaking: true,
    });
  });

  it("detects minor upgrade as non-breaking", () => {
    const base = { axios: "1.3.0" };
    const head = { axios: "1.4.0" };
    const result = diffDependencies(base, head);
    expect(result[0]).toMatchObject<Partial<DependencyChange>>({
      name: "axios",
      changeType: "upgraded",
      isBreaking: false,
    });
  });

  it("detects downgrade as breaking", () => {
    const base = { lodash: "4.17.21" };
    const head = { lodash: "3.10.0" };
    const result = diffDependencies(base, head);
    expect(result[0]).toMatchObject<Partial<DependencyChange>>({
      name: "lodash",
      changeType: "downgraded",
      isBreaking: true,
    });
  });

  it("returns results sorted alphabetically by package name", () => {
    const base = { zebra: "1.0.0", apple: "2.0.0" };
    const head = { zebra: "2.0.0", apple: "3.0.0" };
    const result = diffDependencies(base, head);
    expect(result.map((r) => r.name)).toEqual(["apple", "zebra"]);
  });
});
