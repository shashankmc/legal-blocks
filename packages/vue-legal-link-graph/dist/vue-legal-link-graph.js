import { defineComponent as S, ref as g, computed as x, onMounted as C, openBlock as u, createElementBlock as d, createElementVNode as r, toDisplayString as c, createCommentVNode as I, Fragment as G, createTextVNode as f } from "vue";
const N = { class: "link-graph" }, V = { class: "link-graph__head" }, A = { class: "link-graph__title" }, E = {
  key: 0,
  class: "link-graph__status"
}, U = {
  key: 1,
  class: "link-graph__error"
}, F = { class: "link-graph__summary" }, O = { key: 0 }, P = { class: "link-graph__stats" }, z = {
  key: 3,
  class: "link-graph__status"
}, D = /* @__PURE__ */ S({
  __name: "LinkGraphBuilder",
  props: {
    title: { default: "Build the link graph" },
    task: {},
    groupByInstrument: { type: Boolean, default: !0 },
    includeUnlinked: { type: Boolean, default: !0 },
    onImportAnnotations: {},
    onBuild: {}
  },
  emits: ["submit", "provenance"],
  setup(l, { emit: h }) {
    const o = l, k = h, p = g(!1), _ = g(null), a = g(null), m = g(0), y = g(0), b = x(() => {
      var t, e;
      if (!a.value) return 0;
      const n = /* @__PURE__ */ new Set();
      for (const i of a.value.nodes) {
        const s = ((t = i.data) == null ? void 0 : t.parent) ?? ((e = i.data) == null ? void 0 : e.instrument);
        typeof s == "string" && s && n.add(s);
      }
      return n.size;
    });
    function w(n) {
      var e, i;
      const t = /* @__PURE__ */ new Set();
      for (const s of ((e = n.provisions) == null ? void 0 : e.classifications) ?? []) t.add(s.prov_id);
      for (const s of ((i = n.links) == null ? void 0 : i.links) ?? [])
        t.add(s.source_prov_id), t.add(s.target_prov_id);
      return [...t];
    }
    function L(n) {
      if (o.includeUnlinked) return n;
      const t = /* @__PURE__ */ new Set();
      for (const e of n.edges)
        t.add(e.source), t.add(e.target);
      return { nodes: n.nodes.filter((e) => t.has(e.id)), edges: n.edges };
    }
    async function B() {
      var n;
      if (!(!o.task || !o.onImportAnnotations || !o.onBuild)) {
        p.value = !0, _.value = null;
        try {
          const t = await o.onImportAnnotations(o.task), e = ((n = t.links) == null ? void 0 : n.links) ?? [], i = w(t);
          m.value = i.length, y.value = e.length;
          const s = await o.onBuild(i, e, o.groupByInstrument), v = L(s);
          a.value = v, k("submit", v), k("provenance", {
            action: "build_link_graph",
            target_kind: "graph",
            target_id: `${v.nodes.length}`
          });
        } catch (t) {
          _.value = t instanceof Error ? t.message : String(t);
        } finally {
          p.value = !1;
        }
      }
    }
    return C(B), (n, t) => (u(), d("section", N, [
      r("header", V, [
        r("h3", A, c(l.title), 1),
        a.value && !p.value ? (u(), d("button", {
          key: 0,
          type: "button",
          class: "link-graph__rebuild",
          onClick: B
        }, " Rebuild ")) : I("", !0)
      ]),
      p.value ? (u(), d("p", E, "Building the graph…")) : _.value ? (u(), d("p", U, c(_.value), 1)) : a.value ? (u(), d(G, { key: 2 }, [
        r("p", F, [
          r("strong", null, c(a.value.nodes.length), 1),
          t[2] || (t[2] = f(" provisions · ", -1)),
          r("strong", null, c(a.value.edges.length), 1),
          t[3] || (t[3] = f(" links ", -1)),
          l.groupByInstrument ? (u(), d("span", O, [
            t[0] || (t[0] = f(" · ", -1)),
            r("strong", null, c(b.value), 1),
            t[1] || (t[1] = f(" instruments", -1))
          ])) : I("", !0)
        ]),
        r("ul", P, [
          r("li", null, c(m.value) + " provisions annotated or linked", 1),
          r("li", null, c(y.value) + " typed links imported", 1)
        ])
      ], 64)) : (u(), d("p", z, "No annotated task to graph yet."))
    ]));
  }
}), M = (l, h) => {
  const o = l.__vccOpts || l;
  for (const [k, p] of h)
    o[k] = p;
  return o;
}, R = /* @__PURE__ */ M(D, [["__scopeId", "data-v-0cc5f59c"]]), $ = {
  install(l) {
    l.component("LinkGraphBuilder", R);
  }
};
export {
  R as LinkGraphBuilder,
  $ as VueLegalLinkGraphPlugin,
  $ as default
};
