import type { App, Plugin } from 'vue'

import LinkGraphBuilder from './components/LinkGraphBuilder.vue'
export { LinkGraphBuilder }

export type {
  LinkGraphBuilderProps,
  DocumentSetGraph,
  GraphNode,
  GraphEdge,
  GraphLink,
  ImportedAnnotations,
} from './components/types'

export const VueLegalLinkGraphPlugin: Plugin = {
  install(app: App) {
    app.component('LinkGraphBuilder', LinkGraphBuilder)
  },
}

export default VueLegalLinkGraphPlugin
