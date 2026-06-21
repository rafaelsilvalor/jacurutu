// Recorded Jira-response fixtures for the gateway end-to-end tests. These are
// TypeScript modules exporting typed constants (NOT .json read via fs /
// import.meta.url): the package compiles `src/**/*.ts` into `dist/`, so a `.ts`
// fixture is dist-safe and needs no build-config change (R22 — tsc per package,
// no bundler; R23 — node:test against compiled output).
//
// The shapes mirror the live `POST /rest/api/3/search/jql` response envelope
// (`{ issues, isLast }`) and the seed's `automation/payload.json` v2.0 output.
// Field ids use the real seed `customfield_*` ids so the gateway's DEFAULT_FIELD_
// MAPPING resolves them; that is the only place wire ids appear in tests, and it
// is fixture data, not adapter logic (D1 is about adapter modules).
//
// Drive/Docs URLs are drawn from the seed payload so the expected `copy_url`
// values match the Python output on the same input.

/**
 * A single recorded JQL-search response page: the issues, the cursor flag, and
 * the optional `nextPageToken`. A non-last page carries a token the client must
 * echo back to fetch the following page (cursor pagination — see http.ts).
 */
export interface RecordedSearchResponse {
  issues: Record<string, unknown>[];
  isLast: boolean;
  nextPageToken?: string;
}

// Drive/Docs URLs lifted from automation/payload.json (seed v2.0 output).
export const SISTER_DRIVE_URL =
  "https://drive.google.com/file/d/1V9g9zzGsNfKhv4e25wyEE6T1FaiZVS12/view?usp=drivesdk";
export const PARENT_DRIVE_URL =
  "https://docs.google.com/document/d/1S0gnFpUp70Z5tcOyFcn4bDawteBLdfYX5KLNflKMQ3s/edit?tab=t.0";
export const FALLBACK_DRIVE_URL =
  "https://docs.google.com/document/d/18fhgWuvV-qGUptZaG2k51I3pOfVEHUPQ0hcKEPKHLZg/edit?usp=sharing";

/** ADF `doc` node wrapping a single inlineCard whose attrs.url is `url`. */
function adfWithCard(url: string): Record<string, unknown> {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "inlineCard", attrs: { url } }],
  };
}

/** ADF `doc` node with no Drive/Docs URL anywhere. */
function adfPlain(text: string): Record<string, unknown> {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

// Parent keys referenced across the recorded searches.
export const SISTER_PARENT_KEY = "MCA-1000";
export const PARENT_ONLY_KEY = "MCA-2000";
export const FALLBACK_PARENT_KEY = "MCA-3000";
export const MULTI_PARENT_KEY = "MCA-4000";
export const TEMPLATE_PARENT_KEY = "MCA-5000";
export const FB_PARENT_KEY = "MCA-6000";

// --- Main design search (the mainJql) --------------------------------------
//
// Six design issues, one per EARS branch. The fields requested mirror
// the derived design field list (deriveDesignFields); the real customfield_* ids
// carry the entrega/vertical values. The `status`/`Template` drops below are
// exercised by the dedicated
// issues (DROP_BACKLOG / TEMPLATE in parent summary).

export const MAIN_SEARCH_RESPONSE: RecordedSearchResponse = {
  isLast: true,
  issues: [
    // sister branch: sister copywriter holds the Drive URL in its description.
    {
      key: "MCA-1001",
      fields: {
        summary: "Artes - Banner concurso INSS analista tributario",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-01T12:00:00.000-0300",
        parent: { key: SISTER_PARENT_KEY },
        customfield_10031: "2026-06-05T00:00:00.000-0300",
        customfield_10065: [{ value: "[EC] Concursos" }],
      },
    },
    // parent branch: no sister, parent description carries the Drive URL.
    {
      key: "MCA-2001",
      fields: {
        summary: "Artes - Grid carrossel professores",
        status: { name: "PARA APROVACAO" },
        updated: "2026-06-02T12:00:00.000-0300",
        parent: { key: PARENT_ONLY_KEY },
        customfield_10065: [{ value: "[EE] Engenharia" }],
      },
    },
    // fallback branch: neither sister nor parent yields a Drive URL.
    {
      key: "MCA-3001",
      fields: {
        summary: "Artes - Peca avulsa sem copy",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-03T12:00:00.000-0300",
        parent: { key: FALLBACK_PARENT_KEY },
      },
    },
    // multi-candidate branch: two sisters; the higher token overlap wins.
    {
      key: "MCA-4001",
      fields: {
        summary: "Artes - Banner edital prefeitura saude municipal",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-04T12:00:00.000-0300",
        parent: { key: MULTI_PARENT_KEY },
      },
    },
    // drop branch: Backlog status -> dropped + logged (status filter).
    {
      key: "MCA-5001",
      fields: {
        summary: "Artes - Banner em backlog",
        status: { name: "Backlog" },
        updated: "2026-06-05T12:00:00.000-0300",
        parent: { key: SISTER_PARENT_KEY },
      },
    },
    // template branch: parent summary contains "Template" -> dropped + logged.
    {
      key: "MCA-5002",
      fields: {
        summary: "Artes - Card normal",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-05T13:00:00.000-0300",
        parent: { key: TEMPLATE_PARENT_KEY },
      },
    },
    // customfield_11080 fallback branch: primary entrega field absent, fallback
    // present -> entrega_iso reads the fallback.
    {
      key: "MCA-6001",
      fields: {
        summary: "Artes - Banner data via fallback",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-06T12:00:00.000-0300",
        parent: { key: FB_PARENT_KEY },
        customfield_11080: "2026-06-09T00:00:00.000-0300",
      },
    },
    // partial-failure branch: a parentless design issue is KEPT with fallback
    // field values and the missing-parent warning is LOGGED (D3, R4 — the seed
    // keeps-with-warning, it does not drop).
    {
      key: "MCA-7001",
      fields: {
        summary: "Artes - Peca sem parent",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-07T12:00:00.000-0300",
      },
    },
  ],
};

// --- Sister (COPYWRITER) search --------------------------------------------
//
// Grouped by parent on the wire via each issue's `parent.key`. The gateway
// keys them by parent and runs bestSisterMatch per design.

export const SISTER_SEARCH_RESPONSE: RecordedSearchResponse = {
  isLast: true,
  issues: [
    // Sister for MCA-1001: high token overlap, Drive URL in description.
    {
      key: "MCA-1002",
      fields: {
        summary: "Copy concurso INSS analista tributario",
        parent: { key: SISTER_PARENT_KEY },
        description: adfWithCard(SISTER_DRIVE_URL),
      },
    },
    // Two sisters for MCA-4001 (multi-candidate argmax). The matching one shares
    // more summary tokens; the decoy shares none with the design summary.
    {
      key: "MCA-4002",
      fields: {
        summary: "Copy concurso vestibular medicina",
        parent: { key: MULTI_PARENT_KEY },
        description: adfWithCard(FALLBACK_DRIVE_URL),
      },
    },
    {
      key: "MCA-4003",
      fields: {
        summary: "Copy edital prefeitura saude municipal",
        parent: { key: MULTI_PARENT_KEY },
        description: adfWithCard(SISTER_DRIVE_URL),
      },
    },
  ],
};

// --- Parent search ----------------------------------------------------------

export const PARENT_SEARCH_RESPONSE: RecordedSearchResponse = {
  isLast: true,
  issues: [
    {
      key: SISTER_PARENT_KEY,
      fields: { summary: "Criativos Estaticos Performance Parte 415", description: adfPlain("no url") },
    },
    {
      key: PARENT_ONLY_KEY,
      fields: { summary: "Apresentacao de Professores", description: adfWithCard(PARENT_DRIVE_URL) },
    },
    {
      key: FALLBACK_PARENT_KEY,
      fields: { summary: "Pauta avulsa sem material", description: adfPlain("sem link") },
    },
    {
      key: MULTI_PARENT_KEY,
      fields: { summary: "Banner edital concursos diversos", description: adfPlain("no url") },
    },
    // Parent summary contains "Template" -> drops MCA-5002 at the parent filter.
    {
      key: TEMPLATE_PARENT_KEY,
      fields: { summary: "Modelo Template de campanha", description: adfPlain("no url") },
    },
    {
      key: FB_PARENT_KEY,
      fields: { summary: "Campanha data fallback", description: adfPlain("no url") },
    },
  ],
};

// --- Multi-page main search (cursor pagination) -----------------------------
//
// Exercises the http.ts nextPageToken/isLast loop: a main search whose result
// spans two pages. Page 1 carries issue A, sets `nextPageToken`, and is NOT the
// last page; page 2 carries issue B, is the last page, and omits the token. The
// loop must follow the cursor, accumulate both pages, and terminate on isLast.

/** The cursor the client must echo on the second main-search request. */
export const MAIN_PAGE_TOKEN = "next-page-cursor-001";

export const MAIN_PAGE_1: RecordedSearchResponse = {
  isLast: false,
  nextPageToken: MAIN_PAGE_TOKEN,
  issues: [
    {
      key: "MCA-8001",
      fields: {
        summary: "Artes - Pagina um da paginacao",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-08T12:00:00.000-0300",
      },
    },
  ],
};

export const MAIN_PAGE_2: RecordedSearchResponse = {
  isLast: true,
  issues: [
    {
      key: "MCA-8002",
      fields: {
        summary: "Artes - Pagina dois da paginacao",
        status: { name: "FILA DE EXECUCAO" },
        updated: "2026-06-08T13:00:00.000-0300",
      },
    },
  ],
};
