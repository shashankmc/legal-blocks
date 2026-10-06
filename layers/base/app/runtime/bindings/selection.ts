// vue-legal-document-manager. Reads ranked-provisions@1, produces
// provision-set@1. A workspace saves the selection through the BlueLab
// service; a pipeline holds it for the session and leaves by the next port.

import type {
  ProvisionSetV1,
  RankedProvisionsV1,
} from "vue-legal-document-manager";
import {
  listCorpus,
  loadDocument,
  loadMarkdown,
  saveSelection,
} from "../../api/bluelab";
import type { Binding, BindingContext, KindBindings } from "./types";

/** The selection each document-manager node has produced so far. */
const sessionSets = new Map<string, ProvisionSetV1>();

export const ProvisionSelection: KindBindings = {
  workspace: selection(true),
  pipeline: selection(false),
};

function selection(persist: boolean): Binding {
  return {
    async props(ctx: BindingContext) {
      const ranked = (await ctx.input("ranked")) as RankedProvisionsV1;
      return {
        ranked,
        threshold: ranked.threshold,
        title: String(ctx.config.title ?? "Select documents"),
        minDocuments: Number(ctx.config.min_documents ?? 2),
        highScoreWarning: Number(ctx.config.high_score_warning ?? 0.3),
        requireExclusionReason: ctx.config.require_exclusion_reason !== "no",
        includePreamblesOnAdd: ctx.config.include_preambles_on_add === "yes",
        onLoadDocument: loadDocument,
        onLoadMarkdown: loadMarkdown,
        onListCorpus: listCorpus,
        onSubmit: async (set: ProvisionSetV1) => {
          sessionSets.set(ctx.nodeId, set);
          if (persist) {
            await saveSelection(toSessionState(set));
            ctx.refresh();
          } else {
            ctx.produced();
          }
        },
      };
    },
    async output(ctx: BindingContext): Promise<ProvisionSetV1> {
      return sessionSets.get(ctx.nodeId) ?? emptyProvisionSet();
    },
  };
}

/** provision-set@1 -> the service's selection/save session shape. */
function toSessionState(set: ProvisionSetV1): Record<string, unknown> {
  return {
    scenario_id: set.case_id ?? "",
    method: set.method,
    threshold: set.threshold,
    selected_doc_ids: set.documents.map((d) => d.doc_id),
    excluded_doc_ids: set.excluded.map((e) => e.doc_id),
    selected_provisions: set.provisions,
    provenance_log: set.provenance,
  };
}

function emptyProvisionSet(): ProvisionSetV1 {
  return {
    method: "",
    threshold: 0,
    documents: [],
    provisions: [],
    excluded: [],
    provenance: [],
  };
}
