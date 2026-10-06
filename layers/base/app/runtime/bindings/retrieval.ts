// vue-legal-provision-retriever. Reads case@1, produces ranked-provisions@1.
// The search runs on the BlueLab service; the component never fetches.

import type {
  CaseV1,
  GroundTruth,
  RankedProvisionsV1,
} from "vue-legal-provision-retriever";
import { groundTruth, listMethods, searchProvisions } from "../../api/bluelab";
import type { Binding, BindingContext, KindBindings } from "./types";

/** Results each search node has produced, empty before the first search. */
const sessionResults = new Map<string, RankedProvisionsV1>();

export const ProvisionSearch: KindBindings = {
  workspace: search(false),
  pipeline: search(true),
};

function search(produced: boolean): Binding {
  return {
    async props(ctx: BindingContext) {
      const caseValue = (await ctx.input("case")) as CaseV1 | null;
      const showEvaluation = ctx.config.show_evaluation === "admin";

      // Research mode is off unless the step asks for it, and the service still
      // refuses ground truth to anyone but an admin caller.
      let truth: GroundTruth | null = null;
      if (showEvaluation && caseValue?.case_id) {
        truth = await groundTruth(caseValue.case_id).catch(() => null);
      }

      return {
        case: caseValue,
        title: String(ctx.config.title ?? "Find relevant provisions"),
        defaultMethod: ctx.config.default_method as string | undefined,
        defaultThreshold: Number(ctx.config.default_threshold ?? 0.2),
        showEvaluation,
        groundTruth: truth,
        onListMethods: listMethods,
        onSearch: async (args: { query: string; method: string; case_id?: string }) => {
          const result = await searchProvisions(args);
          sessionResults.set(ctx.nodeId, result);
          if (produced) ctx.produced();
          return result;
        },
      };
    },
    async output(ctx: BindingContext): Promise<RankedProvisionsV1> {
      return sessionResults.get(ctx.nodeId) ?? emptyResults();
    },
  };
}

function emptyResults(): RankedProvisionsV1 {
  return { query: "", method: "", threshold: 0, documents: [] };
}
