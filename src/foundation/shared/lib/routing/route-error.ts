export class RouteError extends Error {
  readonly status: 301 | 404;
  readonly destination: string | undefined;
  constructor(status: 301 | 404, destination?: string) {
    super(destination ?? "Page not found");
    this.name = "RouteError";
    this.status = status;
    this.destination = destination;
  }
}
export function notFound(): never {
  throw new RouteError(404);
}
export function redirect(destination: string): never {
  throw new RouteError(301, destination);
}
