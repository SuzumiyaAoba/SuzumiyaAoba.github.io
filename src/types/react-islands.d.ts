declare module "virtual:react-islands" {
  export const modules: Record<string, () => Promise<Record<string, unknown>>>;
}
