export interface MockReqInit {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
}

export function mockReq(init: MockReqInit = {}) {
  const headers: Record<string, string | string[] | undefined> = {};
  for (const [k, v] of Object.entries(init.headers ?? {})) headers[k.toLowerCase()] = v;
  return {
    method: init.method ?? "GET",
    headers,
    body: init.body,
    query: init.query ?? {},
  };
}

export function mockRes() {
  let statusCode = 200;
  let payload: unknown;
  const res = {
    status(n: number) {
      statusCode = n;
      return res;
    },
    json(b: unknown) {
      payload = b;
      return res;
    },
    end() {
      return res;
    },
    setHeader() {
      return res;
    },
  };
  return { res, status: () => statusCode, body: () => payload };
}
