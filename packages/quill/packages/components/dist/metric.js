import { t as e } from "./createLucideIcon-QjQsCOg8.js";
import * as t from "react";
import { Badge as n, Tooltip as r, TooltipContent as i, TooltipProvider as a, TooltipTrigger as o, cn as s } from "@hanzo/quill-primitives";
import { jsx as c, jsxs as l } from "react/jsx-runtime";
import { ChartErrorBoundary as u, Sparkline as d, computeFallbackChangePercent as f, percentage as p, resolveDelta as m, useAnimatedNumber as h, useHoverIntent as g } from "@hanzo/quill-charts";
var _ = e("chevron-down", [["path", {
	d: "m6 9 6 6 6-6",
	key: "qrunsl"
}]]), v = e("chevron-up", [["path", {
	d: "m18 15-6-6-6 6",
	key: "153udz"
}]]), y = t.createContext(null);
function b(e) {
	let n = t.useContext(y);
	if (n == null) throw Error(`${e} must be rendered inside <Metric>`);
	return n;
}
var x = (e) => e.toLocaleString(), S = (e) => {
	let t = p(e / 100, 1, !0);
	return e > 0 ? `+${t}` : t;
};
function C(e) {
	let { onError: t, ...n } = e;
	return /* @__PURE__ */ c(u, {
		onError: t,
		children: /* @__PURE__ */ c(w, { ...n })
	});
}
function w({ value: e, data: n, series: r, labels: i, theme: a, color: o, sparklineHeight: l = 120, sparklineFill: u = !1, sparklineFillOpacity: d = .35, sparklineDashedFromIndex: p, sparklineTooltip: _, formatValue: v = x, formatChange: b = S, showChange: C = !0, change: w, goodDirection: T = "up", positiveColor: E, negativeColor: D, changeTooltip: O, subtitle: k, restingSubtitle: A, hoverChangeFromPreviousPoint: j = !1, animationMs: M = 350, hoverIntentMs: N = 140, className: P, dataAttr: F, children: I }) {
	let L = n != null && n.length > 0 && a != null ? n : null, R = L ? L.length - 1 : -1, [z, B] = t.useState(-1), V = g(z, N), H = V >= 0 ? V : R, U = e ?? (L ? L[R] : void 0), W = h(L && V >= 0 ? L[V] ?? 0 : U ?? 0, M), G = t.useMemo(() => L?.find((e) => e !== 0 && Number.isFinite(e)), [L]), K = t.useMemo(() => {
		if (U == null) return null;
		let e = L ? L[H] ?? 0 : U, t = j && V >= 0 && L != null, n = f(L, t, V, e, G), s = m({
			showChange: C,
			change: t && w !== null ? void 0 : w,
			fallbackChangePercent: n,
			formatChange: b
		}), c = s != null && s.value >= 0, h = T === "up" ? c : !c;
		return {
			headlineDisplay: v(L ? W : U),
			subtitle: k ?? (V < 0 && A != null ? A : i?.[H]),
			change: s == null ? null : {
				delta: s,
				positive: c,
				good: h,
				colors: h ? E : D,
				tooltip: t ? void 0 : O
			},
			sparkline: L ? {
				data: L,
				series: r,
				labels: i,
				theme: a,
				color: o,
				height: l,
				fill: u,
				fillOpacity: d,
				dashedFromIndex: p,
				setHoverIndex: B,
				tooltip: _
			} : null
		};
	}, [
		U,
		L,
		H,
		V,
		j,
		G,
		C,
		w,
		b,
		O,
		T,
		E,
		D,
		v,
		W,
		k,
		A,
		i,
		a,
		o,
		r,
		l,
		u,
		d,
		p,
		_
	]);
	return K == null ? null : /* @__PURE__ */ c(y.Provider, {
		value: K,
		children: /* @__PURE__ */ c("div", {
			"data-attr": F,
			className: s("flex h-full flex-col px-4", P),
			children: I
		})
	});
}
function T({ className: e, ...t }) {
	return /* @__PURE__ */ c("div", {
		className: s("flex items-start justify-between gap-2", e),
		...t
	});
}
function E({ className: e, ...t }) {
	return /* @__PURE__ */ c("div", {
		className: s("text-sm font-medium", e),
		...t
	});
}
function D({ className: e, children: t, ...n }) {
	let { headlineDisplay: r } = b("MetricValue");
	return /* @__PURE__ */ c("div", {
		className: s("min-w-0 truncate text-4xl font-bold tracking-tight tabular-nums", e),
		...n,
		children: t ?? r
	});
}
function O({ className: e }) {
	let { change: t } = b("MetricDelta");
	if (t == null) return null;
	let u = t.positive ? v : _, d = /* @__PURE__ */ l(n, {
		variant: t.colors == null ? t.good ? "success" : "destructive" : "default",
		className: s("gap-0.5 rounded-full tabular-nums", e),
		style: t.colors == null ? void 0 : {
			background: t.colors.background,
			color: t.colors.foreground
		},
		"data-attr": "metric-change-pill",
		children: [/* @__PURE__ */ c(u, { className: "size-3" }), t.delta.label]
	});
	return t.tooltip == null ? d : /* @__PURE__ */ c(a, { children: /* @__PURE__ */ l(r, { children: [/* @__PURE__ */ c(o, {
		render: /* @__PURE__ */ c("span", { className: "inline-flex" }),
		children: d
	}), /* @__PURE__ */ c(i, { children: t.tooltip })] }) });
}
function k({ className: e, children: t, ...n }) {
	let { subtitle: r } = b("MetricSubtitle"), i = t ?? r;
	return i == null || i === "" ? null : /* @__PURE__ */ c("div", {
		className: s("text-sm opacity-60", e),
		"data-attr": "metric-subtitle",
		...n,
		children: i
	});
}
function A({ className: e = "-mx-4 -mb-4 mt-4 flex-1" }) {
	let { sparkline: t } = b("MetricSparkline");
	if (t == null) return null;
	let n = t.fill ? "" : "mt-auto";
	return /* @__PURE__ */ c(d, {
		data: t.series == null ? t.data : void 0,
		series: t.series,
		labels: t.labels,
		theme: t.theme,
		color: t.color,
		height: t.height,
		fill: t.fill,
		fillOpacity: t.fillOpacity,
		dashedFromIndex: t.dashedFromIndex,
		onHoverIndexChange: t.setHoverIndex,
		tooltip: t.tooltip,
		className: s("relative top-[6px]", n, e),
		dataAttr: "metric-sparkline"
	});
}
//#endregion
export { C as Metric, O as MetricDelta, T as MetricHeader, A as MetricSparkline, k as MetricSubtitle, E as MetricTitle, D as MetricValue };
