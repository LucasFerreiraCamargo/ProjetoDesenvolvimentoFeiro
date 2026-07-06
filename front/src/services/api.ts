/**
 * Cliente HTTP base do app.
 *
 * Centraliza a URL base (`EXPO_PUBLIC_API_URL`), o tratamento de erros HTTP
 * e a injeção de Bearer token. Todos os services específicos
 * (cestas.ts, mercadorias.ts, etc.) devem usar as funções daqui — nenhum
 * lugar do app deve chamar `fetch()` diretamente.
 */

const RAW_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  "http://localhost:3001";

/** URL base normalizada (sem trailing slash). */
export const apiBase: string = RAW_BASE.replace(/\/$/, "");

/**
 * Erro que carrega contexto útil quando uma requisição falha:
 * status HTTP, caminho chamado e payload de erro (se houver).
 */
export class ApiException extends Error {
  readonly status: number;
  readonly path: string;
  readonly payload?: unknown;

  constructor(status: number, path: string, payload?: unknown) {
    super(`HTTP ${status} em ${path}`);
    this.name = "ApiException";
    this.status = status;
    this.path = path;
    this.payload = payload;
  }
}

interface RequestOptions {
  /** Bearer token a injetar em Authorization, se fornecido. */
  token?: string;
  /** Headers extras opcionais (mesclados aos default). */
  headers?: Record<string, string>;
  /** Timeout em ms. Default 15000. */
  timeoutMs?: number;
  /**
   * Signal externo para cancelar a requisição (ex.: quando a tela é
   * desmontada / o usuário faz logout). É combinado com o timeout interno:
   * a request é abortada quando QUALQUER um dos dois disparar.
   */
  signal?: AbortSignal;
}

/**
 * Faz uma requisição genérica e devolve o JSON tipado.
 * Lança {@link ApiException} se a resposta não for 2xx.
 */
async function request<T>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const { token, headers: extraHeaders, timeoutMs = 15000, signal: externalSignal } = options;

  // Controller interno = timeout. Ele também é abortado caso o signal externo
  // (desmontagem/logout) dispare, para cancelar a request na hora em vez de
  // deixá-la pendurada até o timeout.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };

  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });

    if (!res.ok) {
      // Tenta extrair o JSON de erro do backend, sem falhar caso não seja JSON.
      let payload: unknown = undefined;
      try {
        payload = await res.json();
      } catch {
        // resposta sem corpo JSON
      }
      throw new ApiException(res.status, path, payload);
    }

    // Algumas rotas (DELETE etc.) podem responder sem corpo
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
    if (externalSignal) externalSignal.removeEventListener("abort", onExternalAbort);
  }
}

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: "GET" }, options);
}

export function apiPost<T>(
  path: string,
  body: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) }, options);
}

export function apiPut<T>(
  path: string,
  body: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) }, options);
}

export function apiPatch<T>(
  path: string,
  body: unknown,
  options?: RequestOptions
): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, options);
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: "DELETE" }, options);
}
