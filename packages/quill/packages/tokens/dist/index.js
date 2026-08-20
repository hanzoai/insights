//#region src/css.ts
function e(e, t, n = "  ") {
	return Object.entries(e).map(([e, r]) => `${n}--${t}-${e}: ${r};`).join("\n");
}
function t(e, t = "  ") {
	return Object.entries(e).map(([e, n]) => `${t}--${e}: ${n};`).join("\n");
}
function n(e) {
	return /\s/.test(e) ? `"${e}"` : e;
}
function r(e) {
	return e.map(n).join(", ");
}
//#endregion
//#region src/data-viz.ts
var i = [
	["#3d3d3d"],
	["#621da6", "#7f26d9"],
	["#42827e", "#3e7a76"],
	["#ce0e74", "#bf0d6c"],
	["#f14f58", "#f0474f"],
	["#7c440e", "#b36114"],
	["#529a0a"],
	["#0476fb"],
	["#fe729e"],
	["#35416b", "#6576b3"],
	["#41cbc4"],
	["#b64b02"],
	["#e4a604"],
	["#a56eff"],
	["#30d5c8"]
], a = i.map(([e]) => e);
function o(e) {
	return `--data-color-${e + 1}`;
}
var s = {
	"--color-graph-axis-label": "var(--muted-foreground)",
	"--color-graph-axis-line": "var(--border)",
	"--color-graph-crosshair": "var(--muted-foreground)"
};
function c(e = "  ") {
	let t = [...i.map(([t], n) => `${e}${o(n)}: ${t};`), ...Object.entries(s).map(([t, n]) => `${e}${t}: ${n};`)], n = i.map(([, t], n) => t ? `${e}${o(n)}: ${t};` : null).filter((e) => e !== null);
	return {
		light: t.join("\n"),
		dark: n.join("\n")
	};
}
//#endregion
//#region src/shadow.ts
var l = {
	sm: "0 2px 0 color-mix(in oklab, var(--border), transparent 10%)",
	md: "0 3px 0 color-mix(in oklab, var(--border), transparent 10%)",
	lg: "0 6px 0 color-mix(in oklab, var(--border), transparent 10%)",
	line: "0 -1px 0px 0px color-mix(in oklab, var(--border), transparent 10%)"
};
function u() {
	return e(l, "shadow");
}
//#endregion
//#region src/spacing.ts
var d = .25, f = `${d}rem`, p = 16;
function m(e) {
	return `${d * e}rem`;
}
function h(e) {
	return d * e * p;
}
function g() {
	return `  --spacing: ${f};`;
}
//#endregion
//#region src/typography.ts
var _ = 16;
function v(e) {
	return `${e / _}rem`;
}
var y = {
	xxs: [v(10), { lineHeight: v(12) }],
	xs: [v(12), { lineHeight: v(16) }],
	sm: [v(14), { lineHeight: v(20) }],
	base: [v(16), { lineHeight: v(24) }],
	lg: [v(18), { lineHeight: v(28) }],
	xl: [v(20), { lineHeight: v(28) }],
	"2xl": [v(24), { lineHeight: v(32) }]
}, b = {
	sans: [
		"-apple-system",
		"BlinkMacSystemFont",
		"Inter",
		"Segoe UI",
		"Roboto",
		"Helvetica Neue",
		"sans-serif"
	],
	mono: [
		"JetBrains Mono",
		"Fira Code",
		"monospace"
	]
};
function x() {
	return Object.entries(y).map(([e, [t, { lineHeight: n }]]) => `  --text-${e}: ${t};\n  --text-${e}--line-height: ${n};`).join("\n");
}
function S() {
	return Object.entries(b).map(([e, t]) => `  --font-${e}: ${r(t)};`).join("\n");
}
//#endregion
//#region src/colors.ts
var C = {
	hue: 90,
	darkHue: 264,
	tint: .006,
	primaryLight: "oklch(0.65 0.21 37.41)",
	primaryDark: "oklch(0.83 0.16 84.71)"
};
function w(e, t, n, r) {
	let i = n === "light" ? "var(--theme-hue)" : "var(--theme-dark-hue)";
	return `oklch(${e} ${t === 1 ? "var(--theme-tint)" : t === 0 ? "0" : `calc(var(--theme-tint) * ${t})`} ${i}${r === void 0 ? "" : ` / ${r * 100}%`})`;
}
function T(e, t, n, r) {
	return r === void 0 ? `oklch(${e} ${t} ${n})` : `oklch(${e} ${t} ${n} / ${r * 100}%)`;
}
function E() {
	return {
		background: [
			w(.966, .79, "light"),
			w(.187, 1.1, "dark"),
			"bg-background"
		],
		foreground: [
			T(.13, .028, 262),
			T(.967, .003, 265),
			"text-foreground"
		],
		card: [
			w(.995, .3, "light"),
			w(.2, 1.2, "dark"),
			"bg-card"
		],
		"card-foreground": [
			"var(--foreground)",
			"var(--foreground)",
			"text-card-foreground"
		],
		muted: [
			w(.953, 1.28, "light"),
			w(.209, 1.33, "dark"),
			"bg-muted"
		],
		"muted-foreground": [
			T(.446, .03, 257),
			T(.709, 0, 0),
			"text-muted-foreground"
		],
		"subtle-foreground": [
			"color-mix(in oklab, var(--muted-foreground) 80%, transparent)",
			"color-mix(in oklab, var(--muted-foreground) 80%, transparent)",
			"text-subtle-foreground"
		],
		chrome: [
			w(.923, 1.67, "light"),
			w(.187, 1.1, "dark"),
			"bg-chrome"
		],
		primary: [
			"var(--primary-light)",
			"var(--primary-dark)",
			"bg-primary"
		],
		"primary-foreground": [
			T(1, 0, 0),
			T(.13, .028, 262),
			"text-primary-foreground"
		],
		destructive: [
			T(.92, .03, 32.22),
			T(.24, .03, 2.79),
			"bg-destructive"
		],
		"destructive-foreground": [
			T(.51, .2, 23.61),
			T(.6605, .1821, 23.51),
			"text-destructive-foreground"
		],
		success: [
			T(.94, .06, 154.03),
			T(.27, .04, 157.6),
			"bg-success"
		],
		"success-foreground": [
			T(.448, .119, 151.328),
			T(.925, .084, 155.995),
			"text-success-foreground"
		],
		warning: [
			T(.93, .04, 74.41),
			T(.29, .03, 75),
			"bg-warning"
		],
		"warning-foreground": [
			T(.476, .114, 61.907),
			T(.77, .14, 99.29),
			"text-warning-foreground"
		],
		info: [
			T(.882, .059, 254.128),
			T(.4242, .1982, 265.5, .4),
			"bg-info"
		],
		"info-foreground": [
			T(.42, .03, 253.9),
			T(.882, .059, 254.128),
			"text-info-foreground"
		],
		completed: [
			T(.93, .05, 303.9),
			T(.28, .05, 302.7),
			"bg-completed"
		],
		"completed-foreground": [
			T(.46, .25, 287.35),
			T(.81, .06, 301.45),
			"text-completed-foreground"
		],
		border: [
			w(.9, .8, "light"),
			w(.27, 1.2, "dark"),
			"border-border"
		],
		input: [
			w(.81, .5, "light"),
			w(.3, 1.5, "dark"),
			"border-input"
		],
		ring: [
			T(.446, .03, 257),
			T(.709, 0, 0),
			"border-ring"
		],
		"fill-expanded": [
			"color-mix(in oklab, var(--foreground) 6%, transparent)",
			"color-mix(in oklab, var(--foreground) 14%, transparent)",
			"bg-fill-expanded"
		],
		"fill-selected": [
			"color-mix(in oklab, var(--foreground) 6%, transparent)",
			"color-mix(in oklab, var(--foreground) 10%, transparent)",
			"bg-fill-selected"
		],
		"fill-hover": [
			"color-mix(in oklab, var(--foreground) 4%, transparent)",
			"color-mix(in oklab, var(--foreground) 7%, transparent)",
			"bg-fill-hover"
		]
	};
}
var D = E();
function O(e) {
	let t = e === "light" ? 0 : 1;
	return Object.fromEntries(Object.entries(D).map(([e, n]) => [e, n[t]]));
}
var k = /* @__PURE__ */ new Set([
	"background",
	"card",
	"muted",
	"chrome",
	"primary",
	"border",
	"input",
	"fill-hover",
	"fill-expanded",
	"fill-selected"
]);
function A(e) {
	let t = [
		"var(--theme-hue)",
		"var(--theme-dark-hue)",
		"var(--theme-tint)",
		"var(--primary-light)",
		"var(--primary-dark)"
	];
	for (let [n, [r, i]] of Object.entries(e)) if (t.some((e) => r.includes(e) || i.includes(e)) && !k.has(n)) throw Error(`[@hanzo/quill-tokens] Token "${n}" references a theme variable but is missing from THEME_DERIVED_TOKENS. Add it to the set in colors.ts or local [--theme-hue:X] overrides will silently fail for this token.`);
}
A(D);
function j(e) {
	let t = e === void 0 ? [
		".dark",
		"[theme=\"dark\"]",
		"[data-theme=\"dark\"]"
	] : typeof e == "string" ? [e] : e;
	return t.length === 1 ? t[0] : `:is(${t.join(", ")})`;
}
function M(e = C, n = {}) {
	let { scope: r } = n, i = j(n.darkSelector), a = (t = "  ") => [
		`${t}--radius: 0.58rem;`,
		`${t}--theme-hue: ${e.hue};`,
		`${t}--theme-dark-hue: ${e.darkHue};`,
		`${t}--theme-tint: ${e.tint};`,
		`${t}--primary-light: ${e.primaryLight};`,
		`${t}--primary-dark: ${e.primaryDark};`
	].join("\n"), o = (e) => {
		let t = {}, n = {};
		for (let [r, i] of Object.entries(D)) k.has(r) ? n[r] = i[e] : t[r] = i[e];
		return {
			staticVars: t,
			dynamicVars: n
		};
	}, s = o(0), l = o(1), u = c();
	if (r) {
		let e = `:is(${r}, ${r} *)`, n = `:is(${i} ${r}, ${r}${i}, ${i} ${r} *, ${r}${i} *)`;
		return `/* Auto-generated by @hanzo/quill-tokens — do not edit manually */

/*
 * Scoped output — all token vars are gated behind \`${r}\` so they
 * do not clash with the consumer's existing CSS custom properties.
 * Add the \`${r.replace(/[[\]]/g, "")}\` attribute to wrapper elements
 * where quill components are rendered.
 *
 * Dark mode: works when the dark selector is on an ancestor of the scope
 * element (.dark > [data-quill]) OR on the scope element itself
 * ([data-quill].dark).
 */
${r} {
  color-scheme: light;
}

:is(${i} ${r}, ${r}${i}) {
  color-scheme: dark;
}

${e} {
${a()}
${t(s.staticVars)}
${t(s.dynamicVars)}

  /* Data-visualization palette + graph chrome (see data-viz.ts) */
${u.light}

  /* Override Tailwind --color-* theme tokens within scope so utilities
   * like bg-card, text-foreground, border-border resolve to quill's
   * values instead of the consumer's global theme. */
${N()}
}

${n} {
${t(l.staticVars)}
${t(l.dynamicVars)}
${u.dark}
}
`;
	}
	return `/* Auto-generated by @hanzo/quill-tokens — do not edit manually */

:root {
  color-scheme: light;
}

${i} {
  color-scheme: dark;
}

/* Theme knobs — override these to shift the palette */
:root {
${a()}
}

/* Static colors (no theme-var references, safe on :root) */
:root {
${t(s.staticVars)}

  /* Data-visualization palette + graph chrome (see data-viz.ts) */
${u.light}
}

${i} {
${t(l.staticVars)}
${u.dark}
}

/*
 * Theme-derived colors — set on * so each element resolves
 * var(--theme-hue) / var(--primary-light) from its own scope.
 * This enables local overrides like [--theme-hue:200] on a container.
 */
* {
${t(s.dynamicVars)}
}

:is(${i}, ${i} *) {
${t(l.dynamicVars)}
}
`;
}
function N() {
	return Object.keys(D).map((e) => `  --color-${e}: var(--${e});`).join("\n");
}
var P = [
	["--radius-xs", "calc(var(--radius) - 7px)"],
	["--radius-sm", "calc(var(--radius) - 5px)"],
	["--radius-md", "calc(var(--radius) - 2px)"],
	["--radius-lg", "var(--radius)"],
	["--radius-xl", "calc(var(--radius) + 4px)"],
	["--radius-2xl", "calc(var(--radius) + 8px)"],
	["--radius-3xl", "calc(var(--radius) + 12px)"],
	["--radius-4xl", "calc(var(--radius) + 16px)"]
];
function F(e = {}) {
	let { includeBaseLayer: t = !1, scope: n } = e, r = j(e.darkSelector), i = [
		"/* Auto-generated by @hanzo/quill-tokens — do not edit manually */",
		"",
		`@custom-variant dark (${`&:is(${r}, ${r} *)`});`
	];
	i.push(""), i.push("@theme inline {"), i.push("  --animate-skeleton: skeleton 2s -1s infinite linear;"), i.push("  --animate-pulse-glow: pulse-glow 2s -1s infinite linear;"), i.push("  --animate-horizontal-shake: horizontal-shake 0.3s ease-out;"), i.push("  --animate-radar: radar 2s ease-out infinite;"), i.push(""), i.push("  /* --- Colors --- */"), i.push(N()), i.push(""), i.push("  /* --- Spacing --- */"), i.push(g()), i.push(""), i.push("  /* --- Font sizes --- */"), i.push(x()), i.push(""), i.push("  /* --- Font families --- */"), i.push(S()), i.push(""), i.push("  /* --- Shadows --- */"), i.push(u()), i.push(""), i.push("  /* --- Radius (derived from --radius base) --- */");
	for (let [e, t] of P) i.push(`  ${e}: ${t};`);
	i.push(""), i.push("  @keyframes skeleton {"), i.push("    to {"), i.push("      background-position: -200% 0;"), i.push("    }"), i.push("  }"), i.push(""), i.push("  @keyframes pulse-glow {"), i.push("    0%, 100% { box-shadow: 0 0 2px 1px var(--pulse-glow-color, var(--color-primary)) }"), i.push("    50% { box-shadow: 0 0 6px 2px var(--pulse-glow-color, var(--color-primary)) }"), i.push("  }"), i.push(""), i.push("  @keyframes horizontal-shake {"), i.push("    0% { transform: translateX(0); }"), i.push("    25% { transform: translateX(5px); }"), i.push("    50% { transform: translateX(-5px); }"), i.push("    75% { transform: translateX(2px); }"), i.push("    100% { transform: translateX(0); }"), i.push("  }"), i.push(""), i.push("  @keyframes radar {"), i.push("    0% { transform: scale(1); opacity: 0.5; }"), i.push("    100% { transform: scale(1.5); opacity: 0; }"), i.push("  }"), i.push("}"), i.push("");
	let a = n ?? ":root";
	i.push(`${a} {`);
	for (let [e, t] of P) i.push(`  ${e}: ${t};`);
	for (let [e, t] of Object.entries(l)) i.push(`  --shadow-${e}: ${t};`);
	return i.push("}"), t && (i.push(""), i.push("@layer base {"), n ? (i.push(`  ${n}, ${n} * {`), i.push("    @apply border-border outline-ring/50;"), i.push("  }")) : (i.push("  * {"), i.push("    @apply border-border outline-ring/50;"), i.push("  }"), i.push("  body {"), i.push("    @apply bg-background text-foreground;"), i.push("  }")), i.push("}")), i.push(""), i.join("\n");
}
//#endregion
//#region src/border-radius.ts
var I = {
	none: "0px",
	sm: "4px",
	md: "6px",
	lg: "8px",
	xl: "12px",
	full: "9999px"
};
//#endregion
export { C as DEFAULT_THEME, f as SPACING_BASE, d as SPACING_BASE_REM, I as borderRadius, E as buildSemanticColors, e as cssVars, t as cssVarsFlat, a as dataColorPalette, o as dataColorVarName, i as dataColors, b as fontFamily, r as fontFamilyValue, y as fontSize, M as generateColorSystemCSS, c as generateDataVizVars, F as generateStylesCSS, n as quoteFontName, O as resolveTheme, D as semanticColors, l as shadow, m as spacing, h as spacingPx };
