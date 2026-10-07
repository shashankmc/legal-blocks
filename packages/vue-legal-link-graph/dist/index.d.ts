import type { DefineComponent, Plugin } from "vue";

export type {
  LinkGraphBuilderProps,
  DocumentSetGraph,
  GraphNode,
  GraphEdge,
  GraphLink,
  ImportedAnnotations,
} from "./components/types";

export declare const LinkGraphBuilder: DefineComponent<
  import("./components/types").LinkGraphBuilderProps
>;

export declare const VueLegalLinkGraphPlugin: Plugin;
export default VueLegalLinkGraphPlugin;
