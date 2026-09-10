// Explicit DSH Remote contract shared by the host and browser bundles.
import { string, array, object, boolean, literal } from 'zod/mini';

const codec = (name, schema) => ({ mode: 'strict', typeSymbol: `research-loom#scan:${name}`, schema });
const descriptor = {
  id: 'dsh-academic-research-skills#researchLoom/scan',
  service: 'researchLoom', namespace: 'researchLoom', method: 'scan',
  invocation: { kind: 'direct' },
  scope: { context: 'agent', wire: 'agentId' },
  parameters: [{ name: 'agent', wire: 'agentId', source: 'lookup', lookup: 'agent',
    codec: { mode: 'strict', typeSymbol: '@deepseek-ai/dsh-session/types#SessionId', schema: string() } }],
  cancellation: { parameter: 'signal' },
  result: codec('result', object({
    files: array(object({ path: string(), kind: literal('file') })),
    incomplete: boolean(),
    warnings: array(string()),
  })),
};
export const scanRemote = { package: 'dsh-academic-research-skills', descriptors: [descriptor] };
export const scanHost = {
  package: 'dsh-academic-research-skills', face: 'host', schemas: [],
  invocations: [descriptor], model: { services: [], events: [], objects: [] },
};
