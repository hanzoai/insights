import { Accordion as e } from "@base-ui/react/accordion";
import { ArrowDown as t, ArrowDownIcon as n, ArrowLeft as r, ArrowRight as i, ArrowUp as a, ArrowUpRightIcon as o, CheckIcon as s, ChevronDownIcon as c, ChevronLeft as l, ChevronRight as u, ChevronRightIcon as d, ChevronUpIcon as f, CircleArrowRightIcon as p, CircleCheckIcon as m, CircleDashedIcon as h, CircleXIcon as g, InfoIcon as _, ListIcon as v, Loader2Icon as y, MoreHorizontal as b, SearchIcon as x, TriangleAlertIcon as S, XIcon as C } from "lucide-react";
import * as w from "react";
import { createElement as ee, forwardRef as T, useCallback as E, useMemo as D, useState as O } from "react";
import { clsx as k } from "clsx";
import { extendTailwindMerge as A } from "tailwind-merge";
import { Fragment as j, jsx as M, jsxs as N } from "react/jsx-runtime";
import { AlertDialog as te } from "@base-ui/react/alert-dialog";
import { Autocomplete as P } from "@base-ui/react/autocomplete";
import { Button as ne } from "@base-ui/react/button";
import { cva as F } from "class-variance-authority";
import { NumberField as re } from "@base-ui/react/number-field";
import { Input as I } from "@base-ui/react/input";
import { mergeProps as L } from "@base-ui/react/merge-props";
import { useRender as R } from "@base-ui/react/use-render";
import { Separator as ie } from "@base-ui/react/separator";
import { Avatar as z } from "@base-ui/react/avatar";
import { Collapsible as ae } from "@base-ui/react/collapsible";
import { Toggle as oe } from "@base-ui/react/toggle";
import { Toolbar as se } from "@base-ui/react/toolbar";
import { Tooltip as ce } from "@base-ui/react/tooltip";
import { Checkbox as le } from "@base-ui/react/checkbox";
import { Combobox as B } from "@base-ui/react";
import { ContextMenu as V } from "@base-ui/react/context-menu";
import { Radio as ue } from "@base-ui/react/radio";
import { RadioGroup as de } from "@base-ui/react/radio-group";
import { Dialog as fe } from "@base-ui/react/dialog";
import { ScrollArea as pe } from "@base-ui/react/scroll-area";
import { DirectionProvider as me, useDirection as he } from "@base-ui/react/direction-provider";
import { Drawer as ge } from "@base-ui/react/drawer";
import { Menu as H } from "@base-ui/react/menu";
import { Menubar as _e } from "@base-ui/react/menubar";
import { Popover as ve } from "@base-ui/react/popover";
import { Progress as ye } from "@base-ui/react/progress";
import * as be from "react-resizable-panels";
import { Select as U } from "@base-ui/react/select";
import { Slider as xe } from "@base-ui/react/slider";
import { Toast as Se } from "@base-ui/react/toast";
import { Switch as Ce } from "@base-ui/react/switch";
import { Tabs as we } from "@base-ui/react/tabs";
import { ToggleGroup as Te } from "@base-ui/react/toggle-group";
//#region ../primitives/dist/index.js
var Ee = A({ extend: { classGroups: { "font-size": [{ text: ["xxs"] }] } } });
function W(...e) {
	return Ee(k(e));
}
function De({ className: t, ...n }) {
	return /* @__PURE__ */ M(e.Root, {
		"data-slot": "accordion",
		className: W("quill-accordion flex w-full flex-col", t),
		...n
	});
}
function Oe({ className: t, ...n }) {
	return /* @__PURE__ */ M(e.Item, {
		"data-quill": !0,
		"data-slot": "accordion-item",
		className: W("quill-accordion__item", t),
		...n
	});
}
function ke({ className: t, children: n, ...r }) {
	return /* @__PURE__ */ M(e.Header, {
		className: "flex",
		children: /* @__PURE__ */ N(e.Trigger, {
			"data-slot": "accordion-trigger",
			className: W("quill-accordion__trigger group/accordion-trigger relative flex flex-1 items-start justify-between gap-6", t),
			...r,
			children: [
				/* @__PURE__ */ M("span", { children: n }),
				/* @__PURE__ */ M(c, {
					"data-slot": "accordion-trigger-icon",
					"data-chevron": "down",
					className: "pointer-events-none shrink-0"
				}),
				/* @__PURE__ */ M(f, {
					"data-slot": "accordion-trigger-icon",
					"data-chevron": "up",
					className: "pointer-events-none shrink-0"
				})
			]
		})
	});
}
function Ae({ className: t, children: n, ...r }) {
	return /* @__PURE__ */ M(e.Panel, {
		"data-slot": "accordion-content",
		className: "quill-accordion__panel",
		...r,
		children: /* @__PURE__ */ M("div", {
			className: W("quill-accordion__panel-content", t),
			children: n
		})
	});
}
function je({ ...e }) {
	return /* @__PURE__ */ M(te.Root, {
		"data-slot": "alert-dialog",
		...e
	});
}
function Me({ ...e }) {
	return /* @__PURE__ */ M(te.Trigger, {
		"data-slot": "alert-dialog-trigger",
		...e
	});
}
function Ne({ ...e }) {
	return /* @__PURE__ */ M(te.Portal, {
		"data-slot": "alert-dialog-portal",
		...e
	});
}
function Pe({ ...e }) {
	return /* @__PURE__ */ M(te.Close, {
		"data-slot": "alert-dialog-close",
		...e
	});
}
function Fe({ className: e, ...t }) {
	return /* @__PURE__ */ M(te.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "modal-overlay",
		"data-slot": "alert-dialog-overlay",
		className: W("quill-dialog__overlay", e),
		...t
	});
}
function Ie({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ N(Ne, { children: [/* @__PURE__ */ M(Fe, {}), /* @__PURE__ */ M(te.Popup, {
		"data-quill": !0,
		"data-quill-portal": "modal-content",
		"data-slot": "alert-dialog-content",
		className: W("quill-dialog__content", e),
		...n,
		children: t
	})] });
}
function Le({ className: e, ...t }) {
	return /* @__PURE__ */ M(te.Title, {
		"data-slot": "alert-dialog-title",
		className: W("quill-dialog__title", e),
		...t
	});
}
function Re({ className: e, ...t }) {
	return /* @__PURE__ */ M(te.Description, {
		"data-slot": "alert-dialog-description",
		className: W("quill-dialog__description", e),
		...t
	});
}
function ze({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "alert-dialog-header",
		className: W("quill-dialog__header flex flex-col gap-1", e),
		...t
	});
}
function Be({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "alert-dialog-footer",
		className: W("quill-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", e),
		...t
	});
}
function Ve({ className: e, ...t }) {
	return /* @__PURE__ */ M(y, {
		"data-quill": !0,
		role: "status",
		"aria-label": "Loading",
		className: W("quill-spinner", e),
		...t
	});
}
var He = F("quill-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap", {
	variants: {
		variant: {
			default: "quill-button--variant-default",
			primary: "quill-button--variant-primary",
			outline: "quill-button--variant-outline",
			destructive: "quill-button--variant-destructive",
			link: "quill-button--variant-link",
			"link-muted": "quill-button--variant-link-muted"
		},
		size: {
			default: "quill-button--size-default",
			xs: "quill-button--size-xs",
			sm: "quill-button--size-sm",
			lg: "quill-button--size-lg",
			icon: "quill-button--size-icon",
			"icon-xs": "quill-button--size-icon-xs",
			"icon-sm": "quill-button--size-icon-sm",
			"icon-lg": "quill-button--size-icon-lg"
		},
		focusableWhenDisabled: {
			true: "",
			false: "quill-button--not-focusable-when-disabled"
		},
		left: {
			true: "justify-start",
			false: ""
		},
		inert: {
			true: "quill-button--inert",
			false: ""
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
}), G = w.forwardRef(({ className: e, variant: t = "default", size: n = "default", focusableWhenDisabled: r = !0, left: i = !1, loading: a = !1, disabled: o, children: s, ...c }, l) => /* @__PURE__ */ N(ne, {
	ref: l,
	"data-quill": !0,
	"data-slot": "button",
	"data-size": n,
	"data-loading": a || void 0,
	"aria-busy": a || void 0,
	disabled: o || a,
	focusableWhenDisabled: a ? !0 : r,
	className: W(He({
		variant: t,
		size: n,
		className: e,
		focusableWhenDisabled: r,
		left: i
	})),
	...c,
	children: [s, a && /* @__PURE__ */ M(Ve, { className: "quill-button__spinner" })]
}));
G.displayName = "Button";
var Ue = w.forwardRef(({ className: e, type: t, ...n }, r) => /* @__PURE__ */ M(I, {
	ref: r,
	type: t,
	"data-quill": !0,
	"data-slot": "input",
	className: W("quill-input", e),
	...n
}));
Ue.displayName = "Input";
function We({ className: e, ...t }) {
	return /* @__PURE__ */ M("textarea", {
		"data-quill": !0,
		"data-slot": "textarea",
		className: W("quill-textarea flex", e),
		...t
	});
}
var Ge = w.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ M("div", {
	ref: n,
	"data-quill": !0,
	"data-slot": "input-group",
	role: "group",
	className: W("quill-input-group group/input-group flex items-center", e),
	...t
}));
Ge.displayName = "InputGroup";
var Ke = F("quill-input-group__addon group/input-group-addon empty:hidden flex h-auto items-center justify-center gap-1 select-none whitespace-nowrap", {
	variants: { align: {
		"inline-start": "quill-input-group__addon--align-inline-start",
		"inline-end": "quill-input-group__addon--align-inline-end",
		"block-start": "quill-input-group__addon--align-block-start justify-start",
		"block-end": "quill-input-group__addon--align-block-end justify-start"
	} },
	defaultVariants: { align: "inline-start" }
});
function qe({ className: e, align: t = "inline-start", ...n }) {
	return /* @__PURE__ */ M("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": t,
		className: W(Ke({ align: t }), e),
		onClick: (e) => {
			e.target.closest("button") || e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...n
	});
}
var Je = F("quill-input-group__button flex items-center gap-2", {
	variants: { size: {
		xs: "quill-input-group__button--size-xs",
		sm: "quill-input-group__button--size-sm",
		"icon-xs": "quill-input-group__button--size-icon-xs",
		"icon-sm": "quill-input-group__button--size-icon-sm"
	} },
	defaultVariants: { size: "xs" }
}), Ye = w.forwardRef(({ className: e, type: t = "button", variant: n, size: r = "sm", ...i }, a) => /* @__PURE__ */ M(G, {
	ref: a,
	type: t,
	"data-size": r,
	variant: n,
	className: W(Je({ size: r }), e),
	...i
}));
Ye.displayName = "InputGroupButton";
function Xe({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		className: W("quill-input-group__text flex items-end gap-2", e),
		...t
	});
}
var Ze = w.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ M(Ue, {
	ref: n,
	"data-slot": "input-group-control",
	className: W("quill-input-group__control", e),
	...t
}));
Ze.displayName = "InputGroupInput";
function Qe({ className: e, ...t }) {
	return /* @__PURE__ */ M(We, {
		"data-slot": "input-group-control",
		className: W("quill-input-group__control quill-input-group__control--textarea", e),
		...t
	});
}
function $e({ className: e, inputRef: t, ...n }) {
	return /* @__PURE__ */ M(re.Root, {
		...n,
		children: /* @__PURE__ */ M(re.ScrubArea, {
			"data-slot": "input-group-scrub-area",
			className: "cursor-ew-resize",
			children: /* @__PURE__ */ M(re.Input, {
				ref: t,
				"data-slot": "input-group-control",
				className: W("quill-input-group__control h-8 w-full min-w-0 px-2 py-0.5 text-xs tabular-nums text-center outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", e)
			})
		})
	});
}
function et({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M("div", {
		...n,
		"data-slot": "menu-empty",
		role: "status",
		"aria-live": "polite",
		className: W(He({
			size: "sm",
			left: !0,
			inert: !0
		}), "quill-menu-empty", e),
		children: t
	});
}
function tt({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "div",
		props: L({
			"data-quill": "",
			"data-slot": "menu-label",
			className: W("quill-menu-label", e)
		}, n),
		render: t
	});
}
function nt({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ M(ie, {
		"data-quill": !0,
		"data-slot": "separator",
		orientation: t,
		className: W("quill-separator shrink-0", e),
		...n
	});
}
var rt = w.createContext(null), it = P.Root;
function at({ children: e, autoHighlight: t = !0, ...n }) {
	let r = w.useRef(null);
	return /* @__PURE__ */ M(rt.Provider, {
		value: r,
		children: /* @__PURE__ */ M(it, {
			...n,
			autoHighlight: t,
			children: e
		})
	});
}
function ot({ ...e }) {
	return /* @__PURE__ */ M(P.Value, {
		"data-slot": "autocomplete-value",
		...e
	});
}
var st = w.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ N(P.Trigger, {
	ref: r,
	"data-slot": "autocomplete-trigger",
	className: W("quill-autocomplete__trigger", e),
	...n,
	children: [t, /* @__PURE__ */ M(c, { className: "pointer-events-none size-3.5 text-muted-foreground" })]
}));
st.displayName = "AutocompleteTrigger";
function ct({ className: e, ...t }) {
	return /* @__PURE__ */ M(P.Clear, {
		"data-slot": "autocomplete-clear",
		render: /* @__PURE__ */ M(Ye, { size: "icon-xs" }),
		className: W(e),
		...t,
		children: /* @__PURE__ */ M(C, { className: "pointer-events-none" })
	});
}
function lt({ className: e, children: t, disabled: n = !1, showSearchIcon: r = !0, showClear: i = !1, ...a }) {
	return /* @__PURE__ */ N("div", {
		"data-slot": "autocomplete-input-group-wrapper",
		children: [/* @__PURE__ */ N(Ge, {
			ref: w.useContext(rt),
			className: W("w-auto", e),
			children: [
				r && /* @__PURE__ */ M(qe, {
					align: "inline-start",
					children: /* @__PURE__ */ M(x, {})
				}),
				/* @__PURE__ */ M(P.Input, {
					render: /* @__PURE__ */ M(Ze, { disabled: n }),
					...a
				}),
				t ? /* @__PURE__ */ M(qe, {
					align: "inline-end",
					children: t
				}) : null,
				i && /* @__PURE__ */ M(qe, {
					align: "inline-end",
					children: /* @__PURE__ */ M(ct, { disabled: n })
				})
			]
		}), /* @__PURE__ */ M(nt, {
			orientation: "horizontal",
			"data-slot": "autocomplete-popover-separator",
			className: "w-[calc(100%+var(--spacing))]"
		})]
	});
}
function ut({ className: e, side: t = "bottom", sideOffset: n = 6, align: r = "start", alignOffset: i = 0, anchor: a, ...o }) {
	let s = w.useContext(rt), c = a ?? s;
	return /* @__PURE__ */ M(P.Portal, { children: /* @__PURE__ */ M(P.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: t,
		sideOffset: n,
		align: r,
		alignOffset: i,
		anchor: c,
		className: "isolate",
		children: /* @__PURE__ */ M(P.Popup, {
			"data-slot": "autocomplete-content",
			className: W("quill-autocomplete__content group/autocomplete-content", e),
			...o
		})
	}) });
}
function dt({ className: e, ...t }) {
	return /* @__PURE__ */ M(P.List, {
		"data-slot": "autocomplete-list",
		className: W("quill-autocomplete__list scroll-mask-t-2 scroll-mask-b-4 scroll-pb-4 scroll-pt-6 empty:hidden", e),
		...t
	});
}
function ft({ className: e, children: t, title: n, ...r }) {
	return /* @__PURE__ */ M(P.Item, {
		"data-slot": "autocomplete-item",
		className: W("quill-autocomplete__item", e),
		title: n ?? (typeof t == "string" ? t : void 0),
		render: /* @__PURE__ */ M(G, {
			left: !0,
			className: "font-normal min-w-0 aria-selected:bg-fill-selected data-highlighted:border-ring data-highlighted:ring-2 data-highlighted:ring-ring/30 ring-offset-1"
		}),
		tabIndex: -1,
		...r,
		children: /* @__PURE__ */ M("span", {
			className: "flex items-center gap-1.5 min-w-0 truncate",
			children: t
		})
	});
}
function pt({ className: e, ...t }) {
	return /* @__PURE__ */ M(P.Group, {
		"data-slot": "autocomplete-group",
		className: W("pb-1", e),
		...t
	});
}
function mt({ className: e, ...t }) {
	return /* @__PURE__ */ M(P.GroupLabel, {
		"data-slot": "autocomplete-label",
		className: W("quill-autocomplete__label mb-1 -mx-1 w-[calc(100%+var(--spacing)*2)]", e),
		render: /* @__PURE__ */ M(tt, {}),
		...t
	});
}
function ht({ ...e }) {
	return /* @__PURE__ */ M(P.Collection, {
		"data-slot": "autocomplete-collection",
		...e
	});
}
function gt({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(P.Empty, {
		"data-slot": "autocomplete-empty",
		className: W("quill-autocomplete__empty", e),
		...n,
		children: /* @__PURE__ */ M(et, { children: t })
	});
}
function _t({ className: e, ...t }) {
	return /* @__PURE__ */ M(P.Separator, {
		"data-slot": "autocomplete-separator",
		className: W("quill-autocomplete__separator my-0", e),
		...t
	});
}
function vt(e) {
	return Array.isArray(e) ? e.reduce((e, t) => t && typeof t == "object" && "items" in t && Array.isArray(t.items) ? e + t.items.length : e + 1, 0) : 0;
}
function yt({ className: e, children: t, emptyContent: n, ...r }) {
	let i = vt(P.useFilteredItems()), a;
	return a = typeof t == "function" ? t(i) : t === void 0 ? i === 0 ? n : `${i} ${i === 1 ? "result" : "results"}` : t, /* @__PURE__ */ M(P.Status, {
		"data-slot": "autocomplete-status",
		className: W("quill-autocomplete__status bg-card border-b border-border text-xs text-muted-foreground px-2 py-1.5 empty:hidden", e),
		...r,
		children: a
	});
}
function bt() {
	let e = w.useContext(rt);
	if (e === null) throw Error("useAutocompleteAnchor must be used within an Autocomplete");
	return e;
}
var xt = w.forwardRef(function({ className: e, size: t = "default", ...n }, r) {
	return /* @__PURE__ */ M(z.Root, {
		ref: r,
		"data-quill": !0,
		"data-slot": "avatar",
		"data-size": t,
		className: W("quill-avatar", e),
		...n
	});
}), St = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M(z.Image, {
		ref: n,
		"data-slot": "avatar-image",
		className: W("quill-avatar__image", e),
		...t
	});
}), Ct = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M(z.Fallback, {
		ref: n,
		"data-slot": "avatar-fallback",
		className: W("quill-avatar__fallback", e),
		...t
	});
});
function wt({ className: e, stacked: t = !1, reverse: n = !1, size: r = "default", children: i, style: a, ...o }) {
	let s = w.Children.toArray(i);
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "avatar-group",
		"data-stacked": t ? "" : void 0,
		"data-reverse": n ? "" : void 0,
		"data-size": r,
		className: W("quill-avatar-group", e),
		style: {
			...a,
			"--avatar-count": s.length
		},
		...o,
		children: s.map((e, t) => {
			let n = w.isValidElement(e) && e.type === xt && e.props.size === void 0 ? w.cloneElement(e, { size: r }) : e;
			return /* @__PURE__ */ M("span", {
				"data-slot": "avatar-group-item",
				className: "quill-avatar-group__item",
				style: { "--avatar-index": t },
				children: n
			}, t);
		})
	});
}
xt.displayName = "Avatar", St.displayName = "AvatarImage", Ct.displayName = "AvatarFallback";
var Tt = F("quill-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap", {
	variants: { variant: {
		default: "quill-badge--variant-default",
		info: "quill-badge--variant-info",
		destructive: "quill-badge--variant-destructive",
		warning: "quill-badge--variant-warning",
		success: "quill-badge--variant-success",
		completed: "quill-badge--variant-completed"
	} },
	defaultVariants: { variant: "default" }
});
function Et({ className: e, variant: t = "default", render: n, ...r }) {
	return R({
		defaultTagName: "span",
		props: L({
			"data-quill": "",
			className: W(Tt({ variant: t }), e)
		}, r),
		render: n,
		state: {
			slot: "badge",
			variant: t
		}
	});
}
function Dt({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "bubble-group",
		className: W("quill-chat-bubble-group", e),
		...t
	});
}
var Ot = F("quill-chat-bubble", {
	variants: { variant: {
		default: "quill-chat-bubble--variant-default",
		secondary: "quill-chat-bubble--variant-secondary",
		muted: "quill-chat-bubble--variant-muted",
		tinted: "quill-chat-bubble--variant-tinted",
		outline: "quill-chat-bubble--variant-outline",
		ghost: "quill-chat-bubble--variant-ghost",
		destructive: "quill-chat-bubble--variant-destructive"
	} },
	defaultVariants: { variant: "default" }
});
function kt({ variant: e = "default", align: t = "start", className: n, ...r }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "bubble",
		"data-variant": e,
		"data-align": t,
		className: W(Ot({ variant: e }), n),
		...r
	});
}
function At({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "div",
		props: L({
			"data-slot": "bubble-content",
			className: W("quill-chat-bubble__content", e)
		}, n),
		render: t,
		state: { slot: "bubble-content" }
	});
}
function jt({ side: e = "bottom", align: t = "end", className: n, ...r }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "bubble-reactions",
		"data-align": t,
		"data-side": e,
		className: W("quill-chat-bubble-reactions", n),
		...r
	});
}
var Mt = "(prefers-reduced-motion: reduce)";
function Nt(e) {
	let t = window.matchMedia(Mt);
	return t.addEventListener("change", e), () => t.removeEventListener("change", e);
}
function Pt() {
	return w.useSyncExternalStore(Nt, () => window.matchMedia(Mt).matches, () => !1);
}
var Ft = {
	left: "M6.057 11.565 C2.081 11.565 0.371 8.159 0.371 5.964 C0.371 3.642 2.152 0.329 6.05 0.329",
	midLeft: "M6.012 11.55 C4.575 10.496 3.333 8.116 3.321 5.964 C3.307 3.399 4.974 0.977 6.012 0.329",
	midRight: "M6.012 11.55 C7.211 10.781 8.715 8.287 8.715 5.964 C8.715 3.399 7.24 1.233 6.012 0.329",
	right: "M6.012 11.55 C9.677 11.55 11.65 8.487 11.65 5.964 C11.65 3.499 9.748 0.329 6.012 0.329"
}, It = [
	Ft.left,
	Ft.midLeft,
	Ft.midRight,
	Ft.right,
	Ft.left
].join(";"), Lt = 13.48;
Math.round((Lt - 12) / 2 * 100) / 100;
var Rt = `-0.74 -0.74 ${Lt} ${Lt}`, zt = .95, Bt = "7.2s", Vt = [
	"0s",
	"-1.2s",
	"-2.4s",
	"-3.6s",
	"-4.8s",
	"-6s"
], Ht = "0.42 0 0.58 1";
function Ut({ className: e, ...t }) {
	let n = Pt();
	return /* @__PURE__ */ N("svg", {
		"data-quill": !0,
		"data-slot": "globe",
		viewBox: Rt,
		width: "14",
		height: "14",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: zt,
		strokeLinecap: "round",
		"aria-hidden": "true",
		className: W("quill-chat-globe", e),
		...t,
		children: [
			/* @__PURE__ */ M("circle", {
				cx: "6",
				cy: "6",
				r: "5.7",
				opacity: "0.9"
			}),
			/* @__PURE__ */ M("line", {
				x1: "0.3",
				y1: "6",
				x2: "11.7",
				y2: "6",
				opacity: "0.9"
			}),
			n ? /* @__PURE__ */ N(j, { children: [/* @__PURE__ */ M("path", {
				d: Ft.midLeft,
				opacity: "0.9"
			}), /* @__PURE__ */ M("path", {
				d: Ft.midRight,
				opacity: "0.9"
			})] }) : Vt.map((e) => /* @__PURE__ */ N("path", {
				d: Ft.left,
				opacity: "0",
				children: [/* @__PURE__ */ M("animate", {
					attributeName: "d",
					dur: Bt,
					begin: e,
					repeatCount: "indefinite",
					calcMode: "spline",
					keyTimes: "0;0.25;0.5;0.75;1",
					keySplines: [
						Ht,
						Ht,
						Ht,
						Ht
					].join(";"),
					values: It
				}), /* @__PURE__ */ M("animate", {
					attributeName: "opacity",
					dur: Bt,
					begin: e,
					repeatCount: "indefinite",
					calcMode: "linear",
					keyTimes: "0;0.05;0.7;0.75;1",
					values: "0;0.9;0.9;0;0"
				})]
			}, e))
		]
	});
}
var Wt = F("quill-chat-marker", {
	variants: { variant: {
		default: "",
		separator: "quill-chat-marker--separator",
		border: "quill-chat-marker--border"
	} },
	defaultVariants: { variant: "default" }
}), Gt = w.createContext(void 0);
function Kt({ body: e, ...t }) {
	return e != null && e !== !1 && e !== "" ? /* @__PURE__ */ M(Jt, {
		body: e,
		...t
	}) : /* @__PURE__ */ M(qt, { ...t });
}
function qt({ className: e, variant: t = "default", status: n, render: r, defaultOpen: i, open: a, onOpenChange: o, ...s }) {
	let c = R({
		defaultTagName: "div",
		props: L({
			"data-quill": "",
			"data-slot": "marker",
			"data-variant": t,
			"data-status": n,
			className: W("quill-chat-row", Wt({
				variant: t,
				className: e
			}))
		}, s),
		render: r,
		state: {
			slot: "marker",
			variant: t,
			status: n
		}
	});
	return /* @__PURE__ */ M(Gt.Provider, {
		value: n,
		children: c
	});
}
function Jt({ className: e, variant: t = "default", status: n, body: r, defaultOpen: i, open: a, onOpenChange: o, children: s, render: c, ...l }) {
	return /* @__PURE__ */ M(Gt.Provider, {
		value: n,
		children: /* @__PURE__ */ N(ae.Root, {
			"data-quill": !0,
			"data-slot": "marker",
			"data-variant": t,
			"data-status": n,
			defaultOpen: i,
			open: a,
			onOpenChange: o,
			className: W(Wt({ variant: t }), "quill-chat-marker--collapsible"),
			children: [/* @__PURE__ */ N(ae.Trigger, {
				className: W("quill-chat-row", "quill-chat-row--interactive", "quill-chat-marker__trigger", e),
				render: c,
				...l,
				children: [s, /* @__PURE__ */ M(d, {
					"aria-hidden": "true",
					className: W("quill-chat-chevron", "quill-chat-chevron--reveal")
				})]
			}), /* @__PURE__ */ M(ae.Panel, {
				"data-slot": "marker-panel",
				className: W("quill-chat-collapse", "quill-chat-rail", "quill-chat-marker__panel"),
				children: r
			})]
		})
	});
}
function Yt({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "marker-icon",
		"aria-hidden": "true",
		className: W("quill-chat-marker__icon", e),
		...t
	});
}
function Xt({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "marker-content",
		className: W("quill-chat-marker__content", w.useContext(Gt) === "running" && "quill-shimmer", e),
		...t
	});
}
function Zt({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "marker-value",
		className: W("quill-chat-marker__value", e),
		...t
	});
}
function Qt({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "message-group",
		className: W("quill-chat-message-group", e),
		...t
	});
}
function $t({ className: e, align: t = "start", ...n }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "message",
		"data-align": t,
		className: W("quill-chat-message", e),
		...n
	});
}
function en({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "message-avatar",
		className: W("quill-chat-message__avatar", e),
		...t
	});
}
function tn({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "message-content",
		className: W("quill-chat-message__content", e),
		...t
	});
}
function nn({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "message-header",
		className: W("quill-chat-message__header", e),
		...t
	});
}
function rn({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "message-footer",
		className: W("quill-chat-message__footer", e),
		...t
	});
}
function an({ defaultTagName: e, props: t, render: n, state: r = {}, stateAttributesMapping: i }) {
	let a = on(sn(r, i), t);
	if (!n) return w.createElement(e, a);
	if (typeof n == "function") return n(a, r);
	if (!w.isValidElement(n)) return null;
	let o = n.props, s = {
		...on(a, o),
		ref: un(a.ref, o.ref)
	};
	return w.cloneElement(n, s);
}
function on(...e) {
	let t = {};
	for (let n of e) {
		if (!n) continue;
		let e = n;
		for (let n of Object.keys(e)) {
			let r = e[n];
			if (r === void 0) continue;
			let i = t[n];
			n === "className" ? t[n] = [i, r].filter(Boolean).join(" ") : n === "style" ? t[n] = {
				...i,
				...r
			} : n === "ref" ? t[n] = un(i, r) : ln(n) && typeof i == "function" && typeof r == "function" ? t[n] = cn(r, i) : t[n] = r;
		}
	}
	return t;
}
function sn(e, t) {
	let n = {};
	for (let r of Object.keys(e)) {
		let i = e[r], a = t?.[r]?.(i);
		if (a) {
			Object.assign(n, a);
			continue;
		}
		if (r === "slot") {
			n["data-slot"] = i;
			continue;
		}
		let o = `data-${String(r).replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`)}`;
		typeof i == "boolean" ? n[o] = i ? "" : void 0 : i != null && (n[o] = String(i));
	}
	return n;
}
function cn(e, t) {
	return function(n) {
		e(n), n.defaultPrevented || t(n);
	};
}
function ln(e) {
	return /^on[A-Z]/.test(e);
}
function un(...e) {
	let t = e.filter(Boolean);
	if (t.length !== 0) return (e) => {
		for (let n of t) typeof n == "function" ? n(e) : n && (n.current = e);
	};
}
var dn = 8, fn = 64, pn = 0, mn = .5, hn = 180, gn = /* @__PURE__ */ new Set([
	"ArrowDown",
	"ArrowUp",
	"End",
	"Home",
	"PageDown",
	"PageUp",
	" "
]), _n = {
	start: !1,
	end: !1
}, vn = {
	currentAnchorId: null,
	visibleMessageIds: []
};
function yn({ content: e, scrollEdgeThreshold: t, spacer: n, viewport: r }) {
	if (!r || !e) return _n;
	let i = jn({
		content: e,
		spacer: n,
		viewport: r
	});
	return {
		start: r.scrollTop > t,
		end: i - r.scrollTop - r.clientHeight > t
	};
}
function bn({ content: e, scrollMargin: t, scrollPreviousItemPeek: n, spacer: r, viewport: i, visibleMessageIds: a }) {
	if (!e || !i) return vn;
	let o = i.getBoundingClientRect(), s = o.top + t + n, c = typeof IntersectionObserver > "u", l = [], u = null;
	for (let t of xn(e, r)) {
		let e = t.dataset.messageId;
		if (!e) continue;
		let n = t.dataset.scrollAnchor === "true", r = n || c ? t.getBoundingClientRect() : null;
		(c && r ? r.bottom > s && r.top < o.bottom : a.has(e)) && l.push(e), n && r && r.top <= s + mn && (u = e);
	}
	return l.length === 0 && u === null ? vn : {
		currentAnchorId: u,
		visibleMessageIds: l
	};
}
function xn(e, t) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement && e !== t);
}
function Sn(e, t) {
	for (let n = t; n < e.length; n++) {
		let t = e[n];
		if (t?.dataset.scrollAnchor === "true") return t;
	}
	return null;
}
function Cn(e, t) {
	for (let n of e) if (n.dataset.scrollAnchor === "true" && !t.has(n)) return n;
	return null;
}
function wn(e, t) {
	let n = 0;
	for (let r = t; r < e.length; r++) if (e[r]?.dataset.scrollAnchor === "true" && (n += 1, n > 1)) return !0;
	return !1;
}
function Tn(e) {
	for (let t = e.length - 1; t >= 0; t--) {
		let n = e[t];
		if (n?.dataset.scrollAnchor === "true") return n;
	}
	return null;
}
function En({ content: e, spacer: t, viewport: n }) {
	let r = n.getBoundingClientRect();
	for (let n of xn(e, t)) {
		if (!n.dataset.messageId) continue;
		let e = n.getBoundingClientRect();
		if (e.bottom > r.top && e.top < r.bottom) return n;
	}
	return null;
}
function Dn({ align: e, element: t, scrollMargin: n, spacer: r, viewport: i }) {
	let a = On(t, i), o = t.getBoundingClientRect().height, s = Pn(r);
	if (e === "center") {
		let e = Math.max(0, i.clientHeight - s.start - s.end);
		return a - s.start - (e - o) / 2 - n;
	}
	if (e === "end") return a - i.clientHeight + o + s.end + n;
	if (e === "nearest") {
		let e = a + o, t = i.scrollTop + s.start, r = i.scrollTop + i.clientHeight - s.end;
		return a >= t && e <= r ? i.scrollTop : a < t ? a - s.start - n : e - i.clientHeight + s.end + n;
	}
	return a - s.start - n;
}
function On(e, t) {
	let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
	return n.top - r.top + t.scrollTop;
}
function kn(e, t) {
	return e.getBoundingClientRect().top - t.getBoundingClientRect().top;
}
function An({ content: e, scrollTop: t, spacer: n, viewport: r }) {
	let i = jn({
		content: e,
		spacer: n,
		viewport: r
	});
	return t + r.clientHeight - i;
}
function jn({ content: e, spacer: t, viewport: n }) {
	let r = xn(e, t), i = Nn(e), a = n.getBoundingClientRect(), o = n.scrollTop, s = i.start + i.end;
	for (let e of r) {
		let t = e.getBoundingClientRect();
		s = Math.max(s, t.bottom - a.top + o + i.end);
	}
	return s;
}
function Mn(e) {
	return Math.max(0, e.scrollHeight - e.clientHeight);
}
function Nn(e) {
	let t = window.getComputedStyle(e);
	return {
		end: In(t.paddingBlockEnd || t.paddingBottom),
		start: In(t.paddingBlockStart || t.paddingTop)
	};
}
function Pn(e) {
	let t = e?.parentElement;
	return t ? Nn(t) : {
		end: 0,
		start: 0
	};
}
function Fn(e) {
	if (!e) return 0;
	let t = window.getComputedStyle(e);
	return In(t.rowGap === "normal" ? t.gap : t.rowGap);
}
function In(e) {
	if (!e) return 0;
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
function Ln({ refs: e, commitScrollState: t, scheduleStateCommit: n, scheduleVisibilitySync: r }) {
	let { streamingTurnRef: i, autoScrollRef: a, autoscrollingRef: o, autoscrollingTimeoutRef: s, contentRef: c, defaultScrollPositionAppliedRef: l, itemCountRef: u, messageElementsRef: d, modeRef: f, pendingScrollToMessageRef: p, prependRestoreRef: m, scrollMarginRef: h, scrollPreviousItemPeekRef: g, spacerGapRef: _, spacerHeightRef: v, spacerRef: y, viewportRef: b } = e, x = w.useCallback((e) => {
		s.current !== null && (window.clearTimeout(s.current), s.current = null), o.current !== e && (o.current = e, t()), e && (s.current = window.setTimeout(() => {
			s.current = null, o.current = !1, t();
		}, hn));
	}, [t]), S = w.useCallback((e) => {
		let t = y.current;
		if (!t) return;
		let n = Math.max(0, Math.ceil(e));
		v.current !== n && (v.current = n, t.hidden = n === 0, t.style.height = `${n}px`, t.style.marginTop = n > 0 ? `${-_.current}px` : "");
	}, []), C = w.useCallback((e, { behavior: r = "auto", autoscrolling: i = !1 } = {}) => {
		let a = b.current;
		if (!a) return;
		let o = Math.max(0, e);
		if (Math.abs(a.scrollTop - o) <= mn) {
			a.scrollTop = o, t();
			return;
		}
		i && x(!0), a.scrollTo({
			top: o,
			behavior: r
		}), n();
	}, [
		t,
		n,
		x
	]), ee = w.useCallback(({ behavior: e = "auto" } = {}) => b.current ? (S(0), i.current = null, f.current = "free-scrolling", C(0, { behavior: e }), r(), !0) : !1, [
		r,
		C,
		S
	]), T = w.useCallback(({ behavior: e = "auto" } = {}) => {
		let t = b.current;
		return t ? (S(0), i.current = null, f.current = a.current ? "following-bottom" : "free-scrolling", C(Mn(t), {
			autoscrolling: !0,
			behavior: e
		}), r(), !0) : !1;
	}, [
		r,
		C,
		S
	]), E = w.useCallback((e, { align: t = "start", behavior: n = "auto", scrollMargin: a = h.current } = {}, { keepPreviousPeek: o = !1 } = {}) => {
		let s = c.current, l = b.current;
		if (!s || !l || !s.contains(e)) return !1;
		let u = Dn({
			align: t,
			element: e,
			scrollMargin: o ? a + g.current : a,
			spacer: y.current,
			viewport: l
		}), d = An({
			content: s,
			scrollTop: u,
			spacer: y.current,
			viewport: l
		});
		return S(d), m.current = {
			element: e,
			viewportTop: kn(e, l)
		}, f.current = o ? "anchored-to-message" : "settling-jump", i.current = o ? e : null, C(u, { behavior: n }), r(), !0;
	}, [
		r,
		C,
		S
	]), D = w.useCallback(() => {
		let e = i.current;
		return !e || !e.isConnected || f.current !== "anchored-to-message" ? !1 : E(e, { align: "start" }, { keepPreviousPeek: !0 });
	}, [E]), O = w.useCallback((e, t) => {
		let n = d.current.get(e);
		return n ? (l.current = !0, E(n, t) ? (p.current = null, !0) : (p.current = {
			messageId: e,
			options: t
		}, !0)) : u.current === 0 ? (p.current = {
			messageId: e,
			options: t
		}, l.current = !0, !0) : !1;
	}, [E]);
	return {
		flushPendingScrollToMessage: w.useCallback(() => {
			let e = p.current;
			if (!e) return !1;
			let t = d.current.get(e.messageId);
			return !t || !E(t, e.options) ? !1 : (p.current = null, l.current = !0, !0);
		}, [E]),
		reanchorToAnchoredMessage: D,
		scrollToElement: E,
		scrollToEnd: T,
		scrollToMessage: O,
		scrollToStart: ee
	};
}
function Rn(e, t) {
	let n = e, r = /* @__PURE__ */ new Set();
	return {
		getSnapshot: () => n,
		hasListeners: () => r.size > 0,
		setSnapshot: (e) => {
			t(n, e) || (n = e, r.forEach((e) => e()));
		},
		subscribe: (e, t, n) => {
			let i = r.size === 0;
			return r.add(e), i && t?.(), () => {
				r.delete(e), r.size === 0 && n?.();
			};
		}
	};
}
function zn(e, t) {
	return Rn(e, t);
}
function Bn() {
	return Rn(vn, Hn);
}
function Vn(e, t) {
	return e.start === t.start && e.end === t.end;
}
function Hn(e, t) {
	return e.currentAnchorId !== t.currentAnchorId || e.visibleMessageIds.length !== t.visibleMessageIds.length ? !1 : e.visibleMessageIds.every((e, n) => e === t.visibleMessageIds[n]);
}
function Un({ autoScroll: e, scrollEdgeThreshold: t, scrollMargin: n, scrollPreviousItemPeek: r }) {
	let i = w.useRef(e), a = w.useRef(!1), o = w.useRef(null), s = w.useRef(!1), c = w.useRef(t), l = w.useRef(0), u = w.useRef(null), d = w.useRef(e ? "following-bottom" : "free-scrolling"), f = w.useRef(/* @__PURE__ */ new Map()), p = w.useRef(null), m = w.useRef(null), h = w.useRef(null), g = w.useRef(r), _ = w.useRef(!0), v = w.useRef(null), y = w.useRef(n), b = w.useRef(null), x = w.useRef(0), S = w.useRef(0), C = w.useRef(null), ee = w.useRef(null), T = w.useRef(null), E = w.useRef(null), D = w.useRef(null), O = w.useRef(null), k = w.useRef(null), A = w.useRef(null), j = w.useRef(/* @__PURE__ */ new Set()), M = w.useRef(/* @__PURE__ */ new WeakSet());
	return T.current === null && (T.current = zn(_n, Vn)), A.current === null && (A.current = Bn()), i.current = e, c.current = t, y.current = n, g.current = r, {
		autoScrollRef: i,
		autoscrollingRef: a,
		autoscrollingTimeoutRef: E,
		streamingTurnRef: h,
		contentRef: o,
		defaultScrollPositionAppliedRef: s,
		firstItemRef: u,
		itemCountRef: l,
		messageElementsRef: f,
		modeRef: d,
		pendingScrollFrameRef: b,
		pendingScrollToMessageRef: p,
		prependRestoreRef: m,
		preserveScrollOnPrependRef: _,
		rootRef: v,
		scrollEdgeThresholdRef: c,
		scrollMarginRef: y,
		scrollPreviousItemPeekRef: g,
		spacerGapRef: x,
		spacerHeightRef: S,
		spacerRef: C,
		stateFrameRef: ee,
		stateStore: T.current,
		viewportRef: D,
		visibilityFrameRef: O,
		visibilityObserverRef: k,
		visibilityStore: A.current,
		visibleMessageIdsRef: j,
		handledScrollAnchorsRef: M
	};
}
function Wn(e, t) {
	return w.useCallback((n) => {
		e.current = n, n && t();
	}, [e, t]);
}
function Gn({ autoScroll: e = !1, defaultScrollPosition: t = "end", scrollEdgeThreshold: n = dn, scrollPreviousItemPeek: r = fn, scrollMargin: i = pn }) {
	let a = Un({
		autoScroll: e,
		scrollEdgeThreshold: n,
		scrollMargin: i,
		scrollPreviousItemPeek: r
	}), { streamingTurnRef: o, autoScrollRef: s, autoscrollingRef: c, autoscrollingTimeoutRef: l, contentRef: u, defaultScrollPositionAppliedRef: d, firstItemRef: f, itemCountRef: p, messageElementsRef: m, modeRef: h, pendingScrollFrameRef: g, pendingScrollToMessageRef: _, prependRestoreRef: v, preserveScrollOnPrependRef: y, rootRef: b, scrollEdgeThresholdRef: x, scrollMarginRef: S, scrollPreviousItemPeekRef: C, spacerGapRef: ee, spacerRef: T, stateFrameRef: E, stateStore: D, viewportRef: O, visibilityFrameRef: k, visibilityObserverRef: A, visibilityStore: j, visibleMessageIdsRef: M, handledScrollAnchorsRef: N } = a, te = w.useRef(t);
	te.current !== t && (te.current = t, d.current = !1);
	let P = w.useCallback((e) => {
		let t = b.current, n = O.current, r = [e.start && "start", e.end && "end"].filter(Boolean).join(" "), i = c.current;
		for (let e of [t, n]) e && (r ? e.setAttribute("data-scrollable", r) : e.removeAttribute("data-scrollable"), e.toggleAttribute("data-autoscrolling", i));
	}, []), ne = w.useCallback((e) => {
		s.current && !e.end && h.current !== "settling-jump" ? h.current = "following-bottom" : h.current === "following-bottom" && e.end && !c.current && (h.current = "free-scrolling");
	}, []), F = w.useCallback(() => {
		let e = yn({
			content: u.current,
			scrollEdgeThreshold: x.current,
			spacer: T.current,
			viewport: O.current
		});
		ne(e), P(e), D.setSnapshot(e);
	}, [
		ne,
		D,
		P
	]), re = w.useCallback(() => {
		E.current === null && (E.current = window.requestAnimationFrame(() => {
			E.current = null, F();
		}));
	}, [F]), I = w.useCallback(() => {
		j.hasListeners() && k.current === null && (k.current = window.requestAnimationFrame(() => {
			k.current = null, j.hasListeners() && j.setSnapshot(bn({
				content: u.current,
				scrollMargin: S.current,
				scrollPreviousItemPeek: C.current,
				spacer: T.current,
				viewport: O.current,
				visibleMessageIds: M.current
			}));
		}));
	}, [j]), { flushPendingScrollToMessage: L, reanchorToAnchoredMessage: R, scrollToElement: ie, scrollToEnd: z, scrollToMessage: ae, scrollToStart: oe } = Ln({
		refs: a,
		commitScrollState: F,
		scheduleStateCommit: re,
		scheduleVisibilitySync: I
	}), se = w.useCallback(() => {
		let e = v.current, t = O.current;
		if (!e || !t || !e.element.isConnected) return !1;
		let n = kn(e.element, t) - e.viewportTop;
		return Math.abs(n) <= mn ? !1 : (t.scrollTop += n, e.viewportTop = kn(e.element, t), re(), I(), !0);
	}, [re, I]), ce = w.useCallback(() => {
		let e = u.current, t = O.current;
		if (!e || !t) {
			v.current = null;
			return;
		}
		let n = En({
			content: e,
			spacer: T.current,
			viewport: t
		});
		v.current = n ? {
			element: n,
			viewportTop: kn(n, t)
		} : null;
	}, []), le = w.useCallback(() => {
		g.current === null && (g.current = window.requestAnimationFrame(() => {
			g.current = null, L() && ce();
		}));
	}, [ce, L]), B = w.useCallback(() => {
		if (!t || d.current || p.current === 0) return !1;
		let e = !1;
		if (t === "last-anchor") {
			let t = u.current, n = O.current, r = t && n ? Tn(xn(t, T.current)) : null;
			if (!t || !n || !r) e = z({ behavior: "auto" });
			else {
				let i = On(r, n);
				e = jn({
					content: t,
					spacer: T.current,
					viewport: n
				}) - i <= n.clientHeight ? z({ behavior: "auto" }) : ie(r, { align: "start" }, { keepPreviousPeek: !0 });
			}
		} else e = t === "end" ? z({ behavior: "auto" }) : oe({ behavior: "auto" });
		return e ? (d.current = !0, !0) : !1;
	}, [
		t,
		ie,
		z,
		oe
	]), V = w.useCallback(() => {
		let e = u.current;
		if (!e) return;
		let t = xn(e, T.current), n = p.current, r = f.current;
		p.current = t.length, f.current = t[0] ?? null, (() => {
			if (L()) return;
			if (n === 0) {
				if (B() || t.length > 0 && s.current && z({ behavior: "auto" })) return;
				F(), I();
				return;
			}
			let e = r ? t.indexOf(r) : -1;
			if (y.current && e > 0) {
				se();
				return;
			}
			if (t.length > n) {
				let e = Sn(t, n);
				if (e) {
					if (s.current && h.current === "following-bottom" && wn(t, n)) {
						z({ behavior: "auto" });
						return;
					}
					ie(e, { align: "start" }, { keepPreviousPeek: !0 }), N.current.add(e);
					return;
				}
			}
			if (t.length === n) {
				let e = Cn(t, N.current);
				if (e) {
					ie(e, { align: "start" }, { keepPreviousPeek: !0 }), N.current.add(e);
					return;
				}
			}
			h.current === "following-bottom" && s.current ? z({ behavior: "auto" }) : (F(), I());
		})(), ce();
	}, [
		B,
		ce,
		F,
		L,
		se,
		I,
		ie,
		z
	]), ue = w.useCallback(() => {
		if (h.current === "following-bottom" && s.current) {
			z({ behavior: "auto" });
			return;
		}
		R() || (re(), I());
	}, [
		R,
		re,
		I,
		z
	]), de = w.useCallback(() => {
		let e = O.current;
		if (!(!e || !j.hasListeners())) {
			if (typeof IntersectionObserver > "u") {
				I();
				return;
			}
			A.current ||= new IntersectionObserver((e) => {
				for (let t of e) {
					let e = t.target.dataset.messageId;
					e && (t.isIntersecting ? M.current.add(e) : M.current.delete(e));
				}
				I();
			}, {
				root: e,
				rootMargin: `${-(S.current + C.current)}px 0px 0px 0px`,
				threshold: [
					0,
					.01,
					.5,
					1
				]
			}), m.current.forEach((e) => {
				A.current?.observe(e);
			}), I();
		}
	}, [I, j]), fe = w.useCallback(() => {
		k.current !== null && (window.cancelAnimationFrame(k.current), k.current = null), A.current?.disconnect(), A.current = null, M.current.clear(), j.setSnapshot(vn);
	}, [j]), pe = w.useCallback((e, t, n) => {
		if (t) {
			m.current.set(e, t), A.current?.observe(t), I(), _.current?.messageId === e && le();
			return;
		}
		n && m.current.get(e) === n && (m.current.delete(e), M.current.delete(e), A.current?.unobserve(n), I());
	}, [le, I]), me = w.useCallback(() => {
		(h.current === "following-bottom" || h.current === "anchored-to-message" || h.current === "settling-jump") && (o.current = null, h.current = "free-scrolling");
	}, []), he = w.useCallback(() => P(D.getSnapshot()), [D, P]), ge = Wn(b, he), H = Wn(O, he), _e = w.useCallback((e) => {
		u.current = e;
	}, []), ve = w.useCallback((e) => {
		T.current = e, ee.current = Fn(e?.parentElement ?? null);
	}, []), ye = w.useCallback(() => {
		F(), I(), ce();
	}, [
		ce,
		F,
		I
	]), be = w.useMemo(() => ({
		handleContentChange: V,
		handleResize: ue,
		observeVisibility: de,
		preserveScrollOnPrependRef: y,
		scrollToEnd: z,
		scrollToMessage: ae,
		scrollToStart: oe,
		setContentElement: _e,
		setRootElement: ge,
		setSpacerElement: ve,
		setViewportElement: H,
		stateStore: D,
		syncAfterScroll: ye,
		unobserveVisibility: fe,
		userScrollIntent: me,
		viewportRef: O,
		visibilityStore: j
	}), [
		V,
		ue,
		de,
		z,
		ae,
		oe,
		_e,
		ge,
		ve,
		H,
		D,
		ye,
		fe,
		me,
		j
	]);
	return w.useLayoutEffect(() => {
		B();
	}, [B]), w.useEffect(() => () => {
		E.current !== null && (window.cancelAnimationFrame(E.current), E.current = null), k.current !== null && (window.cancelAnimationFrame(k.current), k.current = null), l.current !== null && (window.clearTimeout(l.current), l.current = null), g.current !== null && (window.cancelAnimationFrame(g.current), g.current = null), A.current?.disconnect(), A.current = null;
	}, []), w.useLayoutEffect(() => {
		if (e && h.current === "following-bottom" && p.current > 0) {
			z({ behavior: "auto" });
			return;
		}
		F();
	}, [
		e,
		F,
		z
	]), {
		context: be,
		registerMessage: pe
	};
}
function Kn(e) {
	let t = w.useRef(e);
	return t.current = e, t;
}
var qn = w.createContext(null), Jn = w.createContext(null);
function Yn() {
	let e = w.useContext(qn);
	if (!e) throw Error("useMessageScroller must be used within a MessageScroller.");
	return e;
}
function Xn() {
	let e = w.useContext(Jn);
	if (!e) throw Error("MessageScrollerItem must be used within a MessageScroller.");
	return e;
}
function Zn() {
	let { scrollToEnd: e, scrollToMessage: t, scrollToStart: n } = Yn();
	return w.useMemo(() => ({
		scrollToEnd: e,
		scrollToMessage: t,
		scrollToStart: n
	}), [
		e,
		t,
		n
	]);
}
function Qn() {
	let { stateStore: e } = Yn();
	return w.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getSnapshot);
}
function $n() {
	let { observeVisibility: e, unobserveVisibility: t, visibilityStore: n } = Yn(), r = w.useCallback((r) => n.subscribe(r, e, t), [
		e,
		t,
		n
	]);
	return w.useSyncExternalStore(r, n.getSnapshot, n.getSnapshot);
}
function er({ autoScroll: e = !1, children: t, defaultScrollPosition: n = "end", scrollEdgeThreshold: r, scrollPreviousItemPeek: i, scrollMargin: a }) {
	let { context: o, registerMessage: s } = Gn({
		autoScroll: e,
		defaultScrollPosition: n,
		scrollEdgeThreshold: r,
		scrollPreviousItemPeek: i,
		scrollMargin: a
	});
	return M(qn.Provider, {
		value: o,
		children: M(Jn.Provider, {
			value: s,
			children: t
		})
	});
}
function tr({ children: e, ...t }) {
	let { setRootElement: n } = Yn();
	return M("div", {
		ref: n,
		...t,
		children: e
	});
}
function nr({ "aria-label": e, children: t, onKeyDown: n, onScroll: r, onTouchMove: i, onWheel: a, preserveScrollOnPrepend: o = !0, ref: s, role: c, tabIndex: l, ...u }) {
	let { handleResize: d, preserveScrollOnPrependRef: f, setViewportElement: p, syncAfterScroll: m, userScrollIntent: h, viewportRef: g } = Yn();
	f.current = o;
	let _ = w.useCallback((e) => {
		p(e), un(s)?.(e);
	}, [s, p]);
	function v(e) {
		m(), r?.(e);
	}
	function y(e) {
		h(), a?.(e);
	}
	function b(e) {
		h(), i?.(e);
	}
	function x(e) {
		gn.has(e.key) && h(), n?.(e);
	}
	return w.useEffect(() => {
		let e = g.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver(d);
		return t.observe(e), () => t.disconnect();
	}, [d, g]), M("div", {
		ref: _,
		role: c ?? "region",
		"aria-label": e ?? "Messages",
		tabIndex: l ?? 0,
		onKeyDown: x,
		onScroll: v,
		onTouchMove: b,
		onWheel: y,
		...u,
		children: t
	});
}
function rr({ "aria-relevant": e, children: t, ref: n, role: r, spacerClassName: i, ...a }) {
	let { handleContentChange: o, handleResize: s, setContentElement: c, setSpacerElement: l } = Yn(), u = w.useRef(null), d = w.useCallback((e) => {
		u.current = e, c(e), un(n)?.(e);
	}, [n, c]);
	return w.useLayoutEffect(() => {
		let e = u.current;
		if (!e || (o(), typeof MutationObserver > "u")) return;
		let t = new MutationObserver(() => {
			o();
		});
		return t.observe(e, { childList: !0 }), () => t.disconnect();
	}, [o]), w.useEffect(() => {
		let e = u.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver(s);
		return t.observe(e), () => t.disconnect();
	}, [s]), N("div", {
		ref: d,
		role: r ?? "log",
		"aria-relevant": e ?? "additions",
		...a,
		children: [t, M("div", {
			ref: l,
			"aria-hidden": "true",
			"data-message-scroller-spacer": "",
			hidden: !0,
			className: i
		})]
	});
}
function ir({ messageId: e, ref: t, scrollAnchor: n = !1, ...r }) {
	let i = Xn(), a = w.useRef(null);
	return M("div", {
		ref: w.useCallback((n) => {
			let r = a.current;
			a.current = n, e && i(e, n, r), un(t)?.(n);
		}, [
			e,
			t,
			i
		]),
		"data-message-id": e,
		"data-scroll-anchor": n ? "true" : "false",
		...r
	});
}
function ar({ behavior: e = "smooth", children: t, direction: n = "end", onClick: r, render: i, tabIndex: a, type: o = "button", ...s }) {
	let { scrollToEnd: c, scrollToStart: l, stateStore: u } = Yn(), d = Kn(r), f = w.useCallback((e) => u.subscribe(e), [u]), p = w.useCallback(() => {
		let e = u.getSnapshot();
		return n === "start" ? e.start : e.end;
	}, [n, u]), m = w.useSyncExternalStore(f, p, p), h = w.useCallback((t) => {
		m && (d.current?.(t), t.defaultPrevented || (t.currentTarget.blur(), n === "start" ? l({ behavior: e }) : c({ behavior: e })));
	}, [
		e,
		n,
		m,
		d,
		c,
		l
	]);
	return an({
		defaultTagName: "button",
		props: on({
			type: o,
			inert: !m,
			tabIndex: m ? a : -1,
			children: t ?? N("span", { children: ["Scroll to ", n] }),
			onClick: h
		}, s),
		render: i,
		state: {
			active: m,
			direction: n
		},
		stateAttributesMapping: { active: (e) => ({ "data-active": e ? "true" : "false" }) }
	});
}
var or = {
	Provider: er,
	Root: tr,
	Viewport: nr,
	Content: rr,
	Item: ir,
	Button: ar
};
function sr(e) {
	return /* @__PURE__ */ M(or.Provider, { ...e });
}
function cr({ className: e, ...t }) {
	return /* @__PURE__ */ M(or.Root, {
		"data-quill": !0,
		"data-slot": "chat-message-scroller",
		className: W("quill-chat-message-scroller group/chat-message-scroller", e),
		...t
	});
}
function lr({ className: e, ...t }) {
	return /* @__PURE__ */ M(or.Viewport, {
		"data-slot": "chat-message-scroller-viewport",
		className: W("quill-chat-message-scroller__viewport", e),
		...t
	});
}
function ur({ className: e, density: t = "default", ...n }) {
	return /* @__PURE__ */ M(or.Content, {
		"data-slot": "chat-message-scroller-content",
		"data-density": t,
		className: W("quill-chat-message-scroller__content", e),
		...n
	});
}
function dr({ className: e, scrollAnchor: t = !1, ...n }) {
	return /* @__PURE__ */ M(or.Item, {
		"data-slot": "chat-message-scroller-item",
		scrollAnchor: t,
		className: W("quill-chat-message-scroller__item", e),
		...n
	});
}
function fr({ direction: e = "end", className: t, children: r, render: i, ...a }) {
	return /* @__PURE__ */ M(or.Button, {
		"data-slot": "chat-message-scroller-button",
		"data-direction": e,
		direction: e,
		className: W("quill-chat-message-scroller__button", t),
		render: i ?? /* @__PURE__ */ M(G, {
			variant: "outline",
			size: "icon"
		}),
		...a,
		children: r ?? /* @__PURE__ */ N(j, { children: [/* @__PURE__ */ M(n, { className: "size-4" }), /* @__PURE__ */ M("span", {
			className: "sr-only",
			children: e === "end" ? "Scroll to end" : "Scroll to start"
		})] })
	});
}
var pr = {
	pending: /* @__PURE__ */ M(h, {}),
	loading: /* @__PURE__ */ M(Ut, {}),
	done: /* @__PURE__ */ M(m, {})
};
function mr({ className: e, ...t }) {
	return /* @__PURE__ */ M("ul", {
		"data-quill": !0,
		"data-slot": "source-list",
		className: W("quill-chat-source-list", e),
		...t
	});
}
function hr({ status: e = "pending", className: t, children: n, href: r, render: i, ...a }) {
	return /* @__PURE__ */ M("li", {
		"data-status": e,
		className: "quill-chat-source-item",
		children: R({
			defaultTagName: r == null ? "span" : "a",
			props: L({
				"data-slot": "source",
				href: r,
				className: W("quill-chat-source", t),
				children: /* @__PURE__ */ N(j, { children: [
					/* @__PURE__ */ M("span", {
						"data-slot": "source-bullet",
						"data-status": e,
						className: "quill-chat-bullet",
						children: /* @__PURE__ */ M(w.Fragment, { children: pr[e] }, e)
					}),
					n,
					r != null && /* @__PURE__ */ M(o, {
						"aria-hidden": "true",
						className: "quill-chat-source__arrow"
					})
				] })
			}, a),
			render: i,
			state: {
				slot: "source",
				status: e
			}
		})
	});
}
function gr({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "source-title",
		className: W("quill-chat-source__title", e),
		...t
	});
}
function _r({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "source-url",
		className: W("quill-chat-source__url", e),
		...t
	});
}
function vr({ pinned: e = !1, className: t, children: n, onScroll: r, ...i }) {
	let a = w.useRef(null), o = w.useRef(null), [s, c] = w.useState(e), l = w.useCallback(() => {
		let e = a.current, t = o.current;
		if (!e || !t) return;
		let n = (t, n) => {
			e.toggleAttribute("data-fade-top", t), e.toggleAttribute("data-fade-bottom", n);
		};
		if (s) {
			let r = Math.max(0, t.offsetHeight - e.clientHeight);
			t.style.setProperty("--quill-chat-stream-offset", `${-r}px`), n(r > 0, !1);
			return;
		}
		t.style.setProperty("--quill-chat-stream-offset", "0px"), n(e.scrollTop > 1, e.scrollTop + e.clientHeight < e.scrollHeight - 1);
	}, [s]);
	w.useLayoutEffect(() => {
		let e = o.current;
		if (!e) return;
		let t = new ResizeObserver(l);
		return t.observe(e), () => t.disconnect();
	}, [l]), w.useEffect(() => {
		if (e) {
			c(!0);
			return;
		}
		let t = o.current;
		if (!s || !t) return;
		let n = !1, r = () => {
			n || (n = !0, c(!1));
		}, i = (e) => {
			e.propertyName === "translate" && r();
		};
		t.addEventListener("transitionend", i);
		let a = parseFloat(getComputedStyle(t).transitionDuration) * 1e3 || 0, l = setTimeout(r, a + 50);
		return () => {
			t.removeEventListener("transitionend", i), clearTimeout(l);
		};
	}, [e, s]);
	let u = w.useRef(s);
	return w.useLayoutEffect(() => {
		let e = a.current, t = o.current;
		if (u.current && !s && e && t) {
			let n = Math.max(0, t.offsetHeight - e.clientHeight), r = t.style.transition;
			t.style.transition = "none", t.style.setProperty("--quill-chat-stream-offset", "0px"), e.scrollTop = n, t.offsetHeight, t.style.transition = r;
		}
		u.current = s, l();
	}, [s, l]), /* @__PURE__ */ M("div", {
		ref: a,
		"data-quill": !0,
		"data-slot": "stream",
		"data-pinned": s || void 0,
		onScroll: (e) => {
			l(), r?.(e);
		},
		className: W("quill-chat-stream", t),
		...i,
		children: /* @__PURE__ */ M("div", {
			ref: o,
			"data-slot": "stream-lines",
			className: "quill-chat-stream__lines",
			children: n
		})
	});
}
function yr({ className: e, ...t }) {
	return /* @__PURE__ */ M("p", {
		"data-slot": "stream-line",
		className: W("quill-chat-stream__line", e),
		...t
	});
}
var br = {
	pending: /* @__PURE__ */ M(h, {}),
	active: /* @__PURE__ */ M(p, {}),
	done: /* @__PURE__ */ M(m, {}),
	failed: /* @__PURE__ */ M(g, {})
}, xr = w.createContext(null);
function Sr(e) {
	let t = w.useContext(xr);
	if (!t) throw Error(`${e} must be used within a ChatTaskList`);
	return t;
}
function Cr({ value: e, total: t, className: n, ...r }) {
	let i = w.useMemo(() => ({
		value: e,
		total: t
	}), [e, t]);
	return /* @__PURE__ */ M(xr.Provider, {
		value: i,
		children: /* @__PURE__ */ M(ae.Root, {
			"data-quill": !0,
			"data-slot": "task-list",
			className: W("quill-chat-task-list", n),
			...r
		})
	});
}
function wr({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(ae.Trigger, {
		"data-slot": "task-list-trigger",
		className: W("quill-chat-row", "quill-chat-row--interactive", "quill-chat-task-list__trigger", e),
		...n,
		children: t
	});
}
function Tr({ className: e, ...t }) {
	let { value: n, total: r } = Sr("ChatTaskListProgress"), i = r > 0 && n >= r;
	return /* @__PURE__ */ N("span", {
		"data-slot": "task-list-progress",
		"aria-hidden": "true",
		className: W("quill-chat-swap", "quill-chat-task-list__progress", e),
		...t,
		children: [/* @__PURE__ */ M("span", {
			"data-slot": "task-list-progress-icon",
			"data-status": i ? "done" : void 0,
			className: W("quill-chat-bullet", "quill-chat-swap__icon"),
			children: n <= 0 || r <= 0 ? /* @__PURE__ */ M(v, {}) : i ? /* @__PURE__ */ M(m, {}) : /* @__PURE__ */ M(Er, {
				value: n,
				total: r
			})
		}), /* @__PURE__ */ M(d, {
			"aria-hidden": "true",
			className: W("quill-chat-chevron", "quill-chat-swap__chevron")
		})]
	});
}
function Er({ value: e, total: t }) {
	let n = Math.round(Math.min(Math.max(e, 0), t) / t * 100);
	return /* @__PURE__ */ N("svg", {
		viewBox: "0 0 24 24",
		width: "14",
		height: "14",
		fill: "none",
		className: "quill-chat-task-list__ring",
		children: [/* @__PURE__ */ M("circle", {
			className: "quill-chat-task-list__ring-track",
			cx: "12",
			cy: "12",
			r: "10.5",
			stroke: "currentColor",
			strokeWidth: "2.2",
			strokeDasharray: "2.2 4.4",
			strokeLinecap: "round"
		}), /* @__PURE__ */ M("circle", {
			className: "quill-chat-task-list__ring-fill",
			cx: "12",
			cy: "12",
			r: "10.5",
			pathLength: "100",
			stroke: "currentColor",
			strokeWidth: "2.2",
			strokeDasharray: `${n} 100`,
			strokeLinecap: "round"
		})]
	});
}
function Dr({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "task-list-label",
		className: W("quill-chat-task-list__label", e),
		...t
	});
}
function Or({ className: e, ...t }) {
	let { value: n, total: r } = Sr("ChatTaskListCount"), i = `${Math.min(Math.max(n, 0), r)}/${r}`;
	return /* @__PURE__ */ N("span", {
		"data-slot": "task-list-count",
		className: W("quill-chat-task-list__count", e),
		...t,
		children: [/* @__PURE__ */ N("span", {
			className: "sr-only",
			children: [
				Math.min(Math.max(n, 0), r),
				" of ",
				r,
				" done"
			]
		}), /* @__PURE__ */ M("span", {
			"aria-hidden": "true",
			className: "quill-chat-task-list__digits",
			children: i.split("").map((e, t) => /* @__PURE__ */ M(Ar, { char: e }, t))
		})]
	});
}
var kr = 250;
function Ar({ char: e }) {
	let t = w.useRef(e), [n, r] = w.useState(null), i = Pt();
	return w.useEffect(() => {
		if (e === t.current) return;
		let n = t.current;
		if (t.current = e, i) return;
		r({
			from: n,
			to: e
		});
		let a = setTimeout(() => r(null), kr);
		return () => clearTimeout(a);
	}, [e, i]), n ? /* @__PURE__ */ M("span", {
		className: "quill-chat-task-list__char",
		children: /* @__PURE__ */ N("span", {
			className: "quill-chat-task-list__char-roll",
			children: [/* @__PURE__ */ M("span", { children: n.from }), /* @__PURE__ */ M("span", { children: n.to })]
		})
	}) : /* @__PURE__ */ M("span", {
		className: "quill-chat-task-list__char",
		children: e
	});
}
function jr({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(ae.Panel, {
		"data-slot": "task-list-panel",
		className: W("quill-chat-collapse", "quill-chat-rail", "quill-chat-task-list__panel"),
		children: /* @__PURE__ */ M("ol", {
			"data-slot": "task-list-items",
			className: W("quill-chat-task-list__items", e),
			...n,
			children: t
		})
	});
}
function Mr({ status: e = "pending", truncate: t = !1, className: n, children: r, ...i }) {
	return /* @__PURE__ */ N("li", {
		"data-slot": "task",
		"data-status": e,
		className: W("quill-chat-task", t && "quill-chat-task--truncate", n),
		...i,
		children: [/* @__PURE__ */ M("span", {
			"data-status": e,
			className: "quill-chat-bullet",
			children: /* @__PURE__ */ M(w.Fragment, { children: br[e] }, e)
		}), /* @__PURE__ */ M("span", {
			"data-slot": "task-label",
			className: W("quill-chat-task__label", e === "active" && "quill-shimmer"),
			children: r
		})]
	});
}
function Nr({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "task-detail",
		className: W("quill-chat-task__detail", e),
		...t
	});
}
function Pr({ delay: e = 250, ...t }) {
	return /* @__PURE__ */ M(ce.Provider, {
		"data-slot": "tooltip-provider",
		delay: e,
		...t
	});
}
function Fr({ ...e }) {
	return /* @__PURE__ */ M(ce.Root, {
		"data-slot": "tooltip",
		...e
	});
}
function Ir({ ...e }) {
	return /* @__PURE__ */ M(ce.Trigger, {
		"data-slot": "tooltip-trigger",
		...e
	});
}
function Lr({ className: e, side: t = "top", sideOffset: n = 4, align: r = "center", alignOffset: i = 0, children: a, ...o }) {
	return /* @__PURE__ */ M(ce.Portal, { children: /* @__PURE__ */ M(ce.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "tooltip",
		align: r,
		alignOffset: i,
		side: t,
		sideOffset: n,
		className: "isolate",
		children: /* @__PURE__ */ N(ce.Popup, {
			"data-slot": "tooltip-content",
			className: W("quill-tooltip__content inline-flex items-center gap-1.5", e),
			...o,
			children: [a, /* @__PURE__ */ M(ce.Arrow, { className: "quill-tooltip__arrow data-[side=bottom]:top-[5px] data-[side=inline-end]:top-1/2! data-[side=inline-end]:-start-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-end-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-[2px] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-[2px] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-[9px]" })]
		})
	}) });
}
function Rr({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "thread-item-group",
		className: W("quill-thread-item-group", e),
		...t
	});
}
function zr({ className: e, ...t }) {
	return /* @__PURE__ */ M("article", {
		"data-quill": !0,
		"data-slot": "thread-item",
		className: W("quill-thread-item", e),
		...t
	});
}
function Br({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "thread-item-gutter",
		className: W("quill-thread-item__gutter", e),
		...t
	});
}
function Vr({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "thread-item-content",
		className: W("quill-thread-item__content", e),
		...t
	});
}
function Hr({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "thread-item-header",
		className: W("quill-thread-item__header", e),
		...t
	});
}
function Ur({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "span",
		props: L({
			"data-slot": "thread-item-author",
			className: W("quill-thread-item__author", e)
		}, n),
		render: t,
		state: { slot: "thread-item-author" }
	});
}
function Wr({ className: e, ...t }) {
	return /* @__PURE__ */ M("time", {
		"data-slot": "thread-item-timestamp",
		className: W("quill-thread-item__timestamp", e),
		...t
	});
}
function Gr({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "thread-item-body",
		className: W("quill-thread-item__body", e),
		...t
	});
}
function Kr({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "span",
		props: L({
			"data-slot": "thread-item-mention",
			className: W("quill-thread-item__mention", e)
		}, n),
		render: t,
		state: { slot: "thread-item-mention" }
	});
}
function qr({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "a",
		props: L({
			"data-slot": "thread-item-link",
			className: W("quill-thread-item__link", e)
		}, n),
		render: t,
		state: { slot: "thread-item-link" }
	});
}
function Jr({ className: e, defaultOpen: t = !0, ...n }) {
	return /* @__PURE__ */ M(ae.Root, {
		"data-quill": !0,
		"data-slot": "thread-item-attachment",
		defaultOpen: t,
		className: W("quill-thread-item__attachment", e),
		...n
	});
}
function Yr({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ N(ae.Trigger, {
		"data-slot": "thread-item-attachment-trigger",
		className: W("quill-thread-item__attachment-trigger", t),
		...n,
		children: [e, /* @__PURE__ */ M(c, {
			"data-chevron": "down",
			className: "pointer-events-none shrink-0"
		})]
	});
}
function Xr({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ M(ae.Panel, {
		"data-slot": "thread-item-attachment-content",
		className: "quill-thread-item__attachment-panel",
		...n,
		children: /* @__PURE__ */ M("div", {
			className: W("quill-thread-item__attachment-panel-content", t),
			children: e
		})
	});
}
function Zr({ className: e, alt: t, ...n }) {
	return /* @__PURE__ */ M("img", {
		alt: t,
		"data-slot": "thread-item-attachment-image",
		className: W("quill-thread-item__attachment-image", e),
		...n
	});
}
function Qr({ className: e, "aria-label": t = "Reactions", ...n }) {
	return /* @__PURE__ */ M("div", {
		role: "group",
		"aria-label": t,
		"data-slot": "thread-item-reactions",
		className: W("quill-thread-item__reactions", e),
		...n
	});
}
var $r = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M(oe, {
		ref: n,
		"data-quill": !0,
		"data-slot": "thread-item-reaction",
		className: W("quill-thread-item__reaction", e),
		...t
	});
});
function ei({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"aria-hidden": "true",
		"data-slot": "thread-item-reaction-emoji",
		className: W("quill-thread-item__reaction-emoji", e),
		...t
	});
}
var ti = w.createContext(!1);
function ni({ className: e, "aria-label": t = "Message actions", ...n }) {
	return /* @__PURE__ */ M(ti.Provider, {
		value: !0,
		children: /* @__PURE__ */ M(Pr, { children: /* @__PURE__ */ M(se.Root, {
			"aria-label": t,
			"data-slot": "thread-item-actions",
			className: W("quill-thread-item__actions", e),
			...n
		}) })
	});
}
var ri = w.forwardRef(function({ label: e, tooltipSide: t = "top", size: n = "icon-sm", children: r, ...i }, a) {
	let o = w.useContext(ti), s = /* @__PURE__ */ M(G, {
		ref: a,
		"data-slot": "thread-item-action",
		size: n,
		"aria-label": e,
		...i
	});
	return /* @__PURE__ */ N(Fr, { children: [/* @__PURE__ */ M(Ir, {
		render: o ? /* @__PURE__ */ M(se.Button, { render: s }) : s,
		children: r
	}), /* @__PURE__ */ M(Lr, {
		side: t,
		children: e
	})] });
});
function ii({ className: e, ...t }) {
	return /* @__PURE__ */ M(G, {
		"data-slot": "thread-item-replies",
		left: !0,
		className: W("quill-thread-item__replies", e),
		...t
	});
}
function ai({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "thread-item-replies-label",
		className: W("quill-thread-item__replies-label", e),
		...t
	});
}
function oi({ className: e, ...t }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "thread-item-replies-meta",
		className: W("quill-thread-item__replies-meta", e),
		...t
	});
}
var si = F("quill-button-group", {
	variants: { orientation: {
		horizontal: "",
		vertical: ""
	} },
	defaultVariants: { orientation: "horizontal" }
});
function ci({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ M("div", {
		role: "group",
		"data-quill": !0,
		"data-slot": "button-group",
		"data-orientation": t,
		className: W(si({ orientation: t }), e),
		...n
	});
}
function li({ className: e, render: t, ...n }) {
	return R({
		defaultTagName: "div",
		props: L({ className: W("quill-button-group__text flex items-center gap-2", e) }, n),
		render: t,
		state: { slot: "button-group-text" }
	});
}
function ui({ className: e, orientation: t = "vertical", ...n }) {
	return /* @__PURE__ */ M(nt, {
		"data-slot": "button-group-separator",
		orientation: t,
		className: W("quill-button-group__separator", e),
		...n
	});
}
function di({ className: e, size: t = "default", flush: n = !1, ...r }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "card",
		"data-size": t,
		"data-flush": n ? "" : void 0,
		className: W("quill-card group/card flex flex-col", e),
		...r
	});
}
function fi({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "card-header",
		className: W("quill-card__header group/card-header", e),
		...t
	});
}
var pi = w.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ M("div", {
	ref: n,
	"data-slot": "card-title",
	className: W("quill-card__title", e),
	...t
}));
pi.displayName = "CardTitle";
function mi({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "card-description",
		className: W("quill-card__description", e),
		...t
	});
}
function hi({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "card-content",
		className: W("quill-card__content", e),
		...t
	});
}
function gi({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "card-footer",
		className: W("quill-card__footer", e),
		...t
	});
}
function _i({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "card-group",
		"data-size": t,
		className: W("quill-card-group group/card-group", e),
		...n
	});
}
var vi = F("quill-checkbox-indicator flex shrink-0 items-center justify-center", {
	variants: { size: {
		default: "quill-checkbox-indicator--size-default",
		sm: "quill-checkbox-indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
}), yi = F("", {
	variants: { size: {
		default: "quill-checkbox-icon--size-default",
		sm: "quill-checkbox-icon--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function bi({ checked: e, className: t, size: n = "default" }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "checkbox-indicator",
		className: W(vi({ size: n }), e && "quill-checkbox-indicator--checked", t),
		children: e && /* @__PURE__ */ M(s, { className: yi({ size: n }) })
	});
}
var xi = F("quill-checkbox peer flex shrink-0 items-center justify-center", {
	variants: { size: {
		default: "quill-checkbox--size-default",
		sm: "quill-checkbox--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function Si({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ M(le.Root, {
		"data-quill": !0,
		"data-slot": "checkbox",
		className: W(xi({ size: t }), e),
		...n,
		children: /* @__PURE__ */ M(le.Indicator, {
			"data-slot": "checkbox-primitive-indicator",
			className: "grid place-content-center text-current transition-none",
			children: /* @__PURE__ */ M(bi, {
				checked: !0,
				size: t ?? "default",
				className: "border-none bg-transparent"
			})
		})
	});
}
var Ci = w.forwardRef(({ className: e, size: t = "sm", children: n, ...r }, i) => /* @__PURE__ */ M(G, {
	ref: i,
	render: /* @__PURE__ */ M("div", {}),
	"data-quill": !0,
	"data-slot": "chip",
	size: t,
	variant: "outline",
	className: W("quill-chip gap-1", e),
	...r,
	children: n
}));
Ci.displayName = "Chip";
var wi = w.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ M(G, {
	ref: r,
	"data-slot": "chip-close",
	size: "icon-xs",
	className: W("quill-chip-close rounded-xs", e),
	...n,
	children: t ?? /* @__PURE__ */ M(C, {})
}));
wi.displayName = "ChipClose";
function Ti({ className: e, ...t }) {
	return /* @__PURE__ */ M(ci, {
		"data-slot": "chip-group",
		className: W("flex-wrap gap-0", e),
		...t
	});
}
var Ei = w.createContext("default");
function Di({ variant: e = "default", className: t, ...n }) {
	return /* @__PURE__ */ M(Ei.Provider, {
		value: e,
		children: /* @__PURE__ */ M(ae.Root, {
			"data-quill": !0,
			"data-slot": "collapsible",
			"data-variant": e,
			className: W("group/collapsible", e === "default" && "quill-collapsible--variant-default", t),
			...n
		})
	});
}
function Oi({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "collapsible-header",
		className: W("quill-collapsible__header flex w-full items-center gap-1.5", e),
		...t
	});
}
function ki({ children: e, className: t, iconOnly: n = !1, icon: r, ...i }) {
	let a = w.useContext(Ei);
	if (n) return /* @__PURE__ */ N(ae.Trigger, {
		"data-slot": "collapsible-trigger",
		"data-variant": a,
		className: W("quill-collapsible__trigger quill-collapsible__trigger--icon group/collapsible-trigger", r != null && "quill-collapsible__trigger--swap", t),
		render: /* @__PURE__ */ M(G, { size: "icon-sm" }),
		...i,
		children: [
			r != null && /* @__PURE__ */ M("span", {
				"data-slot": "collapsible-trigger-rest-icon",
				className: "pointer-events-none shrink-0",
				children: r
			}),
			/* @__PURE__ */ M(d, {
				"data-slot": "collapsible-trigger-icon",
				"data-chevron": "right",
				className: "pointer-events-none shrink-0"
			}),
			e != null && /* @__PURE__ */ M("span", {
				className: "sr-only",
				children: e
			})
		]
	});
	let o = /* @__PURE__ */ N(j, { children: [/* @__PURE__ */ M(c, {
		"data-slot": "collapsible-trigger-icon",
		"data-chevron": "down",
		className: "pointer-events-none shrink-0"
	}), /* @__PURE__ */ M(f, {
		"data-slot": "collapsible-trigger-icon",
		"data-chevron": "up",
		className: "pointer-events-none shrink-0"
	})] });
	return /* @__PURE__ */ N(ae.Trigger, {
		"data-slot": "collapsible-trigger",
		"data-variant": a,
		className: W("quill-collapsible__trigger group/collapsible-trigger flex items-center gap-2 justify-start", a === "folder" && "quill-collapsible__trigger--variant-folder", t),
		render: /* @__PURE__ */ M(G, { size: "sm" }),
		...i,
		children: [
			a === "folder" && o,
			e,
			a === "default" && o
		]
	});
}
function Ai({ children: e, className: t, ...n }) {
	let r = w.useContext(Ei);
	return /* @__PURE__ */ M(ae.Panel, {
		"data-slot": "collapsible-content",
		className: "quill-collapsible__panel",
		...n,
		children: /* @__PURE__ */ M("div", {
			className: W("quill-collapsible__panel-content", r === "folder" && "quill-collapsible__panel-content--variant-folder", t),
			children: e
		})
	});
}
var ji = w.createContext(null);
function Mi({ children: e, ...t }) {
	let n = w.useRef(null);
	return /* @__PURE__ */ M(ji.Provider, {
		value: n,
		children: /* @__PURE__ */ M(B.Root, {
			...t,
			children: e
		})
	});
}
function Ni({ ...e }) {
	return /* @__PURE__ */ M(B.Value, {
		"data-slot": "combobox-value",
		...e
	});
}
var Pi = w.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ N(B.Trigger, {
	ref: r,
	"data-slot": "combobox-trigger",
	className: W("quill-combobox__trigger", e),
	...n,
	children: [t, /* @__PURE__ */ M(c, { className: "pointer-events-none size-3.5 text-muted-foreground" })]
}));
Pi.displayName = "ComboboxTrigger";
function Fi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.Clear, {
		"data-slot": "combobox-clear",
		render: /* @__PURE__ */ M(Ye, { size: "icon-xs" }),
		className: W(e),
		...t,
		children: /* @__PURE__ */ M(C, { className: "pointer-events-none" })
	});
}
function Ii({ className: e, children: t, disabled: n = !1, showTrigger: r = !0, showClear: i = !1, ...a }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "combobox-input-group-wrapper",
		children: /* @__PURE__ */ N(Ge, {
			ref: w.useContext(ji),
			className: W("w-auto", e),
			children: [
				/* @__PURE__ */ M(B.Input, {
					render: /* @__PURE__ */ M(Ze, { disabled: n }),
					...a
				}),
				/* @__PURE__ */ N(qe, {
					align: "inline-end",
					children: [r && /* @__PURE__ */ M(Ye, {
						size: "icon-xs",
						render: /* @__PURE__ */ M(Pi, {}),
						"data-slot": "input-group-button",
						className: "group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent rounded-xs",
						disabled: n
					}), i && /* @__PURE__ */ M(Fi, { disabled: n })]
				}),
				t
			]
		})
	});
}
function Li({ className: e, side: t = "bottom", sideOffset: n = 6, align: r = "start", alignOffset: i = 0, anchor: a, ...o }) {
	let s = w.useContext(ji), c = a ?? s;
	return /* @__PURE__ */ M(B.Portal, { children: /* @__PURE__ */ M(B.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: t,
		sideOffset: n,
		align: r,
		alignOffset: i,
		anchor: c,
		className: "isolate",
		children: /* @__PURE__ */ M(B.Popup, {
			"data-slot": "combobox-content",
			"data-chips": !!c,
			className: W("quill-combobox__content group/combobox-content", e),
			...o
		})
	}) });
}
function Ri({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.List, {
		"data-slot": "combobox-list",
		className: W("quill-combobox__list scroll-mask-t-4 scroll-py-4", "not-has-[[data-slot=combobox-list-footer]]:scroll-mask-b-4", e),
		...t
	});
}
function zi({ className: e, children: t, title: n, ...r }) {
	return /* @__PURE__ */ N(B.Item, {
		"data-slot": "combobox-item",
		className: W("quill-combobox__item", e),
		title: n ?? (typeof t == "string" ? t : void 0),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			left: !0,
			className: "min-w-0 aria-selected:bg-fill-selected"
		}),
		...r,
		children: [/* @__PURE__ */ M("span", {
			className: "flex items-center gap-1.5 min-w-0 truncate",
			children: t
		}), /* @__PURE__ */ M(B.ItemIndicator, {
			render: /* @__PURE__ */ M("span", { className: "pointer-events-none absolute start-2 flex items-center justify-center" }),
			children: /* @__PURE__ */ M(s, { className: "pointer-events-none" })
		})]
	});
}
function Bi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.Group, {
		"data-slot": "combobox-group",
		className: W(e),
		...t
	});
}
function Vi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.GroupLabel, {
		"data-slot": "combobox-label",
		className: e,
		render: /* @__PURE__ */ M(tt, {}),
		...t
	});
}
function Hi({ ...e }) {
	return /* @__PURE__ */ M(B.Collection, {
		"data-slot": "combobox-collection",
		...e
	});
}
function Ui({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(B.Empty, {
		"data-slot": "combobox-empty",
		className: W("hidden group-data-empty/combobox-content:flex", e),
		...n,
		render: /* @__PURE__ */ M(et, { children: t })
	});
}
function Wi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.Separator, {
		"data-slot": "combobox-separator",
		className: W("quill-combobox__separator", e),
		...t
	});
}
function Gi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.Chips, {
		"data-slot": "combobox-chips",
		className: W("quill-combobox__chips flex flex-wrap items-center gap-1 py-1", e),
		...t
	});
}
function Ki({ className: e, children: t, title: n, showRemove: r = !0, ...i }) {
	return /* @__PURE__ */ N(B.Chip, {
		render: /* @__PURE__ */ M(Ci, { title: n ?? (typeof t == "string" ? t : void 0) }),
		"data-slot": "combobox-chip",
		className: W(e),
		...i,
		children: [/* @__PURE__ */ M("span", {
			className: "truncate flex-1",
			children: t
		}), r && /* @__PURE__ */ M(B.ChipRemove, {
			render: /* @__PURE__ */ M(wi, {}),
			children: /* @__PURE__ */ M(C, { className: "pointer-events-none" })
		})]
	});
}
function qi({ className: e, ...t }) {
	return /* @__PURE__ */ M(B.Input, {
		"data-slot": "combobox-chip-input",
		className: W("quill-combobox__chips-input", e),
		...t
	});
}
function Ji({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "combobox-list-footer",
		className: W("quill-combobox__list-footer quill-scroll-fade-top", e),
		children: /* @__PURE__ */ M("div", {
			className: "p-1",
			...t
		})
	});
}
function Yi() {
	let e = w.useContext(ji);
	if (e === null) throw Error("useComboboxAnchor must be used within a Combobox");
	return e;
}
function Xi({ className: e, ...t }) {
	return /* @__PURE__ */ M("kbd", {
		"data-quill": !0,
		"data-slot": "kbd",
		className: W(He({
			variant: "outline",
			size: "xs"
		}), "quill-kbd inline-flex w-fit items-center justify-center gap-1", e),
		...t
	});
}
function Zi({ className: e, ...t }) {
	return /* @__PURE__ */ M("kbd", {
		"data-slot": "kbd-text",
		className: W("quill-kbd-text inline-flex w-fit items-center justify-center gap-1", e),
		...t
	});
}
function Qi({ className: e, ...t }) {
	return /* @__PURE__ */ M("kbd", {
		"data-slot": "kbd-group",
		className: W("inline-flex items-center gap-1", e),
		...t
	});
}
var $i = F("quill-radio-indicator", {
	variants: { size: {
		default: "quill-radio-indicator--size-default",
		sm: "quill-radio-indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
}), ea = F("quill-radio-dot", {
	variants: { size: {
		default: "quill-radio-dot--size-default",
		sm: "quill-radio-dot--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function ta({ checked: e, className: t, size: n = "default" }) {
	return /* @__PURE__ */ M("span", {
		"data-slot": "radio-indicator",
		className: W($i({ size: n }), e && "quill-radio-indicator--checked", t),
		children: e && /* @__PURE__ */ M("span", { className: ea({ size: n }) })
	});
}
function na({ className: e, ...t }) {
	return /* @__PURE__ */ M(de, {
		"data-quill": !0,
		"data-slot": "radio-group",
		className: W("grid w-full gap-3", e),
		...t
	});
}
var ra = F("quill-radio group/radio-group-item peer", {
	variants: { size: {
		default: "quill-radio--size-default",
		sm: "quill-radio--size-sm"
	} },
	defaultVariants: { size: "default" }
}), ia = F("quill-radio__indicator", {
	variants: { size: {
		default: "quill-radio__indicator--size-default",
		sm: "quill-radio__indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function aa({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ M(ue.Root, {
		"data-slot": "radio-group-item",
		className: W(ra({ size: t }), e),
		...n,
		children: /* @__PURE__ */ M(ue.Indicator, {
			"data-slot": "radio-group-indicator",
			className: ia({ size: t }),
			children: /* @__PURE__ */ M("span", { className: ea({ size: t }) })
		})
	});
}
function oa({ ...e }) {
	return /* @__PURE__ */ M(V.Root, {
		"data-slot": "context-menu",
		...e
	});
}
function sa({ ...e }) {
	return /* @__PURE__ */ M(V.Portal, {
		"data-slot": "context-menu-portal",
		...e
	});
}
function ca({ className: e, ...t }) {
	return /* @__PURE__ */ M(V.Trigger, {
		"data-slot": "context-menu-trigger",
		className: W("select-none", e),
		...t
	});
}
function la({ className: e, align: t = "start", alignOffset: n = 4, side: r = "inline-end", sideOffset: i = 0, children: a, ...o }) {
	return /* @__PURE__ */ M(V.Portal, { children: /* @__PURE__ */ M(V.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		className: "isolate outline-none",
		align: t,
		alignOffset: n,
		side: r,
		sideOffset: i,
		children: /* @__PURE__ */ M(V.Popup, {
			"data-slot": "context-menu-content",
			className: W("quill-menu__content", e),
			...o,
			children: /* @__PURE__ */ M("div", {
				className: "quill-menu__scroller scroll-mask-y-4 scroll-py-4",
				children: a
			})
		})
	}) });
}
function ua({ ...e }) {
	return /* @__PURE__ */ M(V.Group, {
		"data-slot": "context-menu-group",
		...e
	});
}
function da({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ M(V.GroupLabel, {
		"data-slot": "context-menu-label",
		"data-inset": t,
		className: W("px-2 py-1.5 text-xs text-muted-foreground", t && "quill-menu-item--inset", e),
		...n
	});
}
function fa({ className: e, inset: t, variant: n = "default", children: r, ...i }) {
	return /* @__PURE__ */ M(V.Item, {
		"data-slot": "context-menu-item",
		"data-inset": t,
		"data-variant": n,
		className: W("group/context-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", "data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:text-destructive-foreground data-[variant=destructive]:[&_svg]:text-destructive-foreground data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-disabled:bg-destructive/50", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ M(G, {
			variant: "default",
			className: "w-full font-normal",
			left: !0
		}),
		...i,
		children: r
	});
}
function pa({ ...e }) {
	return /* @__PURE__ */ M(V.SubmenuRoot, {
		"data-slot": "context-menu-sub",
		...e
	});
}
function ma({ className: e, inset: t, children: n, ...r }) {
	return /* @__PURE__ */ N(V.SubmenuTrigger, {
		"data-slot": "context-menu-sub-trigger",
		"data-inset": t,
		className: W("flex cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ M(d, { className: "rtl:rotate-180 ms-auto" })]
	});
}
function ha({ className: e, align: t = "start", alignOffset: n = -3, side: r = "inline-end", sideOffset: i = 0, ...a }) {
	return /* @__PURE__ */ M(la, {
		"data-slot": "context-menu-sub-content",
		className: W("quill-menu__sub-content w-auto", e),
		align: t,
		alignOffset: n,
		side: r,
		sideOffset: i,
		...a
	});
}
function ga({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ N(V.CheckboxItem, {
		"data-slot": "context-menu-checkbox-item",
		"data-inset": r,
		className: W("quill-menu-item--inset relative flex cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		checked: n,
		...i,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			children: [/* @__PURE__ */ M(Si, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ M(V.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(Si, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function _a({ ...e }) {
	return /* @__PURE__ */ M(V.RadioGroup, {
		"data-slot": "context-menu-radio-group",
		...e
	});
}
function va({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ N(V.RadioItem, {
		"data-slot": "context-menu-radio-item",
		"data-inset": n,
		className: W("quill-menu-item--inset relative flex cursor-default items-center pe-2 outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			children: [/* @__PURE__ */ M(ta, { size: "sm" }), /* @__PURE__ */ M(V.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(ta, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function ya({ className: e, ...t }) {
	return /* @__PURE__ */ M(V.Separator, {
		"data-slot": "context-menu-separator",
		className: W("quill-menu__separator", e),
		...t
	});
}
function ba({ className: e, ...t }) {
	return /* @__PURE__ */ M(Xi, {
		"data-slot": "context-menu-shortcut",
		className: W("quill-menu__shortcut", e),
		...t
	});
}
var xa = [
	"top",
	"right",
	"bottom",
	"left"
];
function Sa(e) {
	return e ? e === "all" ? xa : Array.isArray(e) ? e : [e] : [];
}
var Ca = {
	top: {
		label: "Scroll to top",
		Icon: a,
		positionClasses: "top-2 left-1/2 -translate-x-1/2",
		visibleClasses: "group-data-[overflow-y-start]/scroll-area:opacity-100 group-data-[overflow-y-start]/scroll-area:scale-100 group-data-[overflow-y-start]/scroll-area:pointer-events-auto",
		getScrollTarget: () => ({ top: 0 })
	},
	bottom: {
		label: "Scroll to bottom",
		Icon: t,
		positionClasses: "bottom-2 left-1/2 -translate-x-1/2",
		visibleClasses: "group-data-[overflow-y-end]/scroll-area:opacity-100 group-data-[overflow-y-end]/scroll-area:scale-100 group-data-[overflow-y-end]/scroll-area:pointer-events-auto",
		getScrollTarget: (e) => ({ top: e.scrollHeight })
	},
	left: {
		label: "Scroll to start",
		Icon: r,
		positionClasses: "left-2 top-1/2 -translate-y-1/2 not-disabled:active:-translate-y-1/2",
		visibleClasses: "group-data-[overflow-x-start]/scroll-area:opacity-100 group-data-[overflow-x-start]/scroll-area:scale-100 group-data-[overflow-x-start]/scroll-area:pointer-events-auto",
		getScrollTarget: () => ({ left: 0 })
	},
	right: {
		label: "Scroll to end",
		Icon: i,
		positionClasses: "right-2 top-1/2 -translate-y-1/2 not-disabled:active:-translate-y-1/2",
		visibleClasses: "group-data-[overflow-x-end]/scroll-area:opacity-100 group-data-[overflow-x-end]/scroll-area:scale-100 group-data-[overflow-x-end]/scroll-area:pointer-events-auto",
		getScrollTarget: (e) => ({ left: e.scrollWidth })
	}
};
function wa({ edge: e, viewportRef: t }) {
	let n = Ca[e], { Icon: r } = n;
	return /* @__PURE__ */ M(G, {
		type: "button",
		size: "icon",
		variant: "outline",
		"aria-label": n.label,
		onClick: () => {
			let e = t.current;
			if (!e) return;
			let r = typeof window < "u" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
			e.scrollTo({
				...n.getScrollTarget(e),
				behavior: r ? "auto" : "smooth"
			});
		},
		className: W("bg-background not-disabled:hover:bg-fill-hover absolute z-10 grid place-items-center rounded-full shadow-md", "opacity-0 scale-95 pointer-events-none", "transition-[opacity,transform,background-color] duration-150 ease-out", "motion-reduce:transition-none", "focus-visible:opacity-100 focus-visible:scale-100 focus-visible:pointer-events-auto", n.positionClasses, n.visibleClasses),
		children: /* @__PURE__ */ M(r, { className: "size-4" })
	});
}
var Ta = "quill-scroll-area-shadows", Ea = "\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"] {\n    --shadow-x-start: 0 0 0 0 transparent;\n    --shadow-x-end: 0 0 0 0 transparent;\n    --shadow-y-start: 0 0 0 0 transparent;\n    --shadow-y-end: 0 0 0 0 transparent;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before,\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    content: '';\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 2;\n    border-radius: inherit;\n    transition: box-shadow 200ms ease;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before {\n    box-shadow: var(--shadow-x-start) inset, var(--shadow-y-start) inset;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    box-shadow: var(--shadow-x-end) inset, var(--shadow-y-end) inset;\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 28px 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -28px 24px -16px rgb(0 0 0 / 100%);\n}\n";
if (typeof document < "u" && !document.getElementById("quill-scroll-area-shadows")) {
	let e = document.createElement("style");
	e.id = Ta, e.textContent = Ea, document.head.appendChild(e);
}
function Da({ className: e, children: t, scrollShadows: n = !0, hideScrollbars: r = !1, alwaysShowScrollbars: i = !1, showScrollToButton: a, viewportClassName: o, ...s }) {
	let c = w.useRef(null), l = Sa(a);
	return typeof process < "u" && process.env.NODE_ENV !== "production" && r && i && console.warn("[ScrollArea] `hideScrollbars` and `alwaysShowScrollbars` are mutually exclusive; `alwaysShowScrollbars` will be ignored."), /* @__PURE__ */ N(pe.Root, {
		"data-quill": !0,
		"data-slot": "scroll-area",
		"data-component": "scroll-area",
		"data-scroll-shadows": n,
		className: W("quill-scroll-area group/scroll-area", e),
		...s,
		children: [
			/* @__PURE__ */ M(pe.Viewport, {
				ref: c,
				"data-slot": "scroll-area-viewport",
				className: W("quill-scroll-area__viewport", o),
				children: t
			}),
			!r && /* @__PURE__ */ N(j, { children: [
				/* @__PURE__ */ M(Oa, {
					orientation: "horizontal",
					alwaysVisible: i
				}),
				/* @__PURE__ */ M(Oa, {
					orientation: "vertical",
					alwaysVisible: i
				}),
				/* @__PURE__ */ M(pe.Corner, {
					"data-slot": "scroll-area-corner",
					className: "quill-scroll-area__corner"
				})
			] }),
			l.map((e) => /* @__PURE__ */ M(wa, {
				edge: e,
				viewportRef: c
			}, e))
		]
	});
}
function Oa({ className: e, orientation: t = "vertical", alwaysVisible: n = !1, ...r }) {
	return /* @__PURE__ */ M(pe.Scrollbar, {
		"data-slot": "scroll-area-scrollbar",
		"data-orientation": t,
		orientation: t,
		className: W("quill-scroll-area__scrollbar group/scrollbar flex", n ? "quill-scroll-area__scrollbar--always" : "quill-scroll-area__scrollbar--auto", e),
		...r,
		children: /* @__PURE__ */ M(pe.Thumb, {
			"data-slot": "scroll-area-thumb",
			className: "quill-scroll-area__thumb"
		})
	});
}
function ka({ ...e }) {
	return /* @__PURE__ */ M(fe.Root, {
		"data-slot": "dialog",
		...e
	});
}
function Aa({ ...e }) {
	return /* @__PURE__ */ M(fe.Trigger, {
		"data-slot": "dialog-trigger",
		...e
	});
}
function ja({ ...e }) {
	return /* @__PURE__ */ M(fe.Portal, {
		"data-slot": "dialog-portal",
		...e
	});
}
function Ma({ ...e }) {
	return /* @__PURE__ */ M(fe.Close, {
		"data-slot": "dialog-close focus-visible:z-10",
		...e
	});
}
function Na({ className: e, ...t }) {
	return /* @__PURE__ */ M(fe.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "modal-overlay",
		"data-slot": "dialog-overlay",
		className: W("quill-dialog__overlay", e),
		...t
	});
}
function Pa({ className: e, children: t, showCloseButton: n = !0, nested: r = !1, size: i, ...a }) {
	return /* @__PURE__ */ N(ja, { children: [/* @__PURE__ */ M(Na, {}), /* @__PURE__ */ N(fe.Popup, {
		"data-quill": !0,
		"data-quill-portal": "modal-content",
		"data-slot": "dialog-content",
		"data-size": i,
		className: W("quill-dialog__content grid", e),
		...a,
		children: [t, n && /* @__PURE__ */ N(fe.Close, {
			"data-slot": "dialog-close",
			render: /* @__PURE__ */ M(G, {
				className: "absolute top-2 end-2",
				size: "icon-sm"
			}),
			children: [/* @__PURE__ */ M(C, {}), /* @__PURE__ */ M("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function Fa({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "dialog-header",
		className: W("quill-dialog__header flex flex-col gap-1", e),
		...t
	});
}
function Ia({ className: e, showCloseButton: t = !1, children: n, ...r }) {
	return /* @__PURE__ */ N("div", {
		"data-slot": "dialog-footer",
		className: W("quill-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", e),
		...r,
		children: [n, t && /* @__PURE__ */ M(fe.Close, {
			render: /* @__PURE__ */ M(G, { variant: "outline" }),
			children: "Close"
		})]
	});
}
function La({ className: e, render: t, children: n, viewportClassName: r, ...i }) {
	let a = t ?? /* @__PURE__ */ M(Da, {
		"data-slot": "dialog-body",
		className: W("quill-dialog__body", e),
		viewportClassName: r
	});
	return R({
		defaultTagName: "div",
		props: L({
			className: W("quill-dialog__body", e),
			children: n
		}, i),
		render: a,
		state: { slot: "dialog-body" }
	});
}
function Ra({ className: e, ...t }) {
	return /* @__PURE__ */ M(fe.Title, {
		"data-slot": "dialog-title",
		className: W("quill-dialog__title", e),
		...t
	});
}
function za({ className: e, ...t }) {
	return /* @__PURE__ */ M(fe.Description, {
		"data-slot": "dialog-description",
		className: W("quill-dialog__description", e),
		...t
	});
}
var Ba = F("quill-dot relative inline-flex p-0.5 shrink-0 items-center justify-center whitespace-nowrap", {
	variants: {
		variant: {
			default: "quill-dot--variant-default",
			info: "quill-dot--variant-info",
			destructive: "quill-dot--variant-destructive",
			warning: "quill-dot--variant-warning",
			success: "quill-dot--variant-success"
		},
		pulse: {
			true: "quill-dot--pulse",
			false: ""
		}
	},
	defaultVariants: { variant: "default" }
});
function Va({ className: e, variant: t = "default", pulse: n = !1, ...r }) {
	return /* @__PURE__ */ N("span", {
		"data-quill": !0,
		"data-slot": "dot",
		className: W(Ba({
			variant: t,
			pulse: n
		}), e),
		...r,
		children: [n && /* @__PURE__ */ M("span", {
			"aria-hidden": !0,
			"data-slot": "dot-pulse",
			className: "quill-dot__pulse pointer-events-none absolute inset-px"
		}), /* @__PURE__ */ M("span", {
			"data-slot": "dot-inner",
			className: "quill-dot__inner"
		})]
	});
}
function Ha({ ...e }) {
	return /* @__PURE__ */ M(ge.Root, {
		"data-slot": "drawer",
		...e
	});
}
function Ua({ ...e }) {
	return /* @__PURE__ */ M(ge.Trigger, {
		"data-slot": "drawer-trigger",
		...e
	});
}
function Wa({ ...e }) {
	return /* @__PURE__ */ M(ge.Portal, {
		"data-slot": "drawer-portal",
		...e
	});
}
function Ga({ ...e }) {
	return /* @__PURE__ */ M(ge.Close, {
		"data-slot": "drawer-close",
		...e
	});
}
function Ka({ className: e, ...t }) {
	return /* @__PURE__ */ M(ge.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "drawer-backdrop",
		"data-slot": "drawer-backdrop",
		className: W("quill-drawer__backdrop", e),
		...t
	});
}
function qa({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ N(Wa, { children: [/* @__PURE__ */ M(Ka, {}), /* @__PURE__ */ M(ge.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "drawer-viewport",
		"data-slot": "drawer-viewport",
		className: "quill-drawer__viewport",
		children: /* @__PURE__ */ N(ge.Popup, {
			"data-quill": !0,
			"data-slot": "drawer-content",
			className: W("quill-drawer__content group/drawer-content flex h-auto flex-col", e),
			...n,
			children: [/* @__PURE__ */ M(Ja, {}), /* @__PURE__ */ M("div", {
				className: "w-full max-w-[32rem] mx-auto",
				children: t
			})]
		})
	})] });
}
function Ja({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "drawer-handle",
		"aria-hidden": "true",
		className: W("quill-drawer__handle", e),
		...t
	});
}
function Ya({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "drawer-header",
		className: W("quill-drawer__header flex flex-col gap-1 p-4", e),
		...t
	});
}
function Xa({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "drawer-footer",
		className: W("quill-drawer__footer mt-auto flex flex-col gap-2 p-4", e),
		...t
	});
}
function Za({ className: e, ...t }) {
	return /* @__PURE__ */ M(ge.Title, {
		"data-slot": "drawer-title",
		className: W("quill-drawer__title", e),
		...t
	});
}
function Qa({ className: e, ...t }) {
	return /* @__PURE__ */ M(ge.Description, {
		"data-slot": "drawer-description",
		className: W("quill-drawer__description", e),
		...t
	});
}
function $a({ ...e }) {
	return /* @__PURE__ */ M(H.Root, {
		"data-slot": "dropdown-menu",
		...e
	});
}
function eo({ ...e }) {
	return /* @__PURE__ */ M(H.Portal, {
		"data-slot": "dropdown-menu-portal",
		...e
	});
}
function to({ ...e }) {
	return /* @__PURE__ */ M(H.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...e
	});
}
function no({ align: e = "start", alignOffset: t = 0, side: n = "bottom", sideOffset: r = 4, className: i, anchor: a, children: o, ...s }) {
	return /* @__PURE__ */ M(H.Portal, { children: /* @__PURE__ */ M(H.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		className: "isolate outline-none",
		align: e,
		alignOffset: t,
		side: n,
		sideOffset: r,
		anchor: a,
		children: /* @__PURE__ */ M(H.Popup, {
			"data-slot": "dropdown-menu-content",
			className: W("quill-menu__content w-(--anchor-width)", i),
			...s,
			children: /* @__PURE__ */ M("div", {
				className: "quill-menu__scroller scroll-mask-y-4 scroll-py-4",
				children: o
			})
		})
	}) });
}
function ro({ ...e }) {
	return /* @__PURE__ */ M(H.Group, {
		"data-slot": "dropdown-menu-group",
		...e
	});
}
function io({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ M(H.GroupLabel, {
		"data-slot": "dropdown-menu-label",
		"data-inset": t,
		className: W(t && "quill-menu-item--inset", e),
		render: /* @__PURE__ */ M(tt, {}),
		...n
	});
}
function ao({ className: e, inset: t, variant: n = "default", ...r }) {
	return /* @__PURE__ */ M(H.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": t,
		"data-variant": n,
		className: W("group/dropdown-menu-item relative flex cursor-default items-center text-xs/relaxed outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", "data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:text-destructive-foreground data-[variant=destructive]:[&_svg]:text-destructive-foreground data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-disabled:bg-destructive/50", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			variant: "default",
			className: "w-full font-normal [&_kbd]:ml-auto",
			left: !0
		}),
		...r
	});
}
function oo({ ...e }) {
	return /* @__PURE__ */ M(H.SubmenuRoot, {
		"data-slot": "dropdown-menu-sub",
		...e
	});
}
function so({ className: e, inset: t, children: n, ...r }) {
	return /* @__PURE__ */ N(H.SubmenuTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": t,
		className: W("flex cursor-default items-center text-xs outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ M(d, { className: "rtl:rotate-180 ms-auto" })]
	});
}
function co({ align: e = "start", alignOffset: t = -3, side: n = "inline-end", sideOffset: r = 0, className: i, ...a }) {
	return /* @__PURE__ */ M(no, {
		"data-slot": "dropdown-menu-sub-content",
		className: W("quill-menu__sub-content w-auto", i),
		align: e,
		alignOffset: t,
		side: n,
		sideOffset: r,
		...a
	});
}
function lo({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ N(H.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		"data-inset": r,
		className: W("quill-menu-item--inset relative flex cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		checked: n,
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		...i,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-checkbox-item-indicator",
			children: [/* @__PURE__ */ M(Si, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ M(H.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(Si, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function uo({ ...e }) {
	return /* @__PURE__ */ M(H.RadioGroup, {
		"data-slot": "dropdown-menu-radio-group",
		...e
	});
}
function fo({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ N(H.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		"data-inset": n,
		className: W("quill-menu-item--inset relative flex min-h-7 cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ M(G, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-radio-item-indicator",
			children: [/* @__PURE__ */ M(ta, { size: "sm" }), /* @__PURE__ */ M(H.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(ta, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function po({ className: e, ...t }) {
	return /* @__PURE__ */ M(H.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: W("quill-menu__separator", e),
		...t
	});
}
function mo(e, t, n, r) {
	let i = w.useMemo(() => {
		let e = /* @__PURE__ */ new Set();
		for (let n of t) e.add(r ? r(n) : n);
		return e;
	}, [t, r]), a = e.reduce((e, t) => {
		let n = r ? r(t) : t;
		return e + +!!i.has(n);
	}, 0), o = a === 0 ? "none" : a >= e.length ? "all" : "some", s = o === "all";
	return {
		state: o,
		isAllSelected: s,
		toggle: w.useCallback(() => {
			n(s ? [] : e.slice());
		}, [
			s,
			n,
			e
		])
	};
}
function ho({ values: e, selected: t, onChange: n, getKey: r, selectLabel: i = "Select all", deselectLabel: a = "Deselect all", children: o, ...s }) {
	let c = mo(e, t, n, r);
	return o ? /* @__PURE__ */ M(j, { children: o(c) }) : /* @__PURE__ */ M(ao, {
		...s,
		"data-slot": "dropdown-menu-select-all",
		"data-state": c.state,
		closeOnClick: !1,
		onClick: c.toggle,
		children: c.isAllSelected ? a : i
	});
}
function go({ className: e, ...t }) {
	return /* @__PURE__ */ M(Xi, {
		"data-slot": "dropdown-menu-shortcut",
		className: W("quill-menu__shortcut", e),
		...t
	});
}
function _o({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "empty",
		className: W("quill-empty flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4", e),
		...t
	});
}
function vo({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "empty-header",
		className: W("flex max-w-sm flex-col items-center gap-1", e),
		...t
	});
}
var yo = F("quill-empty__media flex shrink-0 items-center justify-center", {
	variants: { variant: {
		default: "quill-empty__media--variant-default",
		icon: "quill-empty__media--variant-icon"
	} },
	defaultVariants: { variant: "default" }
});
function bo({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "empty-icon",
		"data-variant": t,
		className: W(yo({
			variant: t,
			className: e
		})),
		...n
	});
}
function xo({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "empty-title",
		className: W("quill-empty__title", e),
		...t
	});
}
function So({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "empty-description",
		className: W("quill-empty__description", e),
		...t
	});
}
function Co({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "empty-content",
		className: W("quill-empty__content flex w-full max-w-sm min-w-0 flex-col items-center gap-2", e),
		...t
	});
}
function wo({ className: e, ...t }) {
	return /* @__PURE__ */ M("label", {
		"data-quill": !0,
		"data-slot": "label",
		className: W("quill-label flex items-center gap-2", e),
		...t
	});
}
function To({ className: e, ...t }) {
	return /* @__PURE__ */ M("fieldset", {
		"data-slot": "field-set",
		className: W("quill-field-set flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3", e),
		...t
	});
}
function Eo({ className: e, variant: t = "legend", ...n }) {
	return /* @__PURE__ */ M("legend", {
		"data-slot": "field-legend",
		"data-variant": t,
		className: W("quill-field-legend", e),
		...n
	});
}
function Do({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "field-group",
		className: W("group/field-group @container/field-group flex w-full flex-col gap-4 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4", e),
		...t
	});
}
var Oo = F("quill-field group/field flex w-full gap-x-2 gap-y-1", {
	variants: { orientation: {
		vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
		horizontal: "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
		responsive: "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
	} },
	defaultVariants: { orientation: "vertical" }
});
function ko({ className: e, orientation: t = "vertical", ...n }) {
	return /* @__PURE__ */ M("div", {
		role: "group",
		"data-quill": !0,
		"data-slot": "field",
		"data-orientation": t,
		className: W(Oo({ orientation: t }), e),
		...n
	});
}
function Ao({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "field-content",
		className: W("quill-field__content group/field-content flex flex-1 flex-col gap-0.5", e),
		...t
	});
}
function jo({ className: e, ...t }) {
	return /* @__PURE__ */ M(wo, {
		"data-slot": "field-label",
		className: W("quill-field__label group/field-label peer/field-label flex w-fit gap-2", e),
		...t
	});
}
function Mo({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "field-label",
		className: W("quill-field__title flex w-fit items-center gap-2", e),
		...t
	});
}
function No({ className: e, ...t }) {
	return /* @__PURE__ */ M("p", {
		"data-slot": "field-description",
		className: W("quill-field__description last:mt-0 nth-last-2:mt-0", e),
		...t
	});
}
function Po({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ N("div", {
		"data-slot": "field-separator",
		"data-content": !!e,
		className: W("quill-field__separator", t),
		...n,
		children: [/* @__PURE__ */ M(nt, { className: "absolute inset-0 top-1/2" }), e && /* @__PURE__ */ M("span", {
			className: "quill-field__separator-content",
			"data-slot": "field-separator-content",
			children: e
		})]
	});
}
function Fo({ className: e, children: t, errors: n, ...r }) {
	let i = D(() => {
		if (t) return t;
		if (!n?.length) return null;
		let e = [...new Map(n.map((e) => [e?.message, e])).values()];
		return e?.length == 1 ? e[0]?.message : /* @__PURE__ */ M("ul", {
			className: "ms-4 flex list-disc flex-col gap-1",
			children: e.map((e, t) => e?.message && /* @__PURE__ */ M("li", { children: e.message }, t))
		});
	}, [t, n]);
	return i ? /* @__PURE__ */ M("div", {
		role: "alert",
		"data-slot": "field-error",
		className: W("quill-field__error", e),
		...r,
		children: i
	}) : null;
}
var Io = F("text-foreground font-semibold text-balance", {
	variants: { size: {
		"2xl": "text-2xl tracking-tight",
		xl: "text-xl tracking-tight",
		lg: "text-lg",
		base: "text-base",
		sm: "text-sm"
	} },
	defaultVariants: { size: "lg" }
});
function Lo({ className: e, size: t = "lg", render: n, ...r }) {
	return R({
		defaultTagName: "h2",
		props: L({
			"data-quill": "",
			className: W(Io({ size: t }), e)
		}, r),
		render: n,
		state: {
			slot: "heading",
			size: t
		}
	});
}
function Ro({ className: e, ...t }) {
	return /* @__PURE__ */ M(re.Root, {
		"data-quill": !0,
		"data-slot": "number-field",
		className: W("flex flex-col gap-1", e),
		...t
	});
}
function zo({ className: e, ...t }) {
	return /* @__PURE__ */ M(re.Group, {
		"data-slot": "number-field-group",
		className: W("quill-number-field__group flex items-center", e),
		...t
	});
}
var Bo = w.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ M(re.Input, {
	ref: n,
	"data-slot": "number-field-input",
	className: W("quill-number-field__input", e),
	...t
}));
Bo.displayName = "NumberFieldInput";
function Vo({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(re.Increment, {
		"data-slot": "number-field-increment",
		className: W("quill-number-field__increment flex items-center justify-center", e),
		...n,
		children: t ?? /* @__PURE__ */ M(f, { className: "size-3.5" })
	});
}
function Ho({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ M(re.Decrement, {
		"data-slot": "number-field-decrement",
		className: W("quill-number-field__decrement flex items-center justify-center", e),
		...n,
		children: t ?? /* @__PURE__ */ M(c, { className: "size-3.5" })
	});
}
function Uo({ className: e, ...t }) {
	return /* @__PURE__ */ M(re.ScrubArea, {
		"data-slot": "number-field-scrub-area",
		className: W("cursor-ew-resize", e),
		...t
	});
}
function Wo({ className: e, ...t }) {
	return /* @__PURE__ */ M(re.ScrubAreaCursor, {
		"data-slot": "number-field-scrub-area-cursor",
		className: W(e),
		...t
	});
}
function Go({ className: e, combined: t = !1, ...n }) {
	return /* @__PURE__ */ M("div", {
		role: "list",
		"data-slot": "item-group",
		"data-combined": t ? "" : void 0,
		className: W("quill-item-group group/item-group flex w-full flex-col", t ? "gap-0" : "gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2", e),
		...n
	});
}
function Ko({ className: e, ...t }) {
	return /* @__PURE__ */ M(nt, {
		"data-slot": "item-separator",
		orientation: "horizontal",
		className: W("my-2", e),
		...t
	});
}
var qo = F("quill-item item group/item flex w-full flex-wrap items-center", {
	variants: {
		variant: {
			default: "quill-item--variant-default",
			outline: "quill-item--variant-outline",
			pressable: "quill-item--variant-pressable",
			muted: "quill-item--variant-muted",
			menuItem: "quill-item--variant-menu"
		},
		size: {
			default: "quill-item--size-default",
			sm: "quill-item--size-sm",
			xs: "quill-item--size-xs"
		},
		tone: {
			default: "",
			info: "quill-item--tone-info",
			success: "quill-item--tone-success",
			warning: "quill-item--tone-warning",
			completed: "quill-item--tone-completed",
			destructive: "quill-item--tone-destructive"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default",
		tone: "default"
	}
});
function Jo({ className: e, variant: t = "default", size: n = "default", tone: r = "default", role: i, render: a, ...o }) {
	return R({
		defaultTagName: "div",
		props: L({
			"data-quill": "",
			"data-tone": r && r !== "default" ? r : void 0,
			className: W(qo({
				variant: t,
				size: n,
				tone: r,
				className: e
			})),
			role: t === "pressable" ? "link" : void 0
		}, o),
		render: a,
		state: {
			slot: "item",
			variant: t,
			size: n,
			tone: r
		}
	});
}
var Yo = w.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, ...i }, a) {
	return R({
		defaultTagName: "button",
		props: L({
			className: W(qo({
				variant: "menuItem",
				size: n,
				className: e
			})),
			role: "menuitem",
			ref: a
		}, i),
		render: r,
		state: {
			slot: "item",
			variant: t,
			size: n
		}
	});
}), Xo = w.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, children: i, ...a }, o) {
	let s = a["aria-checked"] === !0 || a["aria-checked"] === "true", c = R({
		defaultTagName: "button",
		props: L({
			className: W(qo({
				variant: "menuItem",
				size: n,
				className: e
			})),
			role: "checkbox",
			ref: o
		}, a),
		render: r,
		state: {
			slot: "item",
			variant: t,
			size: n
		}
	});
	return w.cloneElement(c, {}, /* @__PURE__ */ M($o, {
		variant: "checkbox",
		className: "-mr-2",
		children: /* @__PURE__ */ M(bi, {
			checked: s,
			size: "sm"
		})
	}), i);
}), Zo = w.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, children: i, ...a }, o) {
	let s = a["aria-checked"] === !0 || a["aria-checked"] === "true", c = R({
		defaultTagName: "button",
		props: L({
			className: W(qo({
				variant: "menuItem",
				size: n,
				className: e
			})),
			role: "radio",
			ref: o
		}, a),
		render: r,
		state: {
			slot: "item",
			variant: t,
			size: n
		}
	});
	return w.cloneElement(c, {}, /* @__PURE__ */ M($o, {
		variant: "checkbox",
		className: "-mr-2",
		children: /* @__PURE__ */ M(ta, {
			checked: s,
			size: "sm"
		})
	}), i);
}), Qo = F("quill-item__media flex shrink-0 items-center justify-center gap-2", {
	variants: { variant: {
		default: "quill-item__media--variant-default",
		icon: "quill-item__media--variant-icon",
		image: "quill-item__media--variant-image",
		checkbox: "quill-item__media--variant-checkbox"
	} },
	defaultVariants: { variant: "default" }
});
function $o({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-media",
		"data-variant": t,
		className: W(Qo({
			variant: t,
			className: e
		})),
		...n
	});
}
var es = F("quill-item__content flex flex-1 flex-col gap-1", {
	variants: { variant: {
		default: "",
		menuItem: "quill-item__content--variant-menu"
	} },
	defaultVariants: { variant: "default" }
});
function ts({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-content",
		className: W(es({
			variant: t,
			className: e
		})),
		...n
	});
}
function ns({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-title",
		className: W("quill-item__title gap-2", e),
		...t
	});
}
function rs({ className: e, ...t }) {
	return /* @__PURE__ */ M("p", {
		"data-slot": "item-description",
		className: W("quill-item__description", e),
		...t
	});
}
function is({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-actions",
		className: W("flex items-center gap-2", e),
		...t
	});
}
function as({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-header",
		className: W("flex basis-full items-center justify-between gap-2", e),
		...t
	});
}
function os({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-slot": "item-footer",
		className: W("flex basis-full items-center justify-between gap-2", e),
		...t
	});
}
function ss({ className: e, ...t }) {
	return /* @__PURE__ */ M(_e, {
		"data-quill": !0,
		"data-slot": "menubar",
		className: W("quill-menubar flex items-center", e),
		...t
	});
}
function cs({ ...e }) {
	return /* @__PURE__ */ M($a, {
		"data-slot": "menubar-menu",
		...e
	});
}
function ls({ ...e }) {
	return /* @__PURE__ */ M(ro, {
		"data-slot": "menubar-group",
		...e
	});
}
function us({ ...e }) {
	return /* @__PURE__ */ M(eo, {
		"data-slot": "menubar-portal",
		...e
	});
}
function ds({ className: e, ...t }) {
	return /* @__PURE__ */ M(to, {
		"data-slot": "menubar-trigger",
		className: W("quill-menubar__trigger flex items-center outline-hidden select-none", e),
		...t
	});
}
function fs({ className: e, align: t = "start", alignOffset: n = -4, sideOffset: r = 8, ...i }) {
	return /* @__PURE__ */ M(no, {
		"data-slot": "menubar-content",
		align: t,
		alignOffset: n,
		sideOffset: r,
		className: e,
		...i
	});
}
function ps({ className: e, inset: t, variant: n = "default", ...r }) {
	return /* @__PURE__ */ M(ao, {
		"data-slot": "menubar-item",
		"data-inset": t,
		variant: n,
		className: W("group/menubar-item min-h-7 gap-2 rounded-sm px-2 py-1 text-xs/relaxed focus:bg-fill-hover data-disabled:opacity-50", e),
		...r
	});
}
function ms({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ N(H.CheckboxItem, {
		"data-slot": "menubar-checkbox-item",
		"data-inset": r,
		className: W("quill-menu-item--inset relative flex min-h-7 cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 text-xs outline-hidden select-none hover:bg-[var(--fill-hover)] focus:bg-[var(--fill-hover)] focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", e),
		checked: n,
		...i,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex size-4 items-center justify-center",
			children: [/* @__PURE__ */ M(Si, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ M(H.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(Si, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function hs({ ...e }) {
	return /* @__PURE__ */ M(uo, {
		"data-slot": "menubar-radio-group",
		...e
	});
}
function gs({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ N(H.RadioItem, {
		"data-slot": "menubar-radio-item",
		"data-inset": n,
		className: W("quill-menu-item--inset relative flex min-h-7 cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 text-xs outline-hidden select-none hover:bg-[var(--fill-hover)] focus:bg-[var(--fill-hover)] focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		...r,
		children: [/* @__PURE__ */ N("span", {
			className: "pointer-events-none absolute start-2 flex size-4 items-center justify-center",
			children: [/* @__PURE__ */ M(ta, { size: "sm" }), /* @__PURE__ */ M(H.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ M(ta, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function _s({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ M(io, {
		"data-slot": "menubar-label",
		"data-inset": t,
		className: W("px-2 py-1.5 text-xs text-muted-foreground", t && "quill-menu-item--inset", e),
		...n
	});
}
function vs({ className: e, ...t }) {
	return /* @__PURE__ */ M(po, {
		"data-slot": "menubar-separator",
		className: W("quill-menu__separator", e),
		...t
	});
}
function ys({ className: e, ...t }) {
	return /* @__PURE__ */ M(go, {
		"data-slot": "menubar-shortcut",
		className: W("quill-menu__shortcut", e),
		...t
	});
}
function bs({ ...e }) {
	return /* @__PURE__ */ M(oo, {
		"data-slot": "menubar-sub",
		...e
	});
}
function xs({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ M(so, {
		"data-slot": "menubar-sub-trigger",
		"data-inset": t,
		className: W("min-h-7 gap-2 rounded-sm px-2 py-1 text-xs focus:bg-fill-hover data-open:bg-fill-selected [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		...n
	});
}
function Ss({ className: e, ...t }) {
	return /* @__PURE__ */ M(co, {
		"data-slot": "menubar-sub-content",
		className: e,
		...t
	});
}
function Cs({ className: e, ...t }) {
	return /* @__PURE__ */ M("nav", {
		"aria-label": "Pagination",
		"data-quill": !0,
		"data-slot": "pagination",
		className: W("quill-pagination", e),
		...t
	});
}
var ws = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("ul", {
		ref: n,
		"data-slot": "pagination-content",
		className: W("quill-pagination__content", e),
		...t
	});
}), Ts = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("li", {
		ref: n,
		"data-slot": "pagination-item",
		className: W("quill-pagination__item", e),
		...t
	});
}), Es = w.forwardRef(function({ isActive: e, size: t = "icon-sm", className: n, ...r }, i) {
	return /* @__PURE__ */ M(G, {
		ref: i,
		"data-slot": "pagination-button",
		"aria-current": e ? "page" : void 0,
		"aria-selected": e ? !0 : void 0,
		size: t,
		className: W("quill-pagination__button", n),
		...r
	});
}), Ds = w.forwardRef(function({ className: e, children: t, ...n }, r) {
	return /* @__PURE__ */ N(Es, {
		ref: r,
		"aria-label": "Go to previous page",
		size: "sm",
		className: W("gap-1 px-2", e),
		...n,
		children: [/* @__PURE__ */ M(l, { className: "size-3.5" }), t ?? /* @__PURE__ */ M("span", { children: "Previous" })]
	});
}), Os = w.forwardRef(function({ className: e, children: t, ...n }, r) {
	return /* @__PURE__ */ N(Es, {
		ref: r,
		"aria-label": "Go to next page",
		size: "sm",
		className: W("gap-1 px-2", e),
		...n,
		children: [t ?? /* @__PURE__ */ M("span", { children: "Next" }), /* @__PURE__ */ M(u, { className: "size-3.5" })]
	});
});
function ks({ className: e, ...t }) {
	return /* @__PURE__ */ N("span", {
		"aria-hidden": !0,
		"data-slot": "pagination-ellipsis",
		className: W("quill-pagination__ellipsis", e),
		...t,
		children: [/* @__PURE__ */ M(b, { className: "size-3.5" }), /* @__PURE__ */ M("span", {
			className: "sr-only",
			children: "More pages"
		})]
	});
}
function As(e, t, n = 1) {
	if (e <= n * 2 + 5) return Array.from({ length: e }, (e, t) => t);
	let r = Math.max(t - n, 0), i = Math.min(t + n, e - 1), a = r > 2, o = i < e - 3, s = e - 1, c = [0];
	if (a) c.push("ellipsis");
	else for (let e = 1; e < r; e++) c.push(e);
	for (let e = r; e <= i; e++) e !== 0 && e !== s && c.push(e);
	if (o) c.push("ellipsis");
	else for (let e = i + 1; e < s; e++) c.push(e);
	return c.push(s), c;
}
Cs.displayName = "Pagination", ws.displayName = "PaginationContent", Ts.displayName = "PaginationItem", Es.displayName = "PaginationButton", Ds.displayName = "PaginationPrevious", Os.displayName = "PaginationNext";
function js({ ...e }) {
	return /* @__PURE__ */ M(ve.Root, {
		"data-slot": "popover",
		...e
	});
}
function Ms({ ...e }) {
	return /* @__PURE__ */ M(ve.Trigger, {
		"data-slot": "popover-trigger",
		...e
	});
}
function Ns({ className: e, align: t = "center", alignOffset: n = 0, side: r = "bottom", sideOffset: i = 4, collisionAvoidance: a, container: o, ...s }) {
	return /* @__PURE__ */ M(ve.Portal, {
		container: o,
		children: /* @__PURE__ */ M(ve.Positioner, {
			"data-quill": !0,
			"data-quill-portal": "popover",
			align: t,
			alignOffset: n,
			side: r,
			sideOffset: i,
			collisionAvoidance: a,
			className: "isolate",
			children: /* @__PURE__ */ M(ve.Popup, {
				"data-slot": "popover-content",
				className: W("quill-popover__content flex flex-col gap-4", e),
				...s
			})
		})
	});
}
var Ps = F("quill-progress__indicator", {
	variants: { variant: {
		default: "quill-progress__indicator--variant-default",
		info: "quill-progress__indicator--variant-info",
		success: "quill-progress__indicator--variant-success",
		warning: "quill-progress__indicator--variant-warning",
		destructive: "quill-progress__indicator--variant-destructive"
	} },
	defaultVariants: { variant: "default" }
});
function Fs({ className: e, children: t, value: n, variant: r = "default", ...i }) {
	return /* @__PURE__ */ N(ye.Root, {
		value: n,
		"data-quill": !0,
		"data-slot": "progress",
		"data-variant": r,
		className: W("flex flex-wrap gap-3", e),
		...i,
		children: [t, /* @__PURE__ */ M(Is, { children: /* @__PURE__ */ M(Ls, { variant: r }) })]
	});
}
function Is({ className: e, ...t }) {
	return /* @__PURE__ */ M(ye.Track, {
		className: W("quill-progress__track relative flex items-center", e),
		"data-slot": "progress-track",
		...t
	});
}
function Ls({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ M(ye.Indicator, {
		"data-slot": "progress-indicator",
		"data-variant": t,
		className: W(Ps({ variant: t }), e),
		...n
	});
}
function Rs({ className: e, ...t }) {
	return /* @__PURE__ */ M(ye.Label, {
		className: W("quill-progress__label", e),
		"data-slot": "progress-label",
		...t
	});
}
function zs({ className: e, ...t }) {
	return /* @__PURE__ */ M(ye.Value, {
		className: W("quill-progress__value ms-auto", e),
		"data-slot": "progress-value",
		...t
	});
}
function Bs({ className: e, ...t }) {
	return /* @__PURE__ */ M(be.Group, {
		"data-quill": !0,
		"data-slot": "resizable-panel-group",
		className: W("group/resizable-panel-group flex h-full w-full aria-[orientation=vertical]:flex-col", e),
		...t
	});
}
function Vs({ ...e }) {
	return /* @__PURE__ */ M(be.Panel, {
		"data-slot": "resizable-panel",
		...e
	});
}
function Hs({ withHandle: e, className: t, ...n }) {
	let r = w.useRef(null);
	return w.useEffect(() => {
		let e = r.current;
		if (!e) return;
		let t = () => {
			e.blur();
		};
		return e.addEventListener("pointerup", t), () => e.removeEventListener("pointerup", t);
	}, []), /* @__PURE__ */ M(be.Separator, {
		"data-slot": "resizable-handle",
		elementRef: r,
		className: W("quill-resizable__handle flex items-center justify-center", t),
		...n,
		children: e && /* @__PURE__ */ M("div", {})
	});
}
var Us = U.Root;
function Ws({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.Group, {
		"data-slot": "select-group",
		className: W("quill-select__group", e),
		...t
	});
}
function Gs({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.Value, {
		"data-slot": "select-value",
		className: W("quill-select__value", e),
		...t
	});
}
function Ks({ className: e, ...t }) {
	return /* @__PURE__ */ M(c, {
		className: W("quill-select__icon", e),
		...t
	});
}
function qs({ className: e, size: t = "default", children: n, ...r }) {
	return /* @__PURE__ */ N(U.Trigger, {
		"data-slot": "select-trigger",
		"data-size": t,
		className: W("quill-select__trigger group/select-trigger flex items-center justify-between gap-3 whitespace-nowrap outline-none", e),
		render: /* @__PURE__ */ M(G, {
			variant: "outline",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ M(U.Icon, { render: /* @__PURE__ */ M(Ks, {}) })]
	});
}
function Js({ className: e, children: t, side: n = "bottom", sideOffset: r = 4, align: i = "center", alignOffset: a = 0, alignItemWithTrigger: o = !0, ...s }) {
	return /* @__PURE__ */ M(U.Portal, { children: /* @__PURE__ */ M(U.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: n,
		sideOffset: r,
		align: i,
		alignOffset: a,
		alignItemWithTrigger: o,
		className: "isolate",
		children: /* @__PURE__ */ N(U.Popup, {
			"data-slot": "select-content",
			"data-align-trigger": o,
			className: W("quill-select__content", e),
			...s,
			children: [
				/* @__PURE__ */ M(Qs, { className: "quill-select__scroll-button flex items-center justify-center" }),
				/* @__PURE__ */ M(U.List, {
					className: "quill-select__list scroll-mask-y-4 scroll-py-4",
					children: t
				}),
				/* @__PURE__ */ M($s, {})
			]
		})
	}) });
}
function Ys({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.GroupLabel, {
		"data-slot": "select-label",
		className: e,
		render: /* @__PURE__ */ M(tt, {}),
		...t
	});
}
function Xs({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ N(U.Item, {
		"data-slot": "select-item",
		className: W("quill-select__item group/select-item flex w-full cursor-default items-center gap-2 select-none", e),
		...n,
		children: [/* @__PURE__ */ M(U.ItemText, {
			className: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
			children: t
		}), /* @__PURE__ */ M(U.ItemIndicator, {
			render: /* @__PURE__ */ M("span", { className: "pointer-events-none absolute end-2 flex items-center justify-center" }),
			children: /* @__PURE__ */ M(s, { className: "pointer-events-none" })
		})]
	});
}
function Zs({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.Separator, {
		"data-slot": "select-separator",
		className: W("quill-select__separator", e),
		...t
	});
}
function Qs({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.ScrollUpArrow, {
		"data-slot": "select-scroll-up-button",
		className: W("quill-select__scroll-button quill-select__scroll-button--up", e),
		render: /* @__PURE__ */ M(G, {
			variant: "outline",
			size: "icon-sm"
		}),
		...t,
		children: /* @__PURE__ */ M(f, {})
	});
}
function $s({ className: e, ...t }) {
	return /* @__PURE__ */ M(U.ScrollDownArrow, {
		"data-slot": "select-scroll-down-button",
		className: W("quill-select__scroll-button quill-select__scroll-button--down", e),
		render: /* @__PURE__ */ M(G, {
			variant: "outline",
			size: "icon-sm"
		}),
		...t,
		children: /* @__PURE__ */ M(c, {})
	});
}
function ec({ className: e, ...t }) {
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		"data-slot": "skeleton",
		className: W("quill-skeleton", e),
		...t
	});
}
function tc({ lines: e = 3, className: t, minWidth: n = 60, maxWidth: r = 100 }) {
	let i = w.useMemo(() => Array.from({ length: e }).map((t, i) => {
		if (i === 0) return `${r}%`;
		if (i === e - 1) return `${Math.max(n, 40)}%`;
		let a = Math.random() * (r - n) + n;
		return `${Math.round(a)}%`;
	}), [
		e,
		n,
		r
	]);
	return /* @__PURE__ */ M("div", {
		"data-quill": !0,
		className: W("flex flex-col", t),
		children: i.map((e, t) => /* @__PURE__ */ M("span", {
			className: "relative block w-full",
			style: { height: "1lh" },
			children: /* @__PURE__ */ M(ec, {
				className: "absolute left-0 right-auto",
				style: {
					width: e,
					height: "0.7em",
					top: "50%",
					transform: "translateY(-50%)"
				}
			})
		}, t))
	});
}
function nc({ className: e, defaultValue: t, value: n, min: r = 0, max: i = 100, ...a }) {
	let o = w.useMemo(() => Array.isArray(n) ? n : Array.isArray(t) ? t : [r, i], [
		n,
		t,
		r,
		i
	]);
	return /* @__PURE__ */ M(xe.Root, {
		"data-quill": !0,
		"data-slot": "slider",
		className: W("quill-slider", e),
		defaultValue: t,
		value: n,
		min: r,
		max: i,
		thumbAlignment: "edge",
		...a,
		children: /* @__PURE__ */ N(xe.Control, {
			className: "quill-slider__control",
			children: [/* @__PURE__ */ M(xe.Track, {
				"data-slot": "slider-track",
				className: "quill-slider__track",
				children: /* @__PURE__ */ M(xe.Indicator, {
					"data-slot": "slider-range",
					className: "quill-slider__range"
				})
			}), Array.from({ length: o.length }, (e, t) => /* @__PURE__ */ M(xe.Thumb, {
				"data-slot": "slider-thumb",
				className: "quill-slider__thumb flex items-center justify-center"
			}, t))]
		})
	});
}
var rc = Se.createToastManager(), ic = Se.createToastManager(), ac = {
	success: /* @__PURE__ */ M(m, { className: "quill-toast-card__icon--success size-6" }),
	info: /* @__PURE__ */ M(_, { className: "quill-toast-card__icon--info size-6" }),
	warning: /* @__PURE__ */ M(S, { className: "quill-toast-card__icon--warning size-6" }),
	error: /* @__PURE__ */ M(C, { className: "quill-toast-card__icon--error size-6" }),
	loading: /* @__PURE__ */ M(Ve, { className: "quill-toast-card__icon--loading size-6" })
}, oc = w.forwardRef(({ className: e, toastTitle: t, toastDescription: n, icon: r, action: i, onDismiss: a, showGapHitArea: o, children: s, ...c }, l) => {
	let u = t !== void 0 && n === void 0, d = n !== void 0 && t === void 0;
	return /* @__PURE__ */ N("div", {
		ref: l,
		className: W("quill-toast-card", e),
		...c,
		children: [
			o && /* @__PURE__ */ M("span", {
				className: "pointer-events-auto absolute left-0 top-full w-full",
				style: { height: "calc(var(--gap) + 1px)" }
			}),
			/* @__PURE__ */ N("div", {
				className: W("flex items-center gap-3", a && "pe-8"),
				children: [r && /* @__PURE__ */ M("span", {
					className: W("shrink-0 self-start mt-1", !t && n && "mt-0"),
					children: r
				}), /* @__PURE__ */ N("div", {
					className: "flex-1 min-w-0",
					children: [t && /* @__PURE__ */ M("div", {
						className: "quill-toast-card__title",
						children: t
					}), n && /* @__PURE__ */ M("div", {
						className: "quill-toast-card__description",
						children: n
					})]
				})]
			}),
			i && /* @__PURE__ */ N("div", {
				className: "flex items-center gap-3 mt-2",
				children: [r && /* @__PURE__ */ M("span", { className: "size-6 shrink-0" }), /* @__PURE__ */ M(G, {
					variant: "outline",
					size: "sm",
					className: "quill-toast-card__action",
					onClick: i.onClick,
					children: i.label
				})]
			}),
			a && /* @__PURE__ */ M(G, {
				size: "icon-sm",
				className: W("absolute right-2", u && "top-1" || d && "top-1" || "top-2"),
				onClick: a,
				children: /* @__PURE__ */ M(C, { className: "size-3.5" })
			}),
			s
		]
	});
});
oc.displayName = "ToastCard";
var sc = {
	"--gap": "0.75rem",
	"--peek": "0.75rem",
	"--scale": "calc(max(0, 1 - (var(--toast-index) * 0.1)))",
	"--shrink": "calc(1 - var(--scale))",
	"--height": "var(--toast-frontmost-height, var(--toast-height))",
	"--offset-y": "calc(var(--toast-offset-y) * -1 + (var(--toast-index) * var(--gap) * -1) + var(--toast-swipe-movement-y))",
	position: "absolute",
	right: 0,
	bottom: 0,
	left: "auto",
	width: "100%",
	height: "auto",
	zIndex: "calc(1000 - var(--toast-index))",
	transformOrigin: "bottom center",
	transform: "translateX(var(--toast-swipe-movement-x)) translateY(calc(var(--toast-swipe-movement-y) - (var(--toast-index) * var(--peek)) - (var(--shrink) * var(--height)))) scale(var(--scale))",
	transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s, height 0.15s"
};
function cc({ children: e, limit: t = 3, timeout: n = 5e3 }) {
	return /* @__PURE__ */ N(Se.Provider, {
		toastManager: rc,
		limit: t,
		timeout: n,
		children: [/* @__PURE__ */ N(Se.Provider, {
			toastManager: ic,
			limit: t,
			timeout: n,
			children: [e, /* @__PURE__ */ M(uc, {})]
		}), /* @__PURE__ */ M(lc, {})]
	});
}
function lc() {
	let e = Se.useToastManager();
	return /* @__PURE__ */ M(Se.Portal, { children: /* @__PURE__ */ M(Se.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "toast",
		className: "fixed bottom-4 right-4 w-[360px]",
		children: e.toasts.map((e) => {
			let t = e.type;
			return /* @__PURE__ */ M(Se.Root, {
				toast: e,
				style: sc,
				render: /* @__PURE__ */ M(oc, {
					toastTitle: e.title,
					toastDescription: e.description,
					icon: t ? ac[t] : void 0,
					showGapHitArea: !0,
					action: e.data?.action ? {
						label: e.data.action.label,
						onClick: () => {
							rc.close(e.id), e.data?.action?.onClick();
						}
					} : void 0,
					onDismiss: () => rc.close(e.id),
					className: W("m-0 p-3", "data-[expanded]:![transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]", "data-[expanded]:![height:var(--toast-height)]", "data-[starting-style]:![transform:translateY(150%)]", "data-[ending-style]:![transform:translateY(150%)]", "data-[ending-style]:opacity-0", "data-[limited]:opacity-0")
				})
			}, e.id);
		})
	}) });
}
function uc() {
	let e = Se.useToastManager();
	return /* @__PURE__ */ M(Se.Portal, { children: /* @__PURE__ */ M(Se.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "toast",
		className: "fixed",
		children: e.toasts.map((e) => /* @__PURE__ */ M(Se.Positioner, {
			toast: e,
			side: "top",
			sideOffset: 8,
			children: /* @__PURE__ */ M(Se.Root, {
				toast: e,
				render: /* @__PURE__ */ M(oc, {
					toastTitle: e.title,
					toastDescription: e.description,
					className: W("data-[starting-style]:opacity-0 data-[starting-style]:scale-95", "data-[ending-style]:opacity-0 data-[ending-style]:scale-95", "transition-[opacity,transform] duration-200 ease-out")
				})
			})
		}, e.id))
	}) });
}
function dc(e) {
	let { title: t, description: n, type: r, timeout: i, onClose: a, action: o } = e;
	return rc.add({
		title: t,
		description: n,
		type: r,
		timeout: i,
		onClose: a,
		data: o ? { action: o } : void 0
	});
}
function fc(e) {
	return dc(e);
}
fc.success = (e) => dc({
	...e,
	type: "success"
}), fc.info = (e) => dc({
	...e,
	type: "info"
}), fc.warning = (e) => dc({
	...e,
	type: "warning"
}), fc.error = (e) => dc({
	...e,
	type: "error"
}), fc.loading = (e) => dc({
	...e,
	type: "loading",
	timeout: 0
}), fc.dismiss = (e) => {
	rc.close(e);
}, fc.update = (e, t) => {
	let { title: n, description: r, type: i, timeout: a, onClose: o, action: s } = t;
	rc.update(e, {
		title: n,
		description: r,
		type: i,
		timeout: a,
		onClose: o,
		data: s ? { action: s } : void 0
	});
};
function pc(e) {
	let { title: t, description: n, type: r, timeout: i, action: a, anchor: o, side: s, sideOffset: c, onClose: l } = e;
	return ic.add({
		title: t,
		description: n,
		type: r,
		timeout: i,
		onClose: l,
		data: a ? { action: a } : void 0,
		positionerProps: {
			anchor: o,
			side: s,
			sideOffset: c
		}
	});
}
pc.dismiss = (e) => {
	ic.close(e);
};
function mc({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ M(Ce.Root, {
		"data-quill": !0,
		"data-slot": "switch",
		"data-size": t,
		className: W("quill-switch peer group/switch inline-flex shrink-0 items-center", e),
		...n,
		children: /* @__PURE__ */ M(Ce.Thumb, {
			"data-slot": "switch-thumb",
			className: "quill-switch__thumb"
		})
	});
}
function hc(e, ...t) {
	for (let n of t) typeof n == "function" ? n(e) : n && (n.current = e);
}
function gc(e, t) {
	w.useEffect(() => {
		let n = e.current, r = t.current;
		if (!n || !r) return;
		let i = () => {
			let { scrollTop: e, scrollLeft: t, scrollWidth: i, clientWidth: a, scrollHeight: o, clientHeight: s } = r, c = Math.abs(t);
			n.toggleAttribute("data-scroll-top", e > 0), n.toggleAttribute("data-scroll-bottom", Math.ceil(e + s) < o), n.toggleAttribute("data-scroll-left", c > 0), n.toggleAttribute("data-scroll-right", Math.ceil(c + a) < i);
		};
		i(), r.addEventListener("scroll", i, { passive: !0 });
		let a = new ResizeObserver(i);
		a.observe(r);
		for (let e of Array.from(r.children)) a.observe(e);
		return () => {
			r.removeEventListener("scroll", i), a.disconnect();
		};
	}, [e, t]);
}
var _c = w.forwardRef(function({ className: e, tableClassName: t, stickyHeader: n = !1, fullWidth: r = !1, size: i = "default", viewportRef: a, ...o }, s) {
	let c = w.useRef(null), l = w.useRef(null);
	gc(c, l);
	let u = w.useCallback((e) => hc(e, l, a), [a]);
	return /* @__PURE__ */ M("div", {
		ref: c,
		"data-quill": !0,
		"data-slot": "table-container",
		"data-page-sticky": n === "page" ? "" : void 0,
		className: W("quill-table__root", e),
		children: /* @__PURE__ */ M("div", {
			ref: u,
			"data-slot": "table-viewport",
			className: "quill-table__viewport",
			children: /* @__PURE__ */ M("table", {
				ref: s,
				"data-slot": "table",
				"data-sticky-header": n ? "" : void 0,
				"data-full-width": r ? "" : void 0,
				"data-size": i,
				className: W("quill-table", t),
				...o
			})
		})
	});
}), vc = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("thead", {
		ref: n,
		"data-slot": "table-header",
		className: W("quill-table__header", e),
		...t
	});
}), yc = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("tbody", {
		ref: n,
		"data-slot": "table-body",
		className: W("quill-table__body", e),
		...t
	});
}), bc = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("tfoot", {
		ref: n,
		"data-slot": "table-footer",
		className: W("quill-table__footer", e),
		...t
	});
}), xc = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("tr", {
		ref: n,
		"data-slot": "table-row",
		className: W("quill-table__row", e),
		...t
	});
}), Sc = w.forwardRef(function({ className: e, sticky: t, align: n, valign: r, expand: i, scope: a = "col", ...o }, s) {
	return /* @__PURE__ */ M("th", {
		ref: s,
		"data-slot": "table-head",
		"data-sticky": t,
		"data-align": n,
		"data-valign": r,
		"data-expand": i ? "" : void 0,
		scope: a,
		className: W("quill-table__head", e),
		...o
	});
}), Cc = w.forwardRef(function({ className: e, sticky: t, align: n, valign: r, expand: i, ...a }, o) {
	return /* @__PURE__ */ M("td", {
		ref: o,
		"data-slot": "table-cell",
		"data-sticky": t,
		"data-align": n,
		"data-valign": r,
		"data-expand": i ? "" : void 0,
		className: W("quill-table__cell", e),
		...a
	});
}), wc = w.forwardRef(function({ className: e, colSpan: t = 1e3, children: n, ...r }, i) {
	return /* @__PURE__ */ M("tbody", {
		"data-slot": "table-empty",
		children: /* @__PURE__ */ M("tr", { children: /* @__PURE__ */ M("td", {
			ref: i,
			colSpan: t,
			className: W("quill-table__empty", e),
			...r,
			children: /* @__PURE__ */ M("div", {
				className: "quill-table__empty-inner",
				children: n
			})
		}) })
	});
}), Tc = w.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ M("caption", {
		ref: n,
		"data-slot": "table-caption",
		className: W("quill-table__caption", e),
		...t
	});
});
_c.displayName = "Table", vc.displayName = "TableHeader", yc.displayName = "TableBody", bc.displayName = "TableFooter", xc.displayName = "TableRow", Sc.displayName = "TableHead", Cc.displayName = "TableCell", wc.displayName = "TableEmpty", Tc.displayName = "TableCaption";
function Ec({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ M(we.Root, {
		"data-slot": "tabs",
		"data-orientation": t,
		className: W("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", e),
		...n
	});
}
var Dc = F("quill-tabs__list group/tabs-list inline-flex w-fit items-center justify-center relative", {
	variants: { variant: {
		default: "quill-tabs__list--variant-default",
		line: "quill-tabs__list--variant-line"
	} },
	defaultVariants: { variant: "default" }
}), Oc = F("quill-tabs__indicator", {
	variants: { variant: {
		default: "quill-tabs__indicator--variant-default",
		line: "quill-tabs__indicator--variant-line"
	} },
	defaultVariants: { variant: "default" }
});
function kc({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ N(we.List, {
		"data-quill": !0,
		"data-slot": "tabs-list",
		"data-variant": t,
		className: W(Dc({ variant: t }), e),
		...n,
		children: [n.children, /* @__PURE__ */ M(we.Indicator, { className: Oc({ variant: t }) })]
	});
}
function Ac({ className: e, ...t }) {
	return /* @__PURE__ */ M(we.Tab, {
		"data-slot": "tabs-trigger",
		className: W("quill-tabs__trigger inline-flex items-center justify-center gap-1.5 whitespace-nowrap", e),
		...t,
		render: (e) => /* @__PURE__ */ M(G, { ...e })
	});
}
function jc({ className: e, ...t }) {
	return /* @__PURE__ */ M(we.Panel, {
		"data-slot": "tabs-content",
		className: W("quill-tabs__panel", e),
		...t
	});
}
var Mc = F("", {
	variants: {
		size: {
			lg: "text-lg",
			base: "text-base",
			sm: "text-sm",
			xs: "text-xs",
			xxs: "text-xxs"
		},
		variant: {
			default: "text-foreground",
			muted: "text-muted-foreground",
			destructive: "text-destructive-foreground"
		},
		weight: {
			normal: "font-normal",
			medium: "font-medium",
			semibold: "font-semibold"
		}
	},
	defaultVariants: {
		size: "base",
		variant: "default",
		weight: "normal"
	}
});
function Nc({ className: e, size: t = "base", variant: n = "default", weight: r = "normal", render: i, ...a }) {
	return R({
		defaultTagName: "p",
		props: L({
			"data-quill": "",
			className: W(Mc({
				size: t,
				variant: n,
				weight: r
			}), e)
		}, a),
		render: i,
		state: {
			slot: "text",
			size: t,
			variant: n,
			weight: r
		}
	});
}
var Pc = F("quill-toggle group/toggle inline-flex items-center justify-center gap-1 whitespace-nowrap", {
	variants: {
		variant: {
			default: "quill-toggle--variant-default",
			outline: "quill-toggle--variant-outline"
		},
		size: {
			default: "quill-toggle--size-default",
			sm: "quill-toggle--size-sm",
			lg: "quill-toggle--size-lg",
			icon: "quill-toggle--size-icon"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Fc({ className: e, variant: t = "default", size: n = "default", ...r }) {
	return /* @__PURE__ */ M(oe, {
		"data-quill": !0,
		"data-slot": "toggle",
		className: W(Pc({
			variant: t,
			size: n,
			className: e
		})),
		...r
	});
}
var Ic = w.createContext({
	size: "default",
	variant: "default",
	spacing: 0,
	orientation: "horizontal"
});
function Lc({ className: e, variant: t, size: n, spacing: r = 0, orientation: i = "horizontal", children: a, ...o }) {
	return /* @__PURE__ */ M(Te, {
		"data-quill": !0,
		"data-slot": "toggle-group",
		"data-variant": t,
		"data-size": n,
		"data-spacing": r,
		"data-orientation": i,
		style: { "--gap": r },
		className: W("quill-toggle-group group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch", e),
		...o,
		children: /* @__PURE__ */ M(Ic.Provider, {
			value: {
				variant: t,
				size: n,
				spacing: r,
				orientation: i
			},
			children: a
		})
	});
}
function Rc({ className: e, children: t, variant: n = "default", size: r = "default", ...i }) {
	let a = w.useContext(Ic);
	return /* @__PURE__ */ M(oe, {
		"data-slot": "toggle-group-item",
		"data-variant": a.variant || n,
		"data-size": a.size || r,
		"data-spacing": a.spacing,
		className: W("quill-toggle-group__item", Pc({
			variant: a.variant || n,
			size: a.size || r
		}), e),
		...i,
		render: (e) => /* @__PURE__ */ M(G, {
			variant: "outline",
			size: r,
			...e
		}),
		children: t
	});
}
var zc = "(prefers-color-scheme: dark)", Bc = [
	"dark",
	"light",
	"system"
], Vc = w.createContext(void 0);
function Hc(e) {
	return e === null ? !1 : Bc.includes(e);
}
function Uc() {
	return typeof window < "u" && window.matchMedia(zc).matches ? "dark" : "light";
}
function Wc() {
	let e = document.createElement("style");
	return e.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;transition:none!important}")), document.head.appendChild(e), () => {
		window.getComputedStyle(document.body), requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				e.remove();
			});
		});
	};
}
function Gc(e) {
	return e instanceof HTMLElement ? !!(e.isContentEditable || e.closest("input, textarea, select, [contenteditable='true']")) : !1;
}
function Kc({ children: e, defaultTheme: t = "system", storageKey: n = "theme", disableTransitionOnChange: r = !0, ...i }) {
	let [a, o] = w.useState(() => {
		if (typeof window < "u") {
			let e = localStorage.getItem(n);
			if (Hc(e)) return e;
		}
		return t;
	}), s = w.useCallback((e) => {
		typeof window < "u" && localStorage.setItem(n, e), o(e);
	}, [n]), c = w.useCallback((e) => {
		let t = document.documentElement, n = e === "system" ? Uc() : e, i = r ? Wc() : null;
		t.classList.remove("light", "dark"), t.classList.add(n), i && i();
	}, [r]);
	w.useEffect(() => {
		if (c(a), a !== "system") return;
		let e = window.matchMedia(zc), t = () => {
			c("system");
		};
		return e.addEventListener("change", t), () => {
			e.removeEventListener("change", t);
		};
	}, [a, c]), w.useEffect(() => {
		let e = (e) => {
			e.repeat || e.metaKey || e.ctrlKey || e.altKey || Gc(e.target) || e.key.toLowerCase() === "d" && o((e) => {
				let t = e === "dark" ? "light" : e === "light" ? "dark" : Uc() === "dark" ? "light" : "dark";
				return localStorage.setItem(n, t), t;
			});
		};
		return window.addEventListener("keydown", e), () => {
			window.removeEventListener("keydown", e);
		};
	}, [n]), w.useEffect(() => {
		let e = (e) => {
			if (e.storageArea === localStorage && e.key === n) {
				if (Hc(e.newValue)) {
					o(e.newValue);
					return;
				}
				o(t);
			}
		};
		return window.addEventListener("storage", e), () => {
			window.removeEventListener("storage", e);
		};
	}, [t, n]);
	let l = w.useMemo(() => ({
		theme: a,
		setTheme: s
	}), [a, s]);
	return /* @__PURE__ */ M(Vc.Provider, {
		...i,
		value: l,
		children: e
	});
}
var qc = () => {
	let e = w.useContext(Vc);
	if (e === void 0) throw Error("useTheme must be used within a ThemeProvider");
	return e;
}, Jc = (...e) => e.filter((e, t, n) => !!e && e.trim() !== "" && n.indexOf(e) === t).join(" ").trim(), Yc = (e) => e.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), Xc = (e) => e.replace(/^([A-Z])|[\s-_]+(\w)/g, (e, t, n) => n ? n.toUpperCase() : t.toLowerCase()), Zc = (e) => {
	let t = Xc(e);
	return t.charAt(0).toUpperCase() + t.slice(1);
}, Qc = {
	xmlns: "http://www.w3.org/2000/svg",
	width: 24,
	height: 24,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2,
	strokeLinecap: "round",
	strokeLinejoin: "round"
}, $c = (e) => {
	for (let t in e) if (t.startsWith("aria-") || t === "role" || t === "title") return !0;
	return !1;
}, el = T(({ color: e = "currentColor", size: t = 24, strokeWidth: n = 2, absoluteStrokeWidth: r, className: i = "", children: a, iconNode: o, ...s }, c) => ee("svg", {
	ref: c,
	...Qc,
	width: t,
	height: t,
	stroke: e,
	strokeWidth: r ? Number(n) * 24 / Number(t) : n,
	className: Jc("lucide", i),
	...!a && !$c(s) && { "aria-hidden": "true" },
	...s
}, [...o.map(([e, t]) => ee(e, t)), ...Array.isArray(a) ? a : [a]])), tl = (e, t) => {
	let n = T(({ className: n, ...r }, i) => ee(el, {
		ref: i,
		iconNode: t,
		className: Jc(`lucide-${Yc(Zc(e))}`, `lucide-${e}`, n),
		...r
	}));
	return n.displayName = Zc(e), n;
};
//#endregion
//#region ../components/dist/index.js
function nl(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function rl(e, t) {
	return (n) => {
		t.setState((t) => ({
			...t,
			[e]: nl(n, t[e])
		}));
	};
}
function il(e) {
	return e instanceof Function;
}
function al(e) {
	return Array.isArray(e) && e.every((e) => typeof e == "number");
}
function ol(e, t) {
	let n = [], r = (e) => {
		e.forEach((e) => {
			n.push(e);
			let i = t(e);
			i != null && i.length && r(i);
		});
	};
	return r(e), n;
}
function K(e, t, n) {
	let r = [], i;
	return (a) => {
		let o;
		n.key && n.debug && (o = Date.now());
		let s = e(a);
		if (!(s.length !== r.length || s.some((e, t) => r[t] !== e))) return i;
		r = s;
		let c;
		if (n.key && n.debug && (c = Date.now()), i = t(...s), n == null || n.onChange == null || n.onChange(i), n.key && n.debug && n != null && n.debug()) {
			let e = Math.round((Date.now() - o) * 100) / 100, t = Math.round((Date.now() - c) * 100) / 100, r = t / 16, i = (e, t) => {
				for (e = String(e); e.length < t;) e = " " + e;
				return e;
			};
			console.info(`%c⏱ ${i(t, 5)} /${i(e, 5)} ms`, `
            font-size: .6rem;
            font-weight: bold;
            color: hsl(${Math.max(0, Math.min(120 - 120 * r, 120))}deg 100% 31%);`, n?.key);
		}
		return i;
	};
}
function q(e, t, n, r) {
	return {
		debug: () => e?.debugAll ?? e[t],
		key: process.env.NODE_ENV === "development" && n,
		onChange: r
	};
}
function sl(e, t, n, r) {
	let i = {
		id: `${t.id}_${n.id}`,
		row: t,
		column: n,
		getValue: () => t.getValue(r),
		renderValue: () => i.getValue() ?? e.options.renderFallbackValue,
		getContext: K(() => [
			e,
			n,
			t,
			i
		], (e, t, n, r) => ({
			table: e,
			column: t,
			row: n,
			cell: r,
			getValue: r.getValue,
			renderValue: r.renderValue
		}), q(e.options, "debugCells", "cell.getContext"))
	};
	return e._features.forEach((r) => {
		r.createCell == null || r.createCell(i, n, t, e);
	}, {}), i;
}
function cl(e, t, n, r) {
	let i = {
		...e._getDefaultColumnDef(),
		...t
	}, a = i.accessorKey, o = i.id ?? (a ? typeof String.prototype.replaceAll == "function" ? a.replaceAll(".", "_") : a.replace(/\./g, "_") : void 0) ?? (typeof i.header == "string" ? i.header : void 0), s;
	if (i.accessorFn ? s = i.accessorFn : a && (s = a.includes(".") ? (e) => {
		let t = e;
		for (let e of a.split(".")) t = t?.[e], process.env.NODE_ENV !== "production" && t === void 0 && console.warn(`"${e}" in deeply nested key "${a}" returned undefined.`);
		return t;
	} : (e) => e[i.accessorKey]), !o) throw process.env.NODE_ENV === "production" ? Error() : Error(i.accessorFn ? "Columns require an id when using an accessorFn" : "Columns require an id when using a non-string header");
	let c = {
		id: `${String(o)}`,
		accessorFn: s,
		parent: r,
		depth: n,
		columnDef: i,
		columns: [],
		getFlatColumns: K(() => [!0], () => [c, ...c.columns?.flatMap((e) => e.getFlatColumns())], q(e.options, "debugColumns", "column.getFlatColumns")),
		getLeafColumns: K(() => [e._getOrderColumnsFn()], (e) => {
			var t;
			return (t = c.columns) != null && t.length ? e(c.columns.flatMap((e) => e.getLeafColumns())) : [c];
		}, q(e.options, "debugColumns", "column.getLeafColumns"))
	};
	for (let t of e._features) t.createColumn == null || t.createColumn(c, e);
	return c;
}
var J = "debugHeaders";
function ll(e, t, n) {
	let r = {
		id: n.id ?? t.id,
		column: t,
		index: n.index,
		isPlaceholder: !!n.isPlaceholder,
		placeholderId: n.placeholderId,
		depth: n.depth,
		subHeaders: [],
		colSpan: 0,
		rowSpan: 0,
		headerGroup: null,
		getLeafHeaders: () => {
			let e = [], t = (n) => {
				n.subHeaders && n.subHeaders.length && n.subHeaders.map(t), e.push(n);
			};
			return t(r), e;
		},
		getContext: () => ({
			table: e,
			header: r,
			column: t
		})
	};
	return e._features.forEach((t) => {
		t.createHeader == null || t.createHeader(r, e);
	}), r;
}
var ul = { createTable: (e) => {
	e.getHeaderGroups = K(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => {
		let a = r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], o = i?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], s = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id)));
		return dl(t, [
			...a,
			...s,
			...o
		], e);
	}, q(e.options, J, "getHeaderGroups")), e.getCenterHeaderGroups = K(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => (n = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id))), dl(t, n, e, "center")), q(e.options, J, "getCenterHeaderGroups")), e.getLeftHeaderGroups = K(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left
	], (t, n, r) => dl(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "left"), q(e.options, J, "getLeftHeaderGroups")), e.getRightHeaderGroups = K(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.right
	], (t, n, r) => dl(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "right"), q(e.options, J, "getRightHeaderGroups")), e.getFooterGroups = K(() => [e.getHeaderGroups()], (e) => [...e].reverse(), q(e.options, J, "getFooterGroups")), e.getLeftFooterGroups = K(() => [e.getLeftHeaderGroups()], (e) => [...e].reverse(), q(e.options, J, "getLeftFooterGroups")), e.getCenterFooterGroups = K(() => [e.getCenterHeaderGroups()], (e) => [...e].reverse(), q(e.options, J, "getCenterFooterGroups")), e.getRightFooterGroups = K(() => [e.getRightHeaderGroups()], (e) => [...e].reverse(), q(e.options, J, "getRightFooterGroups")), e.getFlatHeaders = K(() => [e.getHeaderGroups()], (e) => e.map((e) => e.headers).flat(), q(e.options, J, "getFlatHeaders")), e.getLeftFlatHeaders = K(() => [e.getLeftHeaderGroups()], (e) => e.map((e) => e.headers).flat(), q(e.options, J, "getLeftFlatHeaders")), e.getCenterFlatHeaders = K(() => [e.getCenterHeaderGroups()], (e) => e.map((e) => e.headers).flat(), q(e.options, J, "getCenterFlatHeaders")), e.getRightFlatHeaders = K(() => [e.getRightHeaderGroups()], (e) => e.map((e) => e.headers).flat(), q(e.options, J, "getRightFlatHeaders")), e.getCenterLeafHeaders = K(() => [e.getCenterFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), q(e.options, J, "getCenterLeafHeaders")), e.getLeftLeafHeaders = K(() => [e.getLeftFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), q(e.options, J, "getLeftLeafHeaders")), e.getRightLeafHeaders = K(() => [e.getRightFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), q(e.options, J, "getRightLeafHeaders")), e.getLeafHeaders = K(() => [
		e.getLeftHeaderGroups(),
		e.getCenterHeaderGroups(),
		e.getRightHeaderGroups()
	], (e, t, n) => [
		...e[0]?.headers ?? [],
		...t[0]?.headers ?? [],
		...n[0]?.headers ?? []
	].map((e) => e.getLeafHeaders()).flat(), q(e.options, J, "getLeafHeaders"));
} };
function dl(e, t, n, r) {
	let i = 0, a = function(e, t) {
		t === void 0 && (t = 1), i = Math.max(i, t), e.filter((e) => e.getIsVisible()).forEach((e) => {
			var n;
			(n = e.columns) != null && n.length && a(e.columns, t + 1);
		}, 0);
	};
	a(e);
	let o = [], s = (e, t) => {
		let i = {
			depth: t,
			id: [r, `${t}`].filter(Boolean).join("_"),
			headers: []
		}, a = [];
		e.forEach((e) => {
			let o = [...a].reverse()[0], s = e.column.depth === i.depth, c, l = !1;
			if (s && e.column.parent ? c = e.column.parent : (c = e.column, l = !0), o && o?.column === c) o.subHeaders.push(e);
			else {
				let i = ll(n, c, {
					id: [
						r,
						t,
						c.id,
						e?.id
					].filter(Boolean).join("_"),
					isPlaceholder: l,
					placeholderId: l ? `${a.filter((e) => e.column === c).length}` : void 0,
					depth: t,
					index: a.length
				});
				i.subHeaders.push(e), a.push(i);
			}
			i.headers.push(e), e.headerGroup = i;
		}), o.push(i), t > 0 && s(a, t - 1);
	};
	s(t.map((e, t) => ll(n, e, {
		depth: i,
		index: t
	})), i - 1), o.reverse();
	let c = (e) => e.filter((e) => e.column.getIsVisible()).map((e) => {
		let t = 0, n = 0, r = [0];
		e.subHeaders && e.subHeaders.length ? (r = [], c(e.subHeaders).forEach((e) => {
			let { colSpan: n, rowSpan: i } = e;
			t += n, r.push(i);
		})) : t = 1;
		let i = Math.min(...r);
		return n += i, e.colSpan = t, e.rowSpan = n, {
			colSpan: t,
			rowSpan: n
		};
	});
	return c(o[0]?.headers ?? []), o;
}
var fl = (e, t, n, r, i, a, o) => {
	let s = {
		id: t,
		index: r,
		original: n,
		depth: i,
		parentId: o,
		_valuesCache: {},
		_uniqueValuesCache: {},
		getValue: (t) => {
			if (s._valuesCache.hasOwnProperty(t)) return s._valuesCache[t];
			let n = e.getColumn(t);
			if (n != null && n.accessorFn) return s._valuesCache[t] = n.accessorFn(s.original, r), s._valuesCache[t];
		},
		getUniqueValues: (t) => {
			if (s._uniqueValuesCache.hasOwnProperty(t)) return s._uniqueValuesCache[t];
			let n = e.getColumn(t);
			if (n != null && n.accessorFn) return n.columnDef.getUniqueValues ? (s._uniqueValuesCache[t] = n.columnDef.getUniqueValues(s.original, r), s._uniqueValuesCache[t]) : (s._uniqueValuesCache[t] = [s.getValue(t)], s._uniqueValuesCache[t]);
		},
		renderValue: (t) => s.getValue(t) ?? e.options.renderFallbackValue,
		subRows: a ?? [],
		getLeafRows: () => ol(s.subRows, (e) => e.subRows),
		getParentRow: () => s.parentId ? e.getRow(s.parentId, !0) : void 0,
		getParentRows: () => {
			let e = [], t = s;
			for (;;) {
				let n = t.getParentRow();
				if (!n) break;
				e.push(n), t = n;
			}
			return e.reverse();
		},
		getAllCells: K(() => [e.getAllLeafColumns()], (t) => t.map((t) => sl(e, s, t, t.id)), q(e.options, "debugRows", "getAllCells")),
		_getAllCellsByColumnId: K(() => [s.getAllCells()], (e) => e.reduce((e, t) => (e[t.column.id] = t, e), {}), q(e.options, "debugRows", "getAllCellsByColumnId"))
	};
	for (let t = 0; t < e._features.length; t++) {
		let n = e._features[t];
		n == null || n.createRow == null || n.createRow(s, e);
	}
	return s;
}, pl = { createColumn: (e, t) => {
	e._getFacetedRowModel = t.options.getFacetedRowModel && t.options.getFacetedRowModel(t, e.id), e.getFacetedRowModel = () => e._getFacetedRowModel ? e._getFacetedRowModel() : t.getPreFilteredRowModel(), e._getFacetedUniqueValues = t.options.getFacetedUniqueValues && t.options.getFacetedUniqueValues(t, e.id), e.getFacetedUniqueValues = () => e._getFacetedUniqueValues ? e._getFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getFacetedMinMaxValues = t.options.getFacetedMinMaxValues && t.options.getFacetedMinMaxValues(t, e.id), e.getFacetedMinMaxValues = () => {
		if (e._getFacetedMinMaxValues) return e._getFacetedMinMaxValues();
	};
} }, ml = (e, t, n) => {
	var r, i;
	let a = n == null || (r = n.toString()) == null ? void 0 : r.toLowerCase();
	return !!(!((i = e.getValue(t)) == null || (i = i.toString()) == null || (i = i.toLowerCase()) == null) && i.includes(a));
};
ml.autoRemove = (e) => wl(e);
var hl = (e, t, n) => {
	var r;
	return !!(!((r = e.getValue(t)) == null || (r = r.toString()) == null) && r.includes(n));
};
hl.autoRemove = (e) => wl(e);
var gl = (e, t, n) => {
	var r;
	return ((r = e.getValue(t)) == null || (r = r.toString()) == null ? void 0 : r.toLowerCase()) === n?.toLowerCase();
};
gl.autoRemove = (e) => wl(e);
var _l = (e, t, n) => e.getValue(t)?.includes(n);
_l.autoRemove = (e) => wl(e);
var vl = (e, t, n) => !n.some((n) => {
	var r;
	return !((r = e.getValue(t)) != null && r.includes(n));
});
vl.autoRemove = (e) => wl(e) || !(e != null && e.length);
var yl = (e, t, n) => n.some((n) => e.getValue(t)?.includes(n));
yl.autoRemove = (e) => wl(e) || !(e != null && e.length);
var bl = (e, t, n) => e.getValue(t) === n;
bl.autoRemove = (e) => wl(e);
var xl = (e, t, n) => e.getValue(t) == n;
xl.autoRemove = (e) => wl(e);
var Sl = (e, t, n) => {
	let [r, i] = n, a = e.getValue(t);
	return a >= r && a <= i;
};
Sl.resolveFilterValue = (e) => {
	let [t, n] = e, r = typeof t == "number" ? t : parseFloat(t), i = typeof n == "number" ? n : parseFloat(n), a = t === null || Number.isNaN(r) ? -Infinity : r, o = n === null || Number.isNaN(i) ? Infinity : i;
	if (a > o) {
		let e = a;
		a = o, o = e;
	}
	return [a, o];
}, Sl.autoRemove = (e) => wl(e) || wl(e[0]) && wl(e[1]);
var Cl = {
	includesString: ml,
	includesStringSensitive: hl,
	equalsString: gl,
	arrIncludes: _l,
	arrIncludesAll: vl,
	arrIncludesSome: yl,
	equals: bl,
	weakEquals: xl,
	inNumberRange: Sl
};
function wl(e) {
	return e == null || e === "";
}
var Tl = {
	getDefaultColumnDef: () => ({ filterFn: "auto" }),
	getInitialState: (e) => ({
		columnFilters: [],
		...e
	}),
	getDefaultOptions: (e) => ({
		onColumnFiltersChange: rl("columnFilters", e),
		filterFromLeafRows: !1,
		maxLeafRowFilterDepth: 100
	}),
	createColumn: (e, t) => {
		e.getAutoFilterFn = () => {
			let n = t.getCoreRowModel().flatRows[0]?.getValue(e.id);
			return typeof n == "string" ? Cl.includesString : typeof n == "number" ? Cl.inNumberRange : typeof n == "boolean" || typeof n == "object" && n ? Cl.equals : Array.isArray(n) ? Cl.arrIncludes : Cl.weakEquals;
		}, e.getFilterFn = () => il(e.columnDef.filterFn) ? e.columnDef.filterFn : e.columnDef.filterFn === "auto" ? e.getAutoFilterFn() : t.options.filterFns?.[e.columnDef.filterFn] ?? Cl[e.columnDef.filterFn], e.getCanFilter = () => (e.columnDef.enableColumnFilter ?? !0) && (t.options.enableColumnFilters ?? !0) && (t.options.enableFilters ?? !0) && !!e.accessorFn, e.getIsFiltered = () => e.getFilterIndex() > -1, e.getFilterValue = () => {
			var n;
			return (n = t.getState().columnFilters) == null || (n = n.find((t) => t.id === e.id)) == null ? void 0 : n.value;
		}, e.getFilterIndex = () => t.getState().columnFilters?.findIndex((t) => t.id === e.id) ?? -1, e.setFilterValue = (n) => {
			t.setColumnFilters((t) => {
				let r = e.getFilterFn(), i = t?.find((t) => t.id === e.id), a = nl(n, i ? i.value : void 0);
				if (El(r, a, e)) return t?.filter((t) => t.id !== e.id) ?? [];
				let o = {
					id: e.id,
					value: a
				};
				return i ? t?.map((t) => t.id === e.id ? o : t) ?? [] : t != null && t.length ? [...t, o] : [o];
			});
		};
	},
	createRow: (e, t) => {
		e.columnFilters = {}, e.columnFiltersMeta = {};
	},
	createTable: (e) => {
		e.setColumnFilters = (t) => {
			let n = e.getAllLeafColumns();
			e.options.onColumnFiltersChange == null || e.options.onColumnFiltersChange((e) => nl(t, e)?.filter((e) => {
				let t = n.find((t) => t.id === e.id);
				return !(t && El(t.getFilterFn(), e.value, t));
			}));
		}, e.resetColumnFilters = (t) => {
			e.setColumnFilters(t ? [] : e.initialState?.columnFilters ?? []);
		}, e.getPreFilteredRowModel = () => e.getCoreRowModel(), e.getFilteredRowModel = () => (!e._getFilteredRowModel && e.options.getFilteredRowModel && (e._getFilteredRowModel = e.options.getFilteredRowModel(e)), e.options.manualFiltering || !e._getFilteredRowModel ? e.getPreFilteredRowModel() : e._getFilteredRowModel());
	}
};
function El(e, t, n) {
	return (e && e.autoRemove ? e.autoRemove(t, n) : !1) || t === void 0 || typeof t == "string" && !t;
}
var Dl = {
	sum: (e, t, n) => n.reduce((t, n) => {
		let r = n.getValue(e);
		return t + (typeof r == "number" ? r : 0);
	}, 0),
	min: (e, t, n) => {
		let r;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r > n || r === void 0 && n >= n) && (r = n);
		}), r;
	},
	max: (e, t, n) => {
		let r;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r < n || r === void 0 && n >= n) && (r = n);
		}), r;
	},
	extent: (e, t, n) => {
		let r, i;
		return n.forEach((t) => {
			let n = t.getValue(e);
			n != null && (r === void 0 ? n >= n && (r = i = n) : (r > n && (r = n), i < n && (i = n)));
		}), [r, i];
	},
	mean: (e, t) => {
		let n = 0, r = 0;
		if (t.forEach((t) => {
			let i = t.getValue(e);
			i != null && (i = +i) >= i && (++n, r += i);
		}), n) return r / n;
	},
	median: (e, t) => {
		if (!t.length) return;
		let n = t.map((t) => t.getValue(e));
		if (!al(n)) return;
		if (n.length === 1) return n[0];
		let r = Math.floor(n.length / 2), i = n.sort((e, t) => e - t);
		return n.length % 2 == 0 ? (i[r - 1] + i[r]) / 2 : i[r];
	},
	unique: (e, t) => Array.from(new Set(t.map((t) => t.getValue(e))).values()),
	uniqueCount: (e, t) => new Set(t.map((t) => t.getValue(e))).size,
	count: (e, t) => t.length
}, Ol = {
	getDefaultColumnDef: () => ({
		aggregatedCell: (e) => {
			var t;
			return ((t = e.getValue()) == null || t.toString == null ? void 0 : t.toString()) ?? null;
		},
		aggregationFn: "auto"
	}),
	getInitialState: (e) => ({
		grouping: [],
		...e
	}),
	getDefaultOptions: (e) => ({
		onGroupingChange: rl("grouping", e),
		groupedColumnMode: "reorder"
	}),
	createColumn: (e, t) => {
		e.toggleGrouping = () => {
			t.setGrouping((t) => t != null && t.includes(e.id) ? t.filter((t) => t !== e.id) : [...t ?? [], e.id]);
		}, e.getCanGroup = () => (e.columnDef.enableGrouping ?? !0) && (t.options.enableGrouping ?? !0) && (!!e.accessorFn || !!e.columnDef.getGroupingValue), e.getIsGrouped = () => t.getState().grouping?.includes(e.id), e.getGroupedIndex = () => t.getState().grouping?.indexOf(e.id), e.getToggleGroupingHandler = () => {
			let t = e.getCanGroup();
			return () => {
				t && e.toggleGrouping();
			};
		}, e.getAutoAggregationFn = () => {
			let n = t.getCoreRowModel().flatRows[0]?.getValue(e.id);
			if (typeof n == "number") return Dl.sum;
			if (Object.prototype.toString.call(n) === "[object Date]") return Dl.extent;
		}, e.getAggregationFn = () => {
			if (!e) throw Error();
			return il(e.columnDef.aggregationFn) ? e.columnDef.aggregationFn : e.columnDef.aggregationFn === "auto" ? e.getAutoAggregationFn() : t.options.aggregationFns?.[e.columnDef.aggregationFn] ?? Dl[e.columnDef.aggregationFn];
		};
	},
	createTable: (e) => {
		e.setGrouping = (t) => e.options.onGroupingChange == null ? void 0 : e.options.onGroupingChange(t), e.resetGrouping = (t) => {
			e.setGrouping(t ? [] : e.initialState?.grouping ?? []);
		}, e.getPreGroupedRowModel = () => e.getFilteredRowModel(), e.getGroupedRowModel = () => (!e._getGroupedRowModel && e.options.getGroupedRowModel && (e._getGroupedRowModel = e.options.getGroupedRowModel(e)), e.options.manualGrouping || !e._getGroupedRowModel ? e.getPreGroupedRowModel() : e._getGroupedRowModel());
	},
	createRow: (e, t) => {
		e.getIsGrouped = () => !!e.groupingColumnId, e.getGroupingValue = (n) => {
			if (e._groupingValuesCache.hasOwnProperty(n)) return e._groupingValuesCache[n];
			let r = t.getColumn(n);
			return r != null && r.columnDef.getGroupingValue ? (e._groupingValuesCache[n] = r.columnDef.getGroupingValue(e.original), e._groupingValuesCache[n]) : e.getValue(n);
		}, e._groupingValuesCache = {};
	},
	createCell: (e, t, n, r) => {
		e.getIsGrouped = () => t.getIsGrouped() && t.id === n.groupingColumnId, e.getIsPlaceholder = () => !e.getIsGrouped() && t.getIsGrouped(), e.getIsAggregated = () => {
			var t;
			return !e.getIsGrouped() && !e.getIsPlaceholder() && !!((t = n.subRows) != null && t.length);
		};
	}
};
function kl(e, t, n) {
	if (!(t != null && t.length) || !n) return e;
	let r = e.filter((e) => !t.includes(e.id));
	return n === "remove" ? r : [...t.map((t) => e.find((e) => e.id === t)).filter(Boolean), ...r];
}
var Al = {
	getInitialState: (e) => ({
		columnOrder: [],
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnOrderChange: rl("columnOrder", e) }),
	createColumn: (e, t) => {
		e.getIndex = K((e) => [Vl(t, e)], (t) => t.findIndex((t) => t.id === e.id), q(t.options, "debugColumns", "getIndex")), e.getIsFirstColumn = (n) => Vl(t, n)[0]?.id === e.id, e.getIsLastColumn = (n) => {
			let r = Vl(t, n);
			return r[r.length - 1]?.id === e.id;
		};
	},
	createTable: (e) => {
		e.setColumnOrder = (t) => e.options.onColumnOrderChange == null ? void 0 : e.options.onColumnOrderChange(t), e.resetColumnOrder = (t) => {
			e.setColumnOrder(t ? [] : e.initialState.columnOrder ?? []);
		}, e._getOrderColumnsFn = K(() => [
			e.getState().columnOrder,
			e.getState().grouping,
			e.options.groupedColumnMode
		], (e, t, n) => (r) => {
			let i = [];
			if (!(e != null && e.length)) i = r;
			else {
				let t = [...e], n = [...r];
				for (; n.length && t.length;) {
					let e = t.shift(), r = n.findIndex((t) => t.id === e);
					r > -1 && i.push(n.splice(r, 1)[0]);
				}
				i = [...i, ...n];
			}
			return kl(i, t, n);
		}, q(e.options, "debugTable", "_getOrderColumnsFn"));
	}
}, jl = () => ({
	left: [],
	right: []
}), Ml = {
	getInitialState: (e) => ({
		columnPinning: jl(),
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnPinningChange: rl("columnPinning", e) }),
	createColumn: (e, t) => {
		e.pin = (n) => {
			let r = e.getLeafColumns().map((e) => e.id).filter(Boolean);
			t.setColumnPinning((e) => n === "right" ? {
				left: (e?.left ?? []).filter((e) => !(r != null && r.includes(e))),
				right: [...(e?.right ?? []).filter((e) => !(r != null && r.includes(e))), ...r]
			} : n === "left" ? {
				left: [...(e?.left ?? []).filter((e) => !(r != null && r.includes(e))), ...r],
				right: (e?.right ?? []).filter((e) => !(r != null && r.includes(e)))
			} : {
				left: (e?.left ?? []).filter((e) => !(r != null && r.includes(e))),
				right: (e?.right ?? []).filter((e) => !(r != null && r.includes(e)))
			});
		}, e.getCanPin = () => e.getLeafColumns().some((e) => (e.columnDef.enablePinning ?? !0) && (t.options.enableColumnPinning ?? t.options.enablePinning ?? !0)), e.getIsPinned = () => {
			let n = e.getLeafColumns().map((e) => e.id), { left: r, right: i } = t.getState().columnPinning, a = n.some((e) => r?.includes(e)), o = n.some((e) => i?.includes(e));
			return a ? "left" : o ? "right" : !1;
		}, e.getPinnedIndex = () => {
			var n;
			let r = e.getIsPinned();
			return r ? ((n = t.getState().columnPinning) == null || (n = n[r]) == null ? void 0 : n.indexOf(e.id)) ?? -1 : 0;
		};
	},
	createRow: (e, t) => {
		e.getCenterVisibleCells = K(() => [
			e._getAllVisibleCells(),
			t.getState().columnPinning.left,
			t.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.column.id));
		}, q(t.options, "debugRows", "getCenterVisibleCells")), e.getLeftVisibleCells = K(() => [e._getAllVisibleCells(), t.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "left"
		})), q(t.options, "debugRows", "getLeftVisibleCells")), e.getRightVisibleCells = K(() => [e._getAllVisibleCells(), t.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "right"
		})), q(t.options, "debugRows", "getRightVisibleCells"));
	},
	createTable: (e) => {
		e.setColumnPinning = (t) => e.options.onColumnPinningChange == null ? void 0 : e.options.onColumnPinningChange(t), e.resetColumnPinning = (t) => e.setColumnPinning(t ? jl() : e.initialState?.columnPinning ?? jl()), e.getIsSomeColumnsPinned = (t) => {
			let n = e.getState().columnPinning;
			return t ? !!n[t]?.length : !!(n.left?.length || n.right?.length);
		}, e.getLeftLeafColumns = K(() => [e.getAllLeafColumns(), e.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), q(e.options, "debugColumns", "getLeftLeafColumns")), e.getRightLeafColumns = K(() => [e.getAllLeafColumns(), e.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), q(e.options, "debugColumns", "getRightLeafColumns")), e.getCenterLeafColumns = K(() => [
			e.getAllLeafColumns(),
			e.getState().columnPinning.left,
			e.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.id));
		}, q(e.options, "debugColumns", "getCenterLeafColumns"));
	}
};
function Nl(e) {
	return e || (typeof document < "u" ? document : null);
}
var Pl = {
	size: 150,
	minSize: 20,
	maxSize: 2 ** 53 - 1
}, Fl = () => ({
	startOffset: null,
	startSize: null,
	deltaOffset: null,
	deltaPercentage: null,
	isResizingColumn: !1,
	columnSizingStart: []
}), Il = {
	getDefaultColumnDef: () => Pl,
	getInitialState: (e) => ({
		columnSizing: {},
		columnSizingInfo: Fl(),
		...e
	}),
	getDefaultOptions: (e) => ({
		columnResizeMode: "onEnd",
		columnResizeDirection: "ltr",
		onColumnSizingChange: rl("columnSizing", e),
		onColumnSizingInfoChange: rl("columnSizingInfo", e)
	}),
	createColumn: (e, t) => {
		e.getSize = () => {
			let n = t.getState().columnSizing[e.id];
			return Math.min(Math.max(e.columnDef.minSize ?? Pl.minSize, n ?? e.columnDef.size ?? Pl.size), e.columnDef.maxSize ?? Pl.maxSize);
		}, e.getStart = K((e) => [
			e,
			Vl(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(0, e.getIndex(t)).reduce((e, t) => e + t.getSize(), 0), q(t.options, "debugColumns", "getStart")), e.getAfter = K((e) => [
			e,
			Vl(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(e.getIndex(t) + 1).reduce((e, t) => e + t.getSize(), 0), q(t.options, "debugColumns", "getAfter")), e.resetSize = () => {
			t.setColumnSizing((t) => {
				let { [e.id]: n, ...r } = t;
				return r;
			});
		}, e.getCanResize = () => (e.columnDef.enableResizing ?? !0) && (t.options.enableColumnResizing ?? !0), e.getIsResizing = () => t.getState().columnSizingInfo.isResizingColumn === e.id;
	},
	createHeader: (e, t) => {
		e.getSize = () => {
			let t = 0, n = (e) => {
				e.subHeaders.length ? e.subHeaders.forEach(n) : t += e.column.getSize() ?? 0;
			};
			return n(e), t;
		}, e.getStart = () => {
			if (e.index > 0) {
				let t = e.headerGroup.headers[e.index - 1];
				return t.getStart() + t.getSize();
			}
			return 0;
		}, e.getResizeHandler = (n) => {
			let r = t.getColumn(e.column.id), i = r?.getCanResize();
			return (a) => {
				if (!r || !i || (a.persist == null || a.persist(), zl(a) && a.touches && a.touches.length > 1)) return;
				let o = e.getSize(), s = e ? e.getLeafHeaders().map((e) => [e.column.id, e.column.getSize()]) : [[r.id, r.getSize()]], c = zl(a) ? Math.round(a.touches[0].clientX) : a.clientX, l = {}, u = (e, n) => {
					typeof n == "number" && (t.setColumnSizingInfo((e) => {
						let r = t.options.columnResizeDirection === "rtl" ? -1 : 1, i = (n - (e?.startOffset ?? 0)) * r, a = Math.max(i / (e?.startSize ?? 0), -.999999);
						return e.columnSizingStart.forEach((e) => {
							let [t, n] = e;
							l[t] = Math.round(Math.max(n + n * a, 0) * 100) / 100;
						}), {
							...e,
							deltaOffset: i,
							deltaPercentage: a
						};
					}), (t.options.columnResizeMode === "onChange" || e === "end") && t.setColumnSizing((e) => ({
						...e,
						...l
					})));
				}, d = (e) => u("move", e), f = (e) => {
					u("end", e), t.setColumnSizingInfo((e) => ({
						...e,
						isResizingColumn: !1,
						startOffset: null,
						startSize: null,
						deltaOffset: null,
						deltaPercentage: null,
						columnSizingStart: []
					}));
				}, p = Nl(n), m = {
					moveHandler: (e) => d(e.clientX),
					upHandler: (e) => {
						p?.removeEventListener("mousemove", m.moveHandler), p?.removeEventListener("mouseup", m.upHandler), f(e.clientX);
					}
				}, h = {
					moveHandler: (e) => (e.cancelable && (e.preventDefault(), e.stopPropagation()), d(e.touches[0].clientX), !1),
					upHandler: (e) => {
						p?.removeEventListener("touchmove", h.moveHandler), p?.removeEventListener("touchend", h.upHandler), e.cancelable && (e.preventDefault(), e.stopPropagation()), f(e.touches[0]?.clientX);
					}
				}, g = Rl() ? { passive: !1 } : !1;
				zl(a) ? (p?.addEventListener("touchmove", h.moveHandler, g), p?.addEventListener("touchend", h.upHandler, g)) : (p?.addEventListener("mousemove", m.moveHandler, g), p?.addEventListener("mouseup", m.upHandler, g)), t.setColumnSizingInfo((e) => ({
					...e,
					startOffset: c,
					startSize: o,
					deltaOffset: 0,
					deltaPercentage: 0,
					columnSizingStart: s,
					isResizingColumn: r.id
				}));
			};
		};
	},
	createTable: (e) => {
		e.setColumnSizing = (t) => e.options.onColumnSizingChange == null ? void 0 : e.options.onColumnSizingChange(t), e.setColumnSizingInfo = (t) => e.options.onColumnSizingInfoChange == null ? void 0 : e.options.onColumnSizingInfoChange(t), e.resetColumnSizing = (t) => {
			e.setColumnSizing(t ? {} : e.initialState.columnSizing ?? {});
		}, e.resetHeaderSizeInfo = (t) => {
			e.setColumnSizingInfo(t ? Fl() : e.initialState.columnSizingInfo ?? Fl());
		}, e.getTotalSize = () => e.getHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getLeftTotalSize = () => e.getLeftHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getCenterTotalSize = () => e.getCenterHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getRightTotalSize = () => e.getRightHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0;
	}
}, Ll = null;
function Rl() {
	if (typeof Ll == "boolean") return Ll;
	let e = !1;
	try {
		let t = { get passive() {
			return e = !0, !1;
		} }, n = () => {};
		window.addEventListener("test", n, t), window.removeEventListener("test", n);
	} catch {
		e = !1;
	}
	return Ll = e, Ll;
}
function zl(e) {
	return e.type === "touchstart";
}
var Bl = {
	getInitialState: (e) => ({
		columnVisibility: {},
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnVisibilityChange: rl("columnVisibility", e) }),
	createColumn: (e, t) => {
		e.toggleVisibility = (n) => {
			e.getCanHide() && t.setColumnVisibility((t) => ({
				...t,
				[e.id]: n ?? !e.getIsVisible()
			}));
		}, e.getIsVisible = () => {
			let n = e.columns;
			return (n.length ? n.some((e) => e.getIsVisible()) : t.getState().columnVisibility?.[e.id]) ?? !0;
		}, e.getCanHide = () => (e.columnDef.enableHiding ?? !0) && (t.options.enableHiding ?? !0), e.getToggleVisibilityHandler = () => (t) => {
			e.toggleVisibility == null || e.toggleVisibility(t.target.checked);
		};
	},
	createRow: (e, t) => {
		e._getAllVisibleCells = K(() => [e.getAllCells(), t.getState().columnVisibility], (e) => e.filter((e) => e.column.getIsVisible()), q(t.options, "debugRows", "_getAllVisibleCells")), e.getVisibleCells = K(() => [
			e.getLeftVisibleCells(),
			e.getCenterVisibleCells(),
			e.getRightVisibleCells()
		], (e, t, n) => [
			...e,
			...t,
			...n
		], q(t.options, "debugRows", "getVisibleCells"));
	},
	createTable: (e) => {
		let t = (t, n) => K(() => [n(), n().filter((e) => e.getIsVisible()).map((e) => e.id).join("_")], (e) => e.filter((e) => e.getIsVisible == null ? void 0 : e.getIsVisible()), q(e.options, "debugColumns", t));
		e.getVisibleFlatColumns = t("getVisibleFlatColumns", () => e.getAllFlatColumns()), e.getVisibleLeafColumns = t("getVisibleLeafColumns", () => e.getAllLeafColumns()), e.getLeftVisibleLeafColumns = t("getLeftVisibleLeafColumns", () => e.getLeftLeafColumns()), e.getRightVisibleLeafColumns = t("getRightVisibleLeafColumns", () => e.getRightLeafColumns()), e.getCenterVisibleLeafColumns = t("getCenterVisibleLeafColumns", () => e.getCenterLeafColumns()), e.setColumnVisibility = (t) => e.options.onColumnVisibilityChange == null ? void 0 : e.options.onColumnVisibilityChange(t), e.resetColumnVisibility = (t) => {
			e.setColumnVisibility(t ? {} : e.initialState.columnVisibility ?? {});
		}, e.toggleAllColumnsVisible = (t) => {
			t ??= !e.getIsAllColumnsVisible(), e.setColumnVisibility(e.getAllLeafColumns().reduce((e, n) => ({
				...e,
				[n.id]: t || !(n.getCanHide != null && n.getCanHide())
			}), {}));
		}, e.getIsAllColumnsVisible = () => !e.getAllLeafColumns().some((e) => !(e.getIsVisible != null && e.getIsVisible())), e.getIsSomeColumnsVisible = () => e.getAllLeafColumns().some((e) => e.getIsVisible == null ? void 0 : e.getIsVisible()), e.getToggleAllColumnsVisibilityHandler = () => (t) => {
			e.toggleAllColumnsVisible(t.target?.checked);
		};
	}
};
function Vl(e, t) {
	return t ? t === "center" ? e.getCenterVisibleLeafColumns() : t === "left" ? e.getLeftVisibleLeafColumns() : e.getRightVisibleLeafColumns() : e.getVisibleLeafColumns();
}
var Hl = { createTable: (e) => {
	e._getGlobalFacetedRowModel = e.options.getFacetedRowModel && e.options.getFacetedRowModel(e, "__global__"), e.getGlobalFacetedRowModel = () => e.options.manualFiltering || !e._getGlobalFacetedRowModel ? e.getPreFilteredRowModel() : e._getGlobalFacetedRowModel(), e._getGlobalFacetedUniqueValues = e.options.getFacetedUniqueValues && e.options.getFacetedUniqueValues(e, "__global__"), e.getGlobalFacetedUniqueValues = () => e._getGlobalFacetedUniqueValues ? e._getGlobalFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getGlobalFacetedMinMaxValues = e.options.getFacetedMinMaxValues && e.options.getFacetedMinMaxValues(e, "__global__"), e.getGlobalFacetedMinMaxValues = () => {
		if (e._getGlobalFacetedMinMaxValues) return e._getGlobalFacetedMinMaxValues();
	};
} }, Ul = {
	getInitialState: (e) => ({
		globalFilter: void 0,
		...e
	}),
	getDefaultOptions: (e) => ({
		onGlobalFilterChange: rl("globalFilter", e),
		globalFilterFn: "auto",
		getColumnCanGlobalFilter: (t) => {
			var n;
			let r = (n = e.getCoreRowModel().flatRows[0]) == null || (n = n._getAllCellsByColumnId()[t.id]) == null ? void 0 : n.getValue();
			return typeof r == "string" || typeof r == "number";
		}
	}),
	createColumn: (e, t) => {
		e.getCanGlobalFilter = () => (e.columnDef.enableGlobalFilter ?? !0) && (t.options.enableGlobalFilter ?? !0) && (t.options.enableFilters ?? !0) && ((t.options.getColumnCanGlobalFilter == null ? void 0 : t.options.getColumnCanGlobalFilter(e)) ?? !0) && !!e.accessorFn;
	},
	createTable: (e) => {
		e.getGlobalAutoFilterFn = () => Cl.includesString, e.getGlobalFilterFn = () => {
			let { globalFilterFn: t } = e.options;
			return il(t) ? t : t === "auto" ? e.getGlobalAutoFilterFn() : e.options.filterFns?.[t] ?? Cl[t];
		}, e.setGlobalFilter = (t) => {
			e.options.onGlobalFilterChange == null || e.options.onGlobalFilterChange(t);
		}, e.resetGlobalFilter = (t) => {
			e.setGlobalFilter(t ? void 0 : e.initialState.globalFilter);
		};
	}
}, Wl = {
	getInitialState: (e) => ({
		expanded: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onExpandedChange: rl("expanded", e),
		paginateExpandedRows: !0
	}),
	createTable: (e) => {
		let t = !1, n = !1;
		e._autoResetExpanded = () => {
			if (!t) {
				e._queue(() => {
					t = !0;
				});
				return;
			}
			if (e.options.autoResetAll ?? e.options.autoResetExpanded ?? !e.options.manualExpanding) {
				if (n) return;
				n = !0, e._queue(() => {
					e.resetExpanded(), n = !1;
				});
			}
		}, e.setExpanded = (t) => e.options.onExpandedChange == null ? void 0 : e.options.onExpandedChange(t), e.toggleAllRowsExpanded = (t) => {
			t ?? !e.getIsAllRowsExpanded() ? e.setExpanded(!0) : e.setExpanded({});
		}, e.resetExpanded = (t) => {
			e.setExpanded(t ? {} : e.initialState?.expanded ?? {});
		}, e.getCanSomeRowsExpand = () => e.getPrePaginationRowModel().flatRows.some((e) => e.getCanExpand()), e.getToggleAllRowsExpandedHandler = () => (t) => {
			t.persist == null || t.persist(), e.toggleAllRowsExpanded();
		}, e.getIsSomeRowsExpanded = () => {
			let t = e.getState().expanded;
			return t === !0 || Object.values(t).some(Boolean);
		}, e.getIsAllRowsExpanded = () => {
			let t = e.getState().expanded;
			return typeof t == "boolean" ? t === !0 : !(!Object.keys(t).length || e.getRowModel().flatRows.some((e) => !e.getIsExpanded()));
		}, e.getExpandedDepth = () => {
			let t = 0;
			return (e.getState().expanded === !0 ? Object.keys(e.getRowModel().rowsById) : Object.keys(e.getState().expanded)).forEach((e) => {
				let n = e.split(".");
				t = Math.max(t, n.length);
			}), t;
		}, e.getPreExpandedRowModel = () => e.getSortedRowModel(), e.getExpandedRowModel = () => (!e._getExpandedRowModel && e.options.getExpandedRowModel && (e._getExpandedRowModel = e.options.getExpandedRowModel(e)), e.options.manualExpanding || !e._getExpandedRowModel ? e.getPreExpandedRowModel() : e._getExpandedRowModel());
	},
	createRow: (e, t) => {
		e.toggleExpanded = (n) => {
			t.setExpanded((r) => {
				let i = r === !0 ? !0 : !!(r != null && r[e.id]), a = {};
				if (r === !0 ? Object.keys(t.getRowModel().rowsById).forEach((e) => {
					a[e] = !0;
				}) : a = r, n ??= !i, !i && n) return {
					...a,
					[e.id]: !0
				};
				if (i && !n) {
					let { [e.id]: t, ...n } = a;
					return n;
				}
				return r;
			});
		}, e.getIsExpanded = () => {
			let n = t.getState().expanded;
			return !!((t.options.getIsRowExpanded == null ? void 0 : t.options.getIsRowExpanded(e)) ?? (n === !0 || n?.[e.id]));
		}, e.getCanExpand = () => {
			var n;
			return (t.options.getRowCanExpand == null ? void 0 : t.options.getRowCanExpand(e)) ?? ((t.options.enableExpanding ?? !0) && !!((n = e.subRows) != null && n.length));
		}, e.getIsAllParentsExpanded = () => {
			let n = !0, r = e;
			for (; n && r.parentId;) r = t.getRow(r.parentId, !0), n = r.getIsExpanded();
			return n;
		}, e.getToggleExpandedHandler = () => {
			let t = e.getCanExpand();
			return () => {
				t && e.toggleExpanded();
			};
		};
	}
}, Gl = 0, Kl = 10, ql = () => ({
	pageIndex: Gl,
	pageSize: Kl
}), Jl = {
	getInitialState: (e) => ({
		...e,
		pagination: {
			...ql(),
			...e?.pagination
		}
	}),
	getDefaultOptions: (e) => ({ onPaginationChange: rl("pagination", e) }),
	createTable: (e) => {
		let t = !1, n = !1;
		e._autoResetPageIndex = () => {
			if (!t) {
				e._queue(() => {
					t = !0;
				});
				return;
			}
			if (e.options.autoResetAll ?? e.options.autoResetPageIndex ?? !e.options.manualPagination) {
				if (n) return;
				n = !0, e._queue(() => {
					e.resetPageIndex(), n = !1;
				});
			}
		}, e.setPagination = (t) => e.options.onPaginationChange == null ? void 0 : e.options.onPaginationChange((e) => nl(t, e)), e.resetPagination = (t) => {
			e.setPagination(t ? ql() : e.initialState.pagination ?? ql());
		}, e.setPageIndex = (t) => {
			e.setPagination((n) => {
				let r = nl(t, n.pageIndex), i = e.options.pageCount === void 0 || e.options.pageCount === -1 ? 2 ** 53 - 1 : e.options.pageCount - 1;
				return r = Math.max(0, Math.min(r, i)), {
					...n,
					pageIndex: r
				};
			});
		}, e.resetPageIndex = (t) => {
			var n;
			e.setPageIndex(t ? Gl : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageIndex) ?? Gl);
		}, e.resetPageSize = (t) => {
			var n;
			e.setPageSize(t ? Kl : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageSize) ?? Kl);
		}, e.setPageSize = (t) => {
			e.setPagination((e) => {
				let n = Math.max(1, nl(t, e.pageSize)), r = e.pageSize * e.pageIndex, i = Math.floor(r / n);
				return {
					...e,
					pageIndex: i,
					pageSize: n
				};
			});
		}, e.setPageCount = (t) => e.setPagination((n) => {
			let r = nl(t, e.options.pageCount ?? -1);
			return typeof r == "number" && (r = Math.max(-1, r)), {
				...n,
				pageCount: r
			};
		}), e.getPageOptions = K(() => [e.getPageCount()], (e) => {
			let t = [];
			return e && e > 0 && (t = [...Array(e)].fill(null).map((e, t) => t)), t;
		}, q(e.options, "debugTable", "getPageOptions")), e.getCanPreviousPage = () => e.getState().pagination.pageIndex > 0, e.getCanNextPage = () => {
			let { pageIndex: t } = e.getState().pagination, n = e.getPageCount();
			return n === -1 ? !0 : n === 0 ? !1 : t < n - 1;
		}, e.previousPage = () => e.setPageIndex((e) => e - 1), e.nextPage = () => e.setPageIndex((e) => e + 1), e.firstPage = () => e.setPageIndex(0), e.lastPage = () => e.setPageIndex(e.getPageCount() - 1), e.getPrePaginationRowModel = () => e.getExpandedRowModel(), e.getPaginationRowModel = () => (!e._getPaginationRowModel && e.options.getPaginationRowModel && (e._getPaginationRowModel = e.options.getPaginationRowModel(e)), e.options.manualPagination || !e._getPaginationRowModel ? e.getPrePaginationRowModel() : e._getPaginationRowModel()), e.getPageCount = () => e.options.pageCount ?? Math.ceil(e.getRowCount() / e.getState().pagination.pageSize), e.getRowCount = () => e.options.rowCount ?? e.getPrePaginationRowModel().rows.length;
	}
}, Yl = () => ({
	top: [],
	bottom: []
}), Xl = {
	getInitialState: (e) => ({
		rowPinning: Yl(),
		...e
	}),
	getDefaultOptions: (e) => ({ onRowPinningChange: rl("rowPinning", e) }),
	createRow: (e, t) => {
		e.pin = (n, r, i) => {
			let a = r ? e.getLeafRows().map((e) => {
				let { id: t } = e;
				return t;
			}) : [], o = i ? e.getParentRows().map((e) => {
				let { id: t } = e;
				return t;
			}) : [], s = /* @__PURE__ */ new Set([
				...o,
				e.id,
				...a
			]);
			t.setRowPinning((e) => n === "bottom" ? {
				top: (e?.top ?? []).filter((e) => !(s != null && s.has(e))),
				bottom: [...(e?.bottom ?? []).filter((e) => !(s != null && s.has(e))), ...Array.from(s)]
			} : n === "top" ? {
				top: [...(e?.top ?? []).filter((e) => !(s != null && s.has(e))), ...Array.from(s)],
				bottom: (e?.bottom ?? []).filter((e) => !(s != null && s.has(e)))
			} : {
				top: (e?.top ?? []).filter((e) => !(s != null && s.has(e))),
				bottom: (e?.bottom ?? []).filter((e) => !(s != null && s.has(e)))
			});
		}, e.getCanPin = () => {
			let { enableRowPinning: n, enablePinning: r } = t.options;
			return typeof n == "function" ? n(e) : n ?? r ?? !0;
		}, e.getIsPinned = () => {
			let n = [e.id], { top: r, bottom: i } = t.getState().rowPinning, a = n.some((e) => r?.includes(e)), o = n.some((e) => i?.includes(e));
			return a ? "top" : o ? "bottom" : !1;
		}, e.getPinnedIndex = () => {
			let n = e.getIsPinned();
			return n ? ((n === "top" ? t.getTopRows() : t.getBottomRows())?.map((e) => {
				let { id: t } = e;
				return t;
			}))?.indexOf(e.id) ?? -1 : -1;
		};
	},
	createTable: (e) => {
		e.setRowPinning = (t) => e.options.onRowPinningChange == null ? void 0 : e.options.onRowPinningChange(t), e.resetRowPinning = (t) => e.setRowPinning(t ? Yl() : e.initialState?.rowPinning ?? Yl()), e.getIsSomeRowsPinned = (t) => {
			let n = e.getState().rowPinning;
			return t ? !!n[t]?.length : !!(n.top?.length || n.bottom?.length);
		}, e._getPinnedRows = (t, n, r) => (e.options.keepPinnedRows ?? !0 ? (n ?? []).map((t) => {
			let n = e.getRow(t, !0);
			return n.getIsAllParentsExpanded() ? n : null;
		}) : (n ?? []).map((e) => t.find((t) => t.id === e))).filter(Boolean).map((e) => ({
			...e,
			position: r
		})), e.getTopRows = K(() => [e.getRowModel().rows, e.getState().rowPinning.top], (t, n) => e._getPinnedRows(t, n, "top"), q(e.options, "debugRows", "getTopRows")), e.getBottomRows = K(() => [e.getRowModel().rows, e.getState().rowPinning.bottom], (t, n) => e._getPinnedRows(t, n, "bottom"), q(e.options, "debugRows", "getBottomRows")), e.getCenterRows = K(() => [
			e.getRowModel().rows,
			e.getState().rowPinning.top,
			e.getState().rowPinning.bottom
		], (e, t, n) => {
			let r = /* @__PURE__ */ new Set([...t ?? [], ...n ?? []]);
			return e.filter((e) => !r.has(e.id));
		}, q(e.options, "debugRows", "getCenterRows"));
	}
}, Zl = {
	getInitialState: (e) => ({
		rowSelection: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onRowSelectionChange: rl("rowSelection", e),
		enableRowSelection: !0,
		enableMultiRowSelection: !0,
		enableSubRowSelection: !0
	}),
	createTable: (e) => {
		e.setRowSelection = (t) => e.options.onRowSelectionChange == null ? void 0 : e.options.onRowSelectionChange(t), e.resetRowSelection = (t) => e.setRowSelection(t ? {} : e.initialState.rowSelection ?? {}), e.toggleAllRowsSelected = (t) => {
			e.setRowSelection((n) => {
				t = t === void 0 ? !e.getIsAllRowsSelected() : t;
				let r = { ...n }, i = e.getPreGroupedRowModel().flatRows;
				return t ? i.forEach((e) => {
					e.getCanSelect() && (r[e.id] = !0);
				}) : i.forEach((e) => {
					delete r[e.id];
				}), r;
			});
		}, e.toggleAllPageRowsSelected = (t) => e.setRowSelection((n) => {
			let r = t === void 0 ? !e.getIsAllPageRowsSelected() : t, i = { ...n };
			return e.getRowModel().rows.forEach((t) => {
				Ql(i, t.id, r, !0, e);
			}), i;
		}), e.getPreSelectedRowModel = () => e.getCoreRowModel(), e.getSelectedRowModel = K(() => [e.getState().rowSelection, e.getCoreRowModel()], (t, n) => Object.keys(t).length ? $l(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, q(e.options, "debugTable", "getSelectedRowModel")), e.getFilteredSelectedRowModel = K(() => [e.getState().rowSelection, e.getFilteredRowModel()], (t, n) => Object.keys(t).length ? $l(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, q(e.options, "debugTable", "getFilteredSelectedRowModel")), e.getGroupedSelectedRowModel = K(() => [e.getState().rowSelection, e.getSortedRowModel()], (t, n) => Object.keys(t).length ? $l(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, q(e.options, "debugTable", "getGroupedSelectedRowModel")), e.getIsAllRowsSelected = () => {
			let t = e.getFilteredRowModel().flatRows, { rowSelection: n } = e.getState(), r = !!(t.length && Object.keys(n).length);
			return r && t.some((e) => e.getCanSelect() && !n[e.id]) && (r = !1), r;
		}, e.getIsAllPageRowsSelected = () => {
			let t = e.getPaginationRowModel().flatRows.filter((e) => e.getCanSelect()), { rowSelection: n } = e.getState(), r = !!t.length;
			return r && t.some((e) => !n[e.id]) && (r = !1), r;
		}, e.getIsSomeRowsSelected = () => {
			let t = Object.keys(e.getState().rowSelection ?? {}).length;
			return t > 0 && t < e.getFilteredRowModel().flatRows.length;
		}, e.getIsSomePageRowsSelected = () => {
			let t = e.getPaginationRowModel().flatRows;
			return e.getIsAllPageRowsSelected() ? !1 : t.filter((e) => e.getCanSelect()).some((e) => e.getIsSelected() || e.getIsSomeSelected());
		}, e.getToggleAllRowsSelectedHandler = () => (t) => {
			e.toggleAllRowsSelected(t.target.checked);
		}, e.getToggleAllPageRowsSelectedHandler = () => (t) => {
			e.toggleAllPageRowsSelected(t.target.checked);
		};
	},
	createRow: (e, t) => {
		e.toggleSelected = (n, r) => {
			let i = e.getIsSelected();
			t.setRowSelection((a) => {
				if (n = n === void 0 ? !i : n, e.getCanSelect() && i === n) return a;
				let o = { ...a };
				return Ql(o, e.id, n, r?.selectChildren ?? !0, t), o;
			});
		}, e.getIsSelected = () => {
			let { rowSelection: n } = t.getState();
			return eu(e, n);
		}, e.getIsSomeSelected = () => {
			let { rowSelection: n } = t.getState();
			return tu(e, n) === "some";
		}, e.getIsAllSubRowsSelected = () => {
			let { rowSelection: n } = t.getState();
			return tu(e, n) === "all";
		}, e.getCanSelect = () => typeof t.options.enableRowSelection == "function" ? t.options.enableRowSelection(e) : t.options.enableRowSelection ?? !0, e.getCanSelectSubRows = () => typeof t.options.enableSubRowSelection == "function" ? t.options.enableSubRowSelection(e) : t.options.enableSubRowSelection ?? !0, e.getCanMultiSelect = () => typeof t.options.enableMultiRowSelection == "function" ? t.options.enableMultiRowSelection(e) : t.options.enableMultiRowSelection ?? !0, e.getToggleSelectedHandler = () => {
			let t = e.getCanSelect();
			return (n) => {
				t && e.toggleSelected(n.target?.checked);
			};
		};
	}
}, Ql = (e, t, n, r, i) => {
	var a;
	let o = i.getRow(t, !0);
	n ? (o.getCanMultiSelect() || Object.keys(e).forEach((t) => delete e[t]), o.getCanSelect() && (e[t] = !0)) : delete e[t], r && (a = o.subRows) != null && a.length && o.getCanSelectSubRows() && o.subRows.forEach((t) => Ql(e, t.id, n, r, i));
};
function $l(e, t) {
	let n = e.getState().rowSelection, r = [], i = {}, a = function(e, t) {
		return e.map((e) => {
			var t;
			let o = eu(e, n);
			if (o && (r.push(e), i[e.id] = e), (t = e.subRows) != null && t.length && (e = {
				...e,
				subRows: a(e.subRows)
			}), o) return e;
		}).filter(Boolean);
	};
	return {
		rows: a(t.rows),
		flatRows: r,
		rowsById: i
	};
}
function eu(e, t) {
	return t[e.id] ?? !1;
}
function tu(e, t, n) {
	var r;
	if (!((r = e.subRows) != null && r.length)) return !1;
	let i = !0, a = !1;
	return e.subRows.forEach((e) => {
		if (!(a && !i) && (e.getCanSelect() && (eu(e, t) ? a = !0 : i = !1), e.subRows && e.subRows.length)) {
			let n = tu(e, t);
			n === "all" ? a = !0 : (n === "some" && (a = !0), i = !1);
		}
	}), i ? "all" : a ? "some" : !1;
}
var nu = /([0-9]+)/gm, ru = (e, t, n) => du(uu(e.getValue(n)).toLowerCase(), uu(t.getValue(n)).toLowerCase()), iu = (e, t, n) => du(uu(e.getValue(n)), uu(t.getValue(n))), au = (e, t, n) => lu(uu(e.getValue(n)).toLowerCase(), uu(t.getValue(n)).toLowerCase()), ou = (e, t, n) => lu(uu(e.getValue(n)), uu(t.getValue(n))), su = (e, t, n) => {
	let r = e.getValue(n), i = t.getValue(n);
	return r > i ? 1 : r < i ? -1 : 0;
}, cu = (e, t, n) => lu(e.getValue(n), t.getValue(n));
function lu(e, t) {
	return e === t ? 0 : e > t ? 1 : -1;
}
function uu(e) {
	return typeof e == "number" ? isNaN(e) || e === Infinity || e === -Infinity ? "" : String(e) : typeof e == "string" ? e : "";
}
function du(e, t) {
	let n = e.split(nu).filter(Boolean), r = t.split(nu).filter(Boolean);
	for (; n.length && r.length;) {
		let e = n.shift(), t = r.shift(), i = parseInt(e, 10), a = parseInt(t, 10), o = [i, a].sort();
		if (isNaN(o[0])) {
			if (e > t) return 1;
			if (t > e) return -1;
			continue;
		}
		if (isNaN(o[1])) return isNaN(i) ? -1 : 1;
		if (i > a) return 1;
		if (a > i) return -1;
	}
	return n.length - r.length;
}
var fu = {
	alphanumeric: ru,
	alphanumericCaseSensitive: iu,
	text: au,
	textCaseSensitive: ou,
	datetime: su,
	basic: cu
}, pu = [
	ul,
	Bl,
	Al,
	Ml,
	pl,
	Tl,
	Hl,
	Ul,
	{
		getInitialState: (e) => ({
			sorting: [],
			...e
		}),
		getDefaultColumnDef: () => ({
			sortingFn: "auto",
			sortUndefined: 1
		}),
		getDefaultOptions: (e) => ({
			onSortingChange: rl("sorting", e),
			isMultiSortEvent: (e) => e.shiftKey
		}),
		createColumn: (e, t) => {
			e.getAutoSortingFn = () => {
				let n = t.getFilteredRowModel().flatRows.slice(10), r = !1;
				for (let t of n) {
					let n = t?.getValue(e.id);
					if (Object.prototype.toString.call(n) === "[object Date]") return fu.datetime;
					if (typeof n == "string" && (r = !0, n.split(nu).length > 1)) return fu.alphanumeric;
				}
				return r ? fu.text : fu.basic;
			}, e.getAutoSortDir = () => typeof t.getFilteredRowModel().flatRows[0]?.getValue(e.id) == "string" ? "asc" : "desc", e.getSortingFn = () => {
				if (!e) throw Error();
				return il(e.columnDef.sortingFn) ? e.columnDef.sortingFn : e.columnDef.sortingFn === "auto" ? e.getAutoSortingFn() : t.options.sortingFns?.[e.columnDef.sortingFn] ?? fu[e.columnDef.sortingFn];
			}, e.toggleSorting = (n, r) => {
				let i = e.getNextSortingOrder(), a = n != null;
				t.setSorting((o) => {
					let s = o?.find((t) => t.id === e.id), c = o?.findIndex((t) => t.id === e.id), l = [], u, d = a ? n : i === "desc";
					return u = o != null && o.length && e.getCanMultiSort() && r ? s ? "toggle" : "add" : o != null && o.length && c !== o.length - 1 ? "replace" : s ? "toggle" : "replace", u === "toggle" && (a || i || (u = "remove")), u === "add" ? (l = [...o, {
						id: e.id,
						desc: d
					}], l.splice(0, l.length - (t.options.maxMultiSortColCount ?? 2 ** 53 - 1))) : l = u === "toggle" ? o.map((t) => t.id === e.id ? {
						...t,
						desc: d
					} : t) : u === "remove" ? o.filter((t) => t.id !== e.id) : [{
						id: e.id,
						desc: d
					}], l;
				});
			}, e.getFirstSortDir = () => e.columnDef.sortDescFirst ?? t.options.sortDescFirst ?? e.getAutoSortDir() === "desc" ? "desc" : "asc", e.getNextSortingOrder = (n) => {
				let r = e.getFirstSortDir(), i = e.getIsSorted();
				return i ? i !== r && (t.options.enableSortingRemoval ?? !0) && (!n || (t.options.enableMultiRemove ?? !0)) ? !1 : i === "desc" ? "asc" : "desc" : r;
			}, e.getCanSort = () => (e.columnDef.enableSorting ?? !0) && (t.options.enableSorting ?? !0) && !!e.accessorFn, e.getCanMultiSort = () => e.columnDef.enableMultiSort ?? t.options.enableMultiSort ?? !!e.accessorFn, e.getIsSorted = () => {
				let n = t.getState().sorting?.find((t) => t.id === e.id);
				return n ? n.desc ? "desc" : "asc" : !1;
			}, e.getSortIndex = () => t.getState().sorting?.findIndex((t) => t.id === e.id) ?? -1, e.clearSorting = () => {
				t.setSorting((t) => t != null && t.length ? t.filter((t) => t.id !== e.id) : []);
			}, e.getToggleSortingHandler = () => {
				let n = e.getCanSort();
				return (r) => {
					n && (r.persist == null || r.persist(), e.toggleSorting == null || e.toggleSorting(void 0, e.getCanMultiSort() ? t.options.isMultiSortEvent == null ? void 0 : t.options.isMultiSortEvent(r) : !1));
				};
			};
		},
		createTable: (e) => {
			e.setSorting = (t) => e.options.onSortingChange == null ? void 0 : e.options.onSortingChange(t), e.resetSorting = (t) => {
				e.setSorting(t ? [] : e.initialState?.sorting ?? []);
			}, e.getPreSortedRowModel = () => e.getGroupedRowModel(), e.getSortedRowModel = () => (!e._getSortedRowModel && e.options.getSortedRowModel && (e._getSortedRowModel = e.options.getSortedRowModel(e)), e.options.manualSorting || !e._getSortedRowModel ? e.getPreSortedRowModel() : e._getSortedRowModel());
		}
	},
	Ol,
	Wl,
	Jl,
	Xl,
	Zl,
	Il
];
function mu(e) {
	process.env.NODE_ENV !== "production" && (e.debugAll || e.debugTable) && console.info("Creating Table Instance...");
	let t = [...pu, ...e._features ?? []], n = { _features: t }, r = n._features.reduce((e, t) => Object.assign(e, t.getDefaultOptions == null ? void 0 : t.getDefaultOptions(n)), {}), i = (e) => n.options.mergeOptions ? n.options.mergeOptions(r, e) : {
		...r,
		...e
	}, a = { ...e.initialState ?? {} };
	n._features.forEach((e) => {
		a = (e.getInitialState == null ? void 0 : e.getInitialState(a)) ?? a;
	});
	let o = [], s = !1, c = {
		_features: t,
		options: {
			...r,
			...e
		},
		initialState: a,
		_queue: (e) => {
			o.push(e), s || (s = !0, Promise.resolve().then(() => {
				for (; o.length;) o.shift()();
				s = !1;
			}).catch((e) => setTimeout(() => {
				throw e;
			})));
		},
		reset: () => {
			n.setState(n.initialState);
		},
		setOptions: (e) => {
			let t = nl(e, n.options);
			n.options = i(t);
		},
		getState: () => n.options.state,
		setState: (e) => {
			n.options.onStateChange == null || n.options.onStateChange(e);
		},
		_getRowId: (e, t, r) => (n.options.getRowId == null ? void 0 : n.options.getRowId(e, t, r)) ?? `${r ? [r.id, t].join(".") : t}`,
		getCoreRowModel: () => (n._getCoreRowModel ||= n.options.getCoreRowModel(n), n._getCoreRowModel()),
		getRowModel: () => n.getPaginationRowModel(),
		getRow: (e, t) => {
			let r = (t ? n.getPrePaginationRowModel() : n.getRowModel()).rowsById[e];
			if (!r && (r = n.getCoreRowModel().rowsById[e], !r)) throw process.env.NODE_ENV === "production" ? Error() : Error(`getRow could not find row with ID: ${e}`);
			return r;
		},
		_getDefaultColumnDef: K(() => [n.options.defaultColumn], (e) => (e ??= {}, {
			header: (e) => {
				let t = e.header.column.columnDef;
				return t.accessorKey ? t.accessorKey : t.accessorFn ? t.id : null;
			},
			cell: (e) => {
				var t;
				return ((t = e.renderValue()) == null || t.toString == null ? void 0 : t.toString()) ?? null;
			},
			...n._features.reduce((e, t) => Object.assign(e, t.getDefaultColumnDef == null ? void 0 : t.getDefaultColumnDef()), {}),
			...e
		}), q(e, "debugColumns", "_getDefaultColumnDef")),
		_getColumnDefs: () => n.options.columns,
		getAllColumns: K(() => [n._getColumnDefs()], (e) => {
			let t = function(e, r, i) {
				return i === void 0 && (i = 0), e.map((e) => {
					let a = cl(n, e, i, r), o = e;
					return a.columns = o.columns ? t(o.columns, a, i + 1) : [], a;
				});
			};
			return t(e);
		}, q(e, "debugColumns", "getAllColumns")),
		getAllFlatColumns: K(() => [n.getAllColumns()], (e) => e.flatMap((e) => e.getFlatColumns()), q(e, "debugColumns", "getAllFlatColumns")),
		_getAllFlatColumnsById: K(() => [n.getAllFlatColumns()], (e) => e.reduce((e, t) => (e[t.id] = t, e), {}), q(e, "debugColumns", "getAllFlatColumnsById")),
		getAllLeafColumns: K(() => [n.getAllColumns(), n._getOrderColumnsFn()], (e, t) => t(e.flatMap((e) => e.getLeafColumns())), q(e, "debugColumns", "getAllLeafColumns")),
		getColumn: (e) => {
			let t = n._getAllFlatColumnsById()[e];
			return process.env.NODE_ENV !== "production" && !t && console.error(`[Table] Column with id '${e}' does not exist.`), t;
		}
	};
	Object.assign(n, c);
	for (let e = 0; e < n._features.length; e++) {
		let t = n._features[e];
		t == null || t.createTable == null || t.createTable(n);
	}
	return n;
}
function hu() {
	return (e) => K(() => [e.options.data], (t) => {
		let n = {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, r = function(t, i, a) {
			i === void 0 && (i = 0);
			let o = [];
			for (let c = 0; c < t.length; c++) {
				let l = fl(e, e._getRowId(t[c], c, a), t[c], c, i, void 0, a?.id);
				if (n.flatRows.push(l), n.rowsById[l.id] = l, o.push(l), e.options.getSubRows) {
					var s;
					l.originalSubRows = e.options.getSubRows(t[c], c), (s = l.originalSubRows) != null && s.length && (l.subRows = r(l.originalSubRows, i + 1, l));
				}
			}
			return o;
		};
		return n.rows = r(t), n;
	}, q(e.options, "debugTable", "getRowModel", () => e._autoResetPageIndex()));
}
function gu(e) {
	let t = [], n = (e) => {
		var r;
		t.push(e), (r = e.subRows) != null && r.length && e.getIsExpanded() && e.subRows.forEach(n);
	};
	return e.rows.forEach(n), {
		rows: t,
		flatRows: e.flatRows,
		rowsById: e.rowsById
	};
}
function _u(e) {
	return (e) => K(() => [
		e.getState().pagination,
		e.getPrePaginationRowModel(),
		e.options.paginateExpandedRows ? void 0 : e.getState().expanded
	], (t, n) => {
		if (!n.rows.length) return n;
		let { pageSize: r, pageIndex: i } = t, { rows: a, flatRows: o, rowsById: s } = n, c = r * i, l = c + r;
		a = a.slice(c, l);
		let u;
		u = e.options.paginateExpandedRows ? {
			rows: a,
			flatRows: o,
			rowsById: s
		} : gu({
			rows: a,
			flatRows: o,
			rowsById: s
		}), u.flatRows = [];
		let d = (e) => {
			u.flatRows.push(e), e.subRows.length && e.subRows.forEach(d);
		};
		return u.rows.forEach(d), u;
	}, q(e.options, "debugTable", "getPaginationRowModel"));
}
function vu() {
	return (e) => K(() => [e.getState().sorting, e.getPreSortedRowModel()], (t, n) => {
		if (!n.rows.length || !(t != null && t.length)) return n;
		let r = e.getState().sorting, i = [], a = r.filter((t) => e.getColumn(t.id)?.getCanSort()), o = {};
		a.forEach((t) => {
			let n = e.getColumn(t.id);
			n && (o[t.id] = {
				sortUndefined: n.columnDef.sortUndefined,
				invertSorting: n.columnDef.invertSorting,
				sortingFn: n.getSortingFn()
			});
		});
		let s = (e) => {
			let t = e.map((e) => ({ ...e }));
			return t.sort((e, t) => {
				for (let n = 0; n < a.length; n += 1) {
					let r = a[n], i = o[r.id], s = i.sortUndefined, c = r?.desc ?? !1, l = 0;
					if (s) {
						let n = e.getValue(r.id), i = t.getValue(r.id), a = n === void 0, o = i === void 0;
						if (a || o) {
							if (s === "first") return a ? -1 : 1;
							if (s === "last") return a ? 1 : -1;
							l = a && o ? 0 : a ? s : -s;
						}
					}
					if (l === 0 && (l = i.sortingFn(e, t, r.id)), l !== 0) return c && (l *= -1), i.invertSorting && (l *= -1), l;
				}
				return e.index - t.index;
			}), t.forEach((e) => {
				var t;
				i.push(e), (t = e.subRows) != null && t.length && (e.subRows = s(e.subRows));
			}), t;
		};
		return {
			rows: s(n.rows),
			flatRows: i,
			rowsById: n.rowsById
		};
	}, q(e.options, "debugTable", "getSortedRowModel", () => e._autoResetPageIndex()));
}
function yu(e, t) {
	return e ? bu(e) ? /*#__PURE__*/ w.createElement(e, t) : e : null;
}
function bu(e) {
	return xu(e) || typeof e == "function" || Su(e);
}
function xu(e) {
	return typeof e == "function" && (() => {
		let t = Object.getPrototypeOf(e);
		return t.prototype && t.prototype.isReactComponent;
	})();
}
function Su(e) {
	return typeof e == "object" && typeof e.$$typeof == "symbol" && ["react.memo", "react.forward_ref"].includes(e.$$typeof.description);
}
function Cu(e) {
	let t = {
		state: {},
		onStateChange: () => {},
		renderFallbackValue: null,
		...e
	}, [n] = w.useState(() => ({ current: mu(t) })), [r, i] = w.useState(() => n.current.initialState);
	return n.current.setOptions((t) => ({
		...t,
		...e,
		state: {
			...r,
			...e.state
		},
		onStateChange: (t) => {
			i(t), e.onStateChange == null || e.onStateChange(t);
		}
	})), n.current;
}
var wu = tl("arrow-down", [["path", {
	d: "M12 5v14",
	key: "s699le"
}], ["path", {
	d: "m19 12-7 7-7-7",
	key: "1idqje"
}]]), Tu = tl("arrow-right", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "m12 5 7 7-7 7",
	key: "xquz4c"
}]]), Eu = tl("arrow-up", [["path", {
	d: "m5 12 7-7 7 7",
	key: "hav0vg"
}], ["path", {
	d: "M12 19V5",
	key: "x0mq9r"
}]]), Du = tl("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]), Ou = tl("chevron-right", [["path", {
	d: "m9 18 6-6-6-6",
	key: "mthhwq"
}]]), ku = tl("chevrons-up-down", [["path", {
	d: "m7 15 5 5 5-5",
	key: "1hf1tw"
}], ["path", {
	d: "m7 9 5-5 5 5",
	key: "sgt6xg"
}]]), Au = tl("inbox", [["polyline", {
	points: "22 12 16 12 14 15 10 15 8 12 2 12",
	key: "o97t9d"
}], ["path", {
	d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
	key: "oot6mr"
}]]), ju = tl("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]), Mu = {
	asc: "ascending",
	desc: "descending"
}, Nu = /* @__PURE__ */ M(_o, { children: /* @__PURE__ */ N(vo, { children: [/* @__PURE__ */ M(bo, {
	variant: "icon",
	children: /* @__PURE__ */ M(Au, {})
}), /* @__PURE__ */ M(xo, { children: "No results" })] }) });
function Pu({ table: e, pageSizeOptions: t }) {
	let { pageIndex: n, pageSize: r } = e.getState().pagination, i = e.getPageCount(), a = e.getFilteredRowModel().rows.length, o = a === 0 ? 0 : n * r + 1, s = Math.min((n + 1) * r, a), c = As(i, n);
	return /* @__PURE__ */ N("div", {
		className: "flex flex-wrap items-center justify-between gap-2 px-3",
		children: [/* @__PURE__ */ N("div", {
			className: "flex items-center gap-2 text-xs text-muted-foreground",
			children: [/* @__PURE__ */ N("span", {
				className: "tabular-nums",
				children: [
					o,
					"–",
					s,
					" of ",
					a
				]
			}), t?.length ? /* @__PURE__ */ N(Us, {
				value: String(r),
				onValueChange: (t) => e.setPageSize(Number(t)),
				children: [/* @__PURE__ */ M(qs, {
					size: "sm",
					className: "w-auto gap-1",
					"aria-label": "Rows per page",
					children: /* @__PURE__ */ M(Gs, {})
				}), /* @__PURE__ */ M(Js, { children: /* @__PURE__ */ M(Ws, { children: t.map((e) => /* @__PURE__ */ N(Xs, {
					value: String(e),
					children: [e, " / page"]
				}, e)) }) })]
			}) : null]
		}), /* @__PURE__ */ M(Cs, {
			className: "w-auto",
			children: /* @__PURE__ */ N(ws, { children: [
				/* @__PURE__ */ M(Ts, { children: /* @__PURE__ */ M(Ds, {
					disabled: !e.getCanPreviousPage(),
					onClick: () => e.previousPage(),
					children: /* @__PURE__ */ M("span", {
						className: "sr-only",
						children: "Previous"
					})
				}) }),
				c.map((t, r) => t === "ellipsis" ? /* @__PURE__ */ M(Ts, { children: /* @__PURE__ */ M(ks, {}) }, `ellipsis-${r}`) : /* @__PURE__ */ M(Ts, { children: /* @__PURE__ */ M(Es, {
					isActive: t === n,
					"aria-label": `Go to page ${t + 1}`,
					onClick: () => e.setPageIndex(t),
					children: t + 1
				}) }, t)),
				/* @__PURE__ */ M(Ts, { children: /* @__PURE__ */ M(Os, {
					disabled: !e.getCanNextPage(),
					onClick: () => e.nextPage(),
					children: /* @__PURE__ */ M("span", {
						className: "sr-only",
						children: "Next"
					})
				}) })
			] })
		})]
	});
}
function Fu({ columns: e, data: t, className: n, stickyHeader: r, fullWidth: i, size: a, empty: o = Nu, pageSize: s, pageSizeOptions: c }) {
	let l = s != null, [u, d] = w.useState([]), [f, p] = w.useState({
		pageIndex: 0,
		pageSize: s ?? 10
	});
	w.useEffect(() => {
		s != null && p((e) => ({
			...e,
			pageIndex: 0,
			pageSize: s
		}));
	}, [s]);
	let m = Cu({
		data: t,
		columns: e,
		state: {
			sorting: u,
			...l ? { pagination: f } : {}
		},
		onSortingChange: d,
		...l ? { onPaginationChange: p } : {},
		getCoreRowModel: hu(),
		getSortedRowModel: vu(),
		...l ? { getPaginationRowModel: _u() } : {}
	}), h = m.getRowModel().rows, g = /* @__PURE__ */ N(_c, {
		className: n,
		stickyHeader: r,
		fullWidth: i,
		size: a,
		children: [/* @__PURE__ */ M(vc, { children: m.getHeaderGroups().map((e) => /* @__PURE__ */ M(xc, { children: e.headers.map((e) => {
			let t = e.column.getIsSorted(), { align: n, expand: r } = e.column.columnDef.meta ?? {}, i = e.isPlaceholder ? null : yu(e.column.columnDef.header, e.getContext());
			return /* @__PURE__ */ M(Sc, {
				colSpan: e.colSpan,
				align: n,
				expand: r,
				"aria-sort": t ? Mu[t] : void 0,
				children: e.column.getCanSort() && !e.isPlaceholder ? /* @__PURE__ */ N(G, {
					size: "sm",
					"aria-selected": t ? !0 : void 0,
					className: W("gap-1.5", t && "text-foreground", !t && "hover:bg-fill-hover/50"),
					onClick: e.column.getToggleSortingHandler(),
					children: [i, t === "asc" ? /* @__PURE__ */ M(Eu, { className: "size-3" }) : t === "desc" ? /* @__PURE__ */ M(wu, { className: "size-3" }) : /* @__PURE__ */ M(ku, { className: "size-3 opacity-50" })]
				}) : i
			}, e.id);
		}) }, e.id)) }), /* @__PURE__ */ M(yc, { children: h.length ? h.map((e) => /* @__PURE__ */ M(xc, {
			"data-state": e.getIsSelected() ? "selected" : void 0,
			children: e.getVisibleCells().map((e) => /* @__PURE__ */ M(Cc, {
				align: e.column.columnDef.meta?.align,
				expand: e.column.columnDef.meta?.expand,
				children: yu(e.column.columnDef.cell, e.getContext())
			}, e.id))
		}, e.id)) : /* @__PURE__ */ M(xc, { children: /* @__PURE__ */ M(Cc, {
			colSpan: e.length,
			className: "p-2 hover:bg-transparent",
			children: o
		}) }) })]
	});
	return !l || m.getFilteredRowModel().rows.length === 0 ? g : /* @__PURE__ */ N("div", {
		className: "flex flex-col gap-2",
		children: [g, /* @__PURE__ */ M(Pu, {
			table: m,
			pageSizeOptions: c
		})]
	});
}
var Iu = 365.2425, Lu = 6048e5, Ru = 864e5, zu = 6e4, Bu = 36e5, Vu = 3600 * 24;
Vu * 7, Vu * Iu / 12 * 3;
var Hu = Symbol.for("constructDateFrom");
function Y(e, t) {
	return typeof e == "function" ? e(t) : e && typeof e == "object" && Hu in e ? e[Hu](t) : e instanceof Date ? new e.constructor(t) : new Date(t);
}
function X(e, t) {
	return Y(t || e, e);
}
function Uu(e, t, n) {
	let r = X(e, n?.in);
	return isNaN(t) ? Y(n?.in || e, NaN) : (t && r.setDate(r.getDate() + t), r);
}
function Wu(e, t, n) {
	let r = X(e, n?.in);
	if (isNaN(t)) return Y(n?.in || e, NaN);
	if (!t) return r;
	let i = r.getDate(), a = Y(n?.in || e, r.getTime());
	return a.setMonth(r.getMonth() + t + 1, 0), i >= a.getDate() ? a : (r.setFullYear(a.getFullYear(), a.getMonth(), i), r);
}
function Gu(e, t, n) {
	return Y(n?.in || e, +X(e) + t);
}
function Ku(e, t, n) {
	return Gu(e, t * Bu, n);
}
var qu = {};
function Ju() {
	return qu;
}
function Yu(e, t) {
	let n = Ju(), r = t?.weekStartsOn ?? t?.locale?.options?.weekStartsOn ?? n.weekStartsOn ?? n.locale?.options?.weekStartsOn ?? 0, i = X(e, t?.in), a = i.getDay(), o = (a < r ? 7 : 0) + a - r;
	return i.setDate(i.getDate() - o), i.setHours(0, 0, 0, 0), i;
}
function Xu(e, t) {
	return Yu(e, {
		...t,
		weekStartsOn: 1
	});
}
function Zu(e, t) {
	let n = X(e, t?.in), r = n.getFullYear(), i = Y(n, 0);
	i.setFullYear(r + 1, 0, 4), i.setHours(0, 0, 0, 0);
	let a = Xu(i), o = Y(n, 0);
	o.setFullYear(r, 0, 4), o.setHours(0, 0, 0, 0);
	let s = Xu(o);
	return n.getTime() >= a.getTime() ? r + 1 : n.getTime() >= s.getTime() ? r : r - 1;
}
function Qu(e) {
	let t = X(e), n = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds()));
	return n.setUTCFullYear(t.getFullYear()), e - +n;
}
function $u(e, ...t) {
	let n = Y.bind(null, e || t.find((e) => typeof e == "object"));
	return t.map(n);
}
function ed(e, t) {
	let n = X(e, t?.in);
	return n.setHours(0, 0, 0, 0), n;
}
function td(e, t, n) {
	let [r, i] = $u(n?.in, e, t), a = ed(r), o = ed(i), s = +a - Qu(a), c = +o - Qu(o);
	return Math.round((s - c) / Ru);
}
function nd(e, t) {
	let n = Zu(e, t), r = Y(t?.in || e, 0);
	return r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), Xu(r);
}
function rd(e, t, n) {
	let r = X(e, n?.in);
	return r.setTime(r.getTime() + t * zu), r;
}
function id(e, t, n) {
	return Uu(e, t * 7, n);
}
function ad(e, t, n) {
	return Wu(e, t * 12, n);
}
function od(e) {
	return Y(e, Date.now());
}
function sd(e, t, n) {
	let [r, i] = $u(n?.in, e, t);
	return +ed(r) == +ed(i);
}
function cd(e) {
	return e instanceof Date || typeof e == "object" && Object.prototype.toString.call(e) === "[object Date]";
}
function ld(e) {
	return !(!cd(e) && typeof e != "number" || isNaN(+X(e)));
}
function ud(e, t) {
	let n = X(e, t?.in);
	return n.setHours(23, 59, 59, 999), n;
}
function dd(e, t) {
	let n = X(e, t?.in), r = n.getMonth();
	return n.setFullYear(n.getFullYear(), r + 1, 0), n.setHours(23, 59, 59, 999), n;
}
function fd(e, t) {
	let [n, r] = $u(e, t.start, t.end);
	return {
		start: n,
		end: r
	};
}
function pd(e, t) {
	let { start: n, end: r } = fd(t?.in, e), i = +n > +r, a = i ? +n : +r, o = i ? r : n;
	o.setHours(0, 0, 0, 0);
	let s = t?.step ?? 1;
	if (!s) return [];
	s < 0 && (s = -s, i = !i);
	let c = [];
	for (; +o <= a;) c.push(Y(n, o)), o.setDate(o.getDate() + s), o.setHours(0, 0, 0, 0);
	return i ? c.reverse() : c;
}
function md(e, t) {
	let { start: n, end: r } = fd(t?.in, e), i = +n > +r, a = i ? +n : +r, o = i ? r : n;
	o.setHours(0, 0, 0, 0), o.setDate(1);
	let s = t?.step ?? 1;
	if (!s) return [];
	s < 0 && (s = -s, i = !i);
	let c = [];
	for (; +o <= a;) c.push(Y(n, o)), o.setMonth(o.getMonth() + s);
	return i ? c.reverse() : c;
}
function hd(e, t) {
	let { start: n, end: r } = fd(t?.in, e), i = +n > +r, a = Yu(i ? r : n, t), o = Yu(i ? n : r, t);
	a.setHours(15), o.setHours(15);
	let s = +o.getTime(), c = a, l = t?.step ?? 1;
	if (!l) return [];
	l < 0 && (l = -l, i = !i);
	let u = [];
	for (; +c <= s;) c.setHours(0), u.push(Y(n, c)), c = id(c, l), c.setHours(15);
	return i ? u.reverse() : u;
}
function gd(e, t) {
	let n = X(e, t?.in);
	return n.setDate(1), n.setHours(0, 0, 0, 0), n;
}
function _d(e, t) {
	let n = X(e, t?.in);
	return n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n;
}
function vd(e, t) {
	let n = Ju(), r = t?.weekStartsOn ?? t?.locale?.options?.weekStartsOn ?? n.weekStartsOn ?? n.locale?.options?.weekStartsOn ?? 0, i = X(e, t?.in), a = i.getDay(), o = (a < r ? -7 : 0) + 6 - (a - r);
	return i.setDate(i.getDate() + o), i.setHours(23, 59, 59, 999), i;
}
var yd = {
	lessThanXSeconds: {
		one: "less than a second",
		other: "less than {{count}} seconds"
	},
	xSeconds: {
		one: "1 second",
		other: "{{count}} seconds"
	},
	halfAMinute: "half a minute",
	lessThanXMinutes: {
		one: "less than a minute",
		other: "less than {{count}} minutes"
	},
	xMinutes: {
		one: "1 minute",
		other: "{{count}} minutes"
	},
	aboutXHours: {
		one: "about 1 hour",
		other: "about {{count}} hours"
	},
	xHours: {
		one: "1 hour",
		other: "{{count}} hours"
	},
	xDays: {
		one: "1 day",
		other: "{{count}} days"
	},
	aboutXWeeks: {
		one: "about 1 week",
		other: "about {{count}} weeks"
	},
	xWeeks: {
		one: "1 week",
		other: "{{count}} weeks"
	},
	aboutXMonths: {
		one: "about 1 month",
		other: "about {{count}} months"
	},
	xMonths: {
		one: "1 month",
		other: "{{count}} months"
	},
	aboutXYears: {
		one: "about 1 year",
		other: "about {{count}} years"
	},
	xYears: {
		one: "1 year",
		other: "{{count}} years"
	},
	overXYears: {
		one: "over 1 year",
		other: "over {{count}} years"
	},
	almostXYears: {
		one: "almost 1 year",
		other: "almost {{count}} years"
	}
}, bd = (e, t, n) => {
	let r, i = yd[e];
	return r = typeof i == "string" ? i : t === 1 ? i.one : i.other.replace("{{count}}", t.toString()), n?.addSuffix ? n.comparison && n.comparison > 0 ? "in " + r : r + " ago" : r;
};
function xd(e) {
	return (t = {}) => {
		let n = t.width ? String(t.width) : e.defaultWidth;
		return e.formats[n] || e.formats[e.defaultWidth];
	};
}
var Sd = {
	date: xd({
		formats: {
			full: "EEEE, MMMM do, y",
			long: "MMMM do, y",
			medium: "MMM d, y",
			short: "MM/dd/yyyy"
		},
		defaultWidth: "full"
	}),
	time: xd({
		formats: {
			full: "h:mm:ss a zzzz",
			long: "h:mm:ss a z",
			medium: "h:mm:ss a",
			short: "h:mm a"
		},
		defaultWidth: "full"
	}),
	dateTime: xd({
		formats: {
			full: "{{date}} 'at' {{time}}",
			long: "{{date}} 'at' {{time}}",
			medium: "{{date}}, {{time}}",
			short: "{{date}}, {{time}}"
		},
		defaultWidth: "full"
	})
}, Cd = {
	lastWeek: "'last' eeee 'at' p",
	yesterday: "'yesterday at' p",
	today: "'today at' p",
	tomorrow: "'tomorrow at' p",
	nextWeek: "eeee 'at' p",
	other: "P"
}, wd = (e, t, n, r) => Cd[e];
function Td(e) {
	return (t, n) => {
		let r = n?.context ? String(n.context) : "standalone", i;
		if (r === "formatting" && e.formattingValues) {
			let t = e.defaultFormattingWidth || e.defaultWidth, r = n?.width ? String(n.width) : t;
			i = e.formattingValues[r] || e.formattingValues[t];
		} else {
			let t = e.defaultWidth, r = n?.width ? String(n.width) : e.defaultWidth;
			i = e.values[r] || e.values[t];
		}
		let a = e.argumentCallback ? e.argumentCallback(t) : t;
		return i[a];
	};
}
var Ed = {
	ordinalNumber: (e, t) => {
		let n = Number(e), r = n % 100;
		if (r > 20 || r < 10) switch (r % 10) {
			case 1: return n + "st";
			case 2: return n + "nd";
			case 3: return n + "rd";
		}
		return n + "th";
	},
	era: Td({
		values: {
			narrow: ["B", "A"],
			abbreviated: ["BC", "AD"],
			wide: ["Before Christ", "Anno Domini"]
		},
		defaultWidth: "wide"
	}),
	quarter: Td({
		values: {
			narrow: [
				"1",
				"2",
				"3",
				"4"
			],
			abbreviated: [
				"Q1",
				"Q2",
				"Q3",
				"Q4"
			],
			wide: [
				"1st quarter",
				"2nd quarter",
				"3rd quarter",
				"4th quarter"
			]
		},
		defaultWidth: "wide",
		argumentCallback: (e) => e - 1
	}),
	month: Td({
		values: {
			narrow: [
				"J",
				"F",
				"M",
				"A",
				"M",
				"J",
				"J",
				"A",
				"S",
				"O",
				"N",
				"D"
			],
			abbreviated: [
				"Jan",
				"Feb",
				"Mar",
				"Apr",
				"May",
				"Jun",
				"Jul",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec"
			],
			wide: [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December"
			]
		},
		defaultWidth: "wide"
	}),
	day: Td({
		values: {
			narrow: [
				"S",
				"M",
				"T",
				"W",
				"T",
				"F",
				"S"
			],
			short: [
				"Su",
				"Mo",
				"Tu",
				"We",
				"Th",
				"Fr",
				"Sa"
			],
			abbreviated: [
				"Sun",
				"Mon",
				"Tue",
				"Wed",
				"Thu",
				"Fri",
				"Sat"
			],
			wide: [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday"
			]
		},
		defaultWidth: "wide"
	}),
	dayPeriod: Td({
		values: {
			narrow: {
				am: "a",
				pm: "p",
				midnight: "mi",
				noon: "n",
				morning: "morning",
				afternoon: "afternoon",
				evening: "evening",
				night: "night"
			},
			abbreviated: {
				am: "AM",
				pm: "PM",
				midnight: "midnight",
				noon: "noon",
				morning: "morning",
				afternoon: "afternoon",
				evening: "evening",
				night: "night"
			},
			wide: {
				am: "a.m.",
				pm: "p.m.",
				midnight: "midnight",
				noon: "noon",
				morning: "morning",
				afternoon: "afternoon",
				evening: "evening",
				night: "night"
			}
		},
		defaultWidth: "wide",
		formattingValues: {
			narrow: {
				am: "a",
				pm: "p",
				midnight: "mi",
				noon: "n",
				morning: "in the morning",
				afternoon: "in the afternoon",
				evening: "in the evening",
				night: "at night"
			},
			abbreviated: {
				am: "AM",
				pm: "PM",
				midnight: "midnight",
				noon: "noon",
				morning: "in the morning",
				afternoon: "in the afternoon",
				evening: "in the evening",
				night: "at night"
			},
			wide: {
				am: "a.m.",
				pm: "p.m.",
				midnight: "midnight",
				noon: "noon",
				morning: "in the morning",
				afternoon: "in the afternoon",
				evening: "in the evening",
				night: "at night"
			}
		},
		defaultFormattingWidth: "wide"
	})
};
function Dd(e) {
	return (t, n = {}) => {
		let r = n.width, i = r && e.matchPatterns[r] || e.matchPatterns[e.defaultMatchWidth], a = t.match(i);
		if (!a) return null;
		let o = a[0], s = r && e.parsePatterns[r] || e.parsePatterns[e.defaultParseWidth], c = Array.isArray(s) ? kd(s, (e) => e.test(o)) : Od(s, (e) => e.test(o)), l;
		l = e.valueCallback ? e.valueCallback(c) : c, l = n.valueCallback ? n.valueCallback(l) : l;
		let u = t.slice(o.length);
		return {
			value: l,
			rest: u
		};
	};
}
function Od(e, t) {
	for (let n in e) if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function kd(e, t) {
	for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
function Ad(e) {
	return (t, n = {}) => {
		let r = t.match(e.matchPattern);
		if (!r) return null;
		let i = r[0], a = t.match(e.parsePattern);
		if (!a) return null;
		let o = e.valueCallback ? e.valueCallback(a[0]) : a[0];
		o = n.valueCallback ? n.valueCallback(o) : o;
		let s = t.slice(i.length);
		return {
			value: o,
			rest: s
		};
	};
}
var jd = {
	code: "en-US",
	formatDistance: bd,
	formatLong: Sd,
	formatRelative: wd,
	localize: Ed,
	match: {
		ordinalNumber: Ad({
			matchPattern: /^(\d+)(th|st|nd|rd)?/i,
			parsePattern: /\d+/i,
			valueCallback: (e) => parseInt(e, 10)
		}),
		era: Dd({
			matchPatterns: {
				narrow: /^(b|a)/i,
				abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
				wide: /^(before christ|before common era|anno domini|common era)/i
			},
			defaultMatchWidth: "wide",
			parsePatterns: { any: [/^b/i, /^(a|c)/i] },
			defaultParseWidth: "any"
		}),
		quarter: Dd({
			matchPatterns: {
				narrow: /^[1234]/i,
				abbreviated: /^q[1234]/i,
				wide: /^[1234](th|st|nd|rd)? quarter/i
			},
			defaultMatchWidth: "wide",
			parsePatterns: { any: [
				/1/i,
				/2/i,
				/3/i,
				/4/i
			] },
			defaultParseWidth: "any",
			valueCallback: (e) => e + 1
		}),
		month: Dd({
			matchPatterns: {
				narrow: /^[jfmasond]/i,
				abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
				wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
			},
			defaultMatchWidth: "wide",
			parsePatterns: {
				narrow: [
					/^j/i,
					/^f/i,
					/^m/i,
					/^a/i,
					/^m/i,
					/^j/i,
					/^j/i,
					/^a/i,
					/^s/i,
					/^o/i,
					/^n/i,
					/^d/i
				],
				any: [
					/^ja/i,
					/^f/i,
					/^mar/i,
					/^ap/i,
					/^may/i,
					/^jun/i,
					/^jul/i,
					/^au/i,
					/^s/i,
					/^o/i,
					/^n/i,
					/^d/i
				]
			},
			defaultParseWidth: "any"
		}),
		day: Dd({
			matchPatterns: {
				narrow: /^[smtwf]/i,
				short: /^(su|mo|tu|we|th|fr|sa)/i,
				abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
				wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
			},
			defaultMatchWidth: "wide",
			parsePatterns: {
				narrow: [
					/^s/i,
					/^m/i,
					/^t/i,
					/^w/i,
					/^t/i,
					/^f/i,
					/^s/i
				],
				any: [
					/^su/i,
					/^m/i,
					/^tu/i,
					/^w/i,
					/^th/i,
					/^f/i,
					/^sa/i
				]
			},
			defaultParseWidth: "any"
		}),
		dayPeriod: Dd({
			matchPatterns: {
				narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
				any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
			},
			defaultMatchWidth: "any",
			parsePatterns: { any: {
				am: /^a/i,
				pm: /^p/i,
				midnight: /^mi/i,
				noon: /^no/i,
				morning: /morning/i,
				afternoon: /afternoon/i,
				evening: /evening/i,
				night: /night/i
			} },
			defaultParseWidth: "any"
		})
	},
	options: {
		weekStartsOn: 0,
		firstWeekContainsDate: 1
	}
};
function Md(e, t) {
	let n = X(e, t?.in);
	return td(n, _d(n)) + 1;
}
function Nd(e, t) {
	let n = X(e, t?.in), r = Xu(n) - +nd(n);
	return Math.round(r / Lu) + 1;
}
function Pd(e, t) {
	let n = X(e, t?.in), r = n.getFullYear(), i = Ju(), a = t?.firstWeekContainsDate ?? t?.locale?.options?.firstWeekContainsDate ?? i.firstWeekContainsDate ?? i.locale?.options?.firstWeekContainsDate ?? 1, o = Y(t?.in || e, 0);
	o.setFullYear(r + 1, 0, a), o.setHours(0, 0, 0, 0);
	let s = Yu(o, t), c = Y(t?.in || e, 0);
	c.setFullYear(r, 0, a), c.setHours(0, 0, 0, 0);
	let l = Yu(c, t);
	return +n >= +s ? r + 1 : +n >= +l ? r : r - 1;
}
function Fd(e, t) {
	let n = Ju(), r = t?.firstWeekContainsDate ?? t?.locale?.options?.firstWeekContainsDate ?? n.firstWeekContainsDate ?? n.locale?.options?.firstWeekContainsDate ?? 1, i = Pd(e, t), a = Y(t?.in || e, 0);
	return a.setFullYear(i, 0, r), a.setHours(0, 0, 0, 0), Yu(a, t);
}
function Id(e, t) {
	let n = X(e, t?.in), r = Yu(n, t) - +Fd(n, t);
	return Math.round(r / Lu) + 1;
}
function Z(e, t) {
	return (e < 0 ? "-" : "") + Math.abs(e).toString().padStart(t, "0");
}
var Ld = {
	y(e, t) {
		let n = e.getFullYear(), r = n > 0 ? n : 1 - n;
		return Z(t === "yy" ? r % 100 : r, t.length);
	},
	M(e, t) {
		let n = e.getMonth();
		return t === "M" ? String(n + 1) : Z(n + 1, 2);
	},
	d(e, t) {
		return Z(e.getDate(), t.length);
	},
	a(e, t) {
		let n = e.getHours() / 12 >= 1 ? "pm" : "am";
		switch (t) {
			case "a":
			case "aa": return n.toUpperCase();
			case "aaa": return n;
			case "aaaaa": return n[0];
			default: return n === "am" ? "a.m." : "p.m.";
		}
	},
	h(e, t) {
		return Z(e.getHours() % 12 || 12, t.length);
	},
	H(e, t) {
		return Z(e.getHours(), t.length);
	},
	m(e, t) {
		return Z(e.getMinutes(), t.length);
	},
	s(e, t) {
		return Z(e.getSeconds(), t.length);
	},
	S(e, t) {
		let n = t.length, r = e.getMilliseconds();
		return Z(Math.trunc(r * 10 ** (n - 3)), t.length);
	}
}, Rd = {
	am: "am",
	pm: "pm",
	midnight: "midnight",
	noon: "noon",
	morning: "morning",
	afternoon: "afternoon",
	evening: "evening",
	night: "night"
}, zd = {
	G: function(e, t, n) {
		let r = +(e.getFullYear() > 0);
		switch (t) {
			case "G":
			case "GG":
			case "GGG": return n.era(r, { width: "abbreviated" });
			case "GGGGG": return n.era(r, { width: "narrow" });
			default: return n.era(r, { width: "wide" });
		}
	},
	y: function(e, t, n) {
		if (t === "yo") {
			let t = e.getFullYear(), r = t > 0 ? t : 1 - t;
			return n.ordinalNumber(r, { unit: "year" });
		}
		return Ld.y(e, t);
	},
	Y: function(e, t, n, r) {
		let i = Pd(e, r), a = i > 0 ? i : 1 - i;
		return t === "YY" ? Z(a % 100, 2) : t === "Yo" ? n.ordinalNumber(a, { unit: "year" }) : Z(a, t.length);
	},
	R: function(e, t) {
		return Z(Zu(e), t.length);
	},
	u: function(e, t) {
		return Z(e.getFullYear(), t.length);
	},
	Q: function(e, t, n) {
		let r = Math.ceil((e.getMonth() + 1) / 3);
		switch (t) {
			case "Q": return String(r);
			case "QQ": return Z(r, 2);
			case "Qo": return n.ordinalNumber(r, { unit: "quarter" });
			case "QQQ": return n.quarter(r, {
				width: "abbreviated",
				context: "formatting"
			});
			case "QQQQQ": return n.quarter(r, {
				width: "narrow",
				context: "formatting"
			});
			default: return n.quarter(r, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	q: function(e, t, n) {
		let r = Math.ceil((e.getMonth() + 1) / 3);
		switch (t) {
			case "q": return String(r);
			case "qq": return Z(r, 2);
			case "qo": return n.ordinalNumber(r, { unit: "quarter" });
			case "qqq": return n.quarter(r, {
				width: "abbreviated",
				context: "standalone"
			});
			case "qqqqq": return n.quarter(r, {
				width: "narrow",
				context: "standalone"
			});
			default: return n.quarter(r, {
				width: "wide",
				context: "standalone"
			});
		}
	},
	M: function(e, t, n) {
		let r = e.getMonth();
		switch (t) {
			case "M":
			case "MM": return Ld.M(e, t);
			case "Mo": return n.ordinalNumber(r + 1, { unit: "month" });
			case "MMM": return n.month(r, {
				width: "abbreviated",
				context: "formatting"
			});
			case "MMMMM": return n.month(r, {
				width: "narrow",
				context: "formatting"
			});
			default: return n.month(r, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	L: function(e, t, n) {
		let r = e.getMonth();
		switch (t) {
			case "L": return String(r + 1);
			case "LL": return Z(r + 1, 2);
			case "Lo": return n.ordinalNumber(r + 1, { unit: "month" });
			case "LLL": return n.month(r, {
				width: "abbreviated",
				context: "standalone"
			});
			case "LLLLL": return n.month(r, {
				width: "narrow",
				context: "standalone"
			});
			default: return n.month(r, {
				width: "wide",
				context: "standalone"
			});
		}
	},
	w: function(e, t, n, r) {
		let i = Id(e, r);
		return t === "wo" ? n.ordinalNumber(i, { unit: "week" }) : Z(i, t.length);
	},
	I: function(e, t, n) {
		let r = Nd(e);
		return t === "Io" ? n.ordinalNumber(r, { unit: "week" }) : Z(r, t.length);
	},
	d: function(e, t, n) {
		return t === "do" ? n.ordinalNumber(e.getDate(), { unit: "date" }) : Ld.d(e, t);
	},
	D: function(e, t, n) {
		let r = Md(e);
		return t === "Do" ? n.ordinalNumber(r, { unit: "dayOfYear" }) : Z(r, t.length);
	},
	E: function(e, t, n) {
		let r = e.getDay();
		switch (t) {
			case "E":
			case "EE":
			case "EEE": return n.day(r, {
				width: "abbreviated",
				context: "formatting"
			});
			case "EEEEE": return n.day(r, {
				width: "narrow",
				context: "formatting"
			});
			case "EEEEEE": return n.day(r, {
				width: "short",
				context: "formatting"
			});
			default: return n.day(r, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	e: function(e, t, n, r) {
		let i = e.getDay(), a = (i - r.weekStartsOn + 8) % 7 || 7;
		switch (t) {
			case "e": return String(a);
			case "ee": return Z(a, 2);
			case "eo": return n.ordinalNumber(a, { unit: "day" });
			case "eee": return n.day(i, {
				width: "abbreviated",
				context: "formatting"
			});
			case "eeeee": return n.day(i, {
				width: "narrow",
				context: "formatting"
			});
			case "eeeeee": return n.day(i, {
				width: "short",
				context: "formatting"
			});
			default: return n.day(i, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	c: function(e, t, n, r) {
		let i = e.getDay(), a = (i - r.weekStartsOn + 8) % 7 || 7;
		switch (t) {
			case "c": return String(a);
			case "cc": return Z(a, t.length);
			case "co": return n.ordinalNumber(a, { unit: "day" });
			case "ccc": return n.day(i, {
				width: "abbreviated",
				context: "standalone"
			});
			case "ccccc": return n.day(i, {
				width: "narrow",
				context: "standalone"
			});
			case "cccccc": return n.day(i, {
				width: "short",
				context: "standalone"
			});
			default: return n.day(i, {
				width: "wide",
				context: "standalone"
			});
		}
	},
	i: function(e, t, n) {
		let r = e.getDay(), i = r === 0 ? 7 : r;
		switch (t) {
			case "i": return String(i);
			case "ii": return Z(i, t.length);
			case "io": return n.ordinalNumber(i, { unit: "day" });
			case "iii": return n.day(r, {
				width: "abbreviated",
				context: "formatting"
			});
			case "iiiii": return n.day(r, {
				width: "narrow",
				context: "formatting"
			});
			case "iiiiii": return n.day(r, {
				width: "short",
				context: "formatting"
			});
			default: return n.day(r, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	a: function(e, t, n) {
		let r = e.getHours() / 12 >= 1 ? "pm" : "am";
		switch (t) {
			case "a":
			case "aa": return n.dayPeriod(r, {
				width: "abbreviated",
				context: "formatting"
			});
			case "aaa": return n.dayPeriod(r, {
				width: "abbreviated",
				context: "formatting"
			}).toLowerCase();
			case "aaaaa": return n.dayPeriod(r, {
				width: "narrow",
				context: "formatting"
			});
			default: return n.dayPeriod(r, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	b: function(e, t, n) {
		let r = e.getHours(), i;
		switch (i = r === 12 ? Rd.noon : r === 0 ? Rd.midnight : r / 12 >= 1 ? "pm" : "am", t) {
			case "b":
			case "bb": return n.dayPeriod(i, {
				width: "abbreviated",
				context: "formatting"
			});
			case "bbb": return n.dayPeriod(i, {
				width: "abbreviated",
				context: "formatting"
			}).toLowerCase();
			case "bbbbb": return n.dayPeriod(i, {
				width: "narrow",
				context: "formatting"
			});
			default: return n.dayPeriod(i, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	B: function(e, t, n) {
		let r = e.getHours(), i;
		switch (i = r >= 17 ? Rd.evening : r >= 12 ? Rd.afternoon : r >= 4 ? Rd.morning : Rd.night, t) {
			case "B":
			case "BB":
			case "BBB": return n.dayPeriod(i, {
				width: "abbreviated",
				context: "formatting"
			});
			case "BBBBB": return n.dayPeriod(i, {
				width: "narrow",
				context: "formatting"
			});
			default: return n.dayPeriod(i, {
				width: "wide",
				context: "formatting"
			});
		}
	},
	h: function(e, t, n) {
		if (t === "ho") {
			let t = e.getHours() % 12;
			return t === 0 && (t = 12), n.ordinalNumber(t, { unit: "hour" });
		}
		return Ld.h(e, t);
	},
	H: function(e, t, n) {
		return t === "Ho" ? n.ordinalNumber(e.getHours(), { unit: "hour" }) : Ld.H(e, t);
	},
	K: function(e, t, n) {
		let r = e.getHours() % 12;
		return t === "Ko" ? n.ordinalNumber(r, { unit: "hour" }) : Z(r, t.length);
	},
	k: function(e, t, n) {
		let r = e.getHours();
		return r === 0 && (r = 24), t === "ko" ? n.ordinalNumber(r, { unit: "hour" }) : Z(r, t.length);
	},
	m: function(e, t, n) {
		return t === "mo" ? n.ordinalNumber(e.getMinutes(), { unit: "minute" }) : Ld.m(e, t);
	},
	s: function(e, t, n) {
		return t === "so" ? n.ordinalNumber(e.getSeconds(), { unit: "second" }) : Ld.s(e, t);
	},
	S: function(e, t) {
		return Ld.S(e, t);
	},
	X: function(e, t, n) {
		let r = e.getTimezoneOffset();
		if (r === 0) return "Z";
		switch (t) {
			case "X": return Vd(r);
			case "XXXX":
			case "XX": return Hd(r);
			default: return Hd(r, ":");
		}
	},
	x: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "x": return Vd(r);
			case "xxxx":
			case "xx": return Hd(r);
			default: return Hd(r, ":");
		}
	},
	O: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "O":
			case "OO":
			case "OOO": return "GMT" + Bd(r, ":");
			default: return "GMT" + Hd(r, ":");
		}
	},
	z: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "z":
			case "zz":
			case "zzz": return "GMT" + Bd(r, ":");
			default: return "GMT" + Hd(r, ":");
		}
	},
	t: function(e, t, n) {
		return Z(Math.trunc(e / 1e3), t.length);
	},
	T: function(e, t, n) {
		return Z(+e, t.length);
	}
};
function Bd(e, t = "") {
	let n = e > 0 ? "-" : "+", r = Math.abs(e), i = Math.trunc(r / 60), a = r % 60;
	return a === 0 ? n + String(i) : n + String(i) + t + Z(a, 2);
}
function Vd(e, t) {
	return e % 60 == 0 ? (e > 0 ? "-" : "+") + Z(Math.abs(e) / 60, 2) : Hd(e, t);
}
function Hd(e, t = "") {
	let n = e > 0 ? "-" : "+", r = Math.abs(e), i = Z(Math.trunc(r / 60), 2), a = Z(r % 60, 2);
	return n + i + t + a;
}
var Ud = (e, t) => {
	switch (e) {
		case "P": return t.date({ width: "short" });
		case "PP": return t.date({ width: "medium" });
		case "PPP": return t.date({ width: "long" });
		default: return t.date({ width: "full" });
	}
}, Wd = (e, t) => {
	switch (e) {
		case "p": return t.time({ width: "short" });
		case "pp": return t.time({ width: "medium" });
		case "ppp": return t.time({ width: "long" });
		default: return t.time({ width: "full" });
	}
}, Gd = {
	p: Wd,
	P: (e, t) => {
		let n = e.match(/(P+)(p+)?/) || [], r = n[1], i = n[2];
		if (!i) return Ud(e, t);
		let a;
		switch (r) {
			case "P":
				a = t.dateTime({ width: "short" });
				break;
			case "PP":
				a = t.dateTime({ width: "medium" });
				break;
			case "PPP":
				a = t.dateTime({ width: "long" });
				break;
			default:
				a = t.dateTime({ width: "full" });
				break;
		}
		return a.replace("{{date}}", Ud(r, t)).replace("{{time}}", Wd(i, t));
	}
}, Kd = /^D+$/, qd = /^Y+$/, Jd = [
	"D",
	"DD",
	"YY",
	"YYYY"
];
function Yd(e) {
	return Kd.test(e);
}
function Xd(e) {
	return qd.test(e);
}
function Zd(e, t, n) {
	let r = Qd(e, t, n);
	if (console.warn(r), Jd.includes(e)) throw RangeError(r);
}
function Qd(e, t, n) {
	let r = e[0] === "Y" ? "years" : "days of the month";
	return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
var $d = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, ef = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, tf = /^'([^]*?)'?$/, nf = /''/g, rf = /[a-zA-Z]/;
function af(e, t, n) {
	let r = Ju(), i = n?.locale ?? r.locale ?? jd, a = n?.firstWeekContainsDate ?? n?.locale?.options?.firstWeekContainsDate ?? r.firstWeekContainsDate ?? r.locale?.options?.firstWeekContainsDate ?? 1, o = n?.weekStartsOn ?? n?.locale?.options?.weekStartsOn ?? r.weekStartsOn ?? r.locale?.options?.weekStartsOn ?? 0, s = X(e, n?.in);
	if (!ld(s)) throw RangeError("Invalid time value");
	let c = t.match(ef).map((e) => {
		let t = e[0];
		if (t === "p" || t === "P") {
			let n = Gd[t];
			return n(e, i.formatLong);
		}
		return e;
	}).join("").match($d).map((e) => {
		if (e === "''") return {
			isToken: !1,
			value: "'"
		};
		let t = e[0];
		if (t === "'") return {
			isToken: !1,
			value: of(e)
		};
		if (zd[t]) return {
			isToken: !0,
			value: e
		};
		if (t.match(rf)) throw RangeError("Format string contains an unescaped latin alphabet character `" + t + "`");
		return {
			isToken: !1,
			value: e
		};
	});
	i.localize.preprocessor && (c = i.localize.preprocessor(s, c));
	let l = {
		firstWeekContainsDate: a,
		weekStartsOn: o,
		locale: i
	};
	return c.map((r) => {
		if (!r.isToken) return r.value;
		let a = r.value;
		(!n?.useAdditionalWeekYearTokens && Xd(a) || !n?.useAdditionalDayOfYearTokens && Yd(a)) && Zd(a, t, String(e));
		let o = zd[a[0]];
		return o(s, a, i.localize, l);
	}).join("");
}
function of(e) {
	let t = e.match(tf);
	return t ? t[1].replace(nf, "'") : e;
}
function sf(e, t) {
	return X(e, t?.in).getDate();
}
function cf(e, t) {
	return X(e, t?.in).getDay();
}
function lf(e, t) {
	let n = X(e, t?.in), r = n.getFullYear(), i = n.getMonth(), a = Y(n, 0);
	return a.setFullYear(r, i + 1, 0), a.setHours(0, 0, 0, 0), a.getDate();
}
function uf(e, t) {
	return X(e, t?.in).getHours();
}
function df(e, t) {
	return X(e, t?.in).getMinutes();
}
function Q(e, t) {
	return X(e, t?.in).getMonth();
}
function $(e, t) {
	return X(e, t?.in).getFullYear();
}
function ff(e, t) {
	return +X(e) > +X(t);
}
function pf(e, t) {
	return +X(e) < +X(t);
}
function mf(e, t) {
	return +X(e) == +X(t);
}
function hf(e, t, n) {
	let [r, i] = $u(n?.in, e, t);
	return r.getFullYear() === i.getFullYear() && r.getMonth() === i.getMonth();
}
function gf(e, t) {
	return sd(Y(t?.in || e, e), od(t?.in || e));
}
function _f(e, t, n) {
	return Uu(e, -t, n);
}
function vf(e, t, n) {
	let r = X(e, n?.in), i = r.getFullYear(), a = r.getDate(), o = Y(n?.in || e, 0);
	o.setFullYear(i, t, 15), o.setHours(0, 0, 0, 0);
	let s = lf(o);
	return r.setMonth(t, Math.min(a, s)), r;
}
function yf(e, t, n) {
	let r = X(e, n?.in);
	return isNaN(+r) ? Y(n?.in || e, NaN) : (t.year != null && r.setFullYear(t.year), t.month != null && (r = vf(r, t.month)), t.date != null && r.setDate(t.date), t.hours != null && r.setHours(t.hours), t.minutes != null && r.setMinutes(t.minutes), t.seconds != null && r.setSeconds(t.seconds), t.milliseconds != null && r.setMilliseconds(t.milliseconds), r);
}
function bf(e, t, n) {
	let r = X(e, n?.in);
	return isNaN(+r) ? Y(n?.in || e, NaN) : (r.setFullYear(t), r);
}
function xf(e) {
	return ed(Date.now(), e);
}
function Sf(e, t, n) {
	return Wu(e, -t, n);
}
function Cf(e, t, n) {
	return Ku(e, -t, n);
}
function wf(e, t, n) {
	return rd(e, -t, n);
}
function Tf(e, t, n) {
	return ad(e, -t, n);
}
var Ef = {
	JANUARY: 0,
	FEBRUARY: 1,
	MARCH: 2,
	APRIL: 3,
	MAY: 4,
	JUNE: 5,
	JULY: 6,
	AUGUST: 7,
	SEPTEMBER: 8,
	OCTOBER: 9,
	NOVEMBER: 10,
	DECEMBER: 11
}, Df = {
	SUNDAY: 0,
	MONDAY: 1,
	TUESDAY: 2,
	WEDNESDAY: 3,
	THURSDAY: 4,
	FRIDAY: 5,
	SATURDAY: 6
}, Of = (e, t, n) => (mf(e, t) || ff(e, t)) && (mf(e, n) || pf(e, n)), kf = (e) => yf(e, {
	hours: 0,
	minutes: 0,
	seconds: 0,
	milliseconds: 0
}), Af = ({ weekStartsOn: e = Df.SUNDAY, viewing: t = /* @__PURE__ */ new Date(), selected: n = [], numberOfMonths: r = 1 } = {}) => {
	let [i, a] = O(t), o = E(() => a(xf()), []), s = E((e) => a((t) => vf(t, e)), []), c = E(() => a((e) => Sf(e, 1)), []), l = E(() => a((e) => Wu(e, 1)), []), u = E((e) => a((t) => bf(t, e)), []), d = E(() => a((e) => Tf(e, 1)), []), f = E(() => a((e) => ad(e, 1)), []), [p, m] = O(n.map(kf)), h = E(() => m([]), []), g = E((e) => p.findIndex((t) => mf(t, e)) > -1, [p]), _ = E((e, t) => {
		m(t ? Array.isArray(e) ? e : [e] : (t) => t.concat(Array.isArray(e) ? e : [e]));
	}, []), v = E((e) => m((t) => Array.isArray(e) ? t.filter((t) => !e.map((e) => e.getTime()).includes(t.getTime())) : t.filter((t) => !mf(t, e))), []);
	return {
		clearTime: kf,
		inRange: Of,
		viewing: i,
		setViewing: a,
		viewToday: o,
		viewMonth: s,
		viewPreviousMonth: c,
		viewNextMonth: l,
		viewYear: u,
		viewPreviousYear: d,
		viewNextYear: f,
		selected: p,
		setSelected: m,
		clearSelected: h,
		isSelected: g,
		select: _,
		deselect: v,
		toggle: E((e, t) => g(e) ? v(e) : _(e, t), [
			v,
			g,
			_
		]),
		selectRange: E((e, t, n) => {
			m(n ? pd({
				start: e,
				end: t
			}) : (n) => n.concat(pd({
				start: e,
				end: t
			})));
		}, []),
		deselectRange: E((e, t) => {
			m((n) => n.filter((n) => !pd({
				start: e,
				end: t
			}).map((e) => e.getTime()).includes(n.getTime())));
		}, []),
		calendar: D(() => md({
			start: gd(i),
			end: dd(Wu(i, r - 1))
		}).map((t) => hd({
			start: gd(t),
			end: dd(t)
		}, { weekStartsOn: e }).map((t) => pd({
			start: Yu(t, { weekStartsOn: e }),
			end: vd(t, { weekStartsOn: e })
		}))), [
			i,
			e,
			r
		])
	};
}, jf = new Date(2020, 0, 23), Mf = [
	"Su",
	"Mo",
	"Tu",
	"We",
	"Th",
	"Fr",
	"Sa"
], Nf = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
function Pf(e) {
	return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function Ff({ day: e, startDate: t, endDate: n, viewing: r, minDate: i, maxDate: a, onClick: o }) {
	let s = !hf(e, r), c = Pf(e), l = c.getTime() > Pf(a).getTime(), u = i ? c.getTime() < Pf(i).getTime() : !1, d = s || l || u, f = !d && sd(t, e), p = !d && sd(n, e), m = sd(t, n), h = !d && !f && !p && ff(e, t) && !ff(e, n), g = gf(e), _ = af(e, "dd");
	return /* @__PURE__ */ M("div", {
		"data-is-between": h,
		"data-is-start": f,
		"data-is-end": p,
		"data-is-today": g,
		"data-is-same-day": m,
		className: W("w-8 h-8 flex items-center justify-center", h && "bg-fill-selected", f && !m && "bg-fill-selected rounded-l-full", p && !m && "bg-fill-selected rounded-r-full"),
		children: /* @__PURE__ */ M(G, {
			variant: f || p ? "primary" : "default",
			size: "icon-sm",
			disabled: d,
			"aria-label": `Select ${af(e, "PP")}`,
			title: d ? void 0 : `Select ${af(e, "PP")}`,
			onClick: () => o(e),
			className: W("w-full h-full !rounded-full p-0 text-[11px] tabular-nums", g && !f && !p && "border border-primary", d && "opacity-20"),
			children: _
		})
	});
}
function If({ defaultViewing: e, startDate: t, endDate: n, minDate: r, maxDate: i, onSelect: a, onViewChange: o, siblingViewing: s, weekStartsOn: c }) {
	let { calendar: l, viewing: u, setViewing: d, viewPreviousMonth: f, viewNextMonth: p } = Af({
		viewing: e,
		weekStartsOn: c
	}), m = w.useRef(e);
	w.useEffect(() => {
		hf(m.current, e) || (d(e), m.current = e);
	}, [e, d]);
	let h = () => {
		f(), o(Sf(u, 1));
	}, g = () => {
		p(), o(Wu(u, 1));
	}, _ = r && r.getTime() > jf.getTime() ? r : jf, v = $(_), y = Q(_), b = v * 12 + y, x = $(i) * 12 + Q(i), S = $(u) * 12 + Q(u), C = S >= x || !!s && Q(s) === Q(Wu(u, 1)) && $(s) === $(Wu(u, 1)), ee = S <= b || !!s && Q(s) === Q(Sf(u, 1)) && $(s) === $(Sf(u, 1)), T = $(i), E = Q(i), D = $(u), O = Q(u), k = (e, t) => e * 12 + t, A = k(D, O), j = s ? k($(s), Q(s)) : null, te = [];
	for (let e = v; e <= T; e++) {
		let t = e === v ? y : 0, n = e === T ? E : 11;
		for (let r = t; r <= n; r++) te.push({
			key: k(e, r),
			year: e,
			month: r
		});
	}
	let P = (e) => {
		let t = Math.floor(e / 12), n = e % 12, r = new Date(t, n, 1);
		d(r), o(r);
	};
	return /* @__PURE__ */ N("div", { children: [
		/* @__PURE__ */ N("div", {
			className: "flex justify-center items-center py-1 gap-1",
			children: [
				/* @__PURE__ */ M(G, {
					variant: "default",
					size: "icon-sm",
					onClick: h,
					disabled: ee,
					"aria-label": "Previous month",
					title: ee ? "Disabled" : "Previous month",
					className: "disabled:cursor-not-allowed",
					children: /* @__PURE__ */ M(Du, {})
				}),
				/* @__PURE__ */ N(Us, {
					value: A,
					onValueChange: (e) => {
						e !== null && P(e);
					},
					children: [/* @__PURE__ */ M(qs, {
						size: "sm",
						"aria-label": "Month and year",
						className: "h-6 px-2 text-xs",
						children: /* @__PURE__ */ M(Gs, { children: (e) => `${Nf[e % 12]} ${Math.floor(e / 12)}` })
					}), /* @__PURE__ */ M(Js, { children: /* @__PURE__ */ M(Ws, { children: te.map(({ key: e, year: t, month: n }) => /* @__PURE__ */ N(Xs, {
						value: e,
						disabled: e === j,
						children: [
							Nf[n],
							" ",
							t
						]
					}, e)) }) })]
				}),
				/* @__PURE__ */ M(G, {
					variant: "default",
					size: "icon-sm",
					onClick: g,
					disabled: C,
					"aria-label": "Next month",
					title: C ? "Disabled" : "Next month",
					className: "disabled:cursor-not-allowed",
					children: /* @__PURE__ */ M(Ou, {})
				})
			]
		}),
		/* @__PURE__ */ M("div", {
			className: "grid grid-cols-7",
			children: l[0][0].map((e) => /* @__PURE__ */ M("div", {
				className: "w-8 h-6 flex items-center justify-center text-[10px] text-muted-foreground uppercase",
				children: Mf[cf(e)]
			}, `h-${cf(e)}`))
		}),
		/* @__PURE__ */ M("div", {
			className: "flex flex-col",
			children: l[0].map((e, o) => /* @__PURE__ */ M("div", {
				className: "grid grid-cols-7",
				children: e.map((e) => /* @__PURE__ */ M(Ff, {
					day: e,
					startDate: t,
					endDate: n,
					viewing: u,
					minDate: r,
					maxDate: i,
					onClick: a
				}, e.toISOString()))
			}, `w-${o}`))
		})
	] });
}
var Lf = {
	id: 0,
	name: "Custom",
	rangeSetter: (e) => e
}, Rf = [
	Lf,
	{
		id: 1,
		name: "Last 5 minutes",
		rangeSetter: (e) => wf(e, 5)
	},
	{
		id: 2,
		name: "Last 15 minutes",
		rangeSetter: (e) => wf(e, 15)
	},
	{
		id: 3,
		name: "Last 30 minutes",
		rangeSetter: (e) => wf(e, 30)
	},
	{
		id: 4,
		name: "Last 1 hour",
		rangeSetter: (e) => Cf(e, 1)
	},
	{
		id: 5,
		name: "Last 3 hours",
		rangeSetter: (e) => Cf(e, 3)
	},
	{
		id: 6,
		name: "Last 6 hours",
		rangeSetter: (e) => Cf(e, 6)
	},
	{
		id: 7,
		name: "Last 12 hours",
		rangeSetter: (e) => Cf(e, 12)
	},
	{
		id: 8,
		name: "Last 24 hours",
		rangeSetter: (e) => _f(e, 1)
	},
	{
		id: 9,
		name: "Last 2 days",
		rangeSetter: (e) => _f(e, 2)
	},
	{
		id: 10,
		name: "Last 7 days",
		rangeSetter: (e) => _f(e, 7)
	},
	{
		id: 11,
		name: "Last 30 days",
		rangeSetter: (e) => _f(e, 30)
	},
	{
		id: 12,
		name: "Last 90 days",
		rangeSetter: (e) => _f(e, 90)
	},
	{
		id: 13,
		name: "Last 6 months",
		rangeSetter: (e) => Sf(e, 6)
	},
	{
		id: 14,
		name: "Last 1 year",
		rangeSetter: (e) => Tf(e, 1)
	},
	{
		id: 15,
		name: "Last 2 years",
		rangeSetter: (e) => Tf(e, 2)
	}
], zf = {
	MDY: "MM/DD/YY",
	DMY: "DD/MM/YY",
	YMD: "YY-MM-DD"
}, Bf = { minimumIntegerDigits: 2 };
function Vf({ date: e, maxDate: t, onChange: n, dateFormat: r, showTime: i }) {
	let [a, o] = w.useState(Q(e) + 1), [s, c] = w.useState(sf(e)), [l, u] = w.useState($(e) % 100), [d, f] = w.useState(uf(e)), [p, m] = w.useState(df(e)), h = w.useRef(n);
	w.useEffect(() => {
		h.current = n;
	}, [n]), w.useEffect(() => {
		o(Q(e) + 1), c(sf(e)), u($(e) % 100), f(uf(e)), m(df(e));
	}, [e]);
	let g = w.useRef(!1);
	w.useEffect(() => {
		if (!g.current) return;
		let e = setTimeout(() => {
			h.current(new Date(2e3 + l, a - 1, s, d, p)), g.current = !1;
		}, 400);
		return () => clearTimeout(e);
	}, [
		a,
		s,
		l,
		d,
		p
	]);
	let _ = (e) => (t) => {
		t !== null && (g.current = !0, e(t));
	}, v = "w-7 flex-none text-center tabular-nums p-0", y = "text-xs text-muted-foreground select-none", b = r === "YMD" ? "-" : "/", x = $(t) % 100, S = l === x, C = S ? Q(t) + 1 : 12, ee = S && a === C ? sf(t) : lf(new Date(2e3 + l, a - 1)), T = /* @__PURE__ */ M($e, {
		"aria-label": "Month",
		value: a,
		onValueChange: _(o),
		min: 1,
		max: C,
		format: Bf,
		className: v
	}, "month"), E = /* @__PURE__ */ M($e, {
		"aria-label": "Day",
		value: s,
		onValueChange: _(c),
		min: 1,
		max: ee,
		format: Bf,
		className: v
	}, "day"), D = /* @__PURE__ */ M($e, {
		"aria-label": "Year",
		value: l,
		onValueChange: _(u),
		min: 0,
		max: x,
		format: Bf,
		className: v
	}, "year");
	return /* @__PURE__ */ M(Pr, { children: /* @__PURE__ */ N("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ N(Fr, { children: [/* @__PURE__ */ M(Ir, { render: /* @__PURE__ */ M(Ge, {
			className: "w-auto px-1.5",
			children: (r === "DMY" ? [
				E,
				T,
				D
			] : r === "YMD" ? [
				D,
				T,
				E
			] : [
				T,
				E,
				D
			]).map((e, t) => /* @__PURE__ */ N(w.Fragment, { children: [t > 0 && /* @__PURE__ */ M("span", {
				className: y,
				children: b
			}), e] }, t))
		}) }), /* @__PURE__ */ M(Lr, { children: zf[r] })] }), i && /* @__PURE__ */ N(Ge, {
			className: "w-auto px-1.5",
			children: [
				/* @__PURE__ */ M($e, {
					"aria-label": "Hour",
					value: d,
					onValueChange: _(f),
					min: 0,
					max: 23,
					format: Bf,
					className: v
				}),
				/* @__PURE__ */ M("span", {
					className: y,
					children: ":"
				}),
				/* @__PURE__ */ M($e, {
					"aria-label": "Minute",
					value: p,
					onValueChange: _(m),
					min: 0,
					max: 59,
					format: Bf,
					className: v
				})
			]
		})]
	}) });
}
var Hf = {
	MDY: "MM/dd/yy HH:mm:ss",
	DMY: "dd/MM/yy HH:mm:ss",
	YMD: "yy-MM-dd HH:mm:ss"
}, Uf = {
	MDY: "MM/dd/yy",
	DMY: "dd/MM/yy",
	YMD: "yy-MM-dd"
}, Wf = "(min-width: 64rem)";
function Gf(e) {
	let [t, n] = w.useState(!1);
	return w.useEffect(() => {
		let t = window.matchMedia(e), r = () => n(t.matches);
		return r(), t.addEventListener("change", r), () => t.removeEventListener("change", r);
	}, [e]), t;
}
function Kf({ value: e, onApply: t, onCancel: n, minDate: r, maxDate: i, dateFormat: a = "MDY", weekStartsOn: o, onDateTimeSettings: s, compact: c = !1, ranges: l = Rf, showHeader: u = !0, showTime: d = !0, className: f }) {
	let p = l.filter((e) => e.id !== Lf.id), m = p.length > 0, h = i ?? /* @__PURE__ */ new Date(), g = i !== void 0, _ = Gf(Wf), v = !c && _, [y, b] = w.useState(e.start), [x, S] = w.useState(e.end), [C, ee] = w.useState(e.range), [T, E] = w.useState(null), [D, O] = w.useState(e.end), [k, A] = w.useState(Sf(e.end, 1)), te = (e) => {
		let t = ed(e), n = ud(e);
		t.getTime() < y.getTime() ? (b(t), E("start")) : n.getTime() > x.getTime() || T === "start" ? (S(n), E("end")) : T === "end" ? (b(t), E("start")) : (b(t), S(n)), ee(Lf);
	}, P = (e) => {
		let t = new Date($(e), Q(e), 1);
		v ? A(t) : O(t);
	}, ne = (e) => {
		O(new Date($(e), Q(e), 1));
	}, F = (e) => {
		y.getTime() !== e.getTime() && (ee(Lf), E("start"), e.getTime() > x.getTime() ? (b(x), S(e), ne(e)) : (b(e), P(e)));
	}, re = (e) => {
		x.getTime() !== e.getTime() && (ee(Lf), E("end"), e.getTime() < y.getTime() ? (S(y), b(e), P(e)) : (S(e), ne(e)));
	}, I = () => {
		let e = /* @__PURE__ */ new Date();
		y.getTime() > e.getTime() && b(e), S(e), E("end"), ne(e);
	}, L = (e) => {
		let t = /* @__PURE__ */ new Date(), n = e.rangeSetter(t), r = e.endSetter?.(t) ?? t;
		b(n), S(r), ee(e), E(null), O(r), A(Sf(r, 1));
	}, R = d ? Hf[a] : Uf[a], ie = af(y, R), z = af(x, R);
	return /* @__PURE__ */ N("div", {
		className: W("bg-card text-foreground rounded-lg shadow-md ring-1 ring-foreground/10 overflow-hidden", c ? "w-[15rem]" : "w-[15rem] lg:w-full max-w-[42rem]", f),
		children: [
			!c && u && /* @__PURE__ */ N("div", {
				className: m ? "hidden lg:grid lg:grid-cols-[minmax(0,1fr)_9rem]" : "hidden lg:grid",
				children: [/* @__PURE__ */ N("div", {
					className: "flex items-center gap-2 px-2 py-1 bg-muted/30 border-b border-border rounded-tl-lg",
					children: [/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground uppercase tracking-wide",
						children: "Choose date range"
					}), (r || g) && /* @__PURE__ */ N("div", {
						className: "flex items-center gap-1 ml-auto",
						children: [
							r && /* @__PURE__ */ N(Et, {
								variant: "default",
								className: "text-[10px] px-1.5 py-0",
								children: ["Min: ", af(r, "MMM d, yy")]
							}),
							r && g && /* @__PURE__ */ M("span", {
								className: "text-[10px] text-muted-foreground",
								children: /* @__PURE__ */ M(Tu, { className: "size-3" })
							}),
							g && /* @__PURE__ */ N(Et, {
								variant: "default",
								className: "text-[10px] px-1.5 py-0",
								children: ["Max: ", af(h, "MMM d, yy")]
							})
						]
					})]
				}), m && /* @__PURE__ */ M("div", {
					className: "flex justify-start px-2 py-1 bg-muted/30 border-b border-l border-border rounded-tr-lg",
					children: /* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground uppercase tracking-wide",
						children: "Quick ranges"
					})
				})]
			}),
			/* @__PURE__ */ N("div", {
				className: c || !m ? "flex flex-col" : "flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_9rem]",
				children: [/* @__PURE__ */ N("div", {
					className: c ? "order-1" : "order-1 lg:order-none",
					children: [!c && /* @__PURE__ */ M("div", {
						className: "hidden lg:flex justify-center items-center px-3 pt-3 pb-1",
						children: /* @__PURE__ */ N("div", {
							className: "flex items-center gap-1.5",
							children: [
								s && /* @__PURE__ */ M(G, {
									size: "icon-xs",
									onClick: s,
									"aria-label": "Date and time settings",
									title: "Date and time settings",
									className: "text-muted-foreground hover:text-foreground",
									children: /* @__PURE__ */ M(ju, {})
								}),
								/* @__PURE__ */ M(Vf, {
									date: y,
									maxDate: h,
									onChange: F,
									dateFormat: a,
									showTime: d
								}),
								/* @__PURE__ */ M("span", {
									className: "text-xs text-muted-foreground",
									children: "to"
								}),
								/* @__PURE__ */ M(Vf, {
									date: x,
									maxDate: h,
									onChange: re,
									dateFormat: a,
									showTime: d
								}),
								d && /* @__PURE__ */ M(G, {
									variant: "link",
									size: "xs",
									onClick: I,
									"aria-label": "Set end to now",
									title: "Set end to now",
									children: "Now"
								})
							]
						})
					}), /* @__PURE__ */ N("div", {
						className: c ? "flex flex-col justify-between" : "flex flex-col lg:flex-row justify-between",
						children: [!c && /* @__PURE__ */ M("div", {
							className: "p-2 hidden lg:block",
							children: /* @__PURE__ */ M(If, {
								defaultViewing: k,
								startDate: y,
								endDate: x,
								minDate: r,
								maxDate: h,
								onSelect: te,
								onViewChange: A,
								siblingViewing: D,
								weekStartsOn: o
							})
						}), /* @__PURE__ */ M("div", {
							className: "p-2",
							children: /* @__PURE__ */ M(If, {
								defaultViewing: D,
								startDate: y,
								endDate: x,
								minDate: r,
								maxDate: h,
								onSelect: te,
								onViewChange: O,
								siblingViewing: v ? k : void 0,
								weekStartsOn: o
							})
						})]
					})]
				}), m && /* @__PURE__ */ M("div", {
					className: c ? "order-0 border-b border-border" : "order-0 lg:order-none lg:relative lg:border-l lg:border-border border-b border-border lg:border-b-0",
					children: /* @__PURE__ */ M(Da, {
						className: c ? "w-full" : "w-full lg:absolute lg:inset-0",
						children: /* @__PURE__ */ M("ul", {
							className: c ? "flex flex-row p-2 gap-px max-h-[320px]" : "flex flex-row lg:flex-col p-2 gap-px max-h-[320px]",
							children: p.map((e) => /* @__PURE__ */ M("li", {
								className: c ? void 0 : "lg:w-full",
								children: /* @__PURE__ */ M(G, {
									variant: "default",
									size: "sm",
									left: !0,
									className: c ? "whitespace-nowrap" : "whitespace-nowrap lg:w-full lg:justify-start",
									"aria-selected": C.id === e.id,
									"aria-label": `Choose ${e.name.toLowerCase()}`,
									title: e.name,
									onClick: () => L(e),
									"data-attr": `date-time-picker-quick-range-${e.name.toLowerCase().replace(/\s+/g, "-")}`,
									children: e.name
								})
							}, e.id))
						})
					})
				})]
			}),
			/* @__PURE__ */ M(nt, {}),
			/* @__PURE__ */ N("div", {
				className: "flex justify-end px-3 py-2 items-center gap-2 bg-muted/30",
				children: [
					/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground flex items-center gap-1 tabular-nums mr-auto",
						children: C.id === Lf.id ? /* @__PURE__ */ N(j, { children: [
							ie,
							" ",
							/* @__PURE__ */ M(Tu, { className: "size-3" }),
							" ",
							z
						] }) : C.name
					}),
					n ? /* @__PURE__ */ M(G, {
						variant: "outline",
						size: "sm",
						onClick: n,
						"aria-label": "Cancel",
						"data-attr": "date-time-picker-cancel",
						children: "Cancel"
					}) : null,
					/* @__PURE__ */ M(G, {
						variant: "primary",
						size: "sm",
						"aria-label": "Apply date range",
						title: "Apply date range",
						onClick: () => t({
							start: y,
							end: x,
							range: C
						}),
						"data-attr": "date-time-picker-apply-date-range",
						children: "Apply"
					})
				]
			})
		]
	});
}
var qf = {
	MDY: "MM/dd/yy HH:mm",
	DMY: "dd/MM/yy HH:mm",
	YMD: "yy-MM-dd HH:mm"
}, Jf = {
	MDY: "MM/dd/yy",
	DMY: "dd/MM/yy",
	YMD: "yy-MM-dd"
};
function Yf({ value: e, onApply: t, onCancel: n, minDate: r, maxDate: i, dateFormat: a = "MDY", weekStartsOn: o, onDateTimeSettings: s, showTime: c = !1, showTimeToggle: l = c, onIncludeTimeChange: u, className: d }) {
	let f = i ?? /* @__PURE__ */ new Date(), p = i !== void 0, [m, h] = w.useState(e), [g, _] = w.useState(c), [v, y] = w.useState(new Date($(e), Q(e), 1)), b = w.useId(), x = (e) => {
		let t = new Date(e.getFullYear(), e.getMonth(), e.getDate(), g ? uf(m) : 0, g ? df(m) : 0);
		h(t);
	}, S = (e) => {
		let t = r && e.getTime() < r.getTime() ? r : e;
		t.getTime() !== m.getTime() && (h(t), y(new Date($(t), Q(t), 1)));
	}, C = (e) => {
		_(e), u?.(e);
	}, ee = () => {
		t(g ? m : ed(m));
	}, T = af(m, g ? qf[a] : Jf[a]);
	return /* @__PURE__ */ N("div", {
		className: W("bg-card text-foreground rounded-lg shadow-md ring-1 ring-foreground/10 overflow-hidden w-[15rem]", d),
		children: [
			/* @__PURE__ */ N("div", {
				className: "flex items-center gap-2 px-2 py-1 bg-muted/30 border-b border-border rounded-t-lg",
				children: [/* @__PURE__ */ M("span", {
					className: "text-[10px] text-muted-foreground uppercase tracking-wide",
					children: "Choose date"
				}), (r || p) && /* @__PURE__ */ N("div", {
					className: "flex items-center gap-1 ml-auto",
					children: [r && /* @__PURE__ */ N(Et, {
						variant: "default",
						className: "text-[10px] px-1.5 py-0",
						children: ["Min: ", af(r, "MMM d, yy")]
					}), p && /* @__PURE__ */ N(Et, {
						variant: "default",
						className: "text-[10px] px-1.5 py-0",
						children: ["Max: ", af(f, "MMM d, yy")]
					})]
				})]
			}),
			/* @__PURE__ */ M("div", {
				className: "flex justify-center items-center px-3 pt-3 pb-1",
				children: /* @__PURE__ */ N("div", {
					className: "flex items-center gap-1.5",
					children: [s && /* @__PURE__ */ M(G, {
						size: "icon-xs",
						onClick: s,
						"aria-label": "Date and time settings",
						title: "Date and time settings",
						className: "text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ M(ju, {})
					}), /* @__PURE__ */ M(Vf, {
						date: m,
						maxDate: f,
						onChange: S,
						dateFormat: a,
						showTime: g
					})]
				})
			}),
			/* @__PURE__ */ M("div", {
				className: "p-2 flex justify-center",
				children: /* @__PURE__ */ M(If, {
					defaultViewing: v,
					startDate: m,
					endDate: m,
					minDate: r,
					maxDate: f,
					onSelect: x,
					onViewChange: y,
					weekStartsOn: o
				})
			}),
			l && /* @__PURE__ */ N("div", {
				className: "flex items-center gap-2 px-3 py-1.5 border-t border-border",
				children: [/* @__PURE__ */ M(mc, {
					checked: g,
					onCheckedChange: C,
					"aria-label": "Include time",
					id: b,
					"data-attr": "date-picker-include-time"
				}), /* @__PURE__ */ M("label", {
					htmlFor: b,
					className: "text-xs text-muted-foreground select-none",
					children: "Include time"
				})]
			}),
			/* @__PURE__ */ M(nt, {}),
			/* @__PURE__ */ N("div", {
				className: "flex justify-end px-3 py-2 items-center gap-2 bg-muted/30",
				children: [
					/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground tabular-nums mr-auto",
						children: T
					}),
					n ? /* @__PURE__ */ M(G, {
						variant: "outline",
						size: "sm",
						onClick: n,
						"aria-label": "Cancel",
						"data-attr": "date-picker-cancel",
						children: "Cancel"
					}) : null,
					/* @__PURE__ */ M(G, {
						variant: "primary",
						size: "sm",
						"aria-label": "Apply date",
						title: "Apply date",
						onClick: ee,
						"data-attr": "date-picker-apply",
						children: "Apply"
					})
				]
			})
		]
	});
}
//#endregion
export { De as Accordion, Ae as AccordionContent, Oe as AccordionItem, ke as AccordionTrigger, je as AlertDialog, Pe as AlertDialogClose, Ie as AlertDialogContent, Re as AlertDialogDescription, Be as AlertDialogFooter, ze as AlertDialogHeader, Fe as AlertDialogOverlay, Ne as AlertDialogPortal, Le as AlertDialogTitle, Me as AlertDialogTrigger, at as Autocomplete, ct as AutocompleteClear, ht as AutocompleteCollection, ut as AutocompleteContent, gt as AutocompleteEmpty, pt as AutocompleteGroup, lt as AutocompleteInput, ft as AutocompleteItem, mt as AutocompleteLabel, dt as AutocompleteList, _t as AutocompleteSeparator, yt as AutocompleteStatus, st as AutocompleteTrigger, ot as AutocompleteValue, xt as Avatar, Ct as AvatarFallback, wt as AvatarGroup, St as AvatarImage, Et as Badge, G as Button, ci as ButtonGroup, ui as ButtonGroupSeparator, li as ButtonGroupText, Lf as CUSTOM_RANGE, di as Card, hi as CardContent, mi as CardDescription, gi as CardFooter, _i as CardGroup, fi as CardHeader, pi as CardTitle, kt as ChatBubble, At as ChatBubbleContent, Dt as ChatBubbleGroup, jt as ChatBubbleReactions, Ut as ChatGlobe, Kt as ChatMarker, Xt as ChatMarkerContent, Yt as ChatMarkerIcon, Zt as ChatMarkerValue, $t as ChatMessage, en as ChatMessageAvatar, tn as ChatMessageContent, rn as ChatMessageFooter, Qt as ChatMessageGroup, nn as ChatMessageHeader, cr as ChatMessageScroller, fr as ChatMessageScrollerButton, ur as ChatMessageScrollerContent, dr as ChatMessageScrollerItem, sr as ChatMessageScrollerProvider, lr as ChatMessageScrollerViewport, hr as ChatSource, mr as ChatSourceList, gr as ChatSourceTitle, _r as ChatSourceUrl, vr as ChatStream, yr as ChatStreamLine, Mr as ChatTask, Nr as ChatTaskDetail, Cr as ChatTaskList, jr as ChatTaskListContent, Or as ChatTaskListCount, Dr as ChatTaskListLabel, Tr as ChatTaskListProgress, wr as ChatTaskListTrigger, Si as Checkbox, bi as CheckboxIndicator, Ci as Chip, wi as ChipClose, Ti as ChipGroup, Di as Collapsible, Ai as CollapsibleContent, Oi as CollapsibleHeader, ki as CollapsibleTrigger, Mi as Combobox, Ki as ComboboxChip, Gi as ComboboxChips, qi as ComboboxChipsInput, Hi as ComboboxCollection, Li as ComboboxContent, Ui as ComboboxEmpty, Bi as ComboboxGroup, Ii as ComboboxInput, zi as ComboboxItem, Vi as ComboboxLabel, Ri as ComboboxList, Ji as ComboboxListFooter, Wi as ComboboxSeparator, Pi as ComboboxTrigger, Ni as ComboboxValue, oa as ContextMenu, ga as ContextMenuCheckboxItem, la as ContextMenuContent, ua as ContextMenuGroup, fa as ContextMenuItem, da as ContextMenuLabel, sa as ContextMenuPortal, _a as ContextMenuRadioGroup, va as ContextMenuRadioItem, ya as ContextMenuSeparator, ba as ContextMenuShortcut, pa as ContextMenuSub, ha as ContextMenuSubContent, ma as ContextMenuSubTrigger, ca as ContextMenuTrigger, Fu as DataTable, Yf as DatePicker, Kf as DateTimePicker, Df as Day, ka as Dialog, La as DialogBody, Ma as DialogClose, Pa as DialogContent, za as DialogDescription, Ia as DialogFooter, Fa as DialogHeader, Na as DialogOverlay, ja as DialogPortal, Ra as DialogTitle, Aa as DialogTrigger, me as DirectionProvider, Va as Dot, Ha as Drawer, Ka as DrawerBackdrop, Ga as DrawerClose, qa as DrawerContent, Qa as DrawerDescription, Xa as DrawerFooter, Ja as DrawerHandle, Ya as DrawerHeader, Wa as DrawerPortal, Za as DrawerTitle, Ua as DrawerTrigger, $a as DropdownMenu, lo as DropdownMenuCheckboxItem, no as DropdownMenuContent, ro as DropdownMenuGroup, ao as DropdownMenuItem, io as DropdownMenuLabel, eo as DropdownMenuPortal, uo as DropdownMenuRadioGroup, fo as DropdownMenuRadioItem, ho as DropdownMenuSelectAll, po as DropdownMenuSeparator, go as DropdownMenuShortcut, oo as DropdownMenuSub, co as DropdownMenuSubContent, so as DropdownMenuSubTrigger, to as DropdownMenuTrigger, _o as Empty, Co as EmptyContent, So as EmptyDescription, vo as EmptyHeader, bo as EmptyMedia, xo as EmptyTitle, ko as Field, Ao as FieldContent, No as FieldDescription, Fo as FieldError, Do as FieldGroup, jo as FieldLabel, Eo as FieldLegend, Po as FieldSeparator, To as FieldSet, Mo as FieldTitle, Lo as Heading, Ue as Input, Ge as InputGroup, qe as InputGroupAddon, Ye as InputGroupButton, Ze as InputGroupInput, $e as InputGroupNumberInput, Xe as InputGroupText, Qe as InputGroupTextarea, Jo as Item, is as ItemActions, Xo as ItemCheckbox, ts as ItemContent, rs as ItemDescription, os as ItemFooter, Go as ItemGroup, as as ItemHeader, $o as ItemMedia, Yo as ItemMenuItem, Zo as ItemRadio, Ko as ItemSeparator, ns as ItemTitle, Xi as Kbd, Qi as KbdGroup, Zi as KbdText, wo as Label, tt as MenuLabel, ss as Menubar, ms as MenubarCheckboxItem, fs as MenubarContent, ls as MenubarGroup, ps as MenubarItem, _s as MenubarLabel, cs as MenubarMenu, us as MenubarPortal, hs as MenubarRadioGroup, gs as MenubarRadioItem, vs as MenubarSeparator, ys as MenubarShortcut, bs as MenubarSub, Ss as MenubarSubContent, xs as MenubarSubTrigger, ds as MenubarTrigger, Ef as Month, Ho as NumberFieldDecrement, zo as NumberFieldGroup, Vo as NumberFieldIncrement, Bo as NumberFieldInput, Ro as NumberFieldRoot, Uo as NumberFieldScrubArea, Wo as NumberFieldScrubAreaCursor, Cs as Pagination, Es as PaginationButton, ws as PaginationContent, ks as PaginationEllipsis, Ts as PaginationItem, Os as PaginationNext, Ds as PaginationPrevious, js as Popover, Ns as PopoverContent, Ms as PopoverTrigger, Fs as Progress, Ls as ProgressIndicator, Rs as ProgressLabel, Is as ProgressTrack, zs as ProgressValue, na as RadioGroup, aa as RadioGroupItem, ta as RadioIndicator, Hs as ResizableHandle, Vs as ResizablePanel, Bs as ResizablePanelGroup, Ta as SCROLL_SHADOWS_STYLE_ID, Da as ScrollArea, Oa as ScrollBar, Us as Select, Js as SelectContent, Ws as SelectGroup, Ys as SelectGroupLabel, Xs as SelectItem, Zs as SelectSeparator, qs as SelectTrigger, Ks as SelectTriggerIcon, Gs as SelectValue, nt as Separator, ec as Skeleton, tc as SkeletonText, nc as Slider, Ve as Spinner, mc as Switch, _c as Table, yc as TableBody, Tc as TableCaption, Cc as TableCell, wc as TableEmpty, bc as TableFooter, Sc as TableHead, vc as TableHeader, xc as TableRow, Ec as Tabs, jc as TabsContent, kc as TabsList, Ac as TabsTrigger, Nc as Text, We as Textarea, Kc as ThemeProvider, zr as ThreadItem, ri as ThreadItemAction, ni as ThreadItemActions, Jr as ThreadItemAttachment, Xr as ThreadItemAttachmentContent, Zr as ThreadItemAttachmentImage, Yr as ThreadItemAttachmentTrigger, Ur as ThreadItemAuthor, Gr as ThreadItemBody, Vr as ThreadItemContent, Rr as ThreadItemGroup, Br as ThreadItemGutter, Hr as ThreadItemHeader, qr as ThreadItemLink, Kr as ThreadItemMention, $r as ThreadItemReaction, ei as ThreadItemReactionEmoji, Qr as ThreadItemReactions, ii as ThreadItemReplies, ai as ThreadItemRepliesLabel, oi as ThreadItemRepliesMeta, Wr as ThreadItemTimestamp, oc as ToastCard, cc as ToastProvider, Fc as Toggle, Lc as ToggleGroup, Rc as ToggleGroupItem, Fr as Tooltip, Lr as TooltipContent, Pr as TooltipProvider, Ir as TooltipTrigger, pc as anchoredToast, ic as anchoredToastManager, Tt as badgeVariants, Ot as bubbleVariants, si as buttonGroupVariants, He as buttonVariants, W as cn, Ba as dotVariants, As as getPaginationRange, Io as headingVariants, Wt as markerVariants, Ps as progressIndicatorVariants, Rf as quickRanges, Ea as scrollShadowsCss, Mc as textVariants, fc as toast, rc as toastManager, Pc as toggleVariants, bt as useAutocompleteAnchor, Af as useCalendar, Zn as useChatMessageScroller, Qn as useChatMessageScrollerScrollable, $n as useChatMessageScrollerVisibility, Yi as useComboboxAnchor, he as useDirection, mo as useDropdownMenuSelectAll, qc as useTheme };
