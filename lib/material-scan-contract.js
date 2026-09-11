// Explicit DSH Remote contract shared by the host and browser bundles.
import { string, array, object, strictObject, boolean, literal, number } from 'zod/mini';

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
const reviewDescriptor = {
  id: 'dsh-academic-research-skills#researchLoom/validateReviewFiles',
  service: 'researchLoom', namespace: 'researchLoom', method: 'validateReviewFiles',
  invocation: { kind: 'direct' },
  scope: { context: 'agent', wire: 'agentId' },
  parameters: [descriptor.parameters[0], {
    name: 'request', wire: 'request', source: 'json',
    codec: codec('review-request', strictObject({
      phase: literal(['plan', 'revise', 'verify']), manuscript: string(), expectedManuscript: string(),
      revised: string(), previousRevised: string(),
    })),
  }],
  cancellation: { parameter: 'signal' },
  result: codec('review-result', object({ manuscript: string(), revised: string() })),
};
const region = object({ startLine: number(), endLine: number(), text: string(), truncated: boolean() });
const changesDescriptor = {
  ...reviewDescriptor,
  id: 'dsh-academic-research-skills#researchLoom/inspectReviewChanges', method: 'inspectReviewChanges',
  parameters: [descriptor.parameters[0], { name: 'request', wire: 'request', source: 'json',
    codec: codec('changes-request', strictObject({ manuscript: string(), revised: string() })) }],
  result: codec('changes-result', object({ manuscript: string(), revised: string(), status: literal(['available', 'unsupported']),
    same: boolean(), originalHash: string(), revisedHash: string(), before: region, after: region, notice: string() })),
};
export const scanRemote = { package: 'dsh-academic-research-skills', descriptors: [descriptor, reviewDescriptor, changesDescriptor] };
export const scanHost = {
  package: 'dsh-academic-research-skills', face: 'host', schemas: [],
  invocations: [descriptor, reviewDescriptor, changesDescriptor], model: { services: [], events: [], objects: [] },
};
