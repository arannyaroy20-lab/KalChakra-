declare module "react" {
  export function useState<T>(initial: T | (() => T)): [T, (value: T | ((previous: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), dependencies?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, dependencies: readonly unknown[]): T;
}
declare module "react-dom/client" { export function createRoot(container: Element | DocumentFragment): { render(node: unknown): void }; }
declare module "react/jsx-runtime" { export function jsx(...args: any[]): any; export function jsxs(...args: any[]): any; }
declare namespace JSX { interface IntrinsicElements { [elementName: string]: any } interface IntrinsicAttributes { key?: string | number | null } }
declare module "*.css";
