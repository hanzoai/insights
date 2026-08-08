import e, { createContext as t, useCallback as n, useContext as r, useEffect as i, useLayoutEffect as a, useMemo as o, useRef as s, useState as c } from "react";
import { Fragment as l, jsx as u, jsxs as d } from "react/jsx-runtime";
import { scaleBand as f, scaleLinear as p, scaleLog as m, scalePoint as h } from "d3-scale";
import { pie as g, stack as _, stackOffsetDiverging as v, stackOffsetExpand as y } from "d3-shape";
import { FloatingArrow as b, FloatingPortal as x, arrow as S, autoUpdate as C, flip as w, offset as T, shift as E, useFloating as D, useHover as O, useInteractions as k, useRole as A } from "@floating-ui/react";
import { color as j, rgb as M } from "d3-color";
import { bisector as N } from "d3-array";
import P from "dayjs";
import F from "dayjs/plugin/customParseFormat";
import I from "dayjs/plugin/timezone";
import L from "dayjs/plugin/utc";
import { linearRegression as R, probit as z, standardDeviation as B } from "simple-statistics";
//#region src/components/Legend/ChartLegendLayout.tsx
var V = {
	start: "items-start",
	center: "items-center",
	end: "items-end"
};
function H({ legend: e, position: t = "top", align: n = "center", gap: r = 8, className: i, dataAttr: a, children: o }) {
	let s = t === "left" || t === "right", c = t === "top" || t === "left", l = e ? /* @__PURE__ */ u("div", {
		className: `flex-none shrink-0 min-h-0 min-w-0 ${s ? "flex flex-col self-stretch max-w-[min(45%,240px)] overflow-y-auto justify-center-safe" : "self-stretch max-h-[40%] overflow-y-auto"}`,
		children: e
	}) : null, f = /* @__PURE__ */ u("div", {
		className: "flex flex-col flex-1 min-w-0 min-h-0 self-stretch",
		children: o
	});
	return /* @__PURE__ */ d("div", {
		className: `flex min-w-0 min-h-0 ${s ? "flex-row" : "flex-col"} ${V[n]} ${i ?? ""}`,
		style: { gap: r },
		"data-attr": a,
		children: [c ? l : f, c ? f : l]
	});
}
//#endregion
//#region src/components/Legend/Legend.tsx
var ee = {
	start: "justify-start",
	center: "justify-center",
	end: "justify-end"
};
function U({ items: t, orientation: n = "horizontal", align: r = "center", onItemClick: i, hiddenKeys: a, className: o, dataAttr: s, renderItem: c }) {
	if (t.length === 0) return null;
	let f = a?.length ? new Set(a) : null, p = n === "vertical", m = p ? "flex-col gap-1 justify-start" : `flex-row flex-wrap gap-x-3 gap-y-1 ${ee[r]}`, h = `max(180px, calc((100% - ${(t.length - 1) * .75}rem) / ${t.length}))`, g = p ? "flex w-full" : "inline-flex max-w-(--legend-row-max)";
	return /* @__PURE__ */ u("div", {
		className: `flex ${m} ${o ?? ""}`,
		style: p ? void 0 : { "--legend-row-max": h },
		"data-attr": s,
		children: t.map((t) => {
			let n = f?.has(t.key) ? " opacity-40" : "", r = `${g} min-w-0 items-center gap-1.5 text-xs leading-4${n}`, a = /* @__PURE__ */ d(l, { children: [
				/* @__PURE__ */ u("span", {
					"aria-hidden": "true",
					className: "inline-block w-2.5 h-2.5 rounded-sm shrink-0",
					style: { backgroundColor: t.color }
				}),
				/* @__PURE__ */ u("span", {
					className: "truncate min-w-0",
					title: t.label,
					children: t.label
				}),
				t.secondaryLabel != null && t.secondaryLabel !== "" && /* @__PURE__ */ u("span", {
					className: "shrink-0 text-muted",
					"data-attr": "script-chart-legend-secondary",
					children: t.secondaryLabel
				})
			] }), o = i ? /* @__PURE__ */ u("button", {
				type: "button",
				className: `${r} cursor-pointer bg-transparent border-0 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`,
				onClick: () => i(t.key),
				children: a
			}) : /* @__PURE__ */ u("span", {
				className: r,
				children: a
			});
			return /* @__PURE__ */ u(e.Fragment, { children: c ? c(o, t) : o }, t.key);
		})
	});
}
//#endregion
//#region src/components/Legend/ChartLegend.tsx
function W({ show: e = !0, items: t, position: n = "top", align: r = "center", gap: i, onItemClick: a, hiddenKeys: o, className: s, renderItem: c, legendDataAttr: d, children: f }) {
	if (!e || t.length === 0) return /* @__PURE__ */ u(l, { children: f });
	let p = n === "left" || n === "right" ? "vertical" : "horizontal", m = `flex-1 min-h-0 ${s ?? ""}`.trim();
	return /* @__PURE__ */ u(H, {
		legend: /* @__PURE__ */ u(U, {
			items: t,
			orientation: p,
			align: r,
			onItemClick: a,
			hiddenKeys: o,
			renderItem: c,
			dataAttr: d
		}),
		position: n,
		align: r,
		gap: i,
		className: m,
		children: f
	});
}
//#endregion
//#region src/components/Legend/legendItemsFromSeries.ts
function G(e, t) {
	let n = t.colors, r = [];
	for (let t = 0; t < e.length; t++) {
		let i = e[t];
		if (i.visibility?.excluded) continue;
		let a = n.length > 0 ? n[t % n.length] : "#000";
		r.push({
			key: i.key,
			label: i.label,
			color: i.color || a
		});
	}
	return r;
}
//#endregion
//#region src/components/Legend/useChartLegend.ts
function te(e, t) {
	return t.size === 0 ? e : e.map((e) => t.has(e.key) ? {
		...e,
		visibility: {
			...e.visibility,
			excluded: !0
		}
	} : e);
}
function K(e, t, r, i) {
	let a = r?.hiddenKeys, [s, l] = c(() => r?.defaultHiddenKeys ?? []), u = a ?? s, d = r?.onToggleSeries, f = n((e) => {
		d?.(e, !u.includes(e)), a === void 0 && l((t) => t.includes(e) ? t.filter((t) => t !== e) : [...t, e]);
	}, [
		a,
		u,
		d
	]), p = o(() => new Set(u), [u]), m = o(() => te(e, p), [e, p]), h = o(() => i ?? G(e, t), [
		i,
		e,
		t
	]), g = r?.interactive ?? !0;
	return {
		visibleSeries: m,
		legendProps: {
			show: r?.show ?? !1,
			items: h,
			position: r?.position ?? "bottom",
			align: r?.align,
			gap: r?.gap,
			onItemClick: g ? f : void 0,
			hiddenKeys: u,
			renderItem: r?.renderItem
		}
	};
}
//#endregion
//#region src/utils/format.ts
var q = 2, ne = [
	"",
	"K",
	"M",
	"B",
	"T",
	"P",
	"E",
	"Z",
	"Y"
];
function J(e, t) {
	return isNaN(e) || !Number.isInteger(e) || e < 0 || e > 100 ? t : e;
}
var re = 10;
function ie(e, t) {
	let n = J(t ?? q, q);
	return !isFinite(e) || e === 0 ? n : Math.min(Math.max(n, 1 - Math.floor(Math.log10(Math.abs(e)))), re);
}
function ae(e, t = q, n = 0) {
	return e.toLocaleString("en-US", {
		maximumFractionDigits: J(t, q),
		minimumFractionDigits: J(n, 0)
	});
}
function oe(e, t = q) {
	e ||= "0.00";
	let n = typeof e == "string" ? parseFloat(e) : e, r = J(t, q);
	return `$${n.toLocaleString("en-US", {
		maximumFractionDigits: r,
		minimumFractionDigits: r
	})}`;
}
function se(e, { maxUnits: t, secondsPrecision: n, secondsFixed: r } = {}) {
	if (e === "" || e == null || t === 0) return "";
	if (e = Number(e), e < 0) return `-${se(-e, {
		maxUnits: t,
		secondsPrecision: n,
		secondsFixed: r
	})}`;
	if (e === 0) return "0s";
	if (e < 1) return `${Math.round(e * 1e3)}ms`;
	if (e < 60) return n == null ? `${parseFloat(e.toFixed(r ?? 0))}s` : `${parseFloat(e.toPrecision(n))}s`;
	let i = Math.floor(e / 86400), a = Math.floor(e % 86400 / 3600), o = Math.floor(e % 3600 / 60), s = Math.floor(e % 3600 % 60), c = i > 0 ? i + "d" : "", l = a > 0 ? a + "h" : "", u = o > 0 ? o + "m" : "", d = s > 0 ? s + "s" : l || u ? "" : "0s", f = [];
	return f = i > 0 ? [c, l].filter(Boolean) : [
		l,
		u,
		d
	].filter(Boolean), f.slice(0, t ?? void 0).join("\xA0");
}
function ce(e, t = q, n = !1) {
	if (e === Infinity) return "∞%";
	let r = J(t, q);
	return e.toLocaleString("en-US", {
		style: "percent",
		maximumFractionDigits: r,
		minimumFractionDigits: n ? r : void 0
	});
}
function le(e) {
	if (e === null) return "-";
	e = parseFloat(e.toPrecision(3));
	let t = 0;
	for (; Math.abs(e) >= 1e3;) t++, e /= 1e3;
	return t > 0 ? `${e} ${ne[t]}` : e.toString();
}
function Y(e, t) {
	let { symbol: n, isPrefix: r } = ue(t);
	return `${r ? n : ""}${ae(e, 2, 2)}${r ? "" : " " + n}`;
}
function ue(e) {
	let t = new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: e
	}).formatToParts(0), n = t.find((e) => e.type === "currency")?.value, r = n ? t[0].type === "currency" : !0;
	return {
		symbol: n ?? e,
		isPrefix: r
	};
}
function de(e) {
	return e = e.replace(/^#/, ""), (e.length === 3 || e.length === 4) && (e = e.split("").map((e) => e + e).join("")), e.length !== 6 && e.length !== 8 ? {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	} : {
		r: parseInt(e.slice(0, 2), 16),
		g: parseInt(e.slice(2, 4), 16),
		b: parseInt(e.slice(4, 6), 16),
		a: e.length === 8 ? parseInt(e.slice(6, 8), 16) / 255 : 1
	};
}
function fe(e, t = 1) {
	let { r: n, g: r, b: i } = de(e);
	return `rgba(${[
		n,
		r,
		i,
		t
	].join(",")})`;
}
//#endregion
//#region src/core/types.ts
var X = "left", pe = "line";
function me(e) {
	return e == null || typeof e == "boolean" ? {
		x: !!e,
		y: !!e
	} : {
		x: e.x ?? !0,
		y: e.y ?? !0
	};
}
var he = (e, t) => {
	let n = e.data[t];
	return typeof n == "number" && Number.isFinite(n) ? n : 0;
}, ge = .2;
function _e(e) {
	let t = Infinity, n = -Infinity, r = Infinity, i = 0;
	for (let a of e) if (!a.visibility?.excluded) for (let e of a.fill?.lowerData ? [...a.data, ...a.fill.lowerData] : a.data) e == null || !isFinite(e) || (i++, e < t && (t = e), e > n && (n = e), e > 0 && e < r && (r = e));
	return {
		min: t,
		max: n,
		minPositive: r,
		count: i
	};
}
function ve(e) {
	return e ? "include" in e ? { include: e.include } : { fixed: e } : {};
}
function ye(e, t) {
	let { min: n, max: r, minPositive: i, count: a } = e;
	for (let e of t) e == null || !isFinite(e) || (a++, e < n && (n = e), e > r && (r = e), e > 0 && e < i && (i = e));
	return {
		min: n,
		max: r,
		minPositive: i,
		count: a
	};
}
function be(e, t) {
	let n = 10 ** (Math.ceil(Math.log10(e)) - 1), r = 10 ** Math.floor(Math.log10(t));
	return [n, Math.ceil(t / r) * r];
}
function xe(e, t) {
	return h().domain(e).range([t.plotLeft, t.plotLeft + t.plotWidth]).padding(0);
}
var Se = 2, Ce = 11;
function we(e) {
	return !isFinite(e) || e <= 0 ? Se : Math.max(Se, Math.min(Ce, Math.floor(e / 50)));
}
function Te([e, t]) {
	return !isFinite(e) || !isFinite(t) ? [0, 1] : e === t ? [e, e + 1] : e < t ? [e, t] : [t, e];
}
function Ee(e, t) {
	let n = Math.min(0, isFinite(e) ? e : 0);
	return [n, Math.max(0, isFinite(t) ? t : 0, n + 1)];
}
function De(e, t, n = {}) {
	let { scaleType: r = "linear", percentStack: i = !1, valueDomain: a, floatBaseline: o = !1 } = n, { fixed: s, include: c } = ve(a), l = we(t.plotHeight);
	if (s) return p().domain(Te(s)).range([t.plotTop + t.plotHeight, t.plotTop]);
	if (i) return p().domain([0, 1]).nice(l).range([t.plotTop + t.plotHeight, t.plotTop]);
	let u = _e(e), d = c?.length ? ye(u, c) : u, f = c?.some((e) => e != null && isFinite(e) && e < 0) ?? !1;
	return Oe({
		range: d,
		primaryRange: e.some((e) => e.overlay) ? _e(e.filter((e) => !e.overlay)) : u,
		valueRange: [t.plotTop + t.plotHeight, t.plotTop],
		tickCount: l,
		scaleType: r,
		allowNegativeBaseline: f,
		floatBaseline: o
	});
}
function Oe(e) {
	let { range: t, valueRange: n, tickCount: r, scaleType: i = "linear", primaryRange: a = t, allowNegativeBaseline: o = !1, floatBaseline: s = !1 } = e;
	if (t.count === 0) return p().domain([0, 1]).range(n);
	let { min: c, max: l } = t;
	if (i === "log") {
		if (!isFinite(t.minPositive)) {
			let e = c, t = l;
			if (!isFinite(e) || !isFinite(t) || e === t) {
				let [n, r] = Ee(e, t);
				e = n, t = r;
			}
			return p().domain([e, t]).nice(r).range(n);
		}
		return m().domain(be(t.minPositive, l)).range(n).clamp(!0);
	}
	if (s || (a.count > 0 && a.min >= 0 && !o ? c = 0 : l < 0 && (l = 0)), !isFinite(c) || !isFinite(l) || c === l) {
		let [e, t] = Ee(c, l);
		c = e, l = t;
	}
	return p().domain([c, l]).nice(r).range(n);
}
function ke(e, t) {
	let n = {};
	for (let [r, { scale: i, position: a }] of Object.entries(e)) n[r] = {
		scale: (e) => i(e),
		ticks: () => i.ticks?.(t) ?? [],
		position: a
	};
	return n;
}
function Ae(e, t = {}) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) r.visibility?.excluded || t.skip?.(r) || n.set(r.yAxisId ?? "left", r.key);
	return n;
}
function je(e) {
	let t = new Set(e.filter((e) => !e.visibility?.excluded).map((e) => e.yAxisId ?? "left"));
	return [...t.has("left") ? [X] : [], ...Array.from(t).filter((e) => e !== X)].map((e, t) => ({
		axisId: e,
		position: t % 2 == 0 ? "left" : "right"
	}));
}
function Me(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of e) {
		if (n.visibility?.excluded) continue;
		let e = n.yAxisId ?? "left", r = t.get(e);
		r ? r.push(n) : t.set(e, [n]);
	}
	return t;
}
function Ne(e, t, n, r = {}) {
	let i = xe(t, n), a = je(e), o = new Map((r.axes ?? []).map((e) => [e.id, e])), s = a[0]?.axisId ?? "left", c = a.length === 1 && o.get(s)?.position === "right";
	if (!(a.length > 1) && !c) return {
		x: i,
		y: De(e, n, {
			scaleType: o.get(s)?.scaleType ?? r.scaleType,
			percentStack: r.percentStack,
			valueDomain: r.valueDomain,
			floatBaseline: r.floatBaseline
		})
	};
	let l = Me(e), u = {};
	return a.forEach(({ axisId: e, position: t }, i) => {
		let a = o.get(e), s = De(l.get(e) ?? [], n, {
			scaleType: a?.scaleType ?? r.scaleType,
			percentStack: r.percentStack,
			valueDomain: i === 0 ? r.valueDomain : void 0,
			floatBaseline: a?.startAtZero == null ? i === 0 ? r.floatBaseline : void 0 : a.startAtZero === !1
		});
		u[e] = {
			scale: s,
			position: a?.position ?? t
		};
	}), {
		x: i,
		y: (u.left ?? u[a[0].axisId]).scale,
		yAxes: u
	};
}
function Pe(e, t, n = {}) {
	let { offset: r, allowNegative: i = !1 } = n, a = e.filter((e) => !e.visibility?.excluded && !e.fill?.lowerData && !e.overlay);
	if (a.length === 0) return /* @__PURE__ */ new Map();
	let o = /* @__PURE__ */ new Map(), s = /* @__PURE__ */ new Map();
	for (let e of a) {
		let t = e.yAxisId ?? "left", n = s.get(t);
		n ? n.push(e) : s.set(t, [e]);
	}
	for (let e of s.values()) {
		let n = t.map((t, n) => {
			let r = {};
			for (let t of e) {
				let e = t.data[n] ?? 0;
				r[t.key] = i ? e : Math.max(0, e);
			}
			return r;
		}), a = _().keys(e.map((e) => e.key));
		r && a.offset(r);
		let s = a(n);
		for (let e of s) o.set(e.key, {
			top: e.map((e) => Number.isFinite(e[1]) ? e[1] : 0),
			bottom: e.map((e) => Number.isFinite(e[0]) ? e[0] : 0)
		});
	}
	return o;
}
function Fe(e, t) {
	return Pe(e, t);
}
function Ie(e, t) {
	return Pe(e, t, { offset: y });
}
function Le(e, t) {
	return Pe(e, t, {
		offset: v,
		allowNegative: !0
	});
}
function Re(e) {
	if (e) return (t, n) => {
		let r = e.get(t.key)?.top[n];
		if (r != null && Number.isFinite(r)) return r;
		let i = t.data[n];
		return typeof i == "number" && Number.isFinite(i) ? i : 0;
	};
}
function ze(e) {
	if (e) return (t, n) => {
		let r = e.get(t.key), i = t.data[n];
		if (r) {
			let e = r.top[n], t = r.bottom[n];
			if (Number.isFinite(e) && Number.isFinite(t)) {
				let n = e - t;
				return typeof i == "number" && i < 0 && n > 0 ? -n : n;
			}
		}
		return typeof i == "number" && Number.isFinite(i) ? i : 0;
	};
}
function Be(e) {
	if (e) return (t, n) => {
		let r = e.get(t.key)?.bottom[n];
		if (Number.isFinite(r)) return r;
		let i = t.data[n];
		return typeof i == "number" && Number.isFinite(i) ? i : 0;
	};
}
function Ve(e, t, n) {
	let r = e.band(t), i = e.group, a = i?.(n);
	if (!(r == null || i == null || a == null)) return {
		x: r + a,
		width: i.bandwidth()
	};
}
function He(e, t, n, r = {}) {
	let { scaleType: i = "linear", barLayout: a = "stacked", axisOrientation: o = "vertical", bandPadding: s = ge, groupPadding: c = .1, stackedSeries: l, maxBandRange: u, fitToHeight: d, minBandSize: p, minBarSize: m, valueDomain: h, valuePadding: g = 0, axes: _ } = r, v = o === "horizontal", y = we(v ? n.plotWidth : n.plotHeight), b = v ? n.plotTop : n.plotLeft, x = v ? n.plotHeight : n.plotWidth, S = u == null ? x : Math.min(x, u), C = t;
	if (v && d && p && p > 0) {
		let e = Math.max(1, Math.floor(S / p));
		t.length > e && (C = t.slice(0, e));
	}
	let w = f().domain(C).range([b, b + S]).paddingInner(s).paddingOuter(s / 2), T;
	if (a === "grouped") {
		let t = e.filter((e) => !e.visibility?.excluded).map((e) => e.key);
		T = f().domain(t).range([0, w.bandwidth()]).padding(c);
	}
	let E = v ? [n.plotLeft, n.plotLeft + n.plotWidth] : [n.plotTop + n.plotHeight, n.plotTop], D = C.length, O = (e) => D < t.length ? {
		...e,
		data: e.data.slice(0, D)
	} : e, k = e.map(O), A = l?.map(O), j = k.filter((e) => !e.visibility?.excluded), M = new Map((_ ?? []).map((e) => [e.id, e])), N = je(j).map(({ axisId: e, position: t }) => ({
		axisId: e,
		position: M.get(e)?.position ?? t
	})), P = N.length === 1 && N[0].position === "right";
	if (N.length > 1 || P) {
		let e = Me(j), t = {};
		return N.forEach(({ axisId: n, position: r }, o) => {
			let s = e.get(n) ?? [], c = A?.filter((e) => (e.yAxisId ?? "left") === n), l = Ue(s, E, y, a, M.get(n)?.scaleType ?? i, c?.length ? c : void 0, o === 0 ? h : void 0, g);
			t[n] = {
				scale: l,
				position: r
			};
		}), {
			band: w,
			value: (t.left ?? t[N[0].axisId]).scale,
			group: T,
			yAxes: t,
			minBarSize: m
		};
	}
	return {
		band: w,
		value: Ue(k, E, y, a, i, A, h, g),
		group: T,
		minBarSize: m
	};
}
function Ue(e, t, n, r, i, a, o, s) {
	let { fixed: c, include: l } = ve(o);
	if (c) return p().domain(Te(c)).range(t);
	if (r === "percent") return p().domain([0, 1]).nice(n).range(t);
	let u = l?.length ? ye(_e(a ?? e), l) : _e(a ?? e);
	if (u.count === 0) return p().domain([0, 1]).range(t);
	let d = u.min > 0 ? 0 : u.min, f = u.max < 0 ? 0 : u.max;
	if (i === "log" && isFinite(u.minPositive)) return m().domain(be(u.minPositive, f)).range(t).clamp(!0);
	if (!isFinite(d) || !isFinite(f) || d === f) {
		let [e, t] = Ee(d, f);
		d = e, f = t;
	}
	let h = p().domain([d, f]).nice(n);
	return h.range(We(t, h.domain(), s));
}
function We([e, t], [n, r], i) {
	let a = Math.abs(t - e);
	if (i <= 0 || a === 0) return [e, t];
	let o = Math.min(i, a / 3) * Math.sign(e - t || 1);
	return [n < 0 ? e - o : e, r > 0 ? t + o : t];
}
function Ge(e, t) {
	return t < 2 ? e.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: ie(t)
	}) : t < 5 ? e.toFixed(1) : e.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function Ke(e) {
	let t = e.length > 0 ? Math.max(...e.map((e) => Math.abs(e))) : 1;
	return (e) => Ge(e, t);
}
function qe(e, t) {
	return e.yAxes?.[t.yAxisId ?? "left"]?.scale ?? e.y;
}
//#endregion
//#region src/core/bar-layout.ts
var Je = .5;
function Ye(e, t, n, r = !1) {
	let i = {};
	return n && (e ? t ? i.topRight = i.bottomRight = !0 : i.topLeft = i.bottomLeft = !0 : t ? i.topLeft = i.topRight = !0 : i.bottomLeft = i.bottomRight = !0), r && (e ? t ? i.topLeft = i.bottomLeft = !0 : i.topRight = i.bottomRight = !0 : t ? i.bottomLeft = i.bottomRight = !0 : i.topLeft = i.topRight = !0), i;
}
var Xe = .5, Ze = .5;
function Qe(e, t, n) {
	let r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
	for (let a of e) if (!((t ? a.width : a.height) < Xe)) if (t) {
		if (a.x + a.width > n + Ze) {
			let e = r.get(a.dataIndex);
			(!e || a.x + a.width >= e.x + e.width) && r.set(a.dataIndex, a);
		}
		if (a.x < n - Ze) {
			let e = i.get(a.dataIndex);
			(!e || a.x <= e.x) && i.set(a.dataIndex, a);
		}
	} else {
		if (a.y < n - Ze) {
			let e = r.get(a.dataIndex);
			(!e || a.y <= e.y) && r.set(a.dataIndex, a);
		}
		if (a.y + a.height > n + Ze) {
			let e = i.get(a.dataIndex);
			(!e || a.y + a.height >= e.y + e.height) && i.set(a.dataIndex, a);
		}
	}
	for (let a of e) {
		let e = r.get(a.dataIndex) === a, o = i.get(a.dataIndex) === a, s = t ? a.x + a.width > n + Ze : a.y < n - Ze, c = e || o || void 0;
		t ? s ? a.corners.topRight = a.corners.bottomRight = c : a.corners.topLeft = a.corners.bottomLeft = c : s ? a.corners.topLeft = a.corners.topRight = c : a.corners.bottomLeft = a.corners.bottomRight = c;
	}
}
function $e(e, t, n, r, i = !1) {
	if (r === "grouped" || i) return;
	let a = /* @__PURE__ */ new Map();
	for (let { bar: t, yAxisId: n } of e) {
		let e = n ?? "left", r = a.get(e);
		r ? r.push(t) : a.set(e, [t]);
	}
	for (let [e, r] of a) Qe(r, n, (t.yAxes?.[e]?.scale ?? t.value)(0));
}
function et(e, t, n, r, i, a, o) {
	let s = Math.min(r, i), c = Math.abs(r - i);
	return e ? {
		x: s,
		y: t,
		width: c,
		height: n,
		corners: a,
		dataIndex: o
	} : {
		x: t,
		y: s,
		width: n,
		height: c,
		corners: a,
		dataIndex: o
	};
}
function tt({ series: e, labels: t, scales: n, layout: r, isHorizontal: i, stackedBand: a, isTopOfStack: o, capRoundedAtIndex: s, baseRoundedAtIndex: c }) {
	let l = Array(t.length);
	for (let u = 0; u < t.length; u++) l[u] = it({
		series: e,
		label: t[u],
		dataIndex: u,
		scales: n,
		isHorizontal: i,
		layout: r,
		stackedBand: a,
		isTopOfStack: o,
		capRounded: s?.(u),
		baseRounded: c?.(u)
	});
	return l;
}
function nt({ series: e, labels: t, scales: n, layout: r, isHorizontal: i, stackedData: a, topStackedKeyByAxis: o }) {
	let s = [];
	for (let c of e) {
		if (c.visibility?.excluded) continue;
		let e = c.yAxisId ?? "left", l = tt({
			series: c,
			labels: t,
			scales: n,
			layout: r,
			isHorizontal: i,
			stackedBand: a?.get(c.key),
			isTopOfStack: o.get(e) === c.key
		}).filter((e) => e !== null);
		s.push({
			series: c,
			bars: l
		});
	}
	return s;
}
function rt(e, t, n, r) {
	let i = Math.sign(e - t);
	return !r || r <= 0 || n === 0 || i === 0 || Math.abs(e - t) >= r ? e : t + i * r;
}
function it({ series: e, label: t, dataIndex: n, scales: r, layout: i, isHorizontal: a, stackedBand: o, isTopOfStack: s, capRounded: c, baseRounded: l }) {
	let u = i === "grouped";
	if (!u && !o) return null;
	let d = r.band(t), f = e.data[n];
	if (d == null || f == null || !isFinite(f)) return null;
	let p = c ?? (u || s), m = u ? !1 : l ?? !1, h = r.band.bandwidth(), g = r.yAxes?.[e.yAxisId ?? "left"]?.scale ?? r.value;
	if (u) {
		let i = Ve(r, t, e.key), o = g(f);
		if (!i || !isFinite(o)) return null;
		let s = Ye(a, f >= 0, p), [c, l] = g.range(), u = Math.min(Math.max(g(0), Math.min(c, l)), Math.max(c, l)), d = rt(o, u, f, r.minBarSize);
		return et(a, i.x, i.width, u, d, s, n);
	}
	let _ = g(o.top[n]), v = g(o.bottom[n]);
	if (!isFinite(_) || !isFinite(v)) return null;
	let y = rt(_, v, f, s ? r.minBarSize : void 0), b = y;
	if (y !== _) {
		let [e, t] = g.range();
		b = Math.min(Math.max(y, Math.min(e, t)), Math.max(e, t));
	}
	let x = Ye(a, a ? b >= v : b <= v, p, m), S = Math.abs(v - g(0)) < .001 ? v : v + Je * Math.sign(v - b);
	return et(a, d, h, b, S, x, n);
}
function at(e, t, n, r) {
	let i = Math.min(t, n), a = Math.abs(n - t);
	return r ? {
		x: i,
		y: e.y,
		width: a,
		height: e.height,
		corners: e.corners,
		dataIndex: e.dataIndex
	} : {
		x: e.x,
		y: i,
		width: e.width,
		height: a,
		corners: e.corners,
		dataIndex: e.dataIndex
	};
}
function ot(e, t) {
	let n = e.band(t);
	return n == null ? void 0 : n + e.band.bandwidth() / 2;
}
function st(e, t, n) {
	let r = Ve(e, t, n);
	return r && r.x + r.width / 2;
}
//#endregion
//#region src/core/chart-context.ts
var ct = t(null), lt = t({ hoverIndex: -1 });
function Z() {
	let e = r(ct);
	if (!e) throw Error("useChartLayout must be used inside a chart component (e.g. <LineChart>)");
	return e;
}
function ut() {
	return r(lt);
}
function dt() {
	let e = Z(), t = ut();
	return {
		...e,
		...t
	};
}
//#endregion
//#region src/utils/text-measure.ts
var ft = "-apple-system, BlinkMacSystemFont, \"Inter\", \"Segoe UI\", \"Roboto\", Helvetica, Arial, sans-serif", pt = `12px ${ft}`, mt = 160, ht = null;
function gt() {
	return ht ||= document.createElement("canvas").getContext("2d"), ht;
}
function _t(e, t = pt) {
	let n = gt();
	return n ? (n.font = t, n.measureText(e).width) : e.length * 7;
}
function vt(e, t, n = pt) {
	if (t <= 0 || _t(e, n) <= t) return e;
	if (_t("…", n) >= t) return "…";
	let r = 0, i = e.length;
	for (; r < i;) {
		let a = Math.ceil((r + i) / 2);
		_t(`${e.slice(0, a).trimEnd()}…`, n) <= t ? r = a : i = a - 1;
	}
	return `${e.slice(0, r).trimEnd()}…`;
}
//#endregion
//#region src/utils/axis-labels.ts
function yt(e) {
	return e?.trim() || void 0;
}
//#endregion
//#region src/core/hooks/useChartMargins.ts
var bt = {
	top: 16,
	right: 16,
	bottom: 32,
	left: 48
}, xt = 8, St = 20, Ct = 48, wt = 12, Tt = 6, Et = 4;
function Dt(e, t) {
	let n = { ...e };
	for (let e of [
		"top",
		"right",
		"bottom",
		"left"
	]) {
		let r = t[e];
		r !== void 0 && (n[e] = r);
	}
	return n;
}
function Ot(e, t, n = 0) {
	let r = 0;
	for (let n = 0; n < e.length; n++) {
		let i = t ? t(e[n], n) : e[n];
		i !== null && (r = Math.max(r, _t(i)));
	}
	return n > 0 ? Math.min(r, n) : r;
}
function kt(e, t) {
	let n = _e(e), [r, i] = n.count === 0 ? [0, 1] : [n.min > 0 ? 0 : n.min, n.max < 0 ? 0 : n.max], a = p().domain([r, i]).nice(6).ticks(6);
	if (a.length === 0) return 0;
	let o = t ?? Ke(a), s = 0;
	for (let e of a) s = Math.max(s, _t(o(e)));
	return s;
}
function At({ series: e, labels: t, hideXAxis: n, hideYAxis: r, xAxisLabel: i, xTickFormatter: a, yTickFormatter: s, axisOrientation: c = "vertical", override: l, valueRangeSeries: u, maxCategoryLabelWidth: d = 0, yAxisFormatters: f, yAxisPositions: p, yAxisTitles: m, yAxisHidden: h }) {
	let g = c === "horizontal", _ = u ?? e, v = yt(i), y = o(() => new Set(e.filter((e) => !e.visibility?.excluded).map((e) => e.yAxisId ?? "left")).size > 1, [e]), b = o(() => y || Object.values(p ?? {}).some((e) => e === "right"), [y, p]), x = o(() => {
		if (r || !m) return {
			left: 0,
			right: 0
		};
		if (g || !b) return {
			left: m.left ? 24 : 0,
			right: 0
		};
		let e = 0, t = 0;
		for (let { axisId: n, position: r } of je(_)) !m[n] || h?.[n] || ((p?.[n] ?? r) === "left" ? e += 24 : t += 24);
		return {
			left: e,
			right: t
		};
	}, [
		r,
		g,
		b,
		_,
		p,
		m,
		h
	]), S = o(() => r ? 0 : g ? Ot(t, a, d) : kt(_, s), [
		_,
		s,
		r,
		g,
		t,
		a,
		d
	]), C = o(() => {
		if (n) return 0;
		if (g) {
			let e = kt(_, s);
			return Math.ceil(e / 2);
		}
		return t.length === 0 ? 0 : Math.ceil(Ot(t, a, d) / 2);
	}, [
		t,
		a,
		n,
		g,
		_,
		s,
		d
	]), w = o(() => {
		if (r || g || !b) return null;
		let e = /* @__PURE__ */ new Map();
		for (let t of _) {
			if (t.visibility?.excluded) continue;
			let n = t.yAxisId ?? "left", r = e.get(n);
			r ? r.push(t) : e.set(n, [t]);
		}
		let t = 0, n = 0;
		for (let { axisId: r, position: i } of je(_)) {
			if (h?.[r]) continue;
			let a = f?.[r] ?? s, o = p?.[r] ?? i, c = Math.ceil(kt(e.get(r) ?? [], a)) + wt;
			o === "left" ? t += c + (t > 0 ? 12 : 0) : n += c + (n > 0 ? 12 : 0);
		}
		return {
			left: t,
			right: n
		};
	}, [
		r,
		g,
		b,
		_,
		s,
		f,
		p,
		h
	]);
	return o(() => {
		let e = n ? xt : bt.bottom + (v ? 22 : 0), t = w ? w.left : Math.ceil(S) + wt, i = r ? xt : Math.max(St, t + Tt, C + Et) + x.left, a = b && !r ? Ct : bt.right, o = (w?.right ?? 0) + x.right, s = Math.max(a, o, C + Et), c = {
			top: bt.top,
			right: s,
			bottom: e,
			left: i
		};
		return l ? Dt(c, l) : c;
	}, [
		n,
		r,
		b,
		w,
		S,
		C,
		v,
		x,
		l?.top,
		l?.right,
		l?.bottom,
		l?.left
	]);
}
//#endregion
//#region src/core/y-axis-gutters.ts
function jt(e, t) {
	return e.reduce((e, n) => Math.max(e, _t(t(n))), 0);
}
function Mt(e, { yTicks: t, yTickFormatter: n, userYTickFormatter: r, yAxisFormatters: i, titles: a, hiddenAxes: o }) {
	if (!e.yAxes) {
		let r = n ?? Ke(t);
		return [{
			axisId: X,
			key: "y-left",
			side: "left",
			offset: 0,
			width: jt(t, r),
			title: a?.[X],
			ticks: t,
			scale: e.y,
			formatter: r
		}];
	}
	let s = 0, c = 0, l = [];
	for (let [t, n] of Object.entries(e.yAxes)) {
		if (o?.[t]) continue;
		let e = n.ticks(), u = i?.[t] ?? r ?? Ke(e), d = n.position === "left" ? s : c, f = jt(e, u), p = a?.[t];
		l.push({
			axisId: t,
			key: `y-${t}`,
			side: n.position,
			offset: d,
			width: f,
			title: p,
			ticks: e,
			scale: n.scale,
			formatter: u
		});
		let m = f + 12 + (p ? 24 : 0);
		n.position === "left" ? s += m : c += m;
	}
	return l;
}
//#endregion
//#region src/overlays/AxisLabels.tsx
var Nt = 20, Pt = 8, Ft = 16;
function It(e, t) {
	let n = vt(e, t);
	return {
		text: n,
		title: n === e ? void 0 : e
	};
}
function Lt(e, t) {
	if (e.length === 0) return [];
	let n = gt();
	if (!n) return e;
	n.font = pt;
	let r = [], i = -Infinity;
	for (let a of e) {
		let e = n.measureText(a.text).width / 2;
		a.x - e >= i + t && (r.push(a), i = a.x + e);
	}
	return r;
}
function Rt(e, t, n, r = 0) {
	let i = [];
	for (let a = 0; a < e.length; a++) {
		let o = t(e[a]);
		if (o == null) continue;
		let s = n ? n(e[a], a) : e[a];
		if (s === null) continue;
		let { text: c, title: l } = It(s, r);
		i.push({
			index: a,
			text: c,
			title: l,
			x: o
		});
	}
	return Lt(i, Nt);
}
function zt(e, t, n) {
	let r = [];
	for (let i of e) {
		let e = t(i);
		isFinite(e) && r.push({
			tick: i,
			text: n ? n(i) : String(i),
			x: e
		});
	}
	return Lt(r, Pt);
}
function Bt(e) {
	if (e === 0) return 0;
	let t = Math.abs(e), n = t / 10 ** Math.floor(Math.log10(t)), r = Math.round(n);
	return r === 1 || r === 10 ? 0 : r === 5 ? 1 : r === 2 ? 2 : 3;
}
function Vt(e, t, n = Ft) {
	let r = e.map((e) => ({
		tick: e,
		y: t(e)
	})).filter(({ y: e }) => isFinite(e));
	if (r.length <= 1) return r.map((e) => e.tick);
	let i = [...r].sort((e, t) => Bt(e.tick) - Bt(t.tick) || e.y - t.y), a = [];
	for (let e of i) a.every((t) => Math.abs(t.y - e.y) >= n) && a.push(e);
	return a.sort((e, t) => e.tick - t.tick).map((e) => e.tick);
}
var Ht = {
	position: "absolute",
	fontSize: 12,
	pointerEvents: "none",
	whiteSpace: "nowrap"
}, Ut = { pointerEvents: "auto" }, Wt = {}, Gt = (e) => e ? Ut : Wt;
function Kt({ y: e, side: t, box: n, text: r, color: i, dataAttr: a, title: o, offset: s = 0 }) {
	let c = t === "left" ? { right: n.width - n.plotLeft + 8 + s } : { left: n.plotLeft + n.plotWidth + 8 + s };
	return /* @__PURE__ */ u("div", {
		"data-attr": a,
		title: o,
		style: {
			...Ht,
			...Gt(o),
			...c,
			top: e,
			transform: "translateY(-50%)",
			color: i
		},
		children: r
	});
}
function qt({ x: e, box: t, text: n, color: r, dataAttr: i, title: a }) {
	return /* @__PURE__ */ u("div", {
		"data-attr": i,
		title: a,
		style: {
			...Ht,
			...Gt(a),
			left: e,
			top: t.plotTop + t.plotHeight + 8,
			transform: "translateX(-50%)",
			color: r
		},
		children: n
	});
}
var Jt = e.memo(function({ xTickFormatter: e, yTickFormatter: t, hideXAxis: n, hideYAxis: r, axisColor: i = "rgba(0, 0, 0, 0.5)", orientation: a = "vertical", labelToCoord: s, maxCategoryLabelWidth: c = 0 }) {
	let { scales: f, dimensions: p, labels: m, yGutters: h } = Z(), g = f.yTicks(), _ = o(() => n || a === "horizontal" ? [] : Rt(m, f.x, e, c), [
		n,
		m,
		f.x,
		e,
		a,
		c
	]), v = o(() => n || a !== "horizontal" ? [] : zt(g, f.y, t), [
		n,
		a,
		g,
		f.y,
		t
	]);
	if (a === "horizontal") {
		let t = s ?? f.x;
		return /* @__PURE__ */ d(l, { children: [!r && m.map((n, r) => {
			let a = e ? e(n, r) : n;
			if (a === null) return null;
			let o = t(n);
			if (o == null || !isFinite(o)) return null;
			let { text: s, title: l } = It(a, c);
			return /* @__PURE__ */ u(Kt, {
				y: o,
				side: "left",
				box: p,
				text: s,
				title: l,
				color: i,
				dataAttr: "script-chart-axis-tick-y"
			}, `y-cat-${r}`);
		}), v.map(({ tick: e, text: t, x: n }) => /* @__PURE__ */ u(qt, {
			x: n,
			box: p,
			text: t,
			color: i,
			dataAttr: "script-chart-axis-tick-x"
		}, `x-val-${e}`))] });
	}
	return /* @__PURE__ */ d(l, { children: [h.flatMap((e) => Vt(e.ticks, e.scale).map((t) => {
		let n = e.scale(t);
		return isFinite(n) ? /* @__PURE__ */ u(Kt, {
			y: n,
			side: e.side,
			offset: e.offset,
			box: p,
			text: e.formatter(t),
			color: i,
			dataAttr: e.side === "left" ? "script-chart-axis-tick-y" : "script-chart-axis-tick-yr"
		}, `${e.key}-${t}`) : null;
	})), _.map(({ index: e, text: t, title: n, x: r }) => /* @__PURE__ */ u(qt, {
		x: r,
		box: p,
		text: t,
		title: n,
		color: i,
		dataAttr: "script-chart-axis-tick-x"
	}, `x-${e}`))] });
}), Yt = {
	fontSize: 12,
	fontWeight: 500,
	pointerEvents: "none"
}, Xt = `500 ${pt}`, Zt = {
	position: "absolute",
	top: 0,
	left: 0,
	width: "100%",
	height: "100%",
	pointerEvents: "none",
	overflow: "visible"
}, Qt = 6, $t = 12, en = 8, tn = (e, t) => vt(e, t, Xt);
function nn({ xAxisLabel: e, yAxisLabel: t, hideXAxis: n, hideYAxis: r, orientation: i = "vertical", axisColor: a }) {
	let { dimensions: o, yGutters: s } = Z(), c = yt(e), l = !n && !!c, f = [];
	if (i === "horizontal") {
		let e = yt(t);
		!r && e && f.push({
			key: "y-cat",
			x: $t,
			rotation: -90,
			dataAttr: "script-chart-axis-title-y",
			label: e
		});
	} else for (let { key: e, side: t, offset: n, width: r, title: i } of s) {
		if (!i) continue;
		let a = 8 + n + r + 24 / 2, s = t === "left" ? o.plotLeft - a : o.plotLeft + o.plotWidth + a;
		f.push({
			key: e,
			x: s,
			rotation: t === "left" ? -90 : 90,
			dataAttr: t === "left" ? "script-chart-axis-title-y" : "script-chart-axis-title-yr",
			label: i
		});
	}
	if (!l && f.length === 0) return null;
	let p = o.plotLeft + o.plotWidth / 2, m = o.height - Qt, h = o.plotTop + o.plotHeight / 2, g = Math.max(0, o.plotHeight - en * 2), _ = c ? tn(c, Math.max(0, o.plotWidth - en * 2)) : void 0;
	return /* @__PURE__ */ d("svg", {
		"aria-hidden": "true",
		style: Zt,
		children: [l && _ && /* @__PURE__ */ u("text", {
			"data-attr": "script-chart-axis-title-x",
			"data-full-label": c,
			x: p,
			y: m,
			fill: a,
			textAnchor: "middle",
			style: Yt,
			children: _
		}), f.map(({ key: e, x: t, rotation: n, dataAttr: r, label: i }) => /* @__PURE__ */ u("text", {
			"data-attr": r,
			"data-full-label": i,
			x: t,
			y: h,
			fill: a,
			textAnchor: "middle",
			dominantBaseline: "middle",
			transform: `rotate(${n} ${t} ${h})`,
			style: Yt,
			children: tn(i, g)
		}, e))]
	});
}
//#endregion
//#region src/overlays/TooltipSurface.tsx
var rn = "#1d2330", an = "#ffffff";
function on({ children: e, className: t, "data-attr": n }) {
	let { theme: r } = Z();
	return /* @__PURE__ */ u("div", {
		className: t,
		"data-attr": n,
		style: {
			width: "fit-content",
			maxWidth: "20rem",
			paddingBlock: "0.375rem",
			paddingInline: "0.5rem",
			fontSize: "var(--text-xs, 0.75rem)",
			lineHeight: 1.4,
			borderRadius: "var(--radius-sm, 0.375rem)",
			border: "1px solid rgba(255, 255, 255, 0.1)",
			boxShadow: "0 4px 16px rgb(0 0 0 / 40%)",
			backgroundColor: r.tooltipBackground ?? "#1d2330",
			color: r.tooltipColor ?? "#ffffff"
		},
		children: e
	});
}
function sn({ color: e }) {
	return /* @__PURE__ */ u("span", {
		"data-attr": "script-chart-tooltip-swatch",
		style: {
			display: "inline-block",
			flex: "none",
			width: "0.5rem",
			height: "0.5rem",
			borderRadius: "9999px",
			backgroundColor: e
		}
	});
}
//#endregion
//#region src/overlays/tooltipUtils.ts
function cn(e, t) {
	for (let n of e) if (n.yPixel != null && n.yPixelBottom != null) {
		let e = Math.min(n.yPixel, n.yPixelBottom), r = Math.max(n.yPixel, n.yPixelBottom);
		if (t >= e && t <= r) return n.series.key;
	}
	let n = null, r = Infinity;
	for (let i of e) {
		if (i.yPixel == null) continue;
		let e = Math.abs(i.yPixel - t);
		e < r && (r = e, n = i.series.key);
	}
	return n;
}
//#endregion
//#region src/overlays/DefaultTooltip.tsx
var ln = "14rem";
function un({ label: e, seriesData: t, hoverPosition: r, valueFormatter: a, labelFormatter: o, labelRenderer: l, showHeader: f = !0, showTotal: p, totalLabel: m = "Total", totalFormatter: h, sortedByValue: g, hideZeroRows: _, onRowClick: v, footer: y }) {
	let b = a ?? ((e) => e.toLocaleString()), x = _ ? t.filter((e) => e.value !== 0) : t, S = g ? [...x].sort((e, t) => t.value - e.value) : x[0]?.yPixel == null ? x : [...x].sort((e, t) => (e.yPixel ?? Infinity) - (t.yPixel ?? Infinity)), C = S.filter((e) => !e.series.overlay && e.series.visibility?.total !== !1), w = r != null && S.length > 1 ? cn(S, r.y) : null, T = p && C.length > 1, E = C.reduce((e, t) => e + t.value, 0), D = h ?? ((e) => b(e, C[0])), O = s(null), [k, A] = c(!1), [j, M] = c(!1), N = n(() => {
		let e = O.current;
		e && (A(e.scrollTop > 0), M(e.scrollTop + e.clientHeight < e.scrollHeight - 1));
	}, []);
	i(() => {
		N();
	}, [S, N]), i(() => {
		if (!w || !O.current) return;
		let e = O.current, t = e.querySelector("[data-closest=\"true\"]");
		if (!t) return;
		let n = e.getBoundingClientRect(), r = t.getBoundingClientRect(), i = r.top - n.top, a = r.bottom - n.top, o = e.clientHeight * .2;
		a > e.clientHeight - o ? e.scrollTop += a - (e.clientHeight - o) : i < o && (e.scrollTop += i - o);
	}, [w]);
	let P = (() => {
		if (k && j) return "linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)";
		if (k) return "linear-gradient(to bottom, transparent, black 20%)";
		if (j) return "linear-gradient(to bottom, black 80%, transparent)";
	})();
	return /* @__PURE__ */ d(on, { children: [
		f && /* @__PURE__ */ u("div", {
			"data-attr": "script-chart-tooltip-label",
			className: "font-semibold mb-1 opacity-60",
			children: o ? o(e) : e
		}),
		/* @__PURE__ */ u("div", {
			ref: O,
			onScroll: N,
			style: {
				maxHeight: ln,
				overflowY: "auto",
				scrollbarWidth: "none",
				scrollBehavior: "smooth",
				maskImage: P,
				WebkitMaskImage: P
			},
			children: S.map((e) => {
				let t = e.series.key === w, n = v ? " cursor-pointer hover:bg-current/10" : "", r = l ? l(e) : e.series.label;
				return /* @__PURE__ */ d("div", {
					"data-attr": "script-chart-tooltip-row",
					"data-closest": t ? "true" : void 0,
					className: `flex items-center gap-2 min-w-0 py-0.5 px-1.5 rounded transition-colors duration-150${t ? " font-semibold bg-current/[.1]" : ""}${n}`,
					onClick: v ? () => {
						window.getSelection()?.toString() || v(e);
					} : void 0,
					children: [
						/* @__PURE__ */ u(sn, { color: e.color }),
						/* @__PURE__ */ d("span", {
							className: "flex-1 min-w-0 overflow-hidden grid",
							children: [/* @__PURE__ */ u("span", {
								className: "font-semibold invisible truncate [grid-area:1/1]",
								"aria-hidden": "true",
								children: r
							}), /* @__PURE__ */ u("span", {
								"data-attr": "script-chart-tooltip-series",
								className: "truncate [grid-area:1/1]",
								children: r
							})]
						}),
						/* @__PURE__ */ u("strong", {
							"data-attr": "script-chart-tooltip-value",
							className: "tabular-nums",
							children: b(e.value, e)
						})
					]
				}, e.series.key);
			})
		}),
		T && /* @__PURE__ */ d("div", {
			"data-attr": "script-chart-tooltip-total",
			className: "flex items-center gap-2 mt-2 pt-1 border-t border-current/25",
			children: [/* @__PURE__ */ u("span", {
				className: "flex-1 opacity-60",
				children: m
			}), /* @__PURE__ */ u("strong", {
				"data-attr": "script-chart-tooltip-value",
				children: D(E)
			})]
		}),
		y && /* @__PURE__ */ u("div", {
			className: "mt-1 pt-1 border-t border-current/25 text-xs opacity-60 text-center",
			children: y
		})
	] });
}
//#endregion
//#region src/overlays/Tooltip.tsx
var dn = [
	T(12),
	w(),
	E({ padding: 8 })
], fn = 9999;
function pn({ context: e, renderTooltip: t, placement: n = "follow-data" }) {
	let { theme: r } = Z(), i = r.tooltipZIndex ?? fn, { left: s, top: c } = e.canvasBounds, l = n === "cursor" ? e.hoverPosition : null, d, f, p;
	l ? (d = s + l.x, f = c + l.y, p = 0) : n === "top" ? (d = s + e.position.x, f = c, p = e.position.width ?? 0) : (d = s + e.position.x, f = c + e.position.y, p = 0);
	let m = o(() => ({ getBoundingClientRect() {
		let e = d - p / 2, t = d + p / 2;
		return {
			x: e,
			y: f,
			width: p,
			height: 0,
			top: f,
			right: t,
			bottom: f,
			left: e
		};
	} }), [
		d,
		f,
		p
	]), { refs: h, floatingStyles: g } = D({
		placement: n === "follow-data" ? "right" : "right-start",
		strategy: "fixed",
		middleware: dn,
		whileElementsMounted: C
	});
	return a(() => {
		h.setPositionReference(m);
	}, [m, h]), /* @__PURE__ */ u(x, { children: /* @__PURE__ */ u("div", {
		ref: h.setFloating,
		"data-script-charts-tooltip": "",
		className: e.isPinned ? "script-charts-tooltip--pinned" : void 0,
		style: {
			...g,
			pointerEvents: e.isPinned ? "auto" : "none",
			width: "max-content",
			zIndex: i
		},
		children: t(e)
	}) });
}
//#endregion
//#region src/core/color-utils.ts
function mn(e, t) {
	return j(e)?.copy({ opacity: t }).toString() ?? e;
}
function hn(e, t) {
	let n = e.trim();
	if (!n.startsWith("var(") || typeof document > "u" || typeof getComputedStyle != "function") return e;
	let r = /^var\(\s*(--[^,)]+?)\s*(?:,\s*([\s\S]+))?\)$/.exec(n);
	if (!r) return e;
	let [, i, a] = r, o = t ?? document.body;
	return getComputedStyle(o).getPropertyValue(i).trim() || (a && a.trim() ? hn(a.trim(), o) : e);
}
function gn(e, t, n) {
	let r = M(e), i = M(t);
	if (Number.isNaN(r.r) || Number.isNaN(i.r)) return e;
	let a = Math.max(0, Math.min(1, n)), o = (e, t) => e + (t - e) * a;
	return M(o(r.r, i.r), o(r.g, i.g), o(r.b, i.b), o(r.opacity, i.opacity)).toString();
}
function _n(e, t) {
	return e.bars?.[t]?.color ?? e.color;
}
function vn(e, t, n) {
	let r = n ?? t.data;
	if (r.length === 0) return;
	let { ctx: i } = e;
	if (i.strokeStyle = t.color, i.lineWidth = 2, i.lineJoin = "round", i.lineCap = "round", yn(e, t, r)) {
		i.setLineDash([]);
		return;
	}
	for (let { start: n, end: a, pattern: o } of Sn(t, r.length)) i.beginPath(), i.setLineDash(o), Cn(e, r, n, a), i.stroke();
	i.setLineDash([]);
}
function yn(e, t, n) {
	let r = t.stroke?.partial?.fromFraction;
	if (r == null || n.length < 2) return !1;
	let { ctx: i, xScale: a, yScale: o, labels: s, yFloor: c, smooth: l } = e, u = n.length - 1, d = a(s[u - 1]), f = o(n[u - 1]), p = a(s[u]), m = o(n[u]);
	if (d == null || p == null || !isFinite(f) || !isFinite(m)) return !1;
	let h = c == null ? f : Math.min(f, c), g = c == null ? m : Math.min(m, c), _ = Math.max(0, Math.min(1, r));
	if (l) return xn(e, t, n, _), !0;
	let v = d + (p - d) * _, y = h + (g - h) * _;
	return i.beginPath(), i.setLineDash(t.stroke?.pattern ?? []), Cn(e, n, 0, u - 1), i.lineTo(v, y), i.stroke(), i.beginPath(), i.setLineDash(t.stroke?.partial?.pattern ?? [10, 10]), i.moveTo(v, y), i.lineTo(p, g), i.stroke(), !0;
}
function bn(e, t, n, r) {
	let i = (e, t) => e + (t - e) * r, a = i(e.x, t.cp1x), o = i(e.y, t.cp1y), s = i(t.cp1x, t.cp2x), c = i(t.cp1y, t.cp2y), l = i(t.cp2x, n.x), u = i(t.cp2y, n.y), d = i(a, s), f = i(o, c), p = i(s, l), m = i(c, u);
	return {
		x: i(d, p),
		y: i(f, m),
		firstCp1x: a,
		firstCp1y: o,
		firstCp2x: d,
		firstCp2y: f,
		secondCp1x: p,
		secondCp1y: m,
		secondCp2x: l,
		secondCp2y: u
	};
}
function xn(e, t, n, r) {
	let { ctx: i } = e, a = wn(e, n, 0, n.length - 1), o = a[a.length - 1], s = On(o), c = s[s.length - 1], l = bn(o[o.length - 2], c, o[o.length - 1], r);
	i.beginPath(), i.setLineDash(t.stroke?.pattern ?? []);
	for (let e = 0; e < a.length - 1; e++) i.moveTo(a[e][0].x, a[e][0].y), a[e].length > 1 && kn(i, a[e]);
	i.moveTo(o[0].x, o[0].y);
	for (let e = 0; e < s.length - 1; e++) i.bezierCurveTo(s[e].cp1x, s[e].cp1y, s[e].cp2x, s[e].cp2y, o[e + 1].x, o[e + 1].y);
	i.bezierCurveTo(l.firstCp1x, l.firstCp1y, l.firstCp2x, l.firstCp2y, l.x, l.y), i.stroke(), i.beginPath(), i.setLineDash(t.stroke?.partial?.pattern ?? [10, 10]), i.moveTo(l.x, l.y);
	let u = o[o.length - 1];
	i.bezierCurveTo(l.secondCp1x, l.secondCp1y, l.secondCp2x, l.secondCp2y, u.x, u.y), i.stroke();
}
function Sn(e, t) {
	let n = e.stroke?.pattern ?? [], r = e.stroke?.partial?.pattern ?? [10, 10], i = jn(e.stroke?.partial?.fromIndex, t), a = jn(e.stroke?.partial?.toIndex, t);
	if (i === null && a === null) return [{
		start: 0,
		end: t - 1,
		pattern: n
	}];
	if (i === 0 || a === t - 1 || i !== null && a !== null && a >= i - 1) return [{
		start: 0,
		end: t - 1,
		pattern: r
	}];
	let o = [];
	a !== null && o.push({
		start: 0,
		end: a,
		pattern: r
	});
	let s = a ?? 0, c = i === null ? t - 1 : i - 1;
	return s < c && o.push({
		start: s,
		end: c,
		pattern: n
	}), i !== null && o.push({
		start: i - 1,
		end: t - 1,
		pattern: r
	}), o;
}
function Cn(e, t, n, r) {
	let { ctx: i, xScale: a, yScale: o, labels: s, smooth: c, yFloor: l } = e;
	if (c) {
		Tn(e, t, n, r);
		return;
	}
	let u = !1;
	for (let e = n; e <= r; e++) {
		let n = a(s[e]), r = o(t[e]);
		if (n == null || !isFinite(r)) {
			u = !1;
			continue;
		}
		let c = l == null ? r : Math.min(r, l);
		u ? i.lineTo(n, c) : (i.moveTo(n, c), u = !0);
	}
}
function wn(e, t, n, r) {
	let { xScale: i, yScale: a, labels: o, yFloor: s } = e, c = [], l = [];
	for (let e = n; e <= r; e++) {
		let n = i(o[e]), r = a(t[e]);
		if (n == null || !isFinite(r)) {
			l.length > 0 && (c.push(l), l = []);
			continue;
		}
		l.push({
			x: n,
			y: s == null ? r : Math.min(r, s)
		});
	}
	return l.length > 0 && c.push(l), c;
}
function Tn(e, t, n, r) {
	let { ctx: i } = e;
	for (let a of wn(e, t, n, r)) i.moveTo(a[0].x, a[0].y), a.length > 1 && kn(i, a);
}
function En(e) {
	let t = e.length, n = Array(t - 1), r = Array(t - 1);
	for (let i = 0; i < t - 1; i++) n[i] = e[i + 1].x - e[i].x, r[i] = n[i] === 0 ? 0 : (e[i + 1].y - e[i].y) / n[i];
	let i = Array(t);
	if (t === 2) return i[0] = r[0], i[1] = r[0], i;
	for (let e = 1; e < t - 1; e++) {
		let t = r[e - 1], a = r[e];
		if (t * a <= 0) i[e] = 0;
		else {
			let r = (t * n[e] + a * n[e - 1]) / (n[e - 1] + n[e]);
			i[e] = (Math.sign(t) + Math.sign(a)) * Math.min(Math.abs(t), Math.abs(a), .5 * Math.abs(r));
		}
	}
	return i[0] = (3 * r[0] - i[1]) / 2, i[t - 1] = (3 * r[t - 2] - i[t - 2]) / 2, i;
}
var Dn = 1 / 4;
function On(e) {
	let t = En(e), n = [];
	for (let r = 0; r < e.length - 1; r++) {
		let i = (e[r + 1].x - e[r].x) * Dn;
		n.push({
			cp1x: e[r].x + i,
			cp1y: e[r].y + t[r] * i,
			cp2x: e[r + 1].x - i,
			cp2y: e[r + 1].y - t[r + 1] * i
		});
	}
	return n;
}
function kn(e, t) {
	let n = On(t);
	for (let r = 0; r < n.length; r++) e.bezierCurveTo(n[r].cp1x, n[r].cp1y, n[r].cp2x, n[r].cp2y, t[r + 1].x, t[r + 1].y);
}
function An(e, t) {
	let n = On(t);
	for (let r = n.length - 1; r >= 0; r--) e.bezierCurveTo(n[r].cp2x, n[r].cp2y, n[r].cp1x, n[r].cp1y, t[r].x, t[r].y);
}
function jn(e, t) {
	if (e == null || t === 0) return null;
	let n = Math.round(e);
	return Math.max(0, Math.min(t - 1, n));
}
var Mn = /* @__PURE__ */ new Map();
function Nn(e, t) {
	let n = Mn.get(t);
	if (n) return n;
	let r = document.createElement("canvas");
	r.width = 14, r.height = 14;
	let i = r.getContext("2d");
	if (!i) return t;
	i.strokeStyle = t, i.lineWidth = 4, i.beginPath(), i.moveTo(0, 14), i.lineTo(14, 0), i.stroke(), i.beginPath(), i.moveTo(-14 / 2, 14 / 2), i.lineTo(14 / 2, -14 / 2), i.stroke(), i.beginPath(), i.moveTo(14 / 2, 21), i.lineTo(21, 14 / 2), i.stroke();
	let a = e.createPattern(r, "repeat");
	return a ? (Mn.set(t, a), a) : t;
}
function Pn(e, t, n, r) {
	let { ctx: i, xScale: a, yScale: o, labels: s, dimensions: c, smooth: l, yFloor: u } = e, d = n ?? t.data, f = t.fill?.opacity ?? .5, p = c.plotTop + c.plotHeight, m = jn(t.stroke?.partial?.fromIndex, d.length), h = jn(t.stroke?.partial?.toIndex, d.length), g = [], _ = [], v = [], y = () => {
		_.length > 0 && (g.push({
			top: _,
			bottom: v
		}), _ = [], v = []);
	};
	for (let e = 0; e < d.length; e++) {
		let t = a(s[e]), n = o(d[e]);
		if (t == null || !isFinite(n)) {
			y();
			continue;
		}
		let i = u == null ? n : Math.min(n, u);
		if (r) {
			let n = r[e], a = n == null ? NaN : o(n);
			if (!isFinite(a)) {
				y();
				continue;
			}
			_.push({
				x: t,
				y: i,
				dataIndex: e
			}), v.push({
				x: t,
				y: a,
				dataIndex: e
			});
		} else _.push({
			x: t,
			y: i,
			dataIndex: e
		}), v.push({
			x: t,
			y: p,
			dataIndex: e
		});
	}
	y(), i.globalAlpha = f;
	let b = t.fill?.gradient && !r, x = null;
	b && (x = i.createLinearGradient(0, c.plotTop, 0, p), x.addColorStop(0, t.color), x.addColorStop(1, "transparent"));
	for (let { top: e, bottom: n } of g) {
		if (e.length < 2) continue;
		if (b || m === null && h === null) {
			i.fillStyle = x ?? t.color, Fn(i, e, n, l);
			continue;
		}
		let r = m === null ? -1 : e.findIndex((e) => e.dataIndex >= m), a = h === null ? -1 : e.findIndex((e) => e.dataIndex > h), o = h !== null && a === -1, s = m !== null && r === 0, c = Nn(i, t.color);
		if (o || s) {
			i.fillStyle = c, Fn(i, e, n, l);
			continue;
		}
		if (h !== null && a > 0) {
			let t = Math.min(e.length, a + 1);
			i.fillStyle = c, Fn(i, e.slice(0, t), n.slice(0, t), l);
		}
		let u = a === -1 ? 0 : a, d = r === -1 ? e.length : r;
		if (d - u >= 2 && (i.fillStyle = t.color, Fn(i, e.slice(u, d), n.slice(u, d), l)), m !== null && r > 0) {
			let t = Math.max(0, r - 1);
			i.fillStyle = c, Fn(i, e.slice(t), n.slice(t), l);
		}
	}
	i.globalAlpha = 1;
}
function Fn(e, t, n, r) {
	if (e.beginPath(), e.moveTo(t[0].x, t[0].y), r && t.length > 1) kn(e, t);
	else for (let n = 1; n < t.length; n++) e.lineTo(t[n].x, t[n].y);
	if (e.lineTo(n[n.length - 1].x, n[n.length - 1].y), r && n.length > 1) An(e, n);
	else for (let t = n.length - 2; t >= 0; t--) e.lineTo(n[t].x, n[t].y);
	e.closePath(), e.fill();
}
function In(e, t, n) {
	let { ctx: r, xScale: i, yScale: a, labels: o } = e, s = n ?? t.data, c = t.points?.radius ?? 0;
	if (!(c <= 0)) {
		r.fillStyle = t.color;
		for (let e = 0; e < s.length; e++) {
			let t = i(o[e]), n = a(s[e]);
			t == null || !isFinite(n) || (r.beginPath(), r.arc(t, n, c, 0, Math.PI * 2), r.fill());
		}
	}
}
function Q(e) {
	return Math.round(e) + .5;
}
function Ln(e) {
	return e.axisLineColor ?? e.axisColor ?? e.gridColor;
}
function Rn(e, t = {}) {
	let { ctx: n, dimensions: r } = e, { xLine: i = !0, yLine: a = !0 } = t;
	n.strokeStyle = t.axisColor ?? "rgba(0, 0, 0, 0.15)", n.lineWidth = 1, n.setLineDash([]);
	let o = Q(r.plotLeft), s = Q(r.plotTop + r.plotHeight), c = Q(r.plotLeft + r.plotWidth);
	a && (n.beginPath(), n.moveTo(o, r.plotTop), n.lineTo(o, s), n.stroke()), i && (n.beginPath(), n.moveTo(o, s), n.lineTo(c, s), n.stroke()), a && t.rightAxis && (n.beginPath(), n.moveTo(c, r.plotTop), n.lineTo(c, s), n.stroke());
}
function zn(e, t, n, r) {
	e.strokeStyle = r ?? "rgba(0, 0, 0, 0.15)", e.lineWidth = 1, e.setLineDash([]);
	let i = Q(t.plotTop + t.plotHeight);
	e.beginPath();
	for (let t of n.xs) {
		let n = Q(t);
		e.moveTo(n, i), e.lineTo(n, i + 4);
	}
	for (let { y: r, side: i, offset: a } of n.ys) {
		let n = Q(r);
		if (i === "left") {
			let r = Q(t.plotLeft - a);
			e.moveTo(r - 4, n), e.lineTo(r, n);
		} else {
			let r = Q(t.plotLeft + t.plotWidth + a);
			e.moveTo(r, n), e.lineTo(r + 4, n);
		}
	}
	e.stroke();
}
function Bn(e, t = {}) {
	let { ctx: n, yScale: r, dimensions: i } = e, a = t.gridColor ?? "rgba(0, 0, 0, 0.1)", o = t.orientation ?? "vertical", s = o === "horizontal" ? i.plotWidth : i.plotHeight, c = t.categoryTicks ?? [], l = r.ticks?.(we(s)) ?? [], u = t.frame ?? !0;
	if (n.strokeStyle = a, n.lineWidth = 1, n.setLineDash(t.gridDash ?? []), o === "horizontal") {
		for (let e of l) {
			let t = r(e);
			if (!u && t - i.plotLeft < 4) continue;
			let a = Q(t);
			n.beginPath(), n.moveTo(a, i.plotTop), n.lineTo(a, i.plotTop + i.plotHeight), n.stroke();
		}
		for (let e of c) {
			if (!isFinite(e) || e - i.plotTop < 4) continue;
			let t = Q(e);
			n.beginPath(), n.moveTo(i.plotLeft, t), n.lineTo(i.plotLeft + i.plotWidth, t), n.stroke();
		}
		if (n.setLineDash([]), u) {
			let e = Q(i.plotTop);
			n.beginPath(), n.moveTo(i.plotLeft, e), n.lineTo(i.plotLeft + i.plotWidth, e), n.stroke();
			let t = Q(i.plotTop + i.plotHeight);
			n.beginPath(), n.moveTo(i.plotLeft, t), n.lineTo(i.plotLeft + i.plotWidth, t), n.stroke();
		}
		return;
	}
	for (let e of l) {
		let t = r(e);
		if (!u && i.plotTop + i.plotHeight - t < 4) continue;
		let a = Q(t);
		n.beginPath(), n.moveTo(i.plotLeft, a), n.lineTo(i.plotLeft + i.plotWidth, a), n.stroke();
	}
	for (let e of c) {
		if (!isFinite(e) || e - i.plotLeft < 4) continue;
		let t = Q(e);
		n.beginPath(), n.moveTo(t, i.plotTop), n.lineTo(t, i.plotTop + i.plotHeight), n.stroke();
	}
	if (n.setLineDash([]), u) {
		let e = Q(i.plotLeft);
		n.beginPath(), n.moveTo(e, i.plotTop), n.lineTo(e, i.plotTop + i.plotHeight), n.stroke();
		let t = Q(i.plotLeft + i.plotWidth);
		n.beginPath(), n.moveTo(t, i.plotTop), n.lineTo(t, i.plotTop + i.plotHeight), n.stroke();
	}
}
function Vn(e, t, n, r, i = "vertical", a) {
	let o = Math.round(n) + .5;
	e.strokeStyle = r, e.lineWidth = 1, e.setLineDash(a ?? []), e.beginPath(), i === "vertical" ? (e.moveTo(o, t.plotTop), e.lineTo(o, t.plotTop + t.plotHeight)) : (e.moveTo(t.plotLeft, o), e.lineTo(t.plotLeft + t.plotWidth, o)), e.stroke(), e.setLineDash([]);
}
function Hn(e, t, n, r, i, a, o) {
	let s = Math.max(0, Math.min(a, Math.abs(r) / 2, Math.abs(i) / 2)), c = o.topLeft ? s : 0, l = o.topRight ? s : 0, u = o.bottomRight ? s : 0, d = o.bottomLeft ? s : 0;
	e.moveTo(t + c, n), e.lineTo(t + r - l, n), l > 0 && e.quadraticCurveTo(t + r, n, t + r, n + l), e.lineTo(t + r, n + i - u), u > 0 && e.quadraticCurveTo(t + r, n + i, t + r - u, n + i), e.lineTo(t + d, n + i), d > 0 && e.quadraticCurveTo(t, n + i, t, n + i - d), e.lineTo(t, n + c), c > 0 && e.quadraticCurveTo(t, n, t + c, n), e.closePath();
}
function Un(e, t, n, r = 8, i = !1) {
	let a = i ? Math.round(t.plotLeft) : 0, o = t.width - a;
	if (!(o > 0)) {
		n();
		return;
	}
	e.save(), e.beginPath(), e.rect(a, t.plotTop - r, o, t.plotHeight + r * 2), e.clip();
	try {
		n();
	} finally {
		e.restore();
	}
}
function Wn(e) {
	let { ctx: t, dimensions: n, labels: r, series: i, xScale: a, resolveYScale: o, smooth: s, yFloor: c, clipLeftEdge: l } = e, u = e.yValuesFor ?? (() => void 0), d = e.bottomFor ?? ((e) => e.fill?.lowerData), f = e.shouldFill ?? ((e) => !!e.fill), p = e.zOrder ?? "per-series", m = i.filter((e) => !e.visibility?.excluded), h = (e) => {
		f(e) && Pn({
			ctx: t,
			dimensions: n,
			labels: r,
			xScale: a,
			yScale: o(e),
			smooth: s,
			yFloor: c
		}, e, u(e), d(e));
	}, g = (e) => {
		if (e.fill?.lowerData) return;
		let i = {
			ctx: t,
			dimensions: n,
			labels: r,
			xScale: a,
			yScale: o(e),
			smooth: s,
			yFloor: c
		};
		vn(i, e, u(e)), In(i, e, u(e));
	};
	Un(t, n, () => {
		if (p === "areas-first") {
			for (let e of m) h(e);
			for (let e of m) g(e);
			return;
		}
		for (let e of m) h(e), g(e);
	}, void 0, l);
}
function Gn(e, t, n, r) {
	let i = !1;
	for (let a of t) {
		if (a.visibility?.excluded || a.fill?.lowerData || a.overlay) continue;
		let t = r(a);
		t && isFinite(t.x) && isFinite(t.y) && (rr(e, t.x, t.y, a.color, n), i = !0);
	}
	return i;
}
var Kn = .22, qn = .16;
function Jn(e, t, n, r) {
	if (r === "flat") return t;
	let i = gn(t, "#ffffff", Kn), a = gn(t, "#000000", qn);
	if (r === "gloss") {
		let r = n.x + n.width * .5, o = n.y + n.height * .12, s = Math.max(n.width, n.height) * .95, c = e.createRadialGradient(r, o, 0, r, o, s);
		return c.addColorStop(0, i), c.addColorStop(.45, t), c.addColorStop(1, a), c;
	}
	let o = e.createLinearGradient(n.x, n.y, n.x + n.width, n.y + n.height);
	return o.addColorStop(0, i), o.addColorStop(1, a), o;
}
function Yn(e, t, n, r = 4, i = "flat") {
	let { ctx: a } = e;
	if (n.length === 0) return;
	let o = t.data.length, s = jn(t.stroke?.partial?.fromIndex, o), c = jn(t.stroke?.partial?.toIndex, o);
	for (let e of n) {
		if (e.width <= 0 || e.height <= 0) continue;
		let n = s !== null && e.dataIndex >= s || c !== null && e.dataIndex <= c || !!t.bars?.[e.dataIndex]?.hatch, o = _n(t, e.dataIndex);
		a.fillStyle = n ? Nn(a, o) : Jn(a, o, e, i), a.beginPath(), Hn(a, e.x, e.y, e.width, e.height, r, e.corners), a.fill();
	}
}
var Xn = .14, Zn = .18, Qn = .2;
function $n(e, t, n) {
	for (let r of t) e.beginPath(), Hn(e, r.x, r.y, r.width, r.height, n, r.corners), e.fill();
}
function er(e, t, n) {
	let r = t.filter((e) => e.width > 0 && e.height > 0);
	if (r.length !== 0) {
		e.beginPath();
		for (let t of r) Hn(e, t.x, t.y, t.width, t.height, n, t.corners);
		e.clip();
	}
}
function tr(e, t, n, r) {
	let i = n.filter((e) => e.width > 0 && e.height > 0);
	if (i.length === 0) return;
	let { ctx: a } = e;
	a.save(), a.globalAlpha = Xn, a.fillStyle = t.color, $n(a, i, r), a.globalAlpha = Zn, a.fillStyle = Nn(a, t.color), $n(a, i, r), a.restore();
}
function nr(e, t, n, r = 4) {
	t.width <= 0 || t.height <= 0 || (e.fillStyle = n, e.beginPath(), Hn(e, t.x, t.y, t.width, t.height, r, t.corners), e.fill());
}
function rr(e, t, n, r, i, a = 4) {
	e.fillStyle = i, e.beginPath(), e.arc(t, n, a + 2, 0, Math.PI * 2), e.fill(), e.fillStyle = r, e.beginPath(), e.arc(t, n, a, 0, Math.PI * 2), e.fill();
}
function ir(e, t, n) {
	if (t.length === 0) return;
	let { color: r, fillColor: i, medianColor: a = r, meanFillColor: o = i, meanRadius: s = 3, lineWidth: c = 1.5, whiskerCapRatio: l = .6 } = n;
	e.lineWidth = c, e.strokeStyle = r, e.setLineDash([]), e.beginPath();
	for (let n of t) {
		let t = n.x + n.width / 2;
		n.whiskerTop < n.top && (e.moveTo(t, n.whiskerTop), e.lineTo(t, n.top)), n.whiskerBottom > n.bottom && (e.moveTo(t, n.bottom), e.lineTo(t, n.whiskerBottom));
	}
	e.stroke(), e.beginPath();
	for (let n of t) {
		let t = n.x + n.width / 2, r = n.width * l / 2;
		n.whiskerTop < n.top && (e.moveTo(t - r, n.whiskerTop), e.lineTo(t + r, n.whiskerTop)), n.whiskerBottom > n.bottom && (e.moveTo(t - r, n.whiskerBottom), e.lineTo(t + r, n.whiskerBottom));
	}
	e.stroke(), e.fillStyle = i;
	for (let n of t) {
		let t = Math.max(0, n.bottom - n.top);
		t > 0 && n.width > 0 && (e.fillRect(n.x, n.top, n.width, t), e.strokeRect(n.x, n.top, n.width, t));
	}
	e.strokeStyle = a, e.beginPath();
	for (let n of t) {
		let t = Math.max(n.top, Math.min(n.bottom, n.medianY));
		e.moveTo(n.x, t), e.lineTo(n.x + n.width, t);
	}
	e.stroke(), e.fillStyle = o, e.strokeStyle = r;
	for (let n of t) e.beginPath(), e.arc(n.mean.x, n.mean.y, s, 0, Math.PI * 2), e.fill(), e.stroke();
}
function ar(e, t, n) {
	let r = Math.max(0, t.bottom - t.top);
	t.width <= 0 || r <= 0 || (e.fillStyle = n, e.fillRect(t.x, t.top, t.width, r));
}
function or(e, t) {
	let { crosshairColor: n, crosshairDash: r, showCrosshair: i, axisOrientation: a = "vertical", labelToCoord: o } = t;
	return (t) => {
		if (i && n && t.hoverIndex >= 0) {
			let e = t.labels[t.hoverIndex], i = o ? o(e) : t.scales.x(e);
			i != null && isFinite(i) && Vn(t.ctx, t.dimensions, i, n, a, r);
		}
		return e()(t);
	};
}
var sr = "rgba(59, 130, 246, 0.15)", cr = "rgba(59, 130, 246, 0.5)", lr = 1;
function ur(e, t) {
	t.width <= 0 || t.height <= 0 || (e.fillStyle = sr, e.fillRect(t.x, t.y, t.width, t.height), e.strokeStyle = cr, e.lineWidth = lr, e.strokeRect(t.x + .5, t.y + .5, t.width - 1, t.height - 1));
}
function dr(e) {
	return (t) => {
		let n = e(t), r = t.dragRect;
		if (!r) return n;
		let i = Math.max(t.dimensions.plotLeft, Math.min(r.x0, r.x1)), a = Math.min(t.dimensions.plotLeft + t.dimensions.plotWidth, Math.max(r.x0, r.x1)), o = t.dimensions.plotTop + t.dimensions.plotHeight, { y0: s, y1: c } = r, l = s != null && c != null, u = l ? Math.max(t.dimensions.plotTop, Math.min(s, c)) : t.dimensions.plotTop, d = l ? Math.min(o, Math.max(s, c)) : o;
		return a <= i || d <= u || ur(t.ctx, {
			x: i,
			y: u,
			width: a - i,
			height: d - u
		}), n;
	};
}
//#endregion
//#region src/core/chart-shell.tsx
var fr = "relative w-full flex-1 min-h-0 overflow-hidden", pr = "absolute top-0 left-0", mr = "absolute top-0 left-0 pointer-events-none", hr = "absolute top-0 left-0 w-full h-full pointer-events-none";
function gr(e, t) {
	return o(() => e.map((e, n) => ({
		...e,
		color: e.color || t.colors[n % t.colors.length]
	})), [e, t.colors]);
}
function _r(e) {
	return n(() => e.current?.getBoundingClientRect() ?? null, [e]);
}
var vr = (e) => e.reduce((e, t) => e + +!t.visibility?.excluded, 0);
function yr(e, t) {
	return e ? "cursor-pointer" : t ? "cursor-crosshair" : "cursor-default";
}
function br({ wrapperRef: e, canvasRef: t, overlayCanvasRef: n, className: r, dataAttr: i, pointer: a, crosshair: o = !1, ariaLabel: s, handlers: c, showOverlay: l, children: f }) {
	return /* @__PURE__ */ d("div", {
		ref: e,
		className: [
			fr,
			yr(a, o),
			r
		].filter(Boolean).join(" "),
		"data-attr": i,
		onMouseDown: c.onMouseDown,
		onMouseMove: c.onMouseMove,
		onMouseLeave: c.onMouseLeave,
		onClick: c.onClick,
		children: [
			/* @__PURE__ */ u("canvas", {
				ref: t,
				role: "img",
				"aria-label": s,
				className: pr
			}),
			/* @__PURE__ */ u("canvas", {
				ref: n,
				"aria-hidden": "true",
				className: mr
			}),
			l && /* @__PURE__ */ u("div", {
				className: hr,
				children: f
			})
		]
	});
}
//#endregion
//#region src/core/canvas-size.ts
function xr(e, t) {
	return Math.round(e * t);
}
function Sr(e, t, n) {
	let r = xr(t.width, n), i = xr(t.height, n), a = !1;
	e.width !== r && (e.width = r, a = !0), e.height !== i && (e.height = i, a = !0);
	let o = `${t.width}px`, s = `${t.height}px`;
	return e.style.width !== o && (e.style.width = o), e.style.height !== s && (e.style.height = s), a;
}
function Cr(e) {
	return isFinite(e) && e > 0 ? e : 0;
}
function wr(e, t) {
	return {
		width: e.width,
		height: e.height,
		plotLeft: t.left,
		plotTop: t.top,
		plotWidth: Cr(e.width - t.left - t.right),
		plotHeight: Cr(e.height - t.top - t.bottom)
	};
}
function Tr(e, t) {
	return e.width === t.width && e.height === t.height && e.plotLeft === t.plotLeft && e.plotTop === t.plotTop && e.plotWidth === t.plotWidth && e.plotHeight === t.plotHeight;
}
//#endregion
//#region src/core/hooks/useLatest.ts
function $(e) {
	let t = s(e);
	return t.current = e, t;
}
//#endregion
//#region src/core/hooks/useChartCanvas.ts
function Er(e) {
	let { margins: t } = e, n = s(null), r = s(null), a = s(null), [o, l] = c(null), u = $(t), d = s(null);
	return i(() => {
		let e = a.current;
		if (!e) return;
		let t = (t = !1) => {
			let i = n.current, a = r.current;
			if (!i || !a) return;
			let o = i.getContext("2d"), s = a.getContext("2d");
			if (!o || !s) return;
			let c = e.getBoundingClientRect();
			d.current = c;
			let f = window.devicePixelRatio || 1, p = Sr(i, c, f), m = Sr(a, c, f), h = wr(c, u.current);
			l((e) => e && !t && !p && !m && e.ctx === o && e.overlayCtx === s && Tr(e.dimensions, h) ? e : {
				ctx: o,
				overlayCtx: s,
				dimensions: h
			});
		};
		t();
		let i = new ResizeObserver(() => {
			t();
		});
		i.observe(e);
		let o = () => t(!0), s = [n.current, r.current].filter((e) => !!e);
		return s.forEach((e) => e.addEventListener("contextrestored", o)), () => {
			i.disconnect(), s.forEach((e) => e.removeEventListener("contextrestored", o));
		};
	}, []), i(() => {
		let e = d.current;
		e && l((n) => {
			if (!n) return n;
			let r = wr(e, t);
			return Tr(n.dimensions, r) ? n : {
				...n,
				dimensions: r
			};
		});
	}, [
		t.left,
		t.right,
		t.top,
		t.bottom,
		t
	]), {
		canvasRef: n,
		overlayCanvasRef: r,
		wrapperRef: a,
		dimensions: o?.dimensions ?? null,
		ctx: o?.ctx ?? null,
		overlayCtx: o?.overlayCtx ?? null
	};
}
//#endregion
//#region src/core/hooks/clearCanvas.ts
function Dr(e, t) {
	let n = t.width > 0 ? e.canvas.width / t.width : window.devicePixelRatio || 1;
	e.save(), e.setTransform(n, 0, 0, n, 0, 0), e.clearRect(0, 0, t.width, t.height);
}
//#endregion
//#region src/core/time.ts
function Or() {
	return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
//#endregion
//#region src/core/hooks/useHoverAnimation.ts
function kr({ overlayCtx: e, dimensions: t, scales: n, series: r, labels: a, hoverIndex: o, hoverPosition: c, theme: l, dragRect: u = null, drawHover: d, hoverAnimationMs: f }) {
	let p = s(null), m = s({
		idx: -1,
		startTime: 0
	}), h = s(!1), g = $(d), _ = $(c), v = $(r), y = $(a), b = $(l), x = $(u);
	i(() => {
		if (p.current != null && (cancelAnimationFrame(p.current), p.current = null), !e || !t || !n || b.current.skipDraw) return;
		o !== m.current.idx && (m.current.idx = o, m.current.startTime = Or(), h.current = !1);
		let r = () => (m.current.startTime = Or(), 0), i = () => {
			h.current || (m.current.startTime = Or());
			let a = Or() - m.current.startTime, s = f > 0 ? Math.min(1, a / f) : 1;
			Dr(e, t);
			let c;
			try {
				c = g.current({
					ctx: e,
					dimensions: t,
					scales: n,
					series: v.current,
					labels: y.current,
					hoverIndex: o,
					hoverPosition: _.current,
					theme: b.current,
					hoverProgress: s,
					resetHoverFade: r,
					dragRect: x.current
				});
			} finally {
				e.restore();
			}
			h.current = c;
			let l = Or() - m.current.startTime, u = f > 0 ? Math.min(1, l / f) : 1;
			c && u < 1 && o >= 0 ? p.current = requestAnimationFrame(i) : p.current = null;
		};
		return p.current = requestAnimationFrame(i), () => {
			p.current != null && (cancelAnimationFrame(p.current), p.current = null);
		};
	}, [
		e,
		t,
		n,
		o,
		c,
		f,
		u
	]);
}
//#endregion
//#region src/core/hooks/useChartDraw.ts
function Ar({ ctx: e, overlayCtx: t, dimensions: n, scales: r, series: a, labels: o, hoverIndex: c, hoverPosition: l, theme: u, dragRect: d = null, drawStatic: f, drawHover: p, hoverAnimationMs: m = 0 }) {
	let h = s(null);
	i(() => {
		if (h.current != null && (cancelAnimationFrame(h.current), h.current = null), !(!e || !n || !r || u.skipDraw)) return h.current = requestAnimationFrame(() => {
			h.current = null, Dr(e, n);
			try {
				f({
					ctx: e,
					dimensions: n,
					scales: r,
					series: a,
					labels: o,
					hoverIndex: -1,
					hoverPosition: null,
					theme: u,
					hoverProgress: 1,
					resetHoverFade: () => 1
				});
			} finally {
				e.restore();
			}
		}), () => {
			h.current != null && (cancelAnimationFrame(h.current), h.current = null);
		};
	}, [
		e,
		n,
		r,
		a,
		o,
		u,
		f
	]), kr({
		overlayCtx: t,
		dimensions: n,
		scales: r,
		series: a,
		labels: o,
		hoverIndex: c,
		hoverPosition: l,
		theme: u,
		dragRect: d,
		drawHover: p,
		hoverAnimationMs: m
	});
}
//#endregion
//#region src/core/interaction.ts
var jr = N((e) => e.x).center;
function Mr(e, t) {
	let n = [];
	for (let r = 0; r < e.length; r++) {
		let i = t(e[r]);
		i != null && isFinite(i) && n.push({
			x: i,
			index: r
		});
	}
	return n;
}
function Nr(e, t) {
	if (t.length === 0) return -1;
	let n = jr(t, e);
	return t[Math.max(0, Math.min(n, t.length - 1))].index;
}
function Pr(e, t, n) {
	return e >= n.plotLeft && e <= n.plotLeft + n.plotWidth && t >= n.plotTop && t <= n.plotTop + n.plotHeight;
}
var Fr = 8;
function Ir(e, t) {
	if (t.length === 0) return null;
	let n = Math.min(e.x0, e.x1), r = Math.max(e.x0, e.x1), i = Nr(n, t), a = Nr(r, t);
	if (i < 0 || a < 0 || i === a && r - n < Fr) return null;
	let [o, s] = i < a ? [i, a] : [a, i];
	return {
		startIndex: o,
		endIndex: s
	};
}
function Lr(e, t, n, r, i, a, o, s, c = "x", l = null, u = o, d, f, p) {
	if (e < 0 || e >= n.length) return null;
	let m = n[e], h = r(m);
	if (h == null) return null;
	let g = [], _ = [];
	for (let n of t) {
		if (n.visibility?.excluded) continue;
		let t = n.data[e], r = s?.[n.yAxisId ?? "left"]?.scale ?? i, a = r(u(n, e));
		if (isFinite(a) && _.push(a), n.visibility?.tooltip !== !1 && t != null && isFinite(t)) {
			let t = n.bars?.[e], i = t ? {
				...n,
				meta: t.meta ?? n.meta,
				label: t.label ?? n.label
			} : n, s = o(n, e), c = d && isFinite(a) ? (() => {
				let t = r(d(n, e));
				return isFinite(t) ? t : void 0;
			})() : void 0;
			g.push({
				series: i,
				value: s,
				color: _n(n, e),
				yPixel: isFinite(a) ? a : void 0,
				yPixelBottom: c
			});
		}
	}
	let v = 0;
	_.length > 0 && (v = c === "y" ? Math.max(..._) : Math.min(..._));
	let y = p ? p.x + p.width / 2 : h, b = c === "y" ? {
		x: v,
		y
	} : {
		x: y,
		y: v
	}, x = p?.width ?? f;
	return x != null && x > 0 && (b.width = x), {
		dataIndex: e,
		label: m,
		seriesData: g,
		position: b,
		hoverPosition: l,
		canvasBounds: a,
		isPinned: !1
	};
}
function Rr(e, t, n, r, i) {
	if (e < 0 || e >= n.length) return null;
	let a = t.filter((e) => !e.visibility?.excluded);
	if (a.length === 0) return null;
	let o = a[0];
	return {
		seriesIndex: t.indexOf(o),
		dataIndex: e,
		series: o,
		value: r(o, e),
		label: n[e],
		crossSeriesData: a.map((t) => ({
			series: t,
			value: r(t, e)
		})),
		cursor: i
	};
}
//#endregion
//#region src/core/hooks/useDragToZoom.ts
var zr = 4;
function Br({ onDateRangeZoom: e, onAreaSelect: t, scales: r, dimensions: a, labels: o, labelPositions: l, wrapperRef: u, interactionAxis: d = "x", onDragActivate: f }) {
	let [p, m] = c(null), h = s(null), g = s(!1), _ = s(null), v = $(o), y = $(l), b = $(e), x = $(t), S = $(f), C = !!t, w = n((e, t) => {
		let n = h.current;
		if (n) {
			if (n.active) {
				let r = Ir({
					x0: n.x,
					x1: e
				}, y.current);
				if (r) {
					let e = v.current, i = {
						startLabel: e[r.startIndex],
						endLabel: e[r.endIndex],
						startIndex: r.startIndex,
						endIndex: r.endIndex
					};
					x.current ? x.current({
						...i,
						yPixel0: Math.min(n.y, t),
						yPixel1: Math.max(n.y, t)
					}) : b.current && b.current(i);
				}
				g.current = !0, _.current && clearTimeout(_.current), _.current = setTimeout(() => {
					g.current = !1, _.current = null;
				}, 0);
			}
			h.current = null, m(null);
		}
	}, [
		y,
		v,
		b,
		x
	]), T = (!!e || !!t) && d === "x";
	return i(() => {
		if (!T) return;
		let e = (e) => {
			if (!h.current) return;
			let t = u.current?.getBoundingClientRect(), n = t ? e.clientX - t.left : 0, r = t ? e.clientY - t.top : 0;
			w(n, r);
		};
		return window.addEventListener("mouseup", e), () => window.removeEventListener("mouseup", e);
	}, [
		T,
		u,
		w
	]), i(() => () => {
		_.current && clearTimeout(_.current);
	}, []), {
		dragRect: p,
		onMouseDown: n((e) => {
			if (!T || !r || !a || e.button !== 0) return;
			let t = e.currentTarget.getBoundingClientRect(), n = e.clientX - t.left, i = e.clientY - t.top;
			Pr(n, i, a) && (h.current = {
				x: n,
				y: i,
				active: !1
			});
		}, [
			T,
			r,
			a
		]),
		handleMouseMove: n((e, t) => {
			let n = h.current;
			return n ? (!n.active && Math.hypot(e - n.x, t - n.y) >= zr && (n.active = !0, S.current()), n.active ? (m(C ? {
				x0: n.x,
				x1: e,
				y0: n.y,
				y1: t
			} : {
				x0: n.x,
				x1: e
			}), !0) : !1) : !1;
		}, [S, C]),
		shouldSwallowClick: n(() => g.current ? (g.current = !1, !0) : !1, [])
	};
}
//#endregion
//#region src/core/hooks/useTooltipLifecycle.ts
function Vr(e, t) {
	if (e.dataIndex !== t.dataIndex || e.label !== t.label || e.position.x !== t.position.x || e.position.y !== t.position.y || e.seriesData.length !== t.seriesData.length) return !1;
	for (let n = 0; n < e.seriesData.length; n++) {
		let r = e.seriesData[n], i = t.seriesData[n];
		if (r.value !== i.value || r.color !== i.color || r.fraction !== i.fraction || r.series.key !== i.series.key || r.series.label !== i.series.label) return !1;
	}
	return !0;
}
function Hr({ wrapperRef: e, rebuildPinnedCtx: t, rebuildDeps: r }) {
	let [a, o] = c(-1), [s, l] = c(null), [u, d] = c(null), f = n((e, t) => {
		o(e), l(t);
	}, []), p = n(() => {
		o(-1), l(null), d(null);
	}, []), m = n(() => {
		d((e) => e?.isPinned ? null : e);
	}, []), h = u?.isPinned ?? !1, g = n(() => {
		d((e) => e && !e.isPinned ? {
			...e,
			isPinned: !0,
			onUnpin: m
		} : e);
	}, [m]);
	i(() => {
		h && d((e) => {
			if (!e || !e.isPinned) return e;
			let n = t(e);
			return n ? Vr(e, n) ? e : {
				...n,
				isPinned: !0,
				onUnpin: m
			} : null;
		});
	}, r);
	let _ = u !== null;
	return i(() => {
		if (!_) return;
		let t = (t) => {
			let n = t.target;
			n instanceof Element && (n.closest("[data-script-charts-tooltip]") || e.current?.contains(n)) || p();
		};
		return window.addEventListener("scroll", t, {
			passive: !0,
			capture: !0
		}), () => {
			window.removeEventListener("scroll", t, !0);
		};
	}, [
		_,
		e,
		p
	]), i(() => {
		if (!h) return;
		let t = (t) => {
			let n = t.target;
			if (n instanceof Element && n.closest("[data-script-charts-tooltip]")) return;
			let r = e.current;
			r && !r.contains(n) && p();
		}, n = (e) => {
			e.key === "Escape" && p();
		}, r = setTimeout(() => {
			document.addEventListener("pointerdown", t, { passive: !0 });
		}, 0);
		return document.addEventListener("keydown", n, { passive: !0 }), () => {
			clearTimeout(r), document.removeEventListener("pointerdown", t), document.removeEventListener("keydown", n);
		};
	}, [
		h,
		e,
		p
	]), {
		hoverIndex: a,
		hoverPosition: s,
		tooltipCtx: u,
		setHover: f,
		setTooltipCtx: d,
		isPinned: h,
		clearTooltip: p,
		unpin: m,
		pin: g
	};
}
//#endregion
//#region src/core/hooks/useChartInteraction.ts
function Ur(e) {
	return e.target instanceof Element && !!e.target.closest("[data-script-charts-tooltip]");
}
function Wr(e, t, n, r, i, a) {
	let o = i === "y" ? a.x : a.y, s = cn(r.seriesData, o), c = s ? r.seriesData.find((e) => e.series.key === s) : void 0;
	return c ? {
		seriesIndex: t.findIndex((e) => e.key === c.series.key),
		dataIndex: e,
		series: c.series,
		value: c.value,
		label: n[e],
		crossSeriesData: r.seriesData.map((e) => ({
			series: e.series,
			value: e.value
		})),
		cursor: a
	} : null;
}
function Gr({ scales: e, dimensions: t, labels: r, series: i, canvasRef: a, wrapperRef: s, showTooltip: c, pinnable: l, resolveClickToNearestSeries: u = !1, onPointClick: d, onDateRangeZoom: f, onAreaSelect: p, resolveValue: m = he, resolvePositionValue: h, resolveBottomValue: g, interactionAxis: _ = "x", labelToCoord: v, wrapClickData: y, resolveHoverIndex: b }) {
	let x = h ?? m, S = $(m), C = $(x), w = $(g), { hoverIndex: T, hoverPosition: E, tooltipCtx: D, setHover: O, setTooltipCtx: k, isPinned: A, clearTooltip: j, pin: M } = Hr({
		wrapperRef: s,
		rebuildPinnedCtx: n((n) => {
			if (!e || !t) return n;
			if (n.dataIndex >= r.length) return null;
			let o = a.current?.getBoundingClientRect() ?? new DOMRect();
			return Lr(n.dataIndex, i, r, v ?? e.x, e.y, o, S.current, e.yAxes, _, n.hoverPosition, C.current, w.current, e.extent?.(r[n.dataIndex]), n.hoverPosition ? e.bandSlotAtCursor?.(r[n.dataIndex], n.hoverPosition) : void 0);
		}, [
			e,
			t,
			r,
			i,
			a,
			v,
			_,
			S,
			C,
			w
		]),
		rebuildDeps: [
			i,
			r,
			e,
			t
		]
	}), N = $(T), P = $(E), F = o(() => e ? Mr(r, v ?? e.x) : [], [
		r,
		e,
		v
	]), { dragRect: I, onMouseDown: L, handleMouseMove: R, shouldSwallowClick: z } = Br({
		onDateRangeZoom: f,
		onAreaSelect: o(() => p && e ? (t) => p(t, e) : void 0, [p, e]),
		scales: e,
		dimensions: t,
		labels: r,
		labelPositions: F,
		wrapperRef: s,
		interactionAxis: _,
		onDragActivate: j
	}), B = n((n) => {
		if (!e || !t) return;
		let o = n.currentTarget.getBoundingClientRect(), s = n.clientX - o.left, l = n.clientY - o.top;
		if (R(s, l) || A) return;
		if (!Pr(s, l, t)) {
			j();
			return;
		}
		let u = Nr(_ === "y" ? l : s, F), d = u >= 0 && b ? b(u, {
			x: s,
			y: l
		}, e) : u;
		if (d < 0) {
			j();
			return;
		}
		if (O(d, {
			x: s,
			y: l
		}), c) {
			let t = a.current?.getBoundingClientRect() ?? new DOMRect();
			k(Lr(d, i, r, v ?? e.x, e.y, t, m, e.yAxes, _, {
				x: s,
				y: l
			}, x, g, e.extent?.(r[d]), e.bandSlotAtCursor?.(r[d], {
				x: s,
				y: l
			})));
		}
	}, [
		e,
		t,
		r,
		i,
		c,
		m,
		x,
		a,
		A,
		j,
		R,
		F,
		v,
		_,
		O,
		k,
		g,
		b
	]), V = n(() => {
		A || j();
	}, [A, j]), H = n((t) => {
		if (Ur(t) || z()) return;
		let n = N.current;
		if (!(n < 0)) {
			if (A) {
				j();
				return;
			}
			if (l && D && D.seriesData.length > 1) {
				if (u && d && P.current) {
					let t = Wr(n, i, r, D, _, P.current);
					if (t) {
						d(y && e ? y(t, e) : t);
						return;
					}
				}
				M();
				return;
			}
			if (d) {
				let t = Rr(n, i, r, m, P.current);
				t && d(y && e ? y(t, e) : t);
			}
		}
	}, [
		d,
		i,
		r,
		m,
		l,
		u,
		_,
		D,
		A,
		j,
		M,
		z,
		N,
		P,
		y,
		e
	]), ee = n((e) => {
		Ur(e) || L(e);
	}, [L]);
	return {
		hoverIndex: T,
		hoverPosition: E,
		tooltipCtx: D,
		dragRect: I,
		handlers: o(() => ({
			onMouseDown: ee,
			onMouseMove: B,
			onMouseLeave: V,
			onClick: H
		}), [
			ee,
			B,
			V,
			H
		])
	};
}
//#endregion
//#region src/core/hooks/useResolvedYFormatters.ts
function Kr(e, t) {
	return o(() => t ?? Ke(e?.yTicks() ?? []), [t, e]);
}
//#endregion
//#region src/core/hooks/useStableResolveValue.ts
function qr(e) {
	let t = $(e);
	return n((e, n) => (t.current ?? he)(e, n), [t]);
}
//#endregion
//#region src/core/hooks/useYAxisMaps.ts
function Jr(e, t) {
	return o(() => {
		if (!e) {
			let e = yt(t), n = {};
			return e && (n[X] = e), { titles: n };
		}
		let n = {}, r = {}, i = {}, a = {};
		for (let t of e) {
			t.tickFormatter && (n[t.id] = t.tickFormatter), r[t.id] = t.position;
			let e = yt(t.label);
			e && (i[t.id] = e), t.hide && (a[t.id] = !0);
		}
		return {
			formatters: Object.keys(n).length > 0 ? n : void 0,
			positions: r,
			titles: i,
			hidden: Object.keys(a).length > 0 ? a : void 0
		};
	}, [e, t]);
}
//#endregion
//#region src/core/Chart.tsx
var Yr = "rgba(0, 0, 0, 0.5)", Xr = 150;
function Zr(e) {
	return e === !0 ? Xr : typeof e == "number" ? e : 0;
}
function Qr({ series: e, labels: t, config: n, theme: r, createScales: i, drawStatic: a, drawHover: s, tooltip: c, onPointClick: l, onDateRangeZoom: f, onAreaSelect: p, className: m, dataAttr: h, children: g, resolveValue: _, resolvePositionValue: v, resolveBottomValue: y, labelToCoord: b, valueRangeSeries: x, wrapClickData: S, resolveHoverIndex: C }) {
	let { xTickFormatter: w, yTickFormatter: T, hideXAxis: E = !1, hideYAxis: D = !1, xAxisLabel: O, yAxisLabel: k, tooltip: A, showCrosshair: j = !1, showTickMarks: M = !1, axisOrientation: N = "vertical", isPercent: P = !1, animateHover: F, margins: I, maxCategoryLabelWidth: L, yAxes: R } = n ?? {}, { formatters: z, positions: B, titles: V, hidden: H } = Jr(R, k), ee = Zr(F), U = N === "horizontal" ? "y" : "x", { enabled: W = !0, pinnable: G = !1, resolveClickToNearestSeries: te = !1, placement: K = "follow-data", valueFormatter: q, labelFormatter: ne, showTotal: J, totalLabel: re, totalFormatter: ie, sortedByValue: ae } = A ?? {}, oe = o(() => c ?? ((e) => /* @__PURE__ */ u(un, {
		...e,
		valueFormatter: q,
		labelFormatter: ne,
		showTotal: J,
		totalLabel: re,
		totalFormatter: ie,
		sortedByValue: ae
	})), [
		c,
		q,
		ne,
		J,
		re,
		ie,
		ae
	]), { canvasRef: se, overlayCanvasRef: ce, wrapperRef: le, dimensions: Y, ctx: ue, overlayCtx: de } = Er({ margins: At({
		series: e,
		labels: t,
		hideXAxis: E,
		hideYAxis: D,
		xAxisLabel: O,
		xTickFormatter: w,
		yTickFormatter: T,
		axisOrientation: N,
		override: I,
		valueRangeSeries: x,
		maxCategoryLabelWidth: L,
		yAxisFormatters: z,
		yAxisPositions: B,
		yAxisTitles: V,
		yAxisHidden: H
	}) }), fe = gr(e, r), X = o(() => Y ? i(fe, t, Y) : null, [
		fe,
		t,
		Y,
		i
	]), pe = Kr(X, T), me = o(() => !X || D || N === "horizontal" ? [] : Mt(X, {
		yTicks: X.yTicks(),
		yTickFormatter: pe,
		userYTickFormatter: T,
		yAxisFormatters: z,
		titles: V,
		hiddenAxes: H
	}), [
		X,
		D,
		N,
		pe,
		T,
		z,
		V,
		H
	]), he = o(() => {
		if (!M || !X || !Y) return null;
		if (N === "horizontal") {
			let e = b ?? X.x, n = D ? [] : t.filter((e, t) => !w || w(e, t) !== null).map((t) => e(t)).filter((e) => e != null && isFinite(e)).map((e) => ({
				y: e,
				side: "left",
				offset: 0
			}));
			return {
				xs: E ? [] : zt(X.yTicks(), X.y, pe).map((e) => e.x),
				ys: n
			};
		}
		return {
			xs: E ? [] : Rt(t, X.x, w, L).map((e) => e.x),
			ys: me.flatMap((e) => Vt(e.ticks, e.scale).map((t) => e.scale(t)).filter((e) => isFinite(e)).map((t) => ({
				y: t,
				side: e.side,
				offset: e.offset
			})))
		};
	}, [
		M,
		X,
		Y,
		N,
		t,
		w,
		L,
		me,
		E,
		D,
		pe,
		b
	]), ge = o(() => {
		if (!he) return a;
		let e = Ln(r);
		return (t) => {
			a(t), zn(t.ctx, t.dimensions, he, e);
		};
	}, [
		a,
		he,
		r
	]), { hoverIndex: _e, hoverPosition: ve, tooltipCtx: ye, dragRect: be, handlers: xe } = Gr({
		scales: X,
		dimensions: Y,
		labels: t,
		series: fe,
		canvasRef: se,
		wrapperRef: le,
		showTooltip: W,
		pinnable: G,
		resolveClickToNearestSeries: te,
		onPointClick: l,
		onDateRangeZoom: f,
		onAreaSelect: p,
		resolveValue: _,
		resolvePositionValue: v,
		resolveBottomValue: y,
		interactionAxis: U,
		labelToCoord: b,
		wrapClickData: S,
		resolveHoverIndex: C
	}), Se = $(s);
	Ar({
		ctx: ue,
		overlayCtx: de,
		dimensions: Y,
		scales: X,
		series: fe,
		labels: t,
		hoverIndex: _e,
		hoverPosition: ve,
		theme: r,
		dragRect: be,
		drawStatic: ge,
		drawHover: o(() => dr(or(() => Se.current, {
			crosshairColor: r.crosshairColor,
			crosshairDash: r.crosshairDashPattern,
			showCrosshair: j,
			axisOrientation: N,
			labelToCoord: b
		})), [
			j,
			r.crosshairColor,
			r.crosshairDashPattern,
			N,
			b,
			Se.current
		]),
		hoverAnimationMs: ee
	});
	let Ce = o(() => {
		let e = [`Chart with ${vr(fe)} data series`], t = yt(O), n = yt(k);
		return !E && t && e.push(`X-axis: ${t}`), !D && n && e.push(`Y-axis: ${n}`), e.join(". ");
	}, [
		fe,
		E,
		D,
		O,
		k
	]), we = _r(se), Te = qr(v ?? _), Ee = o(() => ({
		orientation: N,
		xTickFormatter: w,
		isPercent: P
	}), [
		N,
		w,
		P
	]), De = r.axisColor ?? Yr, Oe = o(() => !X || !Y ? null : {
		scales: X,
		dimensions: Y,
		labels: t,
		series: fe,
		theme: r,
		resolvePositionValue: Te,
		canvasBounds: we,
		axis: Ee,
		yGutters: me
	}, [
		X,
		Y,
		t,
		fe,
		r,
		Te,
		we,
		Ee,
		me
	]), ke = o(() => ({ hoverIndex: _e }), [_e]);
	return /* @__PURE__ */ u(ct.Provider, {
		value: Oe,
		children: /* @__PURE__ */ u(lt.Provider, {
			value: ke,
			children: /* @__PURE__ */ d(br, {
				wrapperRef: le,
				canvasRef: se,
				overlayCanvasRef: ce,
				className: m,
				dataAttr: h,
				pointer: _e >= 0 && !!l,
				crosshair: !!f || !!p,
				ariaLabel: Ce,
				handlers: xe,
				showOverlay: !!(Y && X),
				children: [
					/* @__PURE__ */ u(Jt, {
						xTickFormatter: w,
						yTickFormatter: pe,
						hideXAxis: E,
						hideYAxis: D,
						axisColor: De,
						orientation: N,
						labelToCoord: b,
						maxCategoryLabelWidth: L
					}),
					/* @__PURE__ */ u(nn, {
						xAxisLabel: O,
						yAxisLabel: k,
						hideXAxis: E,
						hideYAxis: D,
						orientation: N,
						axisColor: De
					}),
					g,
					ye && W && /* @__PURE__ */ u(pn, {
						context: ye,
						renderTooltip: oe,
						placement: K
					})
				]
			})
		})
	});
}
//#endregion
//#region src/core/ChartErrorBoundary.tsx
var $r = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	width: "100%",
	height: "100%",
	minHeight: 100,
	color: "#666",
	fontSize: 13
}, ei = class extends e.Component {
	state = { hasError: !1 };
	static getDerivedStateFromError() {
		return { hasError: !0 };
	}
	componentDidCatch(e, t) {
		console.error("[script-charts] render error:", e, t.componentStack), this.props.onError?.(e, t);
	}
	render() {
		return this.state.hasError ? this.props.fallback ?? /* @__PURE__ */ u("div", {
			style: $r,
			children: "Something went wrong rendering this chart"
		}) : this.props.children;
	}
};
//#endregion
//#region src/charts/BarChart/utils/bars-under-cursor.ts
function ti(e) {
	return e !== "grouped";
}
function ni(e, t, n) {
	return n ? t.y >= e.y && t.y < e.y + e.height : t.x >= e.x && t.x < e.x + e.width;
}
function ri(e, t) {
	return t.x >= e.x && t.x < e.x + e.width && t.y >= e.y && t.y < e.y + e.height;
}
function ii(e, t, n) {
	return n ? t.x < e.x || t.x > e.x + e.width : t.y < e.y || t.y > e.y + e.height;
}
function ai(e, t, n, r, i) {
	let a = e.trackData?.[t.dataIndex];
	if (a == null) return !1;
	let o = n.value(a);
	if (!isFinite(o)) return !1;
	let [s = 0] = n.value.range();
	return !ri(at(t, s, o, i), r);
}
function* oi(e) {
	let { series: t, label: n, dataIndex: r, scales: i, layout: a, isHorizontal: o, stackedData: s, topStackedKeyByAxis: c } = e, l = [];
	for (let e of t) {
		if (e.visibility?.excluded) continue;
		let t = s?.get(e.key), u = e.yAxisId ?? "left", d = it({
			series: e,
			label: n,
			dataIndex: r,
			scales: i,
			layout: a,
			isHorizontal: o,
			stackedBand: t,
			isTopOfStack: c.get(u) === e.key
		});
		d && l.push({
			series: e,
			bar: d
		});
	}
	$e(l.map((e) => ({
		bar: e.bar,
		yAxisId: e.series.yAxisId
	})), i, o, a), yield* l;
}
function si(e) {
	let { cursor: t, isHorizontal: n, scales: r } = e, i = !1;
	for (let { series: a, bar: o } of oi(e)) if (ni(o, t, n)) {
		if (!ii(o, t, n)) return !1;
		ai(a, o, r, t, n) && (i = !0);
	}
	return i;
}
function ci(e) {
	let { cursor: t, isHorizontal: n } = e, r = /* @__PURE__ */ new Set(), i = null;
	for (let { series: a, bar: o } of oi(e)) ni(o, t, n) && r.add(a.key), i == null && ri(o, t) && (i = a.key);
	return {
		hits: r,
		strictHit: i
	};
}
function li(e, t, n) {
	let { band: r, group: i } = e, a = r(t), o = i?.domain();
	if (!i || a == null || !o?.length) return;
	let s = i.step(), c = (i(o[0]) ?? 0) + i.bandwidth() / 2, l = Math.round((n - a - c) / s);
	return Ve(e, t, o[Math.max(0, Math.min(o.length - 1, l))]);
}
function ui(e, t) {
	return t ? e.x : e.y + e.height;
}
function di(e) {
	let { labels: t, hoveredLabel: n, cursor: r, isHorizontal: i } = e, a = null, o = [];
	for (let s = 0; s < t.length; s++) if (t[s] === n) for (let { series: n, bar: c } of oi({
		...e,
		label: t[s],
		dataIndex: s
	})) {
		let e = i ? c.width : c.height;
		if (e <= 0) continue;
		let t = ui(c, i);
		o.push({
			extent: e,
			baseline: t
		}), ri(c, r) && (a = {
			series: n,
			bar: c,
			dataIndex: s,
			extent: e,
			baseline: t
		});
	}
	if (!a) return null;
	let s = o.reduce((e, t) => Math.abs(t.baseline - a.baseline) <= .5 && t.extent < a.extent && t.extent > e ? t.extent : e, 0);
	return {
		series: a.series,
		bar: a.bar,
		dataIndex: a.dataIndex,
		nextSmallerExtent: s
	};
}
//#endregion
//#region src/charts/BarChart/BarTooltip.tsx
function fi({ ctx: e, userTooltip: t, allSeries: n, stackedData: r, topStackedKeyByAxis: i, layout: a, isHorizontal: o, tooltipConfig: s }) {
	let { scales: c, labels: d } = Z(), f = c._private?.__barChart;
	if (f && e.hoverPosition && e.dataIndex >= 0) {
		let c = pi(e, f, a, o, r, i, d, n);
		return c ? /* @__PURE__ */ u(l, { children: t ? t(c) : /* @__PURE__ */ u(un, {
			...c,
			...s
		}) }) : null;
	}
	return /* @__PURE__ */ u(l, { children: t ? t(e) : /* @__PURE__ */ u(un, {
		...e,
		...s
	}) });
}
function pi(e, t, n, r, i, a, o, s) {
	let c = e.hoverPosition;
	if (!c) return e;
	let { hits: l } = ci({
		series: e.seriesData.map((e) => e.series),
		label: e.label,
		dataIndex: e.dataIndex,
		cursor: c,
		scales: t,
		layout: n,
		isHorizontal: r,
		stackedData: i,
		topStackedKeyByAxis: a
	});
	if (l.size === 0) return null;
	let u = null, d = null;
	if (ti(n)) {
		let l = di({
			series: s,
			labels: o,
			hoveredLabel: e.label,
			cursor: c,
			scales: t,
			layout: n,
			isHorizontal: r,
			stackedData: i,
			topStackedKeyByAxis: a
		});
		if (!l) return null;
		u = l.series.key, d = l.dataIndex;
	}
	let f = u ?? (l.size === 1 ? l.values().next().value : void 0), p = e.seriesData.filter((e) => l.has(e.series.key));
	if (u != null && d != null && d !== e.dataIndex) {
		let t = d, n = p.map((e) => {
			if (e.series.key !== u) return e;
			let n = e.series.data[t], r = typeof n == "number" && Number.isFinite(n) ? n : e.value;
			return {
				...e,
				value: r
			};
		});
		return {
			...e,
			seriesData: n,
			dataIndex: t,
			hoveredSeriesKey: f
		};
	}
	return {
		...e,
		seriesData: p,
		hoveredSeriesKey: f
	};
}
//#endregion
//#region src/charts/BarChart/utils/bar-config.ts
var mi = {
	color: "rgba(0,0,0,0.30)",
	blur: 12,
	offsetY: -4
}, hi = bt.top + bt.bottom + 22;
function gi(e) {
	if (e === !0) return mi;
	if (!(e === !1 || e == null)) return e;
}
function _i({ isHorizontal: e, fitToHeight: t, resolvedMinBandSize: n, labels: r }) {
	if (!e || t || n <= 0) return;
	let i = new Set(r).size;
	if (i !== 0) return i * n + hi;
}
//#endregion
//#region src/charts/BarChart/utils/stack-pills.ts
var vi = {
	topLeft: !0,
	topRight: !0,
	bottomLeft: !0,
	bottomRight: !0
};
function yi(e, t) {
	let n = /* @__PURE__ */ new Map();
	for (let r of e) {
		if (r.width <= 0 || r.height <= 0) continue;
		let e = n.get(r.dataIndex);
		if (!e) {
			n.set(r.dataIndex, {
				...r,
				corners: vi
			});
			continue;
		}
		if (t) {
			let t = Math.min(e.x, r.x), n = Math.max(e.x + e.width, r.x + r.width);
			e.x = t, e.width = n - t;
		} else {
			let t = Math.min(e.y, r.y), n = Math.max(e.y + e.height, r.y + r.height);
			e.y = t, e.height = n - t;
		}
	}
	return [...n.values()];
}
//#endregion
//#region src/charts/BarChart/utils/draw-bar-chart.ts
function bi(e, t, n, r) {
	if (n) {
		let n = [];
		for (let r of t) {
			let t = ot(e, r);
			t != null && isFinite(t) && n.push(t);
		}
		return n;
	}
	return Rt(t, (t) => ot(e, t), r).map((e) => e.x);
}
function xi(e, t, n, r) {
	if (!n) {
		r();
		return;
	}
	e.save(), e.beginPath(), e.rect(t.plotLeft, t.plotTop, t.plotWidth, t.plotHeight), e.clip(), e.shadowColor = n.color, e.shadowBlur = n.blur, e.shadowOffsetX = n.offsetX ?? 0, e.shadowOffsetY = n.offsetY ?? 0, r(), e.restore();
}
function Si({ ctx: e, dimensions: t, scales: n, series: r, labels: i, theme: a }, { barLayout: o, isHorizontal: s, showGrid: c, axisLines: l, xTickFormatter: u, stackedData: d, topStackedKeyByAxis: f, roundStackEnds: p, barCornerRadius: m, barTrack: h, barShadow: g, barFillStyle: _ }) {
	let v = n._private?.__barChart;
	if (!v) return;
	let y = {
		ctx: e,
		dimensions: t,
		xScale: (e) => ot(v, e),
		yScale: v.value,
		labels: i
	}, b = l.x || l.y;
	c && Bn(y, {
		gridColor: a.gridColor,
		gridDash: a.gridDashPattern,
		frame: !b,
		orientation: s ? "horizontal" : "vertical",
		categoryTicks: b ? [] : bi(v, i, s, u)
	});
	let x = nt({
		series: r,
		labels: i,
		scales: v,
		layout: o,
		isHorizontal: s,
		stackedData: d,
		topStackedKeyByAxis: f
	});
	$e(x.flatMap((e) => e.bars.map((t) => ({
		bar: t,
		yAxisId: e.series.yAxisId
	}))), v, s, o, p);
	let S = p ? yi(x.flatMap((e) => e.bars), s) : [];
	if (h && o === "grouped") {
		let [e = 0, t = 0] = v.value.range();
		for (let { series: n, bars: r } of x) tr(y, n, r.map((r) => {
			let i = n.trackData?.[r.dataIndex], a = i != null && isFinite(v.value(i)) ? v.value(i) : t;
			return at(r, e, a, s);
		}), m);
	}
	if (xi(e, t, gi(g), () => {
		S.length > 0 && (e.save(), er(e, S, m));
		for (let { series: e, bars: t } of x) Yn(y, e, t, S.length > 0 ? 0 : m, _);
		S.length > 0 && e.restore();
	}), b) {
		let e = !s && Object.values(v.yAxes ?? {}).some((e) => e.position === "right");
		Rn(y, {
			axisColor: Ln(a),
			xLine: l.x,
			yLine: l.y,
			rightAxis: e
		});
	}
}
function Ci(e, t, { items: n, hoveredBandPills: r }, { alpha: i, barCornerRadius: a, barTrack: o, isHorizontal: s }) {
	let [c = 0, l = 0] = o ? t.value.range() : [], u = r.length > 0 ? 0 : a;
	e.save(), e.globalAlpha = i, r.length > 0 && er(e, r, a);
	for (let { series: r, bar: i, isTrackHighlight: a } of n) if (a) {
		let n = j(_n(r, i.dataIndex)), a;
		n ? (n.opacity = Qn, a = n.toString()) : a = `rgba(0,0,0,${Qn})`;
		let o = r.trackData?.[i.dataIndex];
		nr(e, at(i, c, o != null && isFinite(t.value(o)) ? t.value(o) : l, s), a, u);
	} else {
		let t = _n(r, i.dataIndex);
		nr(e, i, j(t)?.darker(.6).toString() ?? t, u);
	}
	e.restore();
}
//#endregion
//#region src/charts/BarChart/utils/resolve-bar-hover.ts
function wi({ series: e, labels: t, hoverIndex: n, hoverPosition: r }, i, { barLayout: a, isHorizontal: o, stackedData: s, topStackedKeyByAxis: c, roundStackEnds: l, barTrackHover: u }) {
	let d = t[n], f = [], p = "";
	if (ti(a) && r) {
		let n = di({
			series: e,
			labels: t,
			hoveredLabel: d,
			cursor: r,
			scales: i,
			layout: a,
			isHorizontal: o,
			stackedData: s,
			topStackedKeyByAxis: c
		});
		if (n) {
			let e = o ? n.bar.width : n.bar.height, { nextSmallerExtent: t } = n, r = o ? n.bar.x : n.bar.y + n.bar.height, i = Math.max(0, e - t), a = o ? {
				...n.bar,
				x: r + t,
				width: i
			} : {
				...n.bar,
				y: r - e,
				height: i
			};
			f.push({
				series: n.series,
				bar: a,
				isTrackHighlight: !1
			}), p += "b";
		}
	} else for (let { series: t, bar: l } of oi({
		series: e,
		label: d,
		dataIndex: n,
		scales: i,
		layout: a,
		isHorizontal: o,
		stackedData: s,
		topStackedKeyByAxis: c
	})) {
		if (r && !ni(l, r, o)) continue;
		let e = u && a === "grouped" && r != null && ii(l, r, o) && !ai(t, l, i, r, o);
		f.push({
			series: t,
			bar: l,
			isTrackHighlight: e
		}), p += e ? "t" : "b";
	}
	if (f.length === 0) return null;
	let m = l ? yi([...oi({
		series: e,
		label: d,
		dataIndex: n,
		scales: i,
		layout: a,
		isHorizontal: o,
		stackedData: s,
		topStackedKeyByAxis: c
	})].map(({ bar: e }) => e), o) : [];
	return {
		items: f,
		composition: p,
		hoveredBandPills: m
	};
}
//#endregion
//#region src/charts/BarChart/utils/resolve-clicked-bar-series.ts
function Ti({ clickData: e, scales: t, barLayout: n, isHorizontal: r, stackedData: i, topStackedKeyByAxis: a, series: o, labels: s }) {
	let { cursor: c, label: l, dataIndex: u, crossSeriesData: d } = e;
	if (!c) return null;
	let f = new Map(o.map((e, t) => [e.key, t])), p = new Map(d.map((e) => [e.series.key, e])), m = (t, n, r) => ({
		...e,
		dataIndex: r,
		series: t,
		value: n,
		seriesIndex: f.get(t.key) ?? -1
	});
	if (n === "grouped") {
		for (let { series: e, bar: i } of oi({
			series: d.map((e) => e.series),
			label: l,
			dataIndex: u,
			scales: t,
			layout: n,
			isHorizontal: r,
			topStackedKeyByAxis: a
		})) {
			if (!ni(i, c, r)) continue;
			let n = p.get(e.key);
			if (!n) return null;
			let a = ii(i, c, r);
			return a && ai(e, i, t, c, r) ? null : {
				...m(n.series, n.value, u),
				inTrackArea: a
			};
		}
		return null;
	}
	let h = di({
		series: d.map((e) => e.series),
		labels: s,
		hoveredLabel: l,
		cursor: c,
		scales: t,
		layout: n,
		isHorizontal: r,
		stackedData: i,
		topStackedKeyByAxis: a
	});
	if (!h) return null;
	let g = p.get(h.series.key);
	if (!g) return null;
	let _ = g.series.data[h.dataIndex], v = typeof _ == "number" && Number.isFinite(_) ? _ : g.value;
	return m(g.series, v, h.dataIndex);
}
//#endregion
//#region src/charts/BarChart/BarChart.tsx
function Ei({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(Di, { ...t })
	});
}
function Di({ series: e, labels: t, config: r, theme: i, tooltip: a, onPointClick: c, onDateRangeZoom: l, className: d, dataAttr: f, children: p }) {
	let { yScaleType: m = "linear", showGrid: h = !1, showAxisLines: g = !1, barLayout: _ = "stacked", axisOrientation: v = "vertical", xTickFormatter: y, barCornerRadius: b = 0, yAxes: x } = r ?? {}, { x: S, y: C } = me(g), w = o(() => ({
		x: S,
		y: C
	}), [S, C]), { track: T = !1, shadow: E, divergingStack: D = !1, maxBandRange: O, bandPadding: k, minBandSize: A, minBarSize: j, fitToHeight: M = !1, valueDomain: N, valuePadding: P, roundStackEnds: F = !1, fillStyle: I = "flat" } = r?.bars ?? {}, L = v === "horizontal", R = T !== !1, z = T === !0 || typeof T == "object" && T.hover !== !1, { visibleSeries: B, legendProps: V } = K(e, i, r?.legend), H = A ?? (L ? 24 : 0), ee = o(() => _i({
		isHorizontal: L,
		fitToHeight: M,
		resolvedMinBandSize: H,
		labels: t
	}), [
		L,
		M,
		H,
		t
	]), U = o(() => {
		if (_ === "percent") return Ie(B, t);
		if (_ === "stacked") return D ? Le(B, t) : Fe(B, t);
	}, [
		_,
		B,
		t,
		D
	]), G = o(() => _ === "grouped" ? /* @__PURE__ */ new Map() : Ae(B), [_, B]), te = o(() => {
		let e = {
			...r,
			isPercent: _ === "percent"
		};
		return _ !== "percent" || r?.yTickFormatter ? e : {
			...e,
			yTickFormatter: (e) => `${Math.round(e * 100)}%`
		};
	}, [r, _]), q = n((e, t, n) => {
		let r;
		U && _ === "stacked" && (r = e.flatMap((e) => {
			let t = U.get(e.key);
			return t ? D ? [{
				...e,
				data: t.top
			}, {
				...e,
				key: `${e.key}__bottom`,
				data: t.bottom
			}] : [{
				...e,
				data: t.top
			}] : [e];
		}));
		let i = He(e, t, n, {
			scaleType: m,
			barLayout: _,
			axisOrientation: v,
			stackedSeries: r,
			maxBandRange: O,
			bandPadding: k,
			fitToHeight: M,
			minBandSize: H,
			minBarSize: j,
			valueDomain: N,
			valuePadding: P,
			axes: x
		}), a = we(L ? n.plotWidth : n.plotHeight);
		return {
			x: (e, t) => {
				if (t != null && _ === "grouped") {
					let n = st(i, e, t);
					if (n != null) return n;
				}
				return ot(i, e);
			},
			y: (e) => i.value(e),
			yTicks: () => i.value.ticks?.(a) ?? [],
			yAxes: i.yAxes ? ke(i.yAxes, a) : void 0,
			extent: () => {
				if (L) return;
				let e = i.group;
				if (_ === "grouped" && e) {
					let t = e.domain();
					if (t.length > 0) {
						let n = e(t[0]) ?? 0, r = (e(t[t.length - 1]) ?? 0) + e.bandwidth() - n;
						if (r > 0) return r;
					}
				}
				return i.band.bandwidth();
			},
			bandSlotAtCursor: (e, t) => L || _ !== "grouped" ? void 0 : li(i, e, t.x),
			_private: { __barChart: i }
		};
	}, [
		m,
		_,
		v,
		U,
		L,
		D,
		O,
		k,
		M,
		H,
		j,
		N,
		P,
		x
	]), ne = n((e) => Si(e, {
		barLayout: _,
		isHorizontal: L,
		showGrid: h,
		axisLines: w,
		xTickFormatter: y,
		stackedData: U,
		topStackedKeyByAxis: G,
		roundStackEnds: F,
		barCornerRadius: b,
		barTrack: R,
		barShadow: E,
		barFillStyle: I
	}), [
		h,
		w,
		U,
		_,
		L,
		G,
		F,
		b,
		R,
		y,
		E,
		I
	]), J = s(null), re = n((e) => {
		let { ctx: t, scales: n, hoverIndex: r, hoverProgress: i, resetHoverFade: a } = e, o = n._private?.__barChart;
		if (!o || r < 0) return J.current = null, !1;
		let s = wi(e, o, {
			barLayout: _,
			isHorizontal: L,
			stackedData: U,
			topStackedKeyByAxis: G,
			roundStackEnds: F,
			barTrackHover: z
		});
		if (!s) return J.current = null, !1;
		let c = `${r}:${s.composition}`, l = i;
		return c !== J.current && (l = a(), J.current = c), Ci(t, o, s, {
			alpha: l,
			barCornerRadius: b,
			barTrack: R,
			isHorizontal: L
		}), !0;
	}, [
		U,
		_,
		L,
		G,
		F,
		b,
		R,
		z
	]), ie = o(() => ze(U), [U]), ae = o(() => Re(U), [U]), oe = o(() => Be(U), [U]), se = $(B), ce = $(t), le = n((e, t) => {
		let n = t._private?.__barChart;
		return n ? Ti({
			clickData: e,
			scales: n,
			barLayout: _,
			isHorizontal: L,
			stackedData: U,
			topStackedKeyByAxis: G,
			series: se.current,
			labels: ce.current
		}) ?? e : e;
	}, [
		_,
		L,
		U,
		G,
		se,
		ce
	]), Y = o(() => B.some((e) => Array.isArray(e.trackData)), [B]), ue = n((e, t, n) => {
		let r = n._private?.__barChart;
		return r && si({
			series: se.current,
			label: ce.current[e],
			dataIndex: e,
			scales: r,
			layout: _,
			isHorizontal: L,
			stackedData: U,
			topStackedKeyByAxis: G,
			cursor: t
		}) ? -1 : e;
	}, [
		_,
		L,
		U,
		G,
		se,
		ce
	]), de = /* @__PURE__ */ u(Qr, {
		series: B,
		labels: t,
		config: te,
		theme: i,
		createScales: q,
		drawStatic: ne,
		drawHover: re,
		tooltip: (e) => /* @__PURE__ */ u(fi, {
			ctx: e,
			userTooltip: a,
			allSeries: B,
			stackedData: U,
			topStackedKeyByAxis: G,
			layout: _,
			isHorizontal: L,
			tooltipConfig: r?.tooltip
		}),
		onPointClick: c,
		onDateRangeZoom: l,
		wrapClickData: c ? le : void 0,
		resolveHoverIndex: Y ? ue : void 0,
		className: d,
		dataAttr: f,
		resolveValue: ie,
		resolvePositionValue: ae,
		resolveBottomValue: oe,
		children: p
	});
	return /* @__PURE__ */ u(W, {
		...V,
		legendDataAttr: "script-chart-bar-legend",
		children: /* @__PURE__ */ u("div", {
			className: "flex flex-col flex-1",
			style: { minHeight: ee },
			children: de
		})
	});
}
//#endregion
//#region src/charts/FunnelChart/FunnelChart.tsx
var Oi = .1, ki = {
	color: "rgba(0,0,0,0.15)",
	blur: 6,
	offsetY: -2
}, Ai = 10;
function ji(e) {
	return `${parseFloat(e.toFixed(2))}%`;
}
function Mi({ onBands: e }) {
	let { scales: t, labels: n } = Z(), r = o(() => n.map((e) => {
		let n = t.x(e) ?? 0, r = t.extent?.(e) ?? 0;
		return {
			left: n - r / 2,
			width: r
		};
	}), [t, n]);
	return i(() => e(r), [r, e]), null;
}
function Ni({ bands: e, stepFooter: t }) {
	let n = [], r = 0;
	for (let t of e) n.push(`${Math.max(0, t.left - r)}px`, `${t.width}px`), r = t.left + t.width;
	return /* @__PURE__ */ u("div", {
		className: "grid shrink-0",
		style: { gridTemplateColumns: n.join(" ") },
		"data-attr": "script-funnel-step-footer",
		children: e.map((e, n) => /* @__PURE__ */ u("div", {
			className: "min-w-0",
			style: {
				gridColumn: 2 * n + 2,
				gridRow: 1
			},
			"data-attr": "script-funnel-step-footer-cell",
			children: t(n)
		}, n))
	});
}
function Pi({ steps: e, series: t, theme: r, config: i, tooltip: a, onStepClick: s, stepFooter: l, dataAttr: f, className: p, children: m, onError: h }) {
	let { tooltip: g, legend: _, animateHover: v, margins: y, showGrid: b = !0, barCornerRadius: x = Ai, hideStepLabels: S, hideValueAxis: C, maxCategoryLabelWidth: w, bandPadding: T, maxBandRange: E, chartMinHeight: D } = i ?? {}, O = l != null, k = o(() => e.map((e, t) => `${t + 1}`), [e]), A = n((t) => e[Number(t) - 1] ?? t, [e]), j = o(() => ({
		barLayout: "grouped",
		showGrid: b,
		animateHover: v,
		margins: y,
		hideXAxis: S || O,
		hideYAxis: C,
		maxCategoryLabelWidth: w,
		xTickFormatter: A,
		yTickFormatter: (e) => `${Math.round(e)}%`,
		barCornerRadius: x,
		legend: _,
		tooltip: {
			placement: "top",
			valueFormatter: ji,
			labelFormatter: A,
			...g
		},
		bars: {
			track: !0,
			shadow: ki,
			bandPadding: T ?? .1,
			maxBandRange: E
		}
	}), [
		b,
		v,
		y,
		S,
		O,
		C,
		w,
		A,
		_,
		g,
		x,
		T,
		E
	]), M = o(() => s ? (e) => s({
		...e,
		stepIndex: e.dataIndex,
		converted: !e.inTrackArea
	}) : void 0, [s]), [N, P] = c(null), F = /* @__PURE__ */ d(Ei, {
		series: t,
		labels: k,
		theme: r,
		config: j,
		tooltip: a,
		onPointClick: M,
		className: p,
		dataAttr: f,
		onError: h,
		children: [O && /* @__PURE__ */ u(Mi, { onBands: P }), m]
	});
	return l ? /* @__PURE__ */ d("div", {
		className: "flex flex-col flex-1 min-h-0",
		children: [/* @__PURE__ */ u("div", {
			className: "flex flex-col flex-1 min-h-0",
			style: D == null ? void 0 : { minHeight: D },
			"data-attr": "script-funnel-chart-region",
			children: F
		}), N && N.length > 0 && /* @__PURE__ */ u(Ni, {
			bands: N,
			stepFooter: l
		})]
	}) : F;
}
//#endregion
//#region src/charts/FunnelChart/funnel-data.ts
var Fi = 100;
function Ii(e, t) {
	return t > 0 ? e / t : 0;
}
function Li(e, t = {}) {
	let n = e[0]?.count ?? 0;
	return {
		steps: e.map((e) => e.label),
		series: [{
			key: t.key ?? "funnel-conversion",
			label: t.label ?? "Conversion",
			color: t.color,
			data: e.map((e) => Ii(e.count, n) * 100)
		}]
	};
}
//#endregion
//#region src/charts/LineChart/closest-hover-series.ts
function Ri(e, t, n) {
	let r = null, i = Infinity;
	for (let a of e) {
		if (a.visibility?.excluded || a.fill?.lowerData || a.overlay) continue;
		let e = t(a);
		if (Number.isFinite(e)) {
			let t = Math.abs(e - n);
			t < i && (i = t, r = a.key);
		}
	}
	return r;
}
//#endregion
//#region src/charts/LineChart/LineChart.tsx
function zi({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(Bi, { ...t })
	});
}
function Bi({ series: e, labels: t, config: r, theme: i, tooltip: a, onPointClick: s, onDateRangeZoom: c, className: l, dataAttr: d, children: f }) {
	let { yScaleType: p = "linear", percentStackView: m = !1, showGrid: h = !1, showAxisLines: g = !1, valueDomain: _, floatBaseline: v = !1, yAxes: y, curve: b } = r ?? {}, x = b === "monotone", { x: S, y: C } = me(g), w = o(() => ({
		x: S,
		y: C
	}), [S, C]), { visibleSeries: T, legendProps: E } = K(e, i, r?.legend), D = o(() => T.filter((e) => e.fill && !e.fill.lowerData).length >= 2, [T]), O = o(() => {
		if (m) return Ie(T, t);
		if (D) return Fe(T, t);
	}, [
		m,
		D,
		T,
		t
	]), k = o(() => {
		let e = {
			...r,
			isPercent: m
		};
		return !m || r?.yTickFormatter ? e : {
			...e,
			yTickFormatter: (e) => `${Math.round(e * 100)}%`
		};
	}, [r, m]), A = n((e, t, n) => {
		let r = e;
		O && !m && (r = e.map((e) => {
			let t = O.get(e.key);
			return t ? {
				...e,
				data: t.top
			} : e;
		}));
		let i = Ne(r, t, n, {
			scaleType: p,
			percentStack: m,
			valueDomain: _,
			floatBaseline: v,
			axes: y
		}), a = we(n.plotHeight);
		return {
			x: (e) => i.x(e),
			y: (e) => i.y(e),
			yTicks: () => i.y.ticks?.(a) ?? [],
			yAxes: i.yAxes ? ke(i.yAxes, a) : void 0,
			_private: { __lineChart: i }
		};
	}, [
		p,
		m,
		O,
		_,
		v,
		y
	]), j = n(({ ctx: e, dimensions: t, scales: n, series: r, labels: i, theme: a }) => {
		let o = n._private?.__lineChart;
		if (!o) return;
		let s = (e) => {
			let t = e.yAxisId ?? "left";
			return o.yAxes?.[t]?.scale ?? o.y;
		}, c = {
			ctx: e,
			dimensions: t,
			xScale: o.x,
			yScale: o.y,
			labels: i
		}, l = w.x || w.y;
		if (h && Bn(c, {
			gridColor: a.gridColor,
			gridDash: a.gridDashPattern,
			frame: !l
		}), Wn({
			ctx: e,
			dimensions: t,
			labels: i,
			series: r,
			xScale: o.x,
			resolveYScale: s,
			yValuesFor: (e) => O?.get(e.key)?.top,
			bottomFor: (e) => e.fill?.lowerData ?? O?.get(e.key)?.bottom,
			shouldFill: (e) => !!e.fill,
			zOrder: "per-series",
			smooth: x,
			yFloor: w.x ? t.plotTop + t.plotHeight - 2 / 2 : void 0,
			clipLeftEdge: w.y
		}), l) {
			let e = Object.values(o.yAxes ?? {}).some((e) => e.position === "right");
			Rn(c, {
				axisColor: Ln(a),
				xLine: w.x,
				yLine: w.y,
				rightAxis: e
			});
		}
	}, [
		h,
		w,
		O,
		x
	]), M = n(({ ctx: e, scales: t, series: n, labels: r, hoverIndex: i, hoverPosition: a, theme: o }) => {
		if (i < 0) return !1;
		let s = a == null ? null : Ri(n, (e) => {
			let n = O?.get(e.key)?.top ?? e.data;
			return qe(t, e)(n[i]);
		}, a.y);
		return Gn(e, s == null ? n : n.filter((e) => e.key === s), o.backgroundColor ?? "#ffffff", (e) => {
			let n = O?.get(e.key)?.top ?? e.data, a = t.x(r[i]);
			return a == null ? null : {
				x: a,
				y: qe(t, e)(n[i])
			};
		});
	}, [O]), N = o(() => ze(O), [O]), P = o(() => Re(O), [O]);
	return /* @__PURE__ */ u(W, {
		...E,
		legendDataAttr: "script-chart-line-legend",
		children: /* @__PURE__ */ u(Qr, {
			series: T,
			labels: t,
			config: k,
			theme: i,
			createScales: A,
			drawStatic: j,
			drawHover: M,
			tooltip: a,
			onPointClick: s,
			onDateRangeZoom: c,
			className: l,
			dataAttr: d,
			resolveValue: N,
			resolvePositionValue: P,
			children: f
		})
	});
}
//#endregion
//#region src/core/combo-scales.ts
function Vi(e, t) {
	return e.type ?? t;
}
function Hi(e, t, n, r) {
	let { scaleType: i = "linear", barLayout: a = "stacked", bandPadding: o = .2, groupPadding: s = .1, seriesTypeOf: c, barStackedData: l, valueDomain: u, axes: d } = r, p = f().domain(t).range([n.plotLeft, n.plotLeft + n.plotWidth]).paddingInner(o).paddingOuter(o / 2), m;
	if (a === "grouped") {
		let t = e.filter((e) => !e.visibility?.excluded && c(e) === "bar").map((e) => e.key);
		m = f().domain(t).range([0, p.bandwidth()]).padding(s);
	}
	let h = new Map((d ?? []).map((e) => [e.id, e])), g = je(e).map(({ axisId: e, position: t }) => ({
		axisId: e,
		position: h.get(e)?.position ?? t
	}));
	g.length === 0 && g.push({
		axisId: X,
		position: "left"
	});
	let _ = g.some((e) => e.axisId === "left") ? X : g[0].axisId, v = Me(e), y = {};
	for (let { axisId: e, position: t } of g) {
		let r = v.get(e) ?? [], o = r.flatMap((e) => {
			let t = l?.get(e.key);
			return c(e) === "bar" && (a === "stacked" || a === "percent") && t ? [{
				...e,
				data: t.top
			}, {
				...e,
				key: `${e.key}__bottom`,
				data: t.bottom
			}] : [e];
		}), s = r.some((e) => c(e) === "bar");
		y[e] = {
			scale: De(o, n, {
				scaleType: h.get(e)?.scaleType ?? i,
				percentStack: a === "percent" && s,
				valueDomain: e === _ ? u : void 0,
				floatBaseline: !s && h.get(e)?.startAtZero === !1
			}),
			position: t
		};
	}
	let b = y[_].scale;
	return {
		band: p,
		group: m,
		yAxes: y,
		y: b,
		value: b
	};
}
function Ui(e, t) {
	let n = [], r = [];
	for (let i of e) i.visibility?.excluded || (t(i) === "bar" ? n.push(i) : r.push(i));
	return {
		bars: n,
		lines: r
	};
}
//#endregion
//#region src/charts/ComboChart/ComboChart.tsx
function Wi({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(Gi, { ...t })
	});
}
function Gi({ series: e, labels: t, config: r, theme: i, tooltip: a, onPointClick: s, className: c, dataAttr: l, children: d }) {
	let { yScaleType: f = "linear", showGrid: p = !1, showAxisLines: m = !1, barLayout: h = "stacked", divergingStack: g = !1, barCornerRadius: _ = 4, defaultSeriesType: v = pe, xTickFormatter: y, valueDomain: b, curve: x, yAxes: S } = r ?? {}, C = x === "monotone", { x: w, y: T } = me(m), E = o(() => ({
		x: w,
		y: T
	}), [w, T]), D = n((e) => Vi(e, v), [v]), O = o(() => {
		if (h !== "stacked" && h !== "percent") return;
		let n = e.filter((e) => D(e) === "bar");
		if (n.length !== 0) return h === "percent" ? Ie(n, t) : g ? Le(n, t) : Fe(n, t);
	}, [
		h,
		g,
		e,
		t,
		D
	]), k = o(() => h !== "stacked" && h !== "percent" ? /* @__PURE__ */ new Map() : Ae(e, { skip: (e) => D(e) !== "bar" }), [
		h,
		e,
		D
	]), A = n((e, t, n) => {
		let r = Hi(e, t, n, {
			scaleType: f,
			barLayout: h,
			seriesTypeOf: D,
			barStackedData: O,
			valueDomain: b,
			axes: S
		}), i = we(n.plotHeight), a = /* @__PURE__ */ new Map();
		for (let t of e) a.set(t.key, t);
		let o = { __comboChart: r };
		return {
			x: (e, t) => {
				if (t == null || h !== "grouped") return ot(r, e);
				let n = a.get(t);
				return n && D(n) === "bar" ? st(r, e, t) ?? ot(r, e) : ot(r, e);
			},
			y: (e) => r.y(e),
			yTicks: () => r.y.ticks?.(i) ?? [],
			yAxes: ke(r.yAxes, i),
			_private: o
		};
	}, [
		f,
		h,
		D,
		O,
		b,
		S
	]), M = n(({ ctx: e, dimensions: t, scales: n, series: r, labels: i, theme: a }) => {
		let o = n._private?.__comboChart;
		if (!o) return;
		let { bars: s, lines: c } = Ui(r, D), l = {
			ctx: e,
			dimensions: t,
			xScale: (e) => ot(o, e),
			yScale: o.y,
			labels: i
		}, u = E.x || E.y;
		if (p) {
			let e = u ? [] : Rt(i, (e) => ot(o, e), y).map((e) => e.x);
			Bn(l, {
				gridColor: a.gridColor,
				gridDash: a.gridDashPattern,
				frame: !u,
				categoryTicks: e
			});
		}
		let d = nt({
			series: s,
			labels: i,
			scales: o,
			layout: h,
			isHorizontal: !1,
			stackedData: O,
			topStackedKeyByAxis: k
		});
		$e(d.flatMap((e) => e.bars.map((t) => ({
			bar: t,
			yAxisId: e.series.yAxisId
		}))), o, !1, h);
		for (let { series: e, bars: t } of d) Yn(l, e, t, _);
		if (Wn({
			ctx: e,
			dimensions: t,
			labels: i,
			series: c,
			xScale: (e) => ot(o, e),
			resolveYScale: (e) => qe(o, e),
			shouldFill: (e) => D(e) === "area" || !!e.fill,
			bottomFor: (e) => e.fill?.lowerData,
			zOrder: "areas-first",
			smooth: C,
			yFloor: E.x ? t.plotTop + t.plotHeight - 2 / 2 : void 0,
			clipLeftEdge: E.y
		}), u) {
			let e = Object.values(o.yAxes).some((e) => e.position === "right");
			Rn(l, {
				axisColor: Ln(a),
				xLine: E.x,
				yLine: E.y,
				rightAxis: e
			});
		}
	}, [
		D,
		p,
		E,
		y,
		h,
		O,
		k,
		_,
		C
	]), N = n(({ ctx: e, scales: t, series: n, labels: r, hoverIndex: i, hoverPosition: a, theme: o }) => {
		if (i < 0) return !1;
		let s = t._private?.__comboChart;
		if (!s) return !1;
		let c = r[i], { bars: l, lines: u } = Ui(n, D), d = !1, f = a ? ci({
			series: l,
			label: c,
			dataIndex: i,
			cursor: a,
			scales: s,
			layout: h,
			isHorizontal: !1,
			stackedData: O,
			topStackedKeyByAxis: k
		}).hits : null, p = [];
		for (let e of l) {
			if (f && !f.has(e.key)) continue;
			let t = e.yAxisId ?? "left", n = it({
				series: e,
				label: c,
				dataIndex: i,
				scales: s,
				layout: h,
				isHorizontal: !1,
				stackedBand: O?.get(e.key),
				isTopOfStack: k.get(t) === e.key
			});
			n && p.push({
				series: e,
				bar: n
			});
		}
		$e(p.map((e) => ({
			bar: e.bar,
			yAxisId: e.series.yAxisId
		})), s, !1, h);
		for (let { series: t, bar: n } of p) {
			let r = _n(t, n.dataIndex);
			nr(e, n, j(r)?.darker(.6).toString() ?? r, _), d = !0;
		}
		let m = ot(s, c);
		if (m != null) {
			let t = Gn(e, u, o.backgroundColor ?? "#ffffff", (e) => {
				let t = e.data[i];
				return t == null || !isFinite(t) ? null : {
					x: m,
					y: qe(s, e)(t)
				};
			});
			d ||= t;
		}
		return d;
	}, [
		D,
		h,
		O,
		k,
		_
	]), P = o(() => ze(O), [O]), F = o(() => Re(O), [O]), I = o(() => Be(O), [O]);
	return /* @__PURE__ */ u(Qr, {
		series: e,
		labels: t,
		config: o(() => {
			let e = {
				...r,
				isPercent: h === "percent"
			};
			return h !== "percent" || r?.yTickFormatter ? e : {
				...e,
				yTickFormatter: (e) => `${Math.round(e * 100)}%`
			};
		}, [r, h]),
		theme: i,
		createScales: A,
		drawStatic: M,
		drawHover: N,
		tooltip: a,
		onPointClick: s,
		className: c,
		dataAttr: l,
		resolveValue: P,
		resolvePositionValue: F,
		resolveBottomValue: I,
		children: d
	});
}
//#endregion
//#region src/overlays/ReferenceLine.tsx
var Ki = {
	goal: {
		color: "rgba(0, 0, 0, 0.4)",
		stroke: "dashed",
		width: 2
	},
	alert: {
		color: "#db3707",
		stroke: "dashed",
		width: 2
	},
	marker: {
		color: "rgba(0, 0, 0, 0.5)",
		stroke: "solid",
		width: 1
	}
}, qi = 20, Ji = 4, Yi = 12;
function Xi(e, t) {
	let n = Ki[e];
	return {
		color: t?.color ?? n.color,
		stroke: t?.stroke ?? n.stroke,
		width: t?.width ?? n.width
	};
}
function Zi({ lines: e }) {
	return /* @__PURE__ */ u(l, { children: e.map((e, t) => /* @__PURE__ */ u(Qi, { ...e }, `${t}-${e.value}-${e.label ?? ""}`)) });
}
function Qi(e) {
	let { axis: t } = Z(), { orientation: n = "horizontal", variant: r = "goal", style: i, axisOrientation: a = t.orientation } = e, s = o(() => Xi(r, i), [
		r,
		i?.color,
		i?.stroke,
		i?.width
	]), c = {
		resolved: s,
		fillSide: e.fillSide,
		fillColor: i?.fillColor ?? s.color,
		fillOpacity: i?.fillOpacity ?? .1,
		label: e.label,
		labelPosition: e.labelPosition ?? "end",
		valueText: typeof e.value == "number" ? e.value.toLocaleString() : void 0
	};
	return n === "horizontal" ? typeof e.value == "number" ? a === "horizontal" ? /* @__PURE__ */ u(na, {
		value: e.value,
		...c
	}) : /* @__PURE__ */ u($i, {
		y: e.value,
		yAxisId: e.yAxisId,
		...c
	}) : null : typeof e.value == "string" ? /* @__PURE__ */ u(ta, {
		xLabel: e.value,
		...c
	}) : null;
}
function $i({ y: e, yAxisId: t, resolved: n, fillSide: r, fillColor: i, fillOpacity: a, label: o, labelPosition: s, valueText: c }) {
	let { scales: l, dimensions: d } = Z(), { plotLeft: f, plotTop: p, plotWidth: m, plotHeight: h, width: g } = d, _ = f + m, v = p + h, y = (t && l.yAxes?.[t] ? l.yAxes[t].scale : l.y)(e);
	if (!isFinite(y) || y < p || y > v) return null;
	let b = {
		left: f,
		top: y - n.width / 2,
		width: m,
		height: 0,
		borderTopWidth: n.width,
		borderTopStyle: n.stroke,
		borderTopColor: n.color
	}, x = {
		top: Math.max(p + qi / 2, Math.min(y, v - qi / 2)),
		transform: "translateY(-50%)",
		...s === "end" ? { right: g - _ + Ji } : { left: f + Ji }
	}, S = null;
	r === "above" ? S = {
		left: f,
		top: p,
		width: m,
		height: y - p
	} : r === "below" && (S = {
		left: f,
		top: y,
		width: m,
		height: v - y
	});
	let C = c == null ? null : {
		left: f,
		top: y - Yi / 2,
		width: m,
		height: Yi
	};
	return /* @__PURE__ */ u(ra, {
		fillRect: S,
		fillColor: i,
		fillOpacity: a,
		lineStyle: b,
		hitAreaStyle: C,
		label: o,
		valueText: c,
		labelStyle: x
	});
}
function ea({ x: e, resolved: t, fillBefore: n, fillAfter: r, fillColor: i, fillOpacity: a, label: o, labelPosition: s, valueText: c }) {
	let { dimensions: l } = Z(), { plotLeft: d, plotTop: f, plotWidth: p, plotHeight: m, height: h } = l, g = d + p, _ = f + m;
	if (!isFinite(e) || e < d || e > g) return null;
	let v = {
		left: e - t.width / 2,
		top: f,
		width: 0,
		height: m,
		borderLeftWidth: t.width,
		borderLeftStyle: t.stroke,
		borderLeftColor: t.color
	}, y = {
		left: e + Ji,
		...s === "end" ? { bottom: h - _ + Ji } : { top: f + Ji }
	}, b = null;
	n ? b = {
		left: d,
		top: f,
		width: e - d,
		height: m
	} : r && (b = {
		left: e,
		top: f,
		width: g - e,
		height: m
	});
	let x = c == null ? null : {
		left: e - Yi / 2,
		top: f,
		width: Yi,
		height: m
	};
	return /* @__PURE__ */ u(ra, {
		fillRect: b,
		fillColor: i,
		fillOpacity: a,
		lineStyle: v,
		hitAreaStyle: x,
		label: o,
		valueText: c,
		labelStyle: y
	});
}
function ta({ xLabel: e, fillSide: t, ...n }) {
	let { scales: r } = Z(), i = r.x(e);
	return i == null ? null : /* @__PURE__ */ u(ea, {
		x: i,
		fillBefore: t === "left",
		fillAfter: t === "right",
		...n
	});
}
function na({ value: e, fillSide: t, ...n }) {
	let { scales: r } = Z();
	return /* @__PURE__ */ u(ea, {
		x: r.y(e),
		fillBefore: t === "below",
		fillAfter: t === "above",
		...n
	});
}
function ra({ fillRect: e, fillColor: t, fillOpacity: n, lineStyle: r, hitAreaStyle: i, label: a, valueText: o, labelStyle: s }) {
	let { theme: f } = Z(), [p, m] = c(!1), h = {
		...s,
		backgroundColor: f.tooltipBackground ?? "#1d2330",
		color: f.tooltipColor ?? "#ffffff"
	}, g = p && o ? a ? `${a}: ${o}` : o : a, _ = () => m(!0), v = () => m(!1);
	return /* @__PURE__ */ d(l, { children: [
		e && /* @__PURE__ */ u("div", {
			className: "absolute pointer-events-none",
			style: {
				...e,
				backgroundColor: t,
				opacity: n
			}
		}),
		/* @__PURE__ */ u("div", {
			"data-attr": "script-chart-reference-line",
			className: "absolute pointer-events-none",
			style: r
		}),
		g && /* @__PURE__ */ u("div", {
			"data-attr": "script-chart-reference-line-label",
			className: "absolute pointer-events-auto whitespace-nowrap font-medium text-[11px] rounded px-1 py-0.5 cursor-default",
			style: h,
			onMouseEnter: _,
			onMouseLeave: v,
			children: g
		}),
		i && /* @__PURE__ */ u("div", {
			"data-attr": "script-chart-reference-line-hit-area",
			className: "absolute pointer-events-auto",
			style: i,
			onMouseEnter: _,
			onMouseLeave: v
		})
	] });
}
//#endregion
//#region src/overlays/ValueLabels.tsx
var ia = "600 12px -apple-system, BlinkMacSystemFont, \"Inter\", \"Segoe UI\", \"Roboto\", Helvetica, Arial, sans-serif", aa = 22, oa = 4, sa = 2, ca = 12, la = "__stack_total__", ua = 6;
function da(e) {
	return e.toLocaleString();
}
function fa(e, t, n, r, i, a, o, s, c, l, u, d = !1) {
	let f = (t ? t.measureText(s).width : s.length * 6) + ca;
	e.push({
		key: r,
		seriesIndex: i,
		dataIndex: a,
		text: s,
		x: n ? l : c,
		y: n ? c : l,
		width: f,
		color: o,
		above: u,
		centerAnchor: d
	});
}
function pa(e) {
	let t = gt();
	return t && (t.font = ia), e.mode === "stack-total" ? _a(e, t) : va(e, t);
}
function ma(e) {
	return e.filter((e) => !e.visibility?.excluded && !e.fill?.lowerData && !e.overlay);
}
function ha(e, t) {
	let n = [];
	for (let r of e) {
		let e = r.data[t];
		typeof e == "number" && isFinite(e) && n.push(e);
	}
	return n;
}
function ga(e, t) {
	let n = 0, r = 0, i = !1, a = !1;
	for (let o of e) {
		let e = o.data[t];
		typeof e == "number" && isFinite(e) && (n += e, r++, e > 0 ? i = !0 : e < 0 && (a = !0));
	}
	return r === 0 || n === 0 || !isFinite(n) || i && a ? null : n;
}
function _a(e, t) {
	let { series: n, labels: r, scales: i, valueFormatter: a, isHorizontal: o, isPercent: s } = e, c = [];
	if (s) return c;
	let l = n.filter((e) => !e.visibility?.excluded && e.visibility?.valueLabel !== !1);
	if (l.length === 0) return c;
	let u = l[l.length - 1], d = qe(i, u);
	for (let e = 0; e < r.length; e++) {
		let n = ga(l, e);
		if (n === null) continue;
		let f = i.x(r[e]), p = d(n);
		if (f == null || !isFinite(f) || !isFinite(p)) continue;
		let m = a(n, -1, e, {
			rawValue: n,
			bandValues: ha(l, e),
			previousBandValues: e > 0 ? ha(l, e - 1) : [],
			isPercent: s
		});
		m !== "" && fa(c, t, o, `${la}-${e}`, -1, e, _n(u, e), m, f, p, n >= 0);
	}
	return c;
}
function va(e, t) {
	let { series: n, labels: r, scales: i, resolvePositionValue: a, valueFormatter: o, isHorizontal: s, isPercent: c } = e, l = [], u = ma(n), d = r.map((e, t) => ha(u, t)), f = c ? r.map((e, t) => ga(u, t)) : [];
	for (let e = 0; e < n.length; e++) {
		let u = n[e];
		if (u.visibility?.excluded || u.visibility?.valueLabel === !1) continue;
		let p = qe(i, u);
		for (let n = 0; n < u.data.length && n < r.length; n++) {
			let m = u.data[n];
			if (typeof m != "number" || !isFinite(m) || m === 0) continue;
			let h = a(u, n);
			if (typeof h != "number" || !isFinite(h)) continue;
			let g = m, _ = c ? !1 : h >= 0;
			if (c) {
				let e = f[n];
				if (e == null || e === 0) continue;
				g = m / e;
			}
			let v = i.x(r[n], u.key), y = p(h);
			if (v == null || !isFinite(v) || !isFinite(y)) continue;
			let b = o(g, e, n, {
				rawValue: m,
				bandValues: d[n],
				previousBandValues: n > 0 ? d[n - 1] : [],
				isPercent: c
			});
			b !== "" && fa(l, t, s, `${u.key}-${n}`, e, n, _n(u, n), b, v, y, _, c);
		}
	}
	return l;
}
function ya(e, t) {
	if (t) {
		let t = aa / 2, n;
		return n = e.centerAnchor ? e.x - e.width / 2 : e.above ? e.x : e.x - e.width, {
			left: n,
			right: n + e.width,
			top: e.y - t,
			bottom: e.y + t
		};
	}
	let n = e.width / 2, r;
	return r = e.centerAnchor ? e.y - aa / 2 : e.above ? e.y - aa : e.y, {
		left: e.x - n,
		right: e.x + n,
		top: r,
		bottom: r + aa
	};
}
function ba(e, t, n) {
	return e.left < t.right + n && e.right + n > t.left && e.top < t.bottom + n && e.bottom + n > t.top;
}
function xa(e, t, n, r) {
	if (r) {
		let r = t ? e.x : e.x - e.width;
		return r >= 0 && r + e.width <= n.width;
	}
	let i = t ? e.y - aa : e.y;
	return i >= 0 && i + aa <= n.height;
}
function Sa(e, t, n) {
	for (let r of e) r.centerAnchor || xa(r, r.above, t, n) || xa(r, !r.above, t, n) && (r.above = !r.above);
	return e;
}
function Ca(e, t, n) {
	if (e.length === 0) return e;
	let r = [...e].sort((e, t) => e.seriesIndex === t.seriesIndex ? n ? e.y - t.y : e.x - t.x : e.seriesIndex - t.seriesIndex), i = [], a = [];
	for (let e of r) {
		let r = ya(e, n);
		a.some((e) => ba(r, e, t)) || (i.push(e), a.push(r));
	}
	return i;
}
var wa = {
	position: "absolute",
	boxSizing: "border-box",
	height: aa,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	color: "white",
	fontSize: 12,
	fontWeight: 600,
	lineHeight: 1,
	padding: `0 ${oa}px`,
	borderRadius: 4,
	borderWidth: sa,
	borderStyle: "solid",
	pointerEvents: "none",
	whiteSpace: "nowrap",
	transition: "transform 150ms ease-out"
};
function Ta(e, t, n, r) {
	let i = 0, a = 0;
	n && (e.centerAnchor ? a = -6 : t ? i = e.above ? ua : -6 : a = e.above ? -6 : ua), r && !e.centerAnchor && (t ? i += e.above ? r : -r : a += e.above ? -r : r);
	let o = i === 0 && a === 0 ? "" : ` translate(${i}px, ${a}px)`;
	return e.centerAnchor ? `translate(-50%, -50%)${o}` : t ? (e.above ? "translateY(-50%)" : "translate(-100%, -50%)") + o : (e.above ? "translate(-50%, -100%)" : "translateX(-50%)") + o;
}
function Ea({ valueFormatter: e, minGap: t = 4, mode: n = "per-segment", offset: r = 0 }) {
	let { series: i, scales: a, labels: s, theme: c, resolvePositionValue: d, axis: f, dimensions: p } = Z(), { hoverIndex: m } = ut(), h = f.orientation === "horizontal", g = f.isPercent, _ = e ?? da, v = o(() => Ca(Sa(pa({
		series: i,
		labels: s,
		scales: a,
		resolvePositionValue: d,
		valueFormatter: _,
		isHorizontal: h,
		mode: n,
		isPercent: g
	}), p, h), t, h), [
		i,
		s,
		a,
		d,
		_,
		t,
		h,
		n,
		g,
		p
	]), y = o(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of v) {
			let n = e.get(t.dataIndex) ?? /* @__PURE__ */ new Set();
			n.add(Math.round(t.x)), e.set(t.dataIndex, n);
		}
		let t = /* @__PURE__ */ new Set();
		for (let [n, r] of e) r.size === 1 && t.add(n);
		return t;
	}, [v]);
	if (v.length === 0) return null;
	let b = c.backgroundColor ?? "white";
	return /* @__PURE__ */ u(l, { children: v.map((e) => {
		let t = e.dataIndex === m && y.has(e.dataIndex);
		return /* @__PURE__ */ u("div", {
			"data-attr": "script-chart-value-label",
			style: {
				...wa,
				backgroundColor: e.color,
				borderColor: b,
				left: Math.round(e.x),
				top: Math.round(e.y),
				transform: Ta(e, h, t, r),
				willChange: t ? "transform" : void 0
			},
			children: e.text
		}, e.key);
	}) });
}
P.extend(F), P.extend(L), P.extend(I);
function Da(e, t) {
	let n = /([Zz]|[+-]\d{2}:?\d{2})$/.test(e);
	try {
		if (n) {
			let n = P(e);
			return n.isValid() ? n.tz(t) : P(null);
		}
		return P.tz(e, t);
	} catch {
		return P(null);
	}
}
//#endregion
//#region src/utils/dates.ts
function Oa({ interval: e, allDays: t, timezone: n }) {
	if (t.length === 0 || typeof t[0] != "string") return;
	let r = t.map((e) => ka(String(e), n)), i = r[0], a = r[r.length - 1];
	if (!i?.isValid() || !a?.isValid()) return;
	let o = ja(e ?? Ia(r), r, i, a);
	return (e, t) => {
		let n = r[t];
		return n?.isValid() ? Ma(o, n, t) ? Na(o, n, t) : null : String(e);
	};
}
var ka = Da;
function Aa({ interval: e, timezone: t }) {
	return (n) => {
		let r = Da(n, t);
		if (!r.isValid()) return n;
		switch (e) {
			case "second": return r.format("ddd, MMM D, HH:mm:ss");
			case "minute":
			case "hour": return r.format("ddd, MMM D, HH:mm");
			case "month": return r.format("MMM YYYY");
			case "week": return r.format("MMM D, YYYY");
			default: return r.format("ddd, MMM D, YYYY");
		}
	};
}
function ja(e, t, n, r) {
	let i = (r.year() - n.year()) * 12 + r.month() - n.month(), a = r.diff(n, "day");
	return e === "quarter" ? { type: "quarter" } : e === "year" ? { type: "year" } : e === "month" ? { type: "month" } : (e === "day" || e === "week") && i >= 3 ? {
		type: "monthly",
		visibleBoundaries: Ra(t)
	} : e === "day" || e === "week" ? { type: "day" } : a >= 2 ? {
		type: "hourly-multi-day",
		step: a <= 3 ? 6 : a <= 7 ? 12 : 24,
		dayStartIndices: La(t)
	} : { type: "hourly" };
}
function Ma(e, t, n) {
	switch (e.type) {
		case "monthly": return e.visibleBoundaries.has(n);
		case "hourly-multi-day": return e.dayStartIndices.has(n) ? !0 : e.dayStartIndices.size <= 3 && t.hour() % e.step === 0;
		default: return !0;
	}
}
function Na(e, t, n) {
	switch (e.type) {
		case "month":
		case "monthly": return Pa(t);
		case "quarter": return Fa(t);
		case "year": return String(t.year());
		case "day": return t.date() === 1 ? Pa(t) : t.format("MMM D");
		case "hourly-multi-day": return e.dayStartIndices.has(n) ? t.format("MMM D") : t.format("HH:mm");
		case "hourly": return t.format("HH:mm");
	}
}
function Pa(e) {
	return e.month() === 0 ? String(e.year()) : e.format("MMMM");
}
function Fa(e) {
	return e.month() === 0 ? String(e.year()) : `Q${Math.floor(e.month() / 3) + 1}`;
}
function Ia(e) {
	if (e.length < 2) return "day";
	let t = e[1].diff(e[0], "hour");
	if (t < 1) return "minute";
	if (t < 24) return "hour";
	let n = e[1].diff(e[0], "day");
	return n >= 300 ? "year" : n >= 80 ? "quarter" : n >= 25 ? "month" : n >= 5 ? "week" : "day";
}
function La(e) {
	let t = /* @__PURE__ */ new Set(), n = "";
	for (let r = 0; r < e.length; r++) {
		let i = e[r].format("YYYY-MM-DD");
		i !== n && (t.add(r), n = i);
	}
	return t;
}
function Ra(e) {
	let t = [];
	for (let n = 0; n < e.length; n++) {
		let r = n > 0 ? e[n - 1] : null;
		(!r || r.month() !== e[n].month()) && t.push(n);
	}
	let n = new Set(t), r = Math.max(3, Math.floor(e.length / 10));
	return t.length >= 2 && t[1] - t[0] < r && n.delete(t[0]), t.length >= 2 && t[t.length - 1] - t[t.length - 2] < r && n.delete(t[t.length - 1]), n;
}
//#endregion
//#region src/utils/y-formatters.ts
function za(e) {
	if (e < 0) return `-${za(-e)}`;
	let t = Math.abs(e);
	return t < 1e3 ? `${ae(e)}ns` : t < 1e6 ? `${ae(e / 1e3)}µs` : se(e / 1e9, { secondsFixed: 1 });
}
function Ba(e) {
	let { format: t, prefix: n, suffix: r, decimalPlaces: i, minDecimalPlaces: a, currency: o } = e;
	return (e) => {
		let s = ae(e, i ?? ie(e, a), a);
		switch (t) {
			case "duration":
				s = se(e);
				break;
			case "duration_ms":
				s = se(e / 1e3, { secondsFixed: 1 });
				break;
			case "duration_ns":
				s = za(e);
				break;
			case "percentage":
				s = ce(e / 100, i ?? ie(e, a));
				break;
			case "percentage_scaled":
				s = ce(e, i ?? ie(e * 100, a));
				break;
			case "currency":
				try {
					s = o ? Y(e, o) : oe(e);
				} catch {
					s = oe(e);
				}
				break;
			case "short":
				s = le(e);
				break;
			case "numeric":
			case void 0:
			default: break;
		}
		return `${n ?? ""}${s}${r ?? ""}`;
	};
}
//#endregion
//#region src/utils/use-axis-formatters.ts
function Va(e, t) {
	let n = e?.allDays ?? t;
	return o(() => {
		if (e?.tickFormatter) return e.tickFormatter;
		if (e?.timezone && e?.interval) return Oa({
			timezone: e.timezone,
			interval: e.interval,
			allDays: n
		});
	}, [
		e?.tickFormatter,
		e?.timezone,
		e?.interval,
		n
	]);
}
function Ha(e, t) {
	let { timezone: n, interval: r } = t ?? {};
	return o(() => e?.labelFormatter || !n || !r ? e : {
		...e,
		labelFormatter: Aa({
			interval: r,
			timezone: n
		})
	}, [
		e,
		n,
		r
	]);
}
function Ua(e) {
	if (e?.tickFormatter) return e.tickFormatter;
	if (!(e?.format === void 0 && e?.prefix === void 0 && e?.suffix === void 0 && e?.decimalPlaces === void 0 && e?.minDecimalPlaces === void 0 && e?.currency === void 0)) return Ba({
		format: e.format,
		prefix: e.prefix,
		suffix: e.suffix,
		decimalPlaces: e.decimalPlaces,
		minDecimalPlaces: e.minDecimalPlaces,
		currency: e.currency
	});
}
function Wa(e) {
	return Array.isArray(e) ? e.map((e, t) => ({
		id: e.id ?? (t === 0 ? "left" : `axis-${t}`),
		position: e.position ?? (t === 0 ? "left" : "right"),
		config: e
	})) : e ? [{
		id: X,
		position: "left",
		config: e
	}] : [];
}
function Ga(e) {
	return e.map(({ id: e, position: t, config: n }) => ({
		id: e,
		position: t,
		scaleType: n.scale,
		tickFormatter: Ua(n),
		label: n.label,
		hide: n.hide,
		startAtZero: n.startAtZero
	}));
}
function Ka(e) {
	return (e.find((e) => e.id === "left") ?? e[0])?.config;
}
function qa(e) {
	let { tickFormatter: t, format: n, prefix: r, suffix: i, decimalPlaces: a, minDecimalPlaces: s, currency: c } = e ?? {};
	return o(() => Ua({
		tickFormatter: t,
		format: n,
		prefix: r,
		suffix: i,
		decimalPlaces: a,
		minDecimalPlaces: s,
		currency: c
	}), [
		t,
		n,
		r,
		i,
		a,
		s,
		c
	]);
}
//#endregion
//#region src/utils/comparison-dimming.ts
var Ja = .5;
function Ya(e, t) {
	return !t || Object.keys(t).length === 0 ? e : e.map((e) => {
		if (!(e.key in t)) return e;
		let n = Xa(e.color, Ja);
		return n === e.color ? e : {
			...e,
			color: n
		};
	});
}
function Xa(e, t) {
	return !e || !e.startsWith("#") ? e : fe(e, t);
}
//#endregion
//#region src/utils/statistics.ts
function Za(e) {
	return R(e);
}
function Qa(e, t = .95) {
	let n = e.filter((e) => isFinite(e));
	if (n.length < 2) return [e.slice(), e.slice()];
	let r = B(n) / Math.sqrt(n.length), i = z((1 + t) / 2) * r, a = e.map((e) => e + i);
	return [e.map((e) => e - i), a];
}
function $a(e, t) {
	let n = e.length, r = t == null ? n : Math.max(2, Math.min(t, n)), i = e.slice(0, r).map((e, t) => [t, e]).filter(([, e]) => isFinite(e));
	if (i.length < 2) return e.slice();
	let { m: a, b: o } = Za(i);
	return e.map((e, t) => a * t + o);
}
function eo(e, t = 7) {
	let n = e.length;
	return n < t ? e.slice() : e.map((r, i) => {
		let a = Math.max(0, i - Math.floor(t / 2)), o = Math.min(n, a + t), s = Math.max(0, o - t), c = e.slice(s, o).filter((e) => isFinite(e));
		return c.length > 0 ? c.reduce((e, t) => e + t, 0) / c.length : r;
	});
}
//#endregion
//#region src/charts/utils/derived-series.ts
var to = .5, no = .2, ro = [10, 3], io = [1, 3];
function ao(e) {
	return {
		key: `${e.seriesKey}__ci`,
		label: `${e.label} (CI)`,
		data: e.upper,
		color: e.baseColor,
		yAxisId: e.yAxisId,
		meta: e.meta,
		fill: {
			opacity: no,
			lowerData: e.lower
		},
		visibility: {
			excluded: e.excluded,
			tooltip: !1,
			valueLabel: !1
		}
	};
}
function oo(e) {
	return `${e}-ma`;
}
function so(e) {
	let { sourceSeries: t, window: n } = e;
	return {
		key: oo(t.key),
		label: e.label ?? `${t.label} (Moving avg)`,
		data: eo(t.data, n),
		color: t.color,
		yAxisId: t.yAxisId,
		meta: t.meta,
		stroke: { pattern: ro },
		overlay: !0,
		visibility: {
			excluded: e.excluded,
			tooltip: !1
		}
	};
}
function co(e) {
	let { sourceSeries: t, kind: n, fitUpTo: r } = e, i = n === "exponential" ? lo(t.data, r) : $a(t.data, r), a = t.color;
	return {
		key: `${t.key}__trendline`,
		label: e.label ?? t.label,
		data: i,
		color: Xa(a, to),
		yAxisId: t.yAxisId,
		meta: t.meta,
		stroke: { pattern: io },
		overlay: !0,
		visibility: {
			excluded: e.excluded,
			tooltip: !1,
			valueLabel: !1
		}
	};
}
function lo(e, t) {
	let n = e.length;
	if (n < 2) return $a(e, t);
	let r = t == null ? n : Math.max(2, Math.min(t, n)), i = [];
	for (let n = 0; n < r; n++) {
		let r = e[n];
		if (r <= 0) return $a(e, t);
		i.push([n, Math.log(r)]);
	}
	let { m: a, b: o } = Za(i);
	return e.map((e, t) => Math.exp(a * t + o));
}
//#endregion
//#region src/charts/utils/use-derived-series.ts
function uo(e, t) {
	let { confidenceIntervals: n, movingAverage: r, trendLines: i, comparisonOf: a } = t;
	return o(() => {
		let t = n && n.length > 0 || r && r.length > 0 || i && i.length > 0, o = a && Object.keys(a).length > 0;
		if (!t && !o) return e;
		let s = new Map(e.map((e) => [e.key, e])), c = [];
		for (let e of n ?? []) {
			let t = s.get(e.seriesKey);
			t && c.push(ao({
				seriesKey: t.key,
				label: t.label,
				baseColor: t.color,
				lower: e.lower,
				upper: e.upper,
				yAxisId: t.yAxisId,
				meta: t.meta,
				excluded: t.visibility?.excluded
			}));
		}
		let l = [];
		for (let e of r ?? []) {
			let t = s.get(e.seriesKey);
			t && l.push(so({
				sourceSeries: t,
				window: e.window,
				label: e.label,
				excluded: t.visibility?.excluded
			}));
		}
		let u = s;
		if (l.length > 0) {
			u = new Map(s);
			for (let e of l) u.set(e.key, e);
		}
		let d = [];
		for (let e of i ?? []) {
			let t = u.get(e.seriesKey);
			t && d.push(co({
				sourceSeries: t,
				kind: e.kind,
				label: e.label,
				fitUpTo: e.fitUpTo,
				excluded: t.visibility?.excluded
			}));
		}
		return Ya([
			...c,
			...e,
			...l,
			...d
		], a);
	}, [
		e,
		po(n),
		mo(r),
		ho(i),
		go(a)
	]);
}
function fo(e, t) {
	return o(() => {
		if (!t?.length) return [];
		let n = new Map(e.map((e) => [e.key, e])), r = [];
		for (let e of t) {
			let t = n.get(e.seriesKey);
			t && r.push(co({
				sourceSeries: t,
				kind: e.kind,
				label: e.label,
				fitUpTo: e.fitUpTo,
				excluded: t.visibility?.excluded
			}));
		}
		return r;
	}, [e, ho(t)]);
}
function po(e) {
	return e?.length ? e.map((e) => `${e.seriesKey}|${yo(e.lower)}|${yo(e.upper)}`).join(";") : "";
}
function mo(e) {
	return e?.length ? e.map((e) => `${e.seriesKey}|${e.window}|${e.label ?? ""}`).join(";") : "";
}
function ho(e) {
	return e?.length ? e.map((e) => `${e.seriesKey}|${e.kind}|${e.label ?? ""}|${e.fitUpTo ?? ""}`).join(";") : "";
}
function go(e) {
	return e ? Object.entries(e).map(([e, t]) => `${e}=${t}`).sort().join(";") : "";
}
var _o = /* @__PURE__ */ new WeakMap(), vo = 1;
function yo(e) {
	let t = _o.get(e);
	return t === void 0 && (t = vo++, _o.set(e, t)), t;
}
//#endregion
//#region src/utils/goal-lines.ts
function bo(e) {
	let t = -Infinity;
	for (let n of e) if (!n.visibility?.excluded) for (let e of n.data) {
		let n = Number(e);
		n === 0 || !Number.isFinite(n) || n > t && (t = n);
	}
	return t === -Infinity ? 0 : t;
}
function xo(e, t) {
	if (!e?.length) return [];
	let n = bo(t);
	return e.filter((e) => e.displayIfCrossed !== !1 || e.value >= n).map((e) => ({
		value: e.value,
		orientation: "horizontal",
		label: e.displayLabel === !1 ? void 0 : e.label,
		labelPosition: e.labelPosition ?? "end",
		variant: "goal",
		style: e.color ? { color: e.color } : void 0
	}));
}
function So(e) {
	let t = e.map((e) => e.value).filter((e) => typeof e == "number");
	return t.length > 0 ? { include: t } : void 0;
}
//#endregion
//#region src/charts/utils/use-value-labels.ts
function Co(e) {
	return e === void 0 || e === !1 ? null : e === !0 ? {} : e;
}
function wo(e, t) {
	return o(() => {
		if (!t) return e;
		let n = new Set(t);
		return e.map((e) => n.has(e.key) ? e : {
			...e,
			visibility: {
				...e.visibility,
				valueLabel: !1
			}
		});
	}, [e, JSON.stringify(t ?? null)]);
}
//#endregion
//#region src/charts/utils/use-time-series.ts
function To(e, t, n, r) {
	let { xAxis: i, yAxis: a, valueLabels: s, legend: c } = r, l = o(() => Wa(a), [a]), u = o(() => Ka(l), [l]), d = o(() => Array.isArray(a) ? Ga(l) : void 0, [a, l]), f = Va(i, t), p = qa(u), { visibleSeries: m, legendProps: h } = K(e, n, c), g = Co(s);
	return {
		xTickFormatter: f,
		yTickFormatter: p,
		legendProps: h,
		visibleSeries: m,
		chartSeries: wo(m, g?.seriesKeys),
		valueLabelsConfig: g,
		valueLabelFormatter: g ? g.formatter ?? p : void 0,
		primaryYAxis: u,
		yAxes: d
	};
}
function Eo(e, t) {
	let n = o(() => xo(e, t), [e, t]);
	return {
		referenceLines: n,
		valueDomain: o(() => So(n), [n])
	};
}
//#endregion
//#region src/charts/TimeSeriesLineChart/TimeSeriesLineChart.tsx
function Do({ series: e, labels: t, theme: n, config: r, tooltip: i, onPointClick: a, onDateRangeZoom: o, dataAttr: s, className: c, children: l, onError: f }) {
	let { xAxis: p, yAxis: m, valueLabels: h, goalLines: g, confidenceIntervals: _, movingAverage: v, trendLines: y, comparisonOf: b, percentStackView: x, showCrosshair: S, showGrid: C, showAxisLines: w, showTickMarks: T, curve: E, tooltip: D, legend: O } = r ?? {}, { xTickFormatter: k, yTickFormatter: A, legendProps: j, chartSeries: M, valueLabelsConfig: N, valueLabelFormatter: P, primaryYAxis: F, yAxes: I } = To(e, t, n, {
		xAxis: p,
		yAxis: m,
		valueLabels: h,
		legend: O
	}), L = Ha(D, p), R = uo(M, {
		confidenceIntervals: _,
		movingAverage: v,
		trendLines: y,
		comparisonOf: b
	}), { referenceLines: z, valueDomain: B } = Eo(g, R), V = F?.startAtZero === !1 && F?.scale !== "log", H = {
		yScaleType: F?.scale,
		xTickFormatter: k,
		yTickFormatter: A,
		hideXAxis: p?.hide,
		hideYAxis: I ? I.length > 0 && I.every((e) => e.hide) : F?.hide,
		xAxisLabel: p?.label,
		yAxisLabel: F?.label,
		showGrid: F?.showGrid ?? C,
		showAxisLines: w,
		showTickMarks: T,
		curve: E,
		percentStackView: x,
		showCrosshair: S,
		tooltip: L,
		valueDomain: B,
		floatBaseline: V,
		yAxes: I
	};
	return /* @__PURE__ */ u(W, {
		...j,
		legendDataAttr: "script-chart-timeseries-line-legend",
		children: /* @__PURE__ */ d(zi, {
			series: R,
			labels: t,
			config: H,
			theme: n,
			tooltip: i,
			onPointClick: a,
			onDateRangeZoom: o,
			className: c,
			dataAttr: s,
			onError: f,
			children: [
				z.length > 0 && /* @__PURE__ */ u(Zi, { lines: z }),
				N && /* @__PURE__ */ u(Ea, { valueFormatter: P }),
				l
			]
		})
	});
}
//#endregion
//#region src/overlays/TrendLineOverlay.tsx
function Oo({ trendSeries: t }) {
	let n = e.useId(), { scales: r, dimensions: i, labels: a, axis: s } = Z(), { plotLeft: c, plotTop: l, plotWidth: f, plotHeight: p, width: m, height: h } = i, g = o(() => s.orientation === "horizontal" ? [] : t.filter((e) => !e.visibility?.excluded).map((e) => {
		let t = qe(r, e), n = [];
		for (let i = 0; i < a.length; i++) {
			let o = e.data[i];
			if (o == null || !isFinite(o)) continue;
			let s = r.x(a[i]), c = t(o);
			s == null || !isFinite(s) || !isFinite(c) || n.push(`${s},${c}`);
		}
		if (n.length < 2) return null;
		let i = e.stroke?.pattern ? e.stroke.pattern.join(",") : "6,4";
		return {
			key: e.key,
			points: n.join(" "),
			color: e.color ?? "currentColor",
			dashArray: i
		};
	}).filter((e) => e !== null), [
		t,
		r,
		a,
		s.orientation
	]);
	return g.length === 0 ? null : /* @__PURE__ */ d("svg", {
		style: {
			position: "absolute",
			left: 0,
			top: 0,
			width: m,
			height: h,
			pointerEvents: "none",
			overflow: "visible"
		},
		children: [/* @__PURE__ */ u("clipPath", {
			id: n,
			children: /* @__PURE__ */ u("rect", {
				x: c,
				y: l,
				width: f,
				height: p
			})
		}), /* @__PURE__ */ u("g", {
			clipPath: `url(#${n})`,
			children: g.map(({ key: e, points: t, color: n, dashArray: r }) => /* @__PURE__ */ u("polyline", {
				points: t,
				fill: "none",
				stroke: n,
				strokeWidth: 2,
				strokeDasharray: r,
				strokeLinecap: "round"
			}, e))
		})]
	});
}
//#endregion
//#region src/charts/TimeSeriesBarChart/TimeSeriesBarChart.tsx
function ko({ series: e, labels: t, theme: n, config: r, tooltip: i, onPointClick: a, onDateRangeZoom: o, dataAttr: s, className: c, children: l, onError: f }) {
	let { xAxis: p, yAxis: m, valueLabels: h, goalLines: g, barLayout: _, axisOrientation: v, barCornerRadius: y, showCrosshair: b, showGrid: x, showAxisLines: S, showTickMarks: C, tooltip: w, divergingStack: T, fillStyle: E, bandPadding: D, minBarSize: O, margins: k, animateHover: A, legend: j, trendLines: M } = r ?? {}, { xTickFormatter: N, yTickFormatter: P, legendProps: F, visibleSeries: I, chartSeries: L, valueLabelsConfig: R, valueLabelFormatter: z, primaryYAxis: B, yAxes: V } = To(e, t, n, {
		xAxis: p,
		yAxis: m,
		valueLabels: h,
		legend: j
	}), H = Ha(w, p), { referenceLines: ee, valueDomain: U } = Eo(g, L), G = fo(I, M), te = {
		margins: k,
		yScaleType: B?.scale,
		xTickFormatter: N,
		yTickFormatter: P,
		hideXAxis: p?.hide,
		hideYAxis: V ? V.length > 0 && V.every((e) => e.hide) : B?.hide,
		xAxisLabel: p?.label,
		yAxisLabel: B?.label,
		showGrid: B?.showGrid ?? x,
		showAxisLines: S,
		showTickMarks: C,
		barLayout: _,
		axisOrientation: v,
		showCrosshair: b,
		tooltip: H,
		animateHover: A,
		yAxes: V,
		barCornerRadius: y,
		bars: {
			divergingStack: T,
			valueDomain: U,
			fillStyle: E,
			bandPadding: D,
			minBarSize: O
		}
	};
	return /* @__PURE__ */ u(W, {
		...F,
		legendDataAttr: "script-chart-timeseries-bar-legend",
		children: /* @__PURE__ */ d(Ei, {
			series: L,
			labels: t,
			config: te,
			theme: n,
			tooltip: i,
			onPointClick: a,
			onDateRangeZoom: o,
			className: c,
			dataAttr: s,
			onError: f,
			children: [
				ee.length > 0 && /* @__PURE__ */ u(Zi, { lines: ee }),
				G.length > 0 && /* @__PURE__ */ u(Oo, { trendSeries: G }),
				R && /* @__PURE__ */ u(Ea, { valueFormatter: z }),
				l
			]
		})
	});
}
//#endregion
//#region src/charts/TimeSeriesComboChart/TimeSeriesComboChart.tsx
function Ao({ series: e, labels: t, theme: n, config: r, tooltip: i, onPointClick: a, dataAttr: o, className: s, children: c, onError: l }) {
	let { xAxis: f, yAxis: p, valueLabels: m, goalLines: h, defaultSeriesType: g, barLayout: _, divergingStack: v, barCornerRadius: y, showCrosshair: b, showGrid: x, showAxisLines: S, showTickMarks: C, curve: w, tooltip: T, legend: E, trendLines: D } = r ?? {}, { xTickFormatter: O, yTickFormatter: k, legendProps: A, visibleSeries: j, chartSeries: M, valueLabelsConfig: N, valueLabelFormatter: P, primaryYAxis: F, yAxes: I } = To(e, t, n, {
		xAxis: f,
		yAxis: p,
		valueLabels: m,
		legend: E
	}), L = Ha(T, f), { referenceLines: R, valueDomain: z } = Eo(h, M), B = fo(j, D), V = {
		yScaleType: F?.scale,
		xTickFormatter: O,
		yTickFormatter: k,
		hideXAxis: f?.hide,
		hideYAxis: I ? I.length > 0 && I.every((e) => e.hide) : F?.hide,
		xAxisLabel: f?.label,
		yAxisLabel: F?.label,
		showGrid: F?.showGrid ?? x,
		showAxisLines: S,
		showTickMarks: C,
		curve: w,
		showCrosshair: b,
		defaultSeriesType: g,
		barLayout: _,
		divergingStack: v,
		barCornerRadius: y,
		tooltip: L,
		valueDomain: z,
		yAxes: I
	};
	return /* @__PURE__ */ u(W, {
		...A,
		legendDataAttr: "script-chart-timeseries-combo-legend",
		children: /* @__PURE__ */ d(Wi, {
			series: M,
			labels: t,
			config: V,
			theme: n,
			tooltip: i,
			onPointClick: a,
			className: s,
			dataAttr: o,
			onError: l,
			children: [
				R.length > 0 && /* @__PURE__ */ u(Zi, { lines: R }),
				B.length > 0 && /* @__PURE__ */ u(Oo, { trendSeries: B }),
				N && /* @__PURE__ */ u(Ea, { valueFormatter: P }),
				c
			]
		})
	});
}
//#endregion
//#region src/charts/Sparkline/Sparkline.tsx
var jo = {
	hideXAxis: !0,
	hideYAxis: !0
}, Mo = {
	top: 6,
	right: 0,
	bottom: 6,
	left: 0
}, No = {
	top: 2,
	right: 0,
	bottom: 0,
	left: 0
};
function Po(e) {
	let { onError: t, ...n } = e;
	return /* @__PURE__ */ u(ei, {
		onError: t,
		children: /* @__PURE__ */ u(Fo, { ...n })
	});
}
function Fo({ data: e, series: t, labels: n, theme: r, color: i, type: a = "line", height: s = 120, fill: c = !1, fillOpacity: l = .35, dashedFromIndex: d, onHoverIndexChange: f, tooltip: p, className: m, dataAttr: h }) {
	let g = i ?? r.colors[0], _ = o(() => {
		if (t) return t;
		let n = {
			key: "sparkline",
			label: "sparkline",
			data: e ?? [],
			color: g
		};
		return a === "line" && (n.fill = {
			gradient: !0,
			opacity: l
		}, d != null && (n.stroke = { partial: { fromIndex: d } })), [n];
	}, [
		t,
		e,
		g,
		a,
		l,
		d
	]), v = o(() => Math.max(0, ..._.map(({ data: e }) => e.length)), [_]), y = o(() => n ?? Array.from({ length: v }, (e, t) => String(t)), [n, v]), b = p != null, x = o(() => ({
		...jo,
		...a === "bar" ? {
			barCornerRadius: 2,
			margins: No
		} : {
			showCrosshair: !0,
			margins: Mo
		},
		...b ? {} : { tooltip: { enabled: !1 } }
	}), [a, b]), S = o(() => c ? void 0 : { height: s }, [c, s]), C = f ? /* @__PURE__ */ u(Io, { onHoverChange: f }) : null;
	return /* @__PURE__ */ u("div", {
		className: `relative flex flex-col ${c ? "flex-1 min-h-0" : ""} ${m ?? ""}`,
		style: S,
		"data-attr": h,
		children: u(a === "bar" ? Ei : zi, {
			series: _,
			labels: y,
			theme: r,
			config: x,
			tooltip: p,
			children: C
		})
	});
}
function Io({ onHoverChange: e }) {
	let { hoverIndex: t } = ut(), n = $(e);
	return i(() => {
		n.current(t);
	}, [t, n]), i(() => () => n.current(-1), [n]), null;
}
//#endregion
//#region src/components/MetricCard/internals.tsx
var Lo = {
	background: "rgb(56 134 0 / 10%)",
	foreground: "#388600"
}, Ro = {
	background: "rgb(219 55 7 / 10%)",
	foreground: "#db3707"
}, zo = (e) => e.toLocaleString(), Bo = (e) => {
	let t = ce(e / 100, 1, !0);
	return e > 0 ? `+${t}` : t;
};
function Vo(e, t) {
	let n = e[t - 1], r = e[t];
	return t < 1 || n === 0 || !Number.isFinite(n) || !Number.isFinite(r) ? null : (r - n) / Math.abs(n) * 100;
}
function Ho(e, t, n, r, i) {
	return e == null ? null : t ? Vo(e, n) : i == null ? null : (r - i) / Math.abs(i) * 100;
}
function Uo({ positive: e, label: t, colors: n, size: r = "sm", tooltip: i }) {
	let a = /* @__PURE__ */ d("div", {
		className: `inline-flex items-center rounded-full font-medium transition-colors ${r === "md" ? "gap-1.5 px-2.5 py-1 text-sm" : "gap-1 px-2 py-0.5 text-xs"}`,
		style: {
			background: n.background,
			color: n.foreground
		},
		"data-attr": "metric-card-change-pill",
		children: [/* @__PURE__ */ u(qo, {
			up: e,
			size: r === "md" ? 12 : 10
		}), /* @__PURE__ */ u("span", {
			className: "tabular-nums",
			children: t
		})]
	});
	return i ? /* @__PURE__ */ u(Ko, {
		content: i,
		children: a
	}) : a;
}
var Wo = `var(--color-bg-surface-tooltip, ${rn})`, Go = `var(--color-text-primary-inverse, ${an})`;
function Ko({ content: e, children: t }) {
	let [n, r] = c(!1), i = s(null), { refs: a, floatingStyles: o, context: f } = D({
		open: n,
		onOpenChange: r,
		placement: "top",
		strategy: "fixed",
		whileElementsMounted: C,
		middleware: [
			T(8),
			w(),
			E({ padding: 8 }),
			S({ element: i })
		]
	}), { getReferenceProps: p, getFloatingProps: m } = k([O(f, { move: !1 }), A(f, { role: "tooltip" })]);
	return /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u("span", {
		ref: a.setReference,
		...p(),
		className: "inline-flex",
		children: t
	}), n && /* @__PURE__ */ u(x, { children: /* @__PURE__ */ d("div", {
		ref: a.setFloating,
		...m(),
		className: "pointer-events-none max-w-80 rounded-md px-3 py-1.5 text-xs font-normal leading-snug",
		style: {
			...o,
			zIndex: "var(--z-tooltip, 9999)",
			background: Wo,
			color: Go,
			boxShadow: "var(--modal-shadow-elevation, 0 2px 8px rgb(0 0 0 / 18%))"
		},
		children: [e, /* @__PURE__ */ u(b, {
			ref: i,
			context: f,
			fill: "currentColor",
			style: { color: Wo }
		})]
	}) })] });
}
function qo({ up: e, size: t = 10 }) {
	return /* @__PURE__ */ u("svg", {
		width: t,
		height: t,
		viewBox: "0 0 10 10",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "1.5",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		className: e ? "" : "rotate-180",
		children: /* @__PURE__ */ u("path", { d: "M2 6.5 L5 3.5 L8 6.5" })
	});
}
//#endregion
//#region src/components/MetricCard/resolveDelta.ts
function Jo({ showChange: e, change: t, fallbackChangePercent: n, formatChange: r }) {
	return e ? t === void 0 ? n == null || !Number.isFinite(n) ? null : {
		value: n,
		label: r(n)
	} : t === null || !Number.isFinite(t.value) ? null : {
		value: t.value,
		label: t.label ?? r(t.value)
	} : null;
}
//#endregion
//#region src/components/MetricCard/useAnimatedNumber.ts
function Yo(e, t = 350) {
	let [n, r] = c(e), a = s(n);
	return a.current = n, i(() => {
		if (t <= 0 || !Number.isFinite(e)) {
			r(e);
			return;
		}
		let n = a.current;
		if (n === e) return;
		let i = Or(), o = 0, s = () => {
			let a = Math.min(1, (Or() - i) / t), c = 1 - (1 - a) ** 3;
			r(n + (e - n) * c), a < 1 && (o = requestAnimationFrame(s));
		};
		return o = requestAnimationFrame(s), () => cancelAnimationFrame(o);
	}, [
		e,
		t,
		a
	]), n;
}
//#endregion
//#region src/components/MetricCard/useHoverIntent.ts
function Xo(e, t) {
	let [n, r] = c(e);
	return i(() => {
		if (t <= 0 || e < 0) {
			r(e);
			return;
		}
		let n = setTimeout(() => r(e), t);
		return () => clearTimeout(n);
	}, [e, t]), t <= 0 || e < 0 ? e : n;
}
//#endregion
//#region src/components/MetricCard/MetricCard.tsx
function Zo(e) {
	let { onError: t, ...n } = e;
	return /* @__PURE__ */ u(ei, {
		onError: t,
		children: /* @__PURE__ */ u(Qo, { ...n })
	});
}
function Qo({ title: e, value: t, data: n, labels: r, theme: i, color: a, sparklineHeight: s = 120, sparklineFill: l = !1, sparklineFillOpacity: f = .35, sparklineClassName: p = "mt-4", sparklineDashedFromIndex: m, formatValue: h = zo, formatChange: g = Bo, showChange: _ = !0, change: v, goodDirection: y = "up", changeSize: b = "sm", changeInline: x = !1, changeTooltip: S, positiveColor: C = Lo, negativeColor: w = Ro, subtitle: T, restingSubtitle: E, hoverChangeFromPreviousPoint: D = !1, animationMs: O = 350, hoverIntentMs: k = 140, className: A, dataAttr: j }) {
	let M = n != null && n.length > 0 && i != null ? n : null, N = M ? M.length - 1 : -1, [P, F] = c(-1), I = Xo(P, k), L = I >= 0 ? I : N, R = t ?? (M ? M[N] : void 0), z = Yo(M && I >= 0 ? M[I] ?? 0 : R ?? 0, O), B = o(() => M?.find((e) => e !== 0 && Number.isFinite(e)), [M]);
	if (R == null) return null;
	let V = M ? M[L] ?? 0 : R, H = D && I >= 0 && M != null, ee = Ho(M, H, I, V, B), U = Jo({
		showChange: _,
		change: H && v !== null ? void 0 : v,
		fallbackChangePercent: ee,
		formatChange: g
	}), W = H ? void 0 : S, G = h(M ? z : R), te = T ?? (I < 0 && E != null ? E : r?.[L]), K = U != null && U.value >= 0, q = (y === "up" ? K : !K) ? C : w, ne = U != null && !x ? U : null, J = e != null || ne != null, re = e == null ? "justify-end" : "justify-between", ie = /* @__PURE__ */ u("div", {
		className: `text-4xl font-bold tracking-tight tabular-nums${J ? " mt-2" : ""}`,
		children: G
	});
	return /* @__PURE__ */ d("div", {
		className: `flex flex-col w-full ${A ?? ""}`,
		"data-attr": j,
		children: [
			J && /* @__PURE__ */ d("div", {
				className: `flex items-start gap-2 ${re}`,
				children: [e != null && /* @__PURE__ */ u("div", {
					className: "text-sm font-medium",
					children: e
				}), ne != null && /* @__PURE__ */ u(Uo, {
					positive: K,
					label: ne.label,
					colors: q,
					size: b,
					tooltip: W
				})]
			}),
			x && U != null ? /* @__PURE__ */ d("div", {
				className: "flex items-center justify-between gap-2",
				children: [ie, /* @__PURE__ */ u(Uo, {
					positive: K,
					label: U.label,
					colors: q,
					size: b,
					tooltip: W
				})]
			}) : ie,
			te != null && te !== "" && /* @__PURE__ */ u("div", {
				className: "mt-1 text-sm opacity-60",
				"data-attr": "metric-card-subtitle",
				children: te
			}),
			M && i && /* @__PURE__ */ u(Po, {
				data: M,
				labels: r,
				theme: i,
				color: a,
				height: s,
				fill: l,
				fillOpacity: f,
				dashedFromIndex: m,
				onHoverIndexChange: F,
				className: p,
				dataAttr: "metric-card-sparkline"
			})
		]
	});
}
//#endregion
//#region src/core/radial-layout.ts
function $o(e, t) {
	let n = Math.atan2(e, -t);
	return n < 0 && (n += 2 * Math.PI), n;
}
function es(e, t, { outerSlack: n = 0 } = {}) {
	if (e.slices.length === 0) return -1;
	let r = t.x - e.cx, i = t.y - e.cy, a = Math.hypot(r, i);
	if (a < e.innerRadius || a > e.outerRadius + n) return -1;
	let o = $o(r, i), s = e.padAngle / 2;
	for (let t = 0; t < e.slices.length; t++) {
		let n = e.slices[t], r = n.startAngle + s, i = n.endAngle - s;
		if (!(r >= i)) {
			if (r < 0 || i > 2 * Math.PI) {
				let e = (r % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI), n = (i % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
				if (o >= e || o < n) return t;
				continue;
			}
			if (o >= r && o < i) return t;
		}
	}
	return -1;
}
//#endregion
//#region src/core/hooks/useRadialInteraction.ts
function ts(e, t, n, r) {
	let i = (t.innerRadius + t.outerRadius) / 2, a = t.cx + Math.sin(e.centroidAngle) * i, o = t.cy - Math.cos(e.centroidAngle) * i;
	return {
		dataIndex: e.seriesIndex,
		label: e.series.label,
		seriesData: [{
			series: e.series,
			value: e.value,
			color: e.color,
			fraction: e.fraction
		}],
		position: {
			x: a,
			y: o
		},
		hoverPosition: n,
		canvasBounds: r,
		isPinned: !1
	};
}
function ns({ layout: e, canvasRef: t, wrapperRef: r, showTooltip: i, onSliceClick: a, hitOuterSlack: s = 0 }) {
	let c = $(e), { hoverIndex: l, hoverPosition: u, tooltipCtx: d, setHover: f, setTooltipCtx: p, isPinned: m, clearTooltip: h } = Hr({
		wrapperRef: r,
		rebuildPinnedCtx: n((e) => {
			let n = c.current;
			if (!n) return e;
			let r = e.seriesData[0]?.series.key, i = n.slices.find((e) => e.series.key === r);
			if (!i) return null;
			let a = t.current?.getBoundingClientRect() ?? new DOMRect();
			return ts(i, n, e.hoverPosition, a);
		}, [c, t]),
		rebuildDeps: [e]
	}), g = $(l), _ = n((e) => {
		if (m) return;
		let n = c.current;
		if (!n || n.slices.length === 0) return;
		let r = e.currentTarget.getBoundingClientRect(), a = {
			x: e.clientX - r.left,
			y: e.clientY - r.top
		}, o = es(n, a, { outerSlack: s });
		if (o < 0) {
			h();
			return;
		}
		if (f(o, a), i) {
			let e = t.current?.getBoundingClientRect() ?? new DOMRect();
			p(ts(n.slices[o], n, a, e));
		}
	}, [
		m,
		c,
		s,
		i,
		f,
		p,
		h,
		t
	]), v = n(() => {
		m || h();
	}, [m, h]), y = n(() => {
		let e = g.current;
		if (e < 0 || !a) return;
		let t = c.current;
		if (!t) return;
		let n = t.slices[e];
		n && a({
			sliceIndex: e,
			series: n.series,
			value: n.value,
			fraction: n.fraction
		});
	}, [
		g,
		c,
		a
	]);
	return {
		hoverIndex: l,
		hoverPosition: u,
		tooltipCtx: d,
		handlers: o(() => ({
			onMouseMove: _,
			onMouseLeave: v,
			onClick: y
		}), [
			_,
			v,
			y
		])
	};
}
//#endregion
//#region src/core/radial-context.ts
var rs = t(null);
function is() {
	let e = r(rs);
	if (!e) throw Error("useRadialLayout must be used inside a radial chart component (e.g. <PieChart>)");
	return e;
}
//#endregion
//#region src/core/RadialChart.tsx
var as = {
	top: 8,
	right: 8,
	bottom: 8,
	left: 8
};
function os({ series: e, theme: t, buildLayout: n, drawStatic: r, drawHover: i, tooltip: a, showTooltip: s = !0, onSliceClick: c, hitOuterSlack: l = 0, hoverAnimationMs: f = 0, className: p, dataAttr: m, children: h }) {
	let { canvasRef: g, overlayCanvasRef: _, wrapperRef: v, dimensions: y, ctx: b, overlayCtx: x } = Er({ margins: as }), S = o(() => a ?? ((e) => /* @__PURE__ */ u(un, { ...e })), [a]), C = gr(e, t), w = o(() => y ? n(C, y) : null, [
		C,
		y,
		n
	]), T = o(() => w ? {
		x: () => void 0,
		y: () => 0,
		yTicks: () => [],
		_private: { __radialChart: { layout: w } }
	} : null, [w]), { hoverIndex: E, tooltipCtx: D, handlers: O } = ns({
		layout: w,
		canvasRef: g,
		wrapperRef: v,
		showTooltip: s,
		onSliceClick: c,
		hitOuterSlack: l
	});
	Ar({
		ctx: b,
		overlayCtx: x,
		dimensions: y,
		scales: T,
		series: C,
		labels: [],
		hoverIndex: E,
		hoverPosition: null,
		theme: t,
		drawStatic: r,
		drawHover: i,
		hoverAnimationMs: f
	});
	let k = o(() => `Pie chart with ${vr(C)} slices`, [C]), A = _r(g), j = o(() => !T || !y ? null : {
		scales: T,
		dimensions: y,
		labels: [],
		series: C,
		theme: t,
		resolvePositionValue: he,
		canvasBounds: A,
		axis: {
			orientation: "vertical",
			xTickFormatter: void 0,
			isPercent: !1
		},
		yGutters: []
	}, [
		T,
		y,
		C,
		t,
		A
	]), M = o(() => w ? {
		layout: w,
		canvasBounds: A
	} : null, [w, A]), N = o(() => ({ hoverIndex: E }), [E]);
	return /* @__PURE__ */ u(ct.Provider, {
		value: j,
		children: /* @__PURE__ */ u(rs.Provider, {
			value: M,
			children: /* @__PURE__ */ u(lt.Provider, {
				value: N,
				children: /* @__PURE__ */ d(br, {
					wrapperRef: v,
					canvasRef: g,
					overlayCanvasRef: _,
					className: p,
					dataAttr: m,
					pointer: E >= 0 && !!c,
					ariaLabel: k,
					handlers: O,
					showOverlay: !!(y && w),
					children: [h, D && s && /* @__PURE__ */ u(pn, {
						context: D,
						renderTooltip: S,
						placement: "cursor"
					})]
				})
			})
		})
	});
}
//#endregion
//#region src/charts/BoxPlot/BoxPlotTooltip.tsx
var ss = [
	{
		label: "Max",
		key: "max"
	},
	{
		label: "75th percentile",
		key: "p75"
	},
	{
		label: "Median",
		key: "median"
	},
	{
		label: "Mean",
		key: "mean"
	},
	{
		label: "25th percentile",
		key: "p25"
	},
	{
		label: "Min",
		key: "min"
	}
];
function cs(e) {
	return Number.isFinite(e) ? e.toLocaleString() : "—";
}
function ls({ ctx: e, userTooltip: t, grouped: n }) {
	if (t) return /* @__PURE__ */ u(l, { children: t(e) });
	let r = [];
	for (let t of e.seriesData) {
		if (t.series.visibility?.tooltip === !1) continue;
		let n = t.series.meta?.datums?.[e.dataIndex];
		n && r.push({
			key: t.series.key,
			color: t.color,
			label: t.series.label,
			datum: n
		});
	}
	return r.length === 0 ? null : /* @__PURE__ */ d(on, {
		"data-attr": "script-chart-boxplot-tooltip",
		children: [/* @__PURE__ */ u("div", {
			className: "font-semibold mb-1",
			children: e.label
		}), r.map((e, t) => /* @__PURE__ */ d("div", {
			className: t > 0 ? "mt-2" : void 0,
			children: [n && /* @__PURE__ */ d("div", {
				className: "flex items-center gap-2 mb-1",
				children: [/* @__PURE__ */ u(sn, { color: e.color }), /* @__PURE__ */ u("span", {
					className: "font-semibold",
					children: e.label
				})]
			}), /* @__PURE__ */ u("table", {
				className: "border-collapse",
				children: /* @__PURE__ */ u("tbody", { children: ss.map((t) => /* @__PURE__ */ d("tr", { children: [/* @__PURE__ */ u("td", {
					className: "pr-3 opacity-70",
					children: t.label
				}), /* @__PURE__ */ u("td", {
					className: "font-medium",
					children: cs(e.datum[t.key])
				})] }, t.key)) })
			})]
		}, e.key))]
	});
}
//#endregion
//#region src/charts/BoxPlot/computeBoxLayout.ts
function us(e, t, n, r) {
	if (r) return Ve(n, t, e) ?? null;
	let i = n.band(t);
	return i == null ? null : {
		x: i,
		width: n.band.bandwidth()
	};
}
function ds({ seriesKey: e, label: t, dataIndex: n, datum: r, scales: i, grouped: a }) {
	if (!Number.isFinite(r.min) || !Number.isFinite(r.max) || !Number.isFinite(r.p25) || !Number.isFinite(r.p75) || !Number.isFinite(r.median) || !Number.isFinite(r.mean)) return null;
	let o = us(e, t, i, a);
	if (!o) return null;
	let s = i.value(r.p25), c = i.value(r.p75), l = i.value(r.median), u = i.value(r.mean), d = i.value(r.max), f = i.value(r.min);
	if (!Number.isFinite(s) || !Number.isFinite(c) || !Number.isFinite(l) || !Number.isFinite(u) || !Number.isFinite(d) || !Number.isFinite(f)) return null;
	let p = Math.min(s, c), m = Math.max(s, c), h = Math.min(f, d), g = Math.max(f, d);
	return {
		x: o.x,
		width: o.width,
		top: p,
		bottom: m,
		medianY: l,
		mean: {
			x: o.x + o.width / 2,
			y: u
		},
		whiskerTop: h,
		whiskerBottom: g,
		dataIndex: n
	};
}
function fs({ seriesKey: e, data: t, labels: n, scales: r, grouped: i }) {
	let a = [], o = Math.min(t.length, n.length);
	for (let s = 0; s < o; s++) {
		let o = t[s];
		if (!o) continue;
		let c = ds({
			seriesKey: e,
			label: n[s],
			dataIndex: s,
			datum: o,
			scales: r,
			grouped: i
		});
		c && a.push(c);
	}
	return a;
}
//#endregion
//#region src/charts/BoxPlot/utils/boxes-under-cursor.ts
function ps(e, t) {
	return t.x >= e.x && t.x <= e.x + e.width;
}
function ms(e) {
	let { series: t, label: n, dataIndex: r, cursor: i, scales: a, grouped: o } = e, s = /* @__PURE__ */ new Set();
	for (let e of t) {
		if (e.visibility?.excluded || !e.data[r]) continue;
		let t = us(e.key, n, a, o);
		t && ps(t, i) && s.add(e.key);
	}
	return s;
}
//#endregion
//#region src/charts/BoxPlot/BoxPlot.tsx
function hs({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(gs, { ...t })
	});
}
function gs({ series: e, labels: t, theme: r, config: i, tooltip: a, onBoxClick: s, className: c, dataAttr: l, children: d }) {
	let { yScaleType: f = "linear", showGrid: p = !1, meanRadius: m = 3, whiskerCapRatio: h = .6, boxStrokeWidth: g = 1.5 } = i ?? {}, _ = e.filter((e) => !e.visibility?.excluded).length > 1, v = o(() => e.map((e) => ({
		key: e.key,
		label: e.label,
		color: e.color,
		data: Array.from({ length: t.length }, (t, n) => {
			let r = e.data[n];
			return r && Number.isFinite(r.median) ? r.median : NaN;
		}),
		meta: {
			datums: e.data,
			user: e.meta
		},
		visibility: e.visibility
	})), [e, t.length]), y = o(() => {
		let t = [];
		for (let n of e) {
			if (n.visibility?.excluded) continue;
			let e = [], r = [];
			for (let t of n.data) t && (Number.isFinite(t.min) && e.push(t.min), Number.isFinite(t.max) && r.push(t.max));
			e.length > 0 && t.push({
				key: `${n.key}__min`,
				label: n.label,
				data: e
			}), r.length > 0 && t.push({
				key: `${n.key}__max`,
				label: n.label,
				data: r
			});
		}
		return t;
	}, [e]), { datumsByKey: b, seriesByKey: x } = o(() => {
		let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Map();
		for (let r of e) t.set(r.key, r.data), n.set(r.key, r);
		return {
			datumsByKey: t,
			seriesByKey: n
		};
	}, [e]), S = n((e, t, n) => {
		let r = He(e, t, n, {
			scaleType: f,
			barLayout: _ ? "grouped" : "stacked",
			axisOrientation: "vertical",
			stackedSeries: y.length > 0 ? y : void 0
		}), i = we(n.plotHeight);
		return {
			x: (e, t) => {
				let n = r.band(e);
				if (n != null) {
					if (_ && t != null) {
						let e = r.group?.(t), i = r.group?.bandwidth();
						if (e != null && i != null) return n + e + i / 2;
					}
					return n + r.band.bandwidth() / 2;
				}
			},
			y: (e) => r.value(e),
			yTicks: () => r.value.ticks?.(i) ?? [],
			_private: { __boxPlot: {
				scales: r,
				datumsByKey: b,
				grouped: _
			} }
		};
	}, [
		_,
		f,
		y,
		b
	]), C = n(({ ctx: e, dimensions: t, scales: n, series: r, labels: i, theme: a }) => {
		let o = n._private?.__boxPlot;
		if (!o) return;
		let s = {
			ctx: e,
			dimensions: t,
			xScale: (e) => {
				let t = o.scales.band(e);
				return t == null ? void 0 : t + o.scales.band.bandwidth() / 2;
			},
			yScale: o.scales.value,
			labels: i
		};
		p && Bn(s, {
			gridColor: a.gridColor,
			gridDash: a.gridDashPattern,
			orientation: "vertical"
		});
		for (let t of r) {
			if (t.visibility?.excluded) continue;
			let n = o.datumsByKey.get(t.key);
			n && ir(e, fs({
				seriesKey: t.key,
				data: n,
				labels: i,
				scales: o.scales,
				grouped: o.grouped
			}), {
				color: t.color,
				fillColor: mn(t.color, .25),
				meanFillColor: mn(t.color, .5),
				meanRadius: m,
				whiskerCapRatio: h,
				lineWidth: g
			});
		}
	}, [
		p,
		m,
		h,
		g
	]), w = n(({ ctx: t, scales: n, series: r, labels: i, hoverIndex: a, hoverPosition: o }) => {
		let s = n._private?.__boxPlot;
		if (!s || a < 0 || !o) return !1;
		let c = i[a], l = ms({
			series: e,
			label: c,
			dataIndex: a,
			cursor: o,
			scales: s.scales,
			grouped: s.grouped
		});
		if (l.size === 0) return !1;
		let u = !1;
		for (let e of r) {
			if (e.visibility?.excluded || !l.has(e.key)) continue;
			let n = s.datumsByKey.get(e.key)?.[a];
			if (!n) continue;
			let r = ds({
				seriesKey: e.key,
				label: c,
				dataIndex: a,
				datum: n,
				scales: s.scales,
				grouped: s.grouped
			});
			r && (ar(t, r, mn(e.color, .25)), u = !0);
		}
		return u;
	}, [e]), T = n((e) => /* @__PURE__ */ u(ls, {
		ctx: e,
		userTooltip: a,
		grouped: _
	}), [a, _]), E = n((e) => {
		if (!s) return;
		let t = e.series.meta?.datums?.[e.dataIndex], n = x.get(e.series.key);
		if (!t || !n) return;
		let r = [];
		for (let t of e.crossSeriesData) {
			let n = t.series.meta?.datums?.[e.dataIndex], i = x.get(t.series.key);
			!n || !i || r.push({
				series: i,
				datum: n
			});
		}
		s({
			series: n,
			seriesIndex: e.seriesIndex,
			dataIndex: e.dataIndex,
			label: e.label,
			datum: t,
			crossSeriesData: r
		});
	}, [s, x]);
	return /* @__PURE__ */ u(Qr, {
		series: v,
		labels: t,
		config: {
			...i,
			axisOrientation: "vertical"
		},
		theme: r,
		createScales: S,
		drawStatic: C,
		drawHover: w,
		tooltip: T,
		onPointClick: E,
		valueRangeSeries: y.length > 0 ? y : void 0,
		className: c,
		dataAttr: l,
		children: d
	});
}
//#endregion
//#region src/charts/Heatmap/heatmap-layout.ts
function _s(e, t, n) {
	return {
		cols: t,
		rows: n,
		colWidth: t > 0 ? e.plotWidth / t : 0,
		rowHeight: n > 0 ? e.plotHeight / n : 0,
		plotLeft: e.plotLeft,
		plotTop: e.plotTop,
		plotWidth: e.plotWidth,
		plotHeight: e.plotHeight
	};
}
function vs(e, t, n) {
	return {
		x: e.plotLeft + t * e.colWidth,
		y: e.plotTop + e.plotHeight - (n + 1) * e.rowHeight,
		width: e.colWidth,
		height: e.rowHeight
	};
}
function ys(e, t) {
	if (e.rows === 0 || e.rowHeight <= 0) return -1;
	let n = xs(e, t);
	return n >= 0 && n < e.rows ? n : -1;
}
function bs(e, t) {
	return e.rows === 0 || e.rowHeight <= 0 ? -1 : Math.max(0, Math.min(e.rows - 1, xs(e, t)));
}
function xs(e, t) {
	return Math.floor((e.plotTop + e.plotHeight - t) / e.rowHeight);
}
function Ss(e) {
	let t = 0;
	for (let n of e) for (let e of n) Number.isFinite(e) && e > t && (t = e);
	return t;
}
function Cs(e, t, n) {
	if (!(t > 0) || !(e > 0)) return 0;
	let r = n === "linear" ? e / t : Math.log1p(e) / Math.log1p(t);
	return Math.max(0, Math.min(1, r));
}
var ws = .15;
function Ts(e) {
	let t = /* @__PURE__ */ new Map();
	return (n) => {
		let r = ws + (1 - ws) * Math.max(0, Math.min(1, n)), i = Math.round(r * 255), a = t.get(i);
		return a === void 0 && (a = mn(e, i / 255), t.set(i, a)), a;
	};
}
//#endregion
//#region src/charts/Heatmap/Heatmap.tsx
var Es = 8, Ds = .5;
function Os({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(ks, { ...t })
	});
}
function ks({ xLabels: e, yLabels: t, cells: r, theme: i, config: a, tooltip: s, onCellClick: c, onBrush: l, className: d, dataAttr: f, children: p }) {
	let { colorScale: m = "log" } = a ?? {}, h = o(() => hn(a?.color || i.colors[0] || "#3d3d3d"), [a?.color, i.colors]), g = o(() => t.map((t, n) => e.map((e, t) => r[n]?.[t] ?? 0)), [
		t,
		e,
		r
	]), _ = o(() => e.map((e, t) => `${t}`), [e]), v = n((t) => e[Number(t)] ?? t, [e]), y = o(() => Ss(g), [g]), b = o(() => t.map((e, t) => ({
		key: `row:${t}`,
		label: e,
		data: g[t],
		color: h,
		meta: { rowIndex: t }
	})), [
		t,
		g,
		h
	]), x = n((e) => t.length === 0 ? "" : t[Math.min(t.length - 1, Math.max(0, Math.round(e - .5)))] ?? "", [t]), S = o(() => [{
		key: "__heatmap-rows",
		label: "",
		data: t.map((e, t) => t + .5)
	}], [t]), C = n((e, n, r) => {
		let i = _s(r, n.length, t.length), a = new Map(n.map((e, t) => [e, t]));
		return {
			x: (e) => {
				let t = a.get(e);
				return t == null ? void 0 : i.plotLeft + (t + .5) * i.colWidth;
			},
			y: (e) => i.plotTop + i.plotHeight - e * i.rowHeight,
			yTicks: () => t.map((e, t) => t + .5),
			extent: () => i.colWidth,
			_private: { __heatmap: {
				layout: i,
				cells: g,
				accent: h,
				maxValue: y,
				colorScale: m
			} }
		};
	}, [
		t,
		g,
		h,
		y,
		m
	]), w = n(({ ctx: e, scales: t }) => {
		let n = t._private?.__heatmap;
		if (!n) return;
		let { layout: r, cells: i, accent: a, maxValue: o, colorScale: s } = n, c = Ts(a), l = +(r.colWidth > 3 && r.rowHeight > 3);
		for (let t = 0; t < r.rows; t++) {
			let n = i[t];
			if (n) for (let i = 0; i < r.cols; i++) {
				let a = n[i];
				if (!(a > 0)) continue;
				let u = vs(r, i, t);
				e.fillStyle = c(Cs(a, o, s)), e.fillRect(u.x + l / 2, u.y + l / 2, u.width - l, u.height - l);
			}
		}
	}, []), T = n(({ ctx: e, scales: t, hoverIndex: n, hoverPosition: r, hoverProgress: i }) => {
		let a = t._private?.__heatmap;
		if (!a || n < 0 || !r) return !1;
		let o = ys(a.layout, r.y);
		if (o < 0) return !1;
		let s = vs(a.layout, n, o);
		return e.save(), e.globalAlpha = i, e.strokeStyle = a.accent, e.lineWidth = 1.5, e.strokeRect(s.x + .75, s.y + .75, s.width - 1.5, s.height - 1.5), e.restore(), !0;
	}, []), E = n((e) => (e.meta?.rowIndex ?? 0) + 1, []), D = n((e) => e.meta?.rowIndex ?? 0, []), O = n((e, t) => {
		let n = t._private?.__heatmap;
		if (!n || !e.cursor) return e;
		let r = ys(n.layout, e.cursor.y), i = e.crossSeriesData.find((e) => e.series.meta?.rowIndex === r);
		return r < 0 || !i ? e : {
			...e,
			series: i.series,
			seriesIndex: r,
			value: i.value
		};
	}, []), k = n((e, t) => {
		let n = t._private?.__heatmap;
		if (!n || !l) return;
		let { layout: r } = n;
		if (r.rows === 0) return;
		let i = 0, a = r.rows - 1;
		if (Math.abs(e.yPixel1 - e.yPixel0) >= Es) {
			let t = bs(r, e.yPixel0 + Ds), n = bs(r, e.yPixel1 - Ds);
			i = Math.min(t, n), a = Math.max(t, n);
		}
		l({
			x: {
				startIndex: e.startIndex,
				endIndex: e.endIndex
			},
			y: {
				startIndex: i,
				endIndex: a
			}
		});
	}, [l]), A = n((n) => {
		let r = n.series.meta?.rowIndex;
		r == null || !c || c({
			xIndex: n.dataIndex,
			yIndex: r,
			xLabel: e[n.dataIndex] ?? "",
			yLabel: t[r] ?? "",
			value: n.value
		});
	}, [
		c,
		e,
		t
	]), j = a?.xTickFormatter, M = n((e, t) => {
		let n = v(e);
		return j ? j(n, t) : n;
	}, [v, j]), N = a?.tooltip?.labelFormatter, P = a?.tooltip?.valueFormatter, F = o(() => (e) => {
		let t = {
			...e,
			label: v(e.label)
		};
		if (s) return s(t);
		let n = t.hoverPosition ? cn(t.seriesData, t.hoverPosition.y) : null, r = t.seriesData.find((e) => e.series.key === n);
		return r ? /* @__PURE__ */ u(un, {
			...t,
			seriesData: [r],
			labelFormatter: N,
			valueFormatter: P
		}) : null;
	}, [
		s,
		v,
		N,
		P
	]);
	return /* @__PURE__ */ u(Qr, {
		series: b,
		labels: _,
		config: o(() => ({
			xTickFormatter: M,
			yTickFormatter: x,
			xAxisLabel: a?.xAxisLabel,
			yAxisLabel: a?.yAxisLabel,
			hideXAxis: a?.hideXAxis,
			hideYAxis: a?.hideYAxis,
			margins: a?.margins,
			tooltip: {
				enabled: a?.tooltip?.enabled,
				placement: "cursor"
			}
		}), [
			M,
			x,
			a?.xAxisLabel,
			a?.yAxisLabel,
			a?.hideXAxis,
			a?.hideYAxis,
			a?.margins,
			a?.tooltip?.enabled
		]),
		theme: i,
		createScales: C,
		drawStatic: w,
		drawHover: T,
		tooltip: F,
		onPointClick: c ? A : void 0,
		onAreaSelect: l ? k : void 0,
		wrapClickData: O,
		resolvePositionValue: E,
		resolveBottomValue: D,
		valueRangeSeries: S,
		className: d,
		dataAttr: f,
		children: p
	});
}
//#endregion
//#region src/charts/SlopeChart/slope-data.ts
function As(e, t, n) {
	if (e.visibility?.excluded || e.visibility?.valueLabel === !1) return !1;
	let r = e.meta;
	return (t === "start" ? r?.showStartLabel : r?.showEndLabel) ?? n;
}
function js(e) {
	return e.data[0] ?? 0;
}
function Ms(e) {
	return e.data[e.data.length - 1] ?? 0;
}
function Ns(e) {
	return Ms(e) - js(e);
}
function Ps(e) {
	return [...e].sort((e, t) => t.value - e.value);
}
function Fs(e) {
	return e.toLocaleString();
}
function Is(e) {
	return `${e > 0 ? "+" : ""}${e.toLocaleString()}`;
}
//#endregion
//#region src/charts/SlopeChart/slope-legend.ts
function Ls(e, t, n) {
	let r = new Map(e.map((e) => [e.key, e]));
	return G(e, t).map((e) => ({
		...e,
		secondaryLabel: n(Ns(r.get(e.key)))
	})).sort((e, t) => Ms(r.get(t.key)) - Ms(r.get(e.key)));
}
//#endregion
//#region src/core/label-collision.ts
function Rs(e, t) {
	return Math.abs(e.x - t.x) < e.halfWidth + t.halfWidth && Math.abs(e.y - t.y) < e.halfHeight + t.halfHeight;
}
function zs(e) {
	let t = [], n = /* @__PURE__ */ new Set();
	for (let r of [...e].sort((e, t) => t.value - e.value)) t.every((e) => !Rs(r, e)) && (t.push(r), n.add(r.key));
	return n;
}
var Bs = 600, Vs = `${Bs} 12px ${ft}`;
function Hs({ x: e, y: t, transform: n, color: r, text: i, dataAttr: a, side: o }) {
	return /* @__PURE__ */ u("div", {
		"data-attr": a,
		"data-slope-side": o,
		style: {
			position: "absolute",
			left: Math.round(e),
			top: Math.round(t),
			transform: n,
			color: r,
			fontSize: 12,
			fontWeight: Bs,
			lineHeight: 1,
			whiteSpace: "nowrap",
			pointerEvents: "none"
		},
		children: i
	});
}
//#endregion
//#region src/charts/SlopeChart/SlopeSeriesLabels.tsx
var Us = 4, Ws = 3;
function Gs({ show: e = !0, offsetX: t = 8 }) {
	let { series: n, scales: r, labels: i } = Z(), a = o(() => {
		if (!e || i.length < 2) return [];
		let a = r.x(i[i.length - 1]);
		if (a == null) return [];
		let o = [];
		for (let e of n) {
			if (e.visibility?.excluded || e.visibility?.valueLabel === !1) continue;
			let n = r.y(Ms(e));
			if (!isFinite(n)) continue;
			let i = _t(e.label, Vs);
			o.push({
				color: e.color,
				label: e.label,
				box: {
					key: e.key,
					x: a + t + i / 2,
					y: n,
					halfWidth: i / 2 + Us,
					halfHeight: 12 / 2 + Ws,
					value: Math.abs(Ns(e)),
					lines: [e.label]
				}
			});
		}
		return o;
	}, [
		n,
		r,
		i,
		e,
		t
	]), s = o(() => zs(a.map((e) => e.box)), [a]);
	return a.length === 0 ? null : /* @__PURE__ */ u(l, { children: a.filter((e) => s.has(e.box.key)).map((e) => /* @__PURE__ */ u(Hs, {
		x: e.box.x,
		y: e.box.y,
		transform: "translate(-50%, -50%)",
		color: e.color,
		text: e.label,
		dataAttr: "script-chart-slope-series-label"
	}, e.box.key)) });
}
//#endregion
//#region src/charts/SlopeChart/SlopeValueLabels.tsx
var Ks = 16;
function qs(e, t) {
	let n = [...e].sort((e, t) => e.y - t.y), r = [], i = Ks / 2, a = -Infinity;
	for (let e of n) e.y - i >= a + t && (r.push(e), a = e.y + i);
	return r;
}
function Js({ valueFormatter: e = Fs, showStartLabels: t = !0, showEndLabels: n = !0, gap: r = 8, minGap: i = 2 }) {
	let { series: a, scales: s, labels: c } = Z(), d = o(() => {
		if (c.length < 2) return [];
		let r = s.x(c[0]), o = s.x(c[c.length - 1]), l = [], u = [];
		for (let i of a) {
			if (As(i, "start", t) && r != null) {
				let t = s.y(js(i));
				isFinite(t) && l.push({
					key: i.key,
					side: "start",
					text: e(js(i)),
					color: i.color,
					x: r,
					y: t
				});
			}
			if (As(i, "end", n) && o != null) {
				let t = s.y(Ms(i));
				isFinite(t) && u.push({
					key: i.key,
					side: "end",
					text: e(Ms(i)),
					color: i.color,
					x: o,
					y: t
				});
			}
		}
		return [...qs(l, i), ...qs(u, i)];
	}, [
		a,
		s,
		c,
		e,
		t,
		n,
		i
	]);
	return d.length === 0 ? null : /* @__PURE__ */ u(l, { children: d.map((e) => /* @__PURE__ */ u(Hs, {
		x: e.x,
		y: e.y,
		transform: e.side === "start" ? `translate(calc(-100% - ${r}px), -50%)` : `translate(${r}px, -50%)`,
		color: e.color,
		text: e.text,
		dataAttr: "script-chart-slope-value-label",
		side: e.side
	}, `${e.side}-${e.key}`)) });
}
//#endregion
//#region src/charts/SlopeChart/SlopeChart.tsx
var Ys = `600 12px ${ft}`, Xs = 8, Zs = 8, Qs = 8, $s = 4;
function ec({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(nc, { ...t })
	});
}
function tc(e) {
	return e.reduce((e, t) => Math.max(e, _t(t, Ys)), 0);
}
function nc({ series: e, labels: t, config: r, theme: i, tooltip: a, onPointClick: s, className: c, dataAttr: l, children: f }) {
	let { showSeriesLabels: p = !0, showStartLabels: m = !0, showEndLabels: h = !0, legend: g, valueFormatter: _ = Fs, deltaFormatter: v = Is, pointRadius: y = $s, valueDomain: b } = r ?? {}, x = n((e) => As(e, "start", m), [m]), S = n((e) => As(e, "end", h), [h]), { visibleSeries: C, legendProps: w } = K(e, i, g, o(() => Ls(e, i, v), [
		e,
		i,
		v
	])), T = o(() => t.length > 2 ? [t[0], t[t.length - 1]] : t, [t]), { margins: E, nameOffsetX: D } = o(() => {
		let e = tc(C.filter(x).map((e) => _(js(e)))), t = tc(C.filter(S).map((e) => _(Ms(e)))), n = p ? tc(C.filter((e) => !e.visibility?.excluded && e.visibility?.valueLabel !== !1).map((e) => e.label)) : 0, i = T.length > 0 ? _t(T[0], pt) / 2 : 0, a = T.length > 1 ? _t(T[T.length - 1], pt) / 2 : 0, o = Math.max(e > 0 ? e + Xs + Qs : Qs, i + Qs), s = t > 0 ? Xs + t : 0, c = n > 0 ? Zs + n : 0, l = Math.max(s || c ? s + c + Qs : Qs, a + Qs), u = (t > 0 ? Xs + t : 0) + Zs;
		return {
			margins: Dt({
				left: o,
				right: l
			}, r?.margins ?? {}),
			nameOffsetX: u
		};
	}, [
		C,
		T,
		x,
		S,
		p,
		_,
		r?.margins
	]), O = o(() => C.some((e) => e.meta?.incompleteEnd), [C]), k = o(() => C.map((e) => ({
		...e,
		data: [js(e), Ms(e)],
		points: {
			...e.points,
			radius: y
		},
		...O ? { stroke: {
			...e.stroke,
			partial: {
				...e.stroke?.partial,
				fromFraction: .5
			}
		} } : {}
	})), [
		C,
		y,
		O
	]), A = o(() => ({
		...r,
		legend: void 0,
		hideYAxis: r?.hideYAxis ?? !0,
		showGrid: !1,
		margins: E,
		valueDomain: b
	}), [
		r,
		E,
		b
	]), j = n((e) => /* @__PURE__ */ u(un, {
		...e,
		seriesData: Ps(e.seriesData),
		valueFormatter: _
	}), [_]);
	return /* @__PURE__ */ u(W, {
		...w,
		legendDataAttr: "script-chart-slope-legend",
		children: /* @__PURE__ */ d(zi, {
			series: k,
			labels: T,
			config: A,
			theme: i,
			tooltip: a ?? j,
			onPointClick: s,
			className: c,
			dataAttr: l,
			children: [
				/* @__PURE__ */ u(Js, {
					valueFormatter: _,
					showStartLabels: m,
					showEndLabels: h
				}),
				/* @__PURE__ */ u(Gs, {
					show: p,
					offsetX: D
				}),
				f
			]
		})
	});
}
//#endregion
//#region src/charts/PieChart/computePieLayout.ts
function rc(e) {
	let t = 0;
	for (let n of e.data) typeof n == "number" && Number.isFinite(n) && (t += n);
	return t;
}
function ic(e) {
	let { series: t, dimensions: n, sliceValue: r = rc, innerRadiusRatio: i = 0, padAngle: a = 0, sort: o = null, radiusPadding: s = .92 } = e, c = n.plotLeft + n.plotWidth / 2, l = n.plotTop + n.plotHeight / 2, u = Math.min(n.plotWidth, n.plotHeight), d = Math.max(0, u / 2 * s), f = Math.max(0, Math.min(i, .95)) * d, p = [];
	for (let e = 0; e < t.length; e++) {
		let n = t[e];
		if (n.visibility?.excluded) continue;
		let i = r(n), a = typeof i == "number" && Number.isFinite(i) && i > 0 ? i : 0;
		p.push({
			series: n,
			value: a,
			seriesIndex: e
		});
	}
	let m = 0;
	for (let e of p) m += e.value;
	if (m <= 0 || p.length === 0 || d <= 0) return {
		slices: [],
		total: 0,
		cx: c,
		cy: l,
		outerRadius: d,
		innerRadius: f,
		padAngle: a
	};
	let h = g().value((e) => e.value).padAngle(a);
	return o === null ? h.sort(null) : h.sort((e, t) => o(e.value, t.value)), {
		slices: h(p).map((e) => {
			let t = (e.startAngle + e.endAngle) / 2;
			return {
				seriesIndex: e.data.seriesIndex,
				series: e.data.series,
				value: e.data.value,
				fraction: e.data.value / m,
				startAngle: e.startAngle,
				endAngle: e.endAngle,
				centroidAngle: t,
				color: e.data.series.color
			};
		}),
		total: m,
		cx: c,
		cy: l,
		outerRadius: d,
		innerRadius: f,
		padAngle: a
	};
}
//#endregion
//#region src/charts/PieChart/PieTooltip.tsx
function ac(e) {
	return e.toLocaleString();
}
function oc(e) {
	return `${Math.round(e * 1e3) / 10}%`;
}
function sc({ ctx: e, valueFormatter: t = ac, isPercent: n = !1 }) {
	let r = e.seriesData[0];
	if (!r) return null;
	let i = r.fraction ?? 0;
	return /* @__PURE__ */ d(on, { children: [/* @__PURE__ */ d("div", {
		className: "flex items-center gap-2 mb-1",
		children: [/* @__PURE__ */ u(sn, { color: r.color }), /* @__PURE__ */ u("span", {
			className: "font-semibold",
			children: r.series.label
		})]
	}), /* @__PURE__ */ d("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ u("strong", { children: n ? oc(i) : t(r.value) }), !n && i > 0 ? /* @__PURE__ */ d("span", {
			className: "opacity-70",
			children: [
				"(",
				oc(i),
				")"
			]
		}) : null]
	})] });
}
//#endregion
//#region src/charts/PieChart/SliceLabels.tsx
var cc = 14, lc = 1.2, uc = `600 ${cc}px ${ft}`, dc = 4, fc = 2, pc = {
	position: "absolute",
	pointerEvents: "none",
	color: "white",
	fontSize: cc,
	fontWeight: 600,
	lineHeight: lc,
	textAlign: "center",
	textShadow: "0 1px 2px rgba(0, 0, 0, 0.45)",
	whiteSpace: "nowrap",
	transform: "translate(-50%, -50%)"
};
function mc(e) {
	return e.toLocaleString();
}
function hc(e) {
	return `${Math.round(e * 1e3) / 10}%`;
}
function gc({ valueFormatter: e = mc, showValueOnSlice: t = !0, showLabelOnSlice: n = !1, minSlicePercentForLabel: r = .05, labelRadiusRatio: i = .5, isPercent: a = !1 }) {
	let { layout: o } = is();
	if (!t && !n) return null;
	let s = Math.min(1, Math.max(0, i)), c = o.innerRadius + (o.outerRadius - o.innerRadius) * s, d = [];
	for (let i = 0; i < o.slices.length; i++) {
		let s = o.slices[i];
		if (s.series.visibility?.valueLabel === !1 || s.fraction < r) continue;
		let l = [];
		n && l.push(s.series.label), t && l.push(a ? hc(s.fraction) : e(s.value));
		let u = Math.max(0, ...l.map((e) => _t(e, uc)));
		d.push({
			key: s.series.key || String(i),
			x: o.cx + Math.sin(s.centroidAngle) * c,
			y: o.cy - Math.cos(s.centroidAngle) * c,
			halfWidth: u / 2 + dc,
			halfHeight: l.length * cc * lc / 2 + fc,
			value: s.value,
			lines: l
		});
	}
	let f = zs(d);
	return /* @__PURE__ */ u(l, { children: d.filter((e) => f.has(e.key)).map((e) => /* @__PURE__ */ u("div", {
		"data-attr": "script-chart-pie-slice-label",
		style: {
			...pc,
			left: Math.round(e.x),
			top: Math.round(e.y)
		},
		children: e.lines.map((e, t) => /* @__PURE__ */ u("div", { children: e }, t))
	}, e.key)) });
}
//#endregion
//#region src/charts/PieChart/PieChart.tsx
var _c = 8, vc = 150, yc = .05, bc = .5, xc = "#ffffff", Sc = .15, Cc = .55, wc = "#ffffff";
function Tc(e) {
	return 1 - (1 - e) ** 3;
}
var Ec = {
	position: "absolute",
	pointerEvents: "none",
	transform: "translate(-50%, -50%)",
	textAlign: "center",
	whiteSpace: "nowrap"
};
function Dc({ children: e, cx: t, cy: n }) {
	return /* @__PURE__ */ u("div", {
		style: {
			...Ec,
			left: t,
			top: n
		},
		children: e
	});
}
function Oc({ onError: e, ...t }) {
	return /* @__PURE__ */ u(ei, {
		onError: e,
		children: /* @__PURE__ */ u(Ac, { ...t })
	});
}
function kc(e) {
	return e.toLocaleString();
}
function Ac({ series: e, theme: t, config: r, tooltip: i, onSliceClick: a, className: c, dataAttr: l, valueFormatter: f = kc, centerLabel: p, children: m }) {
	let { innerRadiusRatio: h = 0, showValueOnSlice: g = !0, showLabelOnSlice: _ = !1, isPercent: v = !1, hoverGrowth: y = _c, hoverAnimationMs: b = vc, disableHoverOffset: x = !1, minSlicePercentForLabel: S = yc, labelRadiusRatio: C = bc, padAngle: w = 0, sort: T = null, sliceValue: E, tooltip: D, legend: O } = r ?? {}, k = D?.enabled !== !1, { visibleSeries: A, legendProps: j } = K(e, t, O), M = n((e, t) => ic({
		series: e,
		dimensions: t,
		sliceValue: E,
		innerRadiusRatio: h,
		padAngle: w,
		sort: T
	}), [
		E,
		h,
		w,
		T
	]), N = x ? 0 : y, P = x ? 0 : b, F = s(0), I = n((e) => {
		let t = Mc(e);
		t && Nc(e.ctx, t, { outerRadiusBoost: 0 });
	}, []), L = n((e) => {
		let t = Mc(e), n = t && e.hoverIndex >= 0 ? t.slices[e.hoverIndex] : null;
		if (!t || !n || t.slices.length <= 1 || N === 0) return F.current = 0, !1;
		let r = Tc(e.hoverProgress);
		F.current = Math.max(F.current, r * Cc);
		let i = e.theme.backgroundColor || wc;
		for (let n = 0; n < t.slices.length; n++) {
			if (n === e.hoverIndex) continue;
			let r = t.slices[n], a = gn(r.color, i, F.current);
			Pc(e.ctx, r, t, {
				outerRadiusBoost: 0,
				fillStyle: a
			});
		}
		let a = r * N, o = gn(n.color, xc, r * Sc);
		return Pc(e.ctx, n, t, {
			outerRadiusBoost: a,
			fillStyle: o
		}), !0;
	}, [N]), R = o(() => i ?? ((e) => /* @__PURE__ */ u(sc, {
		ctx: e,
		valueFormatter: f,
		isPercent: v
	})), [
		i,
		f,
		v
	]);
	return /* @__PURE__ */ u(W, {
		...j,
		legendDataAttr: "script-chart-pie-legend",
		children: /* @__PURE__ */ d(os, {
			series: A,
			theme: t,
			buildLayout: M,
			drawStatic: I,
			drawHover: L,
			tooltip: R,
			showTooltip: k,
			onSliceClick: a,
			hitOuterSlack: N,
			hoverAnimationMs: P,
			className: c,
			dataAttr: l,
			children: [
				/* @__PURE__ */ u(gc, {
					valueFormatter: f,
					showValueOnSlice: g,
					showLabelOnSlice: _,
					minSlicePercentForLabel: S,
					labelRadiusRatio: C,
					isPercent: v
				}),
				/* @__PURE__ */ u(jc, { children: p }),
				m
			]
		})
	});
}
function jc({ children: e }) {
	let { layout: t } = is();
	return e ? /* @__PURE__ */ u(Dc, {
		cx: t.cx,
		cy: t.cy,
		children: e
	}) : null;
}
function Mc(e) {
	return e.scales._private?.__radialChart?.layout ?? null;
}
function Nc(e, t, { outerRadiusBoost: n }) {
	for (let r = 0; r < t.slices.length; r++) Pc(e, t.slices[r], t, {
		outerRadiusBoost: n,
		fillStyle: t.slices[r].color
	});
}
function Pc(e, t, n, { outerRadiusBoost: r, fillStyle: i }) {
	let a = n.padAngle / 2, o = t.startAngle + a, s = t.endAngle - a;
	if (o >= s) return;
	let { cx: c, cy: l, innerRadius: u } = n, d = n.outerRadius + r, f = o - Math.PI / 2, p = s - Math.PI / 2;
	e.fillStyle = i, e.beginPath(), u > 0 ? (e.arc(c, l, d, f, p, !1), e.arc(c, l, u, p, f, !0)) : (e.moveTo(c, l), e.arc(c, l, d, f, p, !1)), e.closePath(), e.fill();
}
//#endregion
//#region src/core/theme.ts
var Fc = [
	"#3d3d3d",
	"#621da6",
	"#42827e",
	"#ce0e74",
	"#f14f58",
	"#7c440e",
	"#529a0a",
	"#0476fb",
	"#fe729e",
	"#35416b",
	"#41cbc4",
	"#b64b02",
	"#e4a604",
	"#a56eff",
	"#30d5c8"
];
function Ic(e, t) {
	return e.getPropertyValue(t).trim() || void 0;
}
function Lc(e = {}) {
	let { colorCount: t = Fc.length } = e;
	if (typeof document > "u" || typeof getComputedStyle != "function") return { colors: [...Fc] };
	let n = e.root ?? document.body, r = getComputedStyle(n);
	return {
		colors: Array.from({ length: t }, (e, t) => Ic(r, `--data-color-${t + 1}`) ?? Fc[t % Fc.length]),
		backgroundColor: Ic(r, "--background") ?? Ic(r, "--color-bg-surface-primary"),
		axisColor: Ic(r, "--color-graph-axis-label"),
		gridColor: Ic(r, "--color-graph-axis-line"),
		crosshairColor: Ic(r, "--color-graph-crosshair"),
		tooltipBackground: Ic(r, "--card") ?? Ic(r, "--color-bg-surface-popover"),
		tooltipColor: Ic(r, "--foreground") ?? Ic(r, "--color-text-primary")
	};
}
function Rc(e = {}) {
	let { root: t, colorCount: n } = e, [r, a] = c(() => Lc(e));
	return i(() => {
		if (typeof document > "u" || typeof MutationObserver != "function") return;
		let e = () => a(Lc({
			root: t,
			colorCount: n
		}));
		e();
		let r = new MutationObserver(e), i = {
			attributes: !0,
			attributeFilter: [
				"class",
				"theme",
				"data-theme"
			]
		};
		return r.observe(document.documentElement, i), r.observe(document.body, i), () => r.disconnect();
	}, [t, n]), r;
}
//#endregion
//#region src/overlays/HighlightedRange.tsx
var zc = "#8f8f8f";
function Bc({ start: e, end: t, color: n = zc, fillOpacity: r = .1, borderOpacity: i = .8 }) {
	let { labels: a, scales: o, dimensions: s } = Z(), c = typeof e == "number" ? a[e] : e, f = typeof t == "number" ? a[t] : t;
	if (c == null || f == null) return null;
	let p = o.x(c), m = o.x(f);
	if (p == null || m == null || !isFinite(p) || !isFinite(m)) return null;
	let h = (o.extent?.(c) ?? 0) / 2, g = (o.extent?.(f) ?? 0) / 2, _ = Math.min(p - h, m - g), v = Math.max(p + h, m + g), { plotLeft: y, plotTop: b, plotWidth: x, plotHeight: S } = s, C = y + x, w = Math.max(_, y), T = Math.min(v, C);
	if (T <= w) return null;
	let E = {
		left: w,
		top: b,
		width: T - w,
		height: S
	};
	return /* @__PURE__ */ d(l, { children: [/* @__PURE__ */ u("div", {
		"data-attr": "script-chart-highlighted-range",
		className: "absolute pointer-events-none",
		style: {
			...E,
			backgroundColor: n,
			opacity: r
		}
	}), i > 0 && /* @__PURE__ */ u("div", {
		className: "absolute pointer-events-none",
		style: {
			...E,
			borderWidth: 1,
			borderStyle: "solid",
			borderColor: n,
			opacity: i
		}
	})] });
}
//#endregion
//#region src/overlays/AnomalyPointsLayer.tsx
function Vc({ markers: e, radius: t = 3 }) {
	let { scales: n, dimensions: r, labels: i } = Z();
	if (!e.length) return null;
	let { plotLeft: a, plotTop: o, plotWidth: s, plotHeight: c } = r, d = a + s, f = o + c, p = [];
	for (let r of e) {
		let e = i[r.dataIndex], s = e == null ? void 0 : n.x(e);
		if (s == null || !isFinite(s)) continue;
		let c = (n.yAxes?.[r.yAxisId]?.scale ?? n.y)(r.value);
		if (!isFinite(c) || s < a || s > d || c < o || c > f) continue;
		let l = t * 2;
		p.push(/* @__PURE__ */ u("div", {
			"data-attr": "script-chart-anomaly-point",
			className: "absolute pointer-events-none rounded-full",
			style: {
				left: s - t,
				top: c - t,
				width: l,
				height: l,
				backgroundColor: r.color
			}
		}, `${r.dataIndex}-${r.yAxisId}`));
	}
	return /* @__PURE__ */ u(l, { children: p });
}
//#endregion
export { Vc as AnomalyPointsLayer, nn as AxisTitles, Ei as BarChart, hs as BoxPlot, ls as BoxPlotTooltip, Qr as Chart, ei as ChartErrorBoundary, W as ChartLegend, Wi as ComboChart, Fc as DEFAULT_CHART_COLORS, bt as DEFAULT_MARGINS, X as DEFAULT_Y_AXIS_ID, un as DefaultTooltip, Oi as FUNNEL_BAND_PADDING, Pi as FunnelChart, Os as Heatmap, Bc as HighlightedRange, U as Legend, zi as LineChart, mt as MAX_CATEGORY_LABEL_WIDTH, Zo as MetricCard, Oc as PieChart, sc as PieTooltip, Fi as RATE_TO_PERCENT, os as RadialChart, Qi as ReferenceLine, Zi as ReferenceLines, gc as SliceLabels, ec as SlopeChart, Gs as SlopeSeriesLabels, Js as SlopeValueLabels, Po as Sparkline, ko as TimeSeriesBarChart, Ao as TimeSeriesComboChart, Do as TimeSeriesLineChart, on as TooltipSurface, sn as TooltipSwatch, Ea as ValueLabels, te as applyHiddenSeries, xo as buildGoalLineReferenceLines, Ba as buildYTickFormatter, Qa as ciRanges, Ho as computeFallbackChangePercent, ic as computePieLayout, bo as computeSeriesNonZeroMax, Rt as computeVisibleXLabels, Oa as createXAxisTickCallback, $o as cursorOffsetToAngle, rc as defaultSliceValue, Ii as funnelConversionRate, Li as funnelFromCounts, G as legendItemsFromSeries, Za as linearRegression, eo as movingAverage, oo as movingAverageKey, yt as normalizeAxisLabel, ce as percentage, me as resolveAxisLines, Jo as resolveDelta, es as sliceAt, Ls as slopeLegendItems, Lc as themeFromCssVars, $a as trendLine, Yo as useAnimatedNumber, dt as useChart, ut as useChartHover, Z as useChartLayout, K as useChartLegend, Rc as useChartTheme, Xo as useHoverIntent, is as useRadialLayout };
