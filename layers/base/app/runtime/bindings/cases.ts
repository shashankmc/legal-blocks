// vue-legal-case-builder. A source: it produces case@1 and never stores it
// (a case is a value that travels on the port, not a row), so both kinds hold
// the built case for the session and differ only in what finishing means.

import type { CaseV1 } from "vue-legal-case-builder";
import { listCases, loadCase } from "../../api/bluelab";
import type { Binding, BindingContext, KindBindings } from "./types";

/** The case each source node has built so far, empty before the first submit. */
const sessionCase = new Map<string, CaseV1>();

export const CaseSource: KindBindings = {
  workspace: caseSource(false),
  pipeline: caseSource(true),
};

/** `pipeline` finishing opens the next step; a workspace just refreshes. */
function caseSource(produced: boolean): Binding {
  return {
    async props(ctx: BindingContext) {
      return {
        onListCases: listCases,
        onLoadCase: loadCase,
        // An `onX` prop is a listener (v-bind), which is how a binding hands a
        // callback to a module without ModuleHost knowing any module's events.
        onSubmit: (value: CaseV1) => {
          sessionCase.set(ctx.nodeId, value);
          if (produced) ctx.produced();
          else ctx.refresh();
        },
      };
    },
    async output(ctx: BindingContext): Promise<CaseV1> {
      return sessionCase.get(ctx.nodeId) ?? emptyCase();
    },
  };
}

function emptyCase(): CaseV1 {
  return { title: "", fact_pattern: "", facts: {}, origin: "custom" };
}
