import { HttpAgent, type HttpAgentConfig } from '@ag-ui/client'

// @ag-ui/client stores `this.fetch = globalThis.fetch` which detaches it from
// the window receiver, causing "Illegal invocation" in browsers.
// Wrapping in an arrow function keeps the call in the global context.
const boundFetch: HttpAgentConfig['fetch'] = (url, init) => fetch(url, init)

export function createAgent(config: Omit<HttpAgentConfig, 'fetch'>): HttpAgent {
  return new HttpAgent({ ...config, fetch: boundFetch })
}
