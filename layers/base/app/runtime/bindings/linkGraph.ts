// BlueLab link graph. Reads annotated-task@1, produces document-set@1.
//
// The service does the work: annotation/import reads the annotated task back
// into provisions and links, and graph turns those into the graph the
// visualizer renders (filling each node's instrument metadata). The output is
// a `results` CorpusValue, which is exactly what the existing visualizer
// binding (DocumentPassthrough) reads, so no visualizer change is needed.

import type { DocumentSetGraph, GraphLink } from "vue-legal-link-graph";
import { buildGraph, importAnnotations } from "../../api/bluelab";
import type { Binding, BindingContext, CorpusValue, KindBindings, TaskValue } from "./types";

/** The graph each link-graph node has produced so far. */
const sessionGraphs = new Map<string, DocumentSetGraph>();

export const LinkGraph: KindBindings = {
  workspace: linkGraph(false),
  pipeline: linkGraph(true),
};

function linkGraph(produced: boolean): Binding {
  return {
    async props(ctx: BindingContext) {
      const value = (await ctx.input("task")) as TaskValue;
      return {
        title: String(ctx.config.title ?? "Build the link graph"),
        task: taskDataOf(value),
        groupByInstrument: ctx.config.group_by_instrument !== "no",
        includeUnlinked: ctx.config.include_unlinked !== "no",
        onImportAnnotations: (taskData: unknown) => importAnnotations(taskData),
        onBuild: (provIds: string[], links: GraphLink[], groupBy: boolean) =>
          buildGraph(provIds, links, groupBy),
        onSubmit: (graph: DocumentSetGraph) => {
          sessionGraphs.set(ctx.nodeId, graph);
          if (produced) ctx.produced();
          else ctx.refresh();
        },
      };
    },
    async output(ctx: BindingContext): Promise<CorpusValue> {
      const graph = sessionGraphs.get(ctx.nodeId);
      return { kind: "results", nodes: graph?.nodes ?? [], edges: graph?.edges ?? [] };
    },
  };
}

/**
 * The TaskData to graph. A pipeline hands the task over on the port; a stored
 * workspace keeps it as a row, which this binding does not load yet — the
 * graph step is wired for the pipeline flow.
 */
function taskDataOf(value: TaskValue): unknown {
  if (value && value.kind === "session") return value.task;
  throw new Error(
    "the link graph needs an annotated task on its input — connect it after the annotate step",
  );
}
