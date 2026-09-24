import { retryRuntime } from "@/lib/http/retry";

// Retry sem espera real nos testes: o backoff é verificado pelos testes de
// retry.ts; nos demais só importa quantas tentativas acontecem.
retryRuntime.sleep = async () => {};
