// The shapes the link-graph step reads and emits. Port types only — the
// component never calls an API; the host hands it the two operations.

/** One typed link, as links.json / annotation-import carries it. */
export interface GraphLink {
  link_id?: string
  source_prov_id: string
  target_prov_id: string
  link_type: string
  [k: string]: unknown
}

/** A graph node, as document-set@1 carries it (the visualizer's shape). */
export interface GraphNode {
  id: string
  data: Record<string, unknown>
}

/** A graph edge, as document-set@1 carries it. */
export interface GraphEdge {
  id?: string
  source: string
  target: string
  relation_type?: string
}

/** document-set@1 — what the visualizer renders. */
export interface DocumentSetGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

/** What annotation/import returns for a TaskData. */
export interface ImportedAnnotations {
  provisions: {
    classifications: { prov_id: string; norm_type?: string; note?: string }[]
  }
  links: { links: GraphLink[] }
}

export interface LinkGraphBuilderProps {
  /** Heading above the summary. */
  title?: string
  /** The annotated task (annotated-task@1): the TaskData to read links from. */
  task?: unknown
  /** Collapse provisions into one node per instrument (needs the visualizer's
   * compound-node support). */
  groupByInstrument?: boolean
  /** Keep provisions that have no links; off drops the isolated nodes. */
  includeUnlinked?: boolean
  /** annotation/import: a TaskData -> { provisions, links }. */
  onImportAnnotations?: (taskData: unknown) => Promise<ImportedAnnotations>
  /** graph: { prov_ids, links, group_by_instrument } -> document-set@1. */
  onBuild?: (
    provIds: string[],
    links: GraphLink[],
    groupByInstrument: boolean,
  ) => Promise<DocumentSetGraph>
}
