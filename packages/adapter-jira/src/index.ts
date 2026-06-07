// Public surface of @saci/adapter-jira: the JiraGateway implementation of the
// 019 port and its construction config. The composition root (cli) wires this
// adapter into core (R25).

export { JiraGateway } from "./gateway.js";
export type { JiraGatewayConfig, IssueDropLog } from "./gateway.js";
export type { JiraHttpConfig, FetchLike } from "./http.js";
export type { IssueWarningLog } from "./mapper.js";
export {
  DEFAULT_FIELD_MAPPING,
  DEFAULT_DESIGN_FIELDS,
  COPYWRITER_ISSUETYPE,
  TEMPLATE_MARKER,
  FILTERED_STATUSES,
} from "./field-mapping.js";
