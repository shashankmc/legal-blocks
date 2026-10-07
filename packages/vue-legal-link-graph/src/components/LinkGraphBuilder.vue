<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
  DocumentSetGraph,
  GraphLink,
  ImportedAnnotations,
  LinkGraphBuilderProps,
} from './types'

// Turns annotated provisions and their typed links into the graph the
// visualizer renders. The two operations it needs are the host's:
// `onImportAnnotations` reads a TaskData back into provisions + links, and
// `onBuild` turns those into document-set@1 (the service's `graph` operation,
// which also fills each node's instrument metadata). The component never calls
// an API.
const props = withDefaults(defineProps<LinkGraphBuilderProps>(), {
  title: 'Build the link graph',
  groupByInstrument: true,
  includeUnlinked: true,
})

const emit = defineEmits<{
  /** The built graph, document-set@1. */
  submit: [graph: DocumentSetGraph]
  /** A provenance-worthy action. */
  provenance: [event: { action: string; target_kind: string; target_id?: string }]
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const graph = ref<DocumentSetGraph | null>(null)
const importedProvisions = ref(0)
const importedLinks = ref(0)

const instrumentCount = computed(() => {
  if (!graph.value) return 0
  const parents = new Set<string>()
  for (const node of graph.value.nodes) {
    const parent = node.data?.parent ?? node.data?.instrument
    if (typeof parent === 'string' && parent) parents.add(parent)
  }
  return parents.size
})

/** Provision ids the graph must contain: every classified provision, plus any
 * link endpoint. A provision that was only linked (never classified) still
 * becomes a node. */
function provIdsOf(imported: ImportedAnnotations): string[] {
  const ids = new Set<string>()
  for (const c of imported.provisions?.classifications ?? []) ids.add(c.prov_id)
  for (const link of imported.links?.links ?? []) {
    ids.add(link.source_prov_id)
    ids.add(link.target_prov_id)
  }
  return [...ids]
}

/** Drops isolated nodes when `includeUnlinked` is off. */
function withUnlinkedFiltered(built: DocumentSetGraph): DocumentSetGraph {
  if (props.includeUnlinked) return built
  const linked = new Set<string>()
  for (const edge of built.edges) {
    linked.add(edge.source)
    linked.add(edge.target)
  }
  return { nodes: built.nodes.filter((n) => linked.has(n.id)), edges: built.edges }
}

async function build(): Promise<void> {
  if (!props.task || !props.onImportAnnotations || !props.onBuild) return
  loading.value = true
  error.value = null
  try {
    const imported = await props.onImportAnnotations(props.task)
    const links: GraphLink[] = imported.links?.links ?? []
    const provIds = provIdsOf(imported)
    importedProvisions.value = provIds.length
    importedLinks.value = links.length

    const built = await props.onBuild(provIds, links, props.groupByInstrument)
    const filtered = withUnlinkedFiltered(built)
    graph.value = filtered
    emit('submit', filtered)
    emit('provenance', {
      action: 'build_link_graph',
      target_kind: 'graph',
      target_id: `${filtered.nodes.length}`,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(build)
</script>

<template>
  <section class="link-graph">
    <header class="link-graph__head">
      <h3 class="link-graph__title">{{ title }}</h3>
      <button v-if="graph && !loading" type="button" class="link-graph__rebuild" @click="build">
        Rebuild
      </button>
    </header>

    <p v-if="loading" class="link-graph__status">Building the graph…</p>
    <p v-else-if="error" class="link-graph__error">{{ error }}</p>

    <template v-else-if="graph">
      <p class="link-graph__summary">
        <strong>{{ graph.nodes.length }}</strong> provisions ·
        <strong>{{ graph.edges.length }}</strong> links
        <span v-if="groupByInstrument"> · <strong>{{ instrumentCount }}</strong> instruments</span>
      </p>
      <ul class="link-graph__stats">
        <li>{{ importedProvisions }} provisions annotated or linked</li>
        <li>{{ importedLinks }} typed links imported</li>
      </ul>
    </template>

    <p v-else class="link-graph__status">No annotated task to graph yet.</p>
  </section>
</template>

<style scoped>
.link-graph {
  border: 1px solid var(--lak-border, #d8e3eb);
  border-radius: 8px;
  padding: 0.9rem 1.1rem;
}
.link-graph__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}
.link-graph__title {
  margin: 0;
  font-size: 0.95rem;
}
.link-graph__rebuild {
  font: inherit;
  font-size: 0.8rem;
  border: 1px solid var(--lak-border, #d8e3eb);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 0.2rem 0.6rem;
}
.link-graph__summary {
  margin: 0.6rem 0 0.3rem;
}
.link-graph__stats {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--lak-muted, #5a6a7a);
  font-size: 0.85rem;
}
.link-graph__status {
  color: var(--lak-muted, #5a6a7a);
  font-size: 0.85rem;
}
.link-graph__error {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
