export type HealthStatus = "ok" | "error";

export interface HealthResponse {
  status: HealthStatus;
}
