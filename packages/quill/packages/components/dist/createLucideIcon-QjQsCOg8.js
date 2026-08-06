import { createElement as e, forwardRef as t } from "react";
//#region ../../../../node_modules/.pnpm/lucide-react@0.577.0_react@18.3.1/node_modules/lucide-react/dist/esm/shared/src/utils/mergeClasses.js
var n = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), r = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), i = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), a = (e) => {
	let t = i(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, o = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, s = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, c = t(({ color: t = "currentColor", size: r = 24, strokeWidth: i = 2, absoluteStrokeWidth: a, className: c = "", children: l, iconNode: u, ...d }, f) => e("svg", {
	ref: f,
	...o,
	width: r,
	height: r,
	stroke: t,
	strokeWidth: a ? Number(i) * 24 / Number(r) : i,
	className: n("lucide", c),
	...!l && !s(d) && { "aria-hidden": "true" },
	...d
}, [...u.map(([t, n]) => e(t, n)), ...Array.isArray(l) ? l : [l]])), l = (i, o) => {
	let s = t(({ className: t, ...s }, l) => e(c, {
		ref: l,
		iconNode: o,
		className: n(`lucide-${r(a(i))}`, `lucide-${i}`, t),
		...s
	}));
	return s.displayName = a(i), s;
};
//#endregion
export { l as t };
