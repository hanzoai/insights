import { Accordion as e } from "@base-ui/react/accordion";
import { ArrowDown as t, ArrowDownIcon as n, ArrowLeft as r, ArrowRight as i, ArrowUp as a, ArrowUpRightIcon as o, CheckIcon as s, ChevronDownIcon as c, ChevronLeft as l, ChevronRight as u, ChevronRightIcon as d, ChevronUpIcon as f, CircleArrowRightIcon as p, CircleCheckIcon as m, CircleDashedIcon as h, CircleXIcon as g, InfoIcon as ee, ListIcon as _, Loader2Icon as v, MoreHorizontal as y, SearchIcon as te, TriangleAlertIcon as b, XIcon as x } from "lucide-react";
import * as S from "react";
import { useMemo as ne } from "react";
import { clsx as C } from "clsx";
import { extendTailwindMerge as w } from "tailwind-merge";
import { Fragment as T, jsx as E, jsxs as D } from "react/jsx-runtime";
import { AlertDialog as O } from "@base-ui/react/alert-dialog";
import { Autocomplete as k } from "@base-ui/react/autocomplete";
import { Button as re } from "@base-ui/react/button";
import { cva as A } from "class-variance-authority";
import { NumberField as j } from "@base-ui/react/number-field";
import { Input as ie } from "@base-ui/react/input";
import { mergeProps as M } from "@base-ui/react/merge-props";
import { useRender as N } from "@base-ui/react/use-render";
import { Separator as ae } from "@base-ui/react/separator";
import { Avatar as P } from "@base-ui/react/avatar";
import { Collapsible as F } from "@base-ui/react/collapsible";
import { Toggle as oe } from "@base-ui/react/toggle";
import { Toolbar as I } from "@base-ui/react/toolbar";
import { Tooltip as L } from "@base-ui/react/tooltip";
import { Checkbox as se } from "@base-ui/react/checkbox";
import { Combobox as R } from "@base-ui/react";
import { ContextMenu as z } from "@base-ui/react/context-menu";
import { Radio as B } from "@base-ui/react/radio";
import { RadioGroup as ce } from "@base-ui/react/radio-group";
import { Dialog as V } from "@base-ui/react/dialog";
import { ScrollArea as le } from "@base-ui/react/scroll-area";
import { DirectionProvider as ue, useDirection as de } from "@base-ui/react/direction-provider";
import { Drawer as H } from "@base-ui/react/drawer";
import { Menu as U } from "@base-ui/react/menu";
import { Menubar as fe } from "@base-ui/react/menubar";
import { Popover as W } from "@base-ui/react/popover";
import { Progress as G } from "@base-ui/react/progress";
import * as pe from "react-resizable-panels";
import { Select as K } from "@base-ui/react/select";
import { Slider as me } from "@base-ui/react/slider";
import { Toast as q } from "@base-ui/react/toast";
import { Switch as he } from "@base-ui/react/switch";
import { Tabs as ge } from "@base-ui/react/tabs";
import { ToggleGroup as _e } from "@base-ui/react/toggle-group";
//#region src/lib/utils.ts
var ve = w({ extend: { classGroups: { "font-size": [{ text: ["xxs"] }] } } });
function J(...e) {
	return ve(C(e));
}
//#endregion
//#region src/accordion.tsx
function ye({ className: t, ...n }) {
	return /* @__PURE__ */ E(e.Root, {
		"data-slot": "accordion",
		className: J("quill-accordion flex w-full flex-col", t),
		...n
	});
}
function be({ className: t, ...n }) {
	return /* @__PURE__ */ E(e.Item, {
		"data-quill": !0,
		"data-slot": "accordion-item",
		className: J("quill-accordion__item", t),
		...n
	});
}
function xe({ className: t, children: n, ...r }) {
	return /* @__PURE__ */ E(e.Header, {
		className: "flex",
		children: /* @__PURE__ */ D(e.Trigger, {
			"data-slot": "accordion-trigger",
			className: J("quill-accordion__trigger group/accordion-trigger relative flex flex-1 items-start justify-between gap-6", t),
			...r,
			children: [
				/* @__PURE__ */ E("span", { children: n }),
				/* @__PURE__ */ E(c, {
					"data-slot": "accordion-trigger-icon",
					"data-chevron": "down",
					className: "pointer-events-none shrink-0"
				}),
				/* @__PURE__ */ E(f, {
					"data-slot": "accordion-trigger-icon",
					"data-chevron": "up",
					className: "pointer-events-none shrink-0"
				})
			]
		})
	});
}
function Se({ className: t, children: n, ...r }) {
	return /* @__PURE__ */ E(e.Panel, {
		"data-slot": "accordion-content",
		className: "quill-accordion__panel",
		...r,
		children: /* @__PURE__ */ E("div", {
			className: J("quill-accordion__panel-content", t),
			children: n
		})
	});
}
//#endregion
//#region src/alert-dialog.tsx
function Ce({ ...e }) {
	return /* @__PURE__ */ E(O.Root, {
		"data-slot": "alert-dialog",
		...e
	});
}
function we({ ...e }) {
	return /* @__PURE__ */ E(O.Trigger, {
		"data-slot": "alert-dialog-trigger",
		...e
	});
}
function Te({ ...e }) {
	return /* @__PURE__ */ E(O.Portal, {
		"data-slot": "alert-dialog-portal",
		...e
	});
}
function Ee({ ...e }) {
	return /* @__PURE__ */ E(O.Close, {
		"data-slot": "alert-dialog-close",
		...e
	});
}
function De({ className: e, ...t }) {
	return /* @__PURE__ */ E(O.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "modal-overlay",
		"data-slot": "alert-dialog-overlay",
		className: J("quill-dialog__overlay", e),
		...t
	});
}
function Oe({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ D(Te, { children: [/* @__PURE__ */ E(De, {}), /* @__PURE__ */ E(O.Popup, {
		"data-quill": !0,
		"data-quill-portal": "modal-content",
		"data-slot": "alert-dialog-content",
		className: J("quill-dialog__content", e),
		...n,
		children: t
	})] });
}
function ke({ className: e, ...t }) {
	return /* @__PURE__ */ E(O.Title, {
		"data-slot": "alert-dialog-title",
		className: J("quill-dialog__title", e),
		...t
	});
}
function Ae({ className: e, ...t }) {
	return /* @__PURE__ */ E(O.Description, {
		"data-slot": "alert-dialog-description",
		className: J("quill-dialog__description", e),
		...t
	});
}
function je({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "alert-dialog-header",
		className: J("quill-dialog__header flex flex-col gap-1", e),
		...t
	});
}
function Me({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "alert-dialog-footer",
		className: J("quill-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", e),
		...t
	});
}
//#endregion
//#region src/spinner.tsx
function Ne({ className: e, ...t }) {
	return /* @__PURE__ */ E(v, {
		"data-quill": !0,
		role: "status",
		"aria-label": "Loading",
		className: J("quill-spinner", e),
		...t
	});
}
//#endregion
//#region src/button.tsx
var Pe = A("quill-button group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap", {
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
}), Y = S.forwardRef(({ className: e, variant: t = "default", size: n = "default", focusableWhenDisabled: r = !0, left: i = !1, loading: a = !1, disabled: o, children: s, ...c }, l) => /* @__PURE__ */ D(re, {
	ref: l,
	"data-quill": !0,
	"data-slot": "button",
	"data-size": n,
	"data-loading": a || void 0,
	"aria-busy": a || void 0,
	disabled: o || a,
	focusableWhenDisabled: a ? !0 : r,
	className: J(Pe({
		variant: t,
		size: n,
		className: e,
		focusableWhenDisabled: r,
		left: i
	})),
	...c,
	children: [s, a && /* @__PURE__ */ E(Ne, { className: "quill-button__spinner" })]
}));
Y.displayName = "Button";
//#endregion
//#region src/input.tsx
var Fe = S.forwardRef(({ className: e, type: t, ...n }, r) => /* @__PURE__ */ E(ie, {
	ref: r,
	type: t,
	"data-quill": !0,
	"data-slot": "input",
	className: J("quill-input", e),
	...n
}));
Fe.displayName = "Input";
//#endregion
//#region src/textarea.tsx
function Ie({ className: e, ...t }) {
	return /* @__PURE__ */ E("textarea", {
		"data-quill": !0,
		"data-slot": "textarea",
		className: J("quill-textarea flex", e),
		...t
	});
}
//#endregion
//#region src/input-group.tsx
var Le = S.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ E("div", {
	ref: n,
	"data-quill": !0,
	"data-slot": "input-group",
	role: "group",
	className: J("quill-input-group group/input-group flex items-center", e),
	...t
}));
Le.displayName = "InputGroup";
var Re = A("quill-input-group__addon group/input-group-addon empty:hidden flex h-auto items-center justify-center gap-1 select-none whitespace-nowrap", {
	variants: { align: {
		"inline-start": "quill-input-group__addon--align-inline-start",
		"inline-end": "quill-input-group__addon--align-inline-end",
		"block-start": "quill-input-group__addon--align-block-start justify-start",
		"block-end": "quill-input-group__addon--align-block-end justify-start"
	} },
	defaultVariants: { align: "inline-start" }
});
function ze({ className: e, align: t = "inline-start", ...n }) {
	return /* @__PURE__ */ E("div", {
		role: "group",
		"data-slot": "input-group-addon",
		"data-align": t,
		className: J(Re({ align: t }), e),
		onClick: (e) => {
			e.target.closest("button") || e.currentTarget.parentElement?.querySelector("input")?.focus();
		},
		...n
	});
}
var Be = A("quill-input-group__button flex items-center gap-2", {
	variants: { size: {
		xs: "quill-input-group__button--size-xs",
		sm: "quill-input-group__button--size-sm",
		"icon-xs": "quill-input-group__button--size-icon-xs",
		"icon-sm": "quill-input-group__button--size-icon-sm"
	} },
	defaultVariants: { size: "xs" }
}), Ve = S.forwardRef(({ className: e, type: t = "button", variant: n, size: r = "sm", ...i }, a) => /* @__PURE__ */ E(Y, {
	ref: a,
	type: t,
	"data-size": r,
	variant: n,
	className: J(Be({ size: r }), e),
	...i
}));
Ve.displayName = "InputGroupButton";
function He({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		className: J("quill-input-group__text flex items-end gap-2", e),
		...t
	});
}
var Ue = S.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ E(Fe, {
	ref: n,
	"data-slot": "input-group-control",
	className: J("quill-input-group__control", e),
	...t
}));
Ue.displayName = "InputGroupInput";
function We({ className: e, ...t }) {
	return /* @__PURE__ */ E(Ie, {
		"data-slot": "input-group-control",
		className: J("quill-input-group__control quill-input-group__control--textarea", e),
		...t
	});
}
function Ge({ className: e, inputRef: t, ...n }) {
	return /* @__PURE__ */ E(j.Root, {
		...n,
		children: /* @__PURE__ */ E(j.ScrubArea, {
			"data-slot": "input-group-scrub-area",
			className: "cursor-ew-resize",
			children: /* @__PURE__ */ E(j.Input, {
				ref: t,
				"data-slot": "input-group-control",
				className: J("quill-input-group__control h-8 w-full min-w-0 px-2 py-0.5 text-xs tabular-nums text-center outline-none placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", e)
			})
		})
	});
}
//#endregion
//#region src/menu-empty.tsx
function Ke({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E("div", {
		...n,
		"data-slot": "menu-empty",
		role: "status",
		"aria-live": "polite",
		className: J(Pe({
			size: "sm",
			left: !0,
			inert: !0
		}), "quill-menu-empty", e),
		children: t
	});
}
//#endregion
//#region src/menu-label.tsx
function qe({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "div",
		props: M({
			"data-quill": "",
			"data-slot": "menu-label",
			className: J("quill-menu-label", e)
		}, n),
		render: t
	});
}
//#endregion
//#region src/separator.tsx
function Je({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ E(ae, {
		"data-quill": !0,
		"data-slot": "separator",
		orientation: t,
		className: J("quill-separator shrink-0", e),
		...n
	});
}
//#endregion
//#region src/autocomplete.tsx
var Ye = S.createContext(null), Xe = k.Root;
function Ze({ children: e, autoHighlight: t = !0, ...n }) {
	let r = S.useRef(null);
	return /* @__PURE__ */ E(Ye.Provider, {
		value: r,
		children: /* @__PURE__ */ E(Xe, {
			...n,
			autoHighlight: t,
			children: e
		})
	});
}
function Qe({ ...e }) {
	return /* @__PURE__ */ E(k.Value, {
		"data-slot": "autocomplete-value",
		...e
	});
}
var $e = S.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ D(k.Trigger, {
	ref: r,
	"data-slot": "autocomplete-trigger",
	className: J("quill-autocomplete__trigger", e),
	...n,
	children: [t, /* @__PURE__ */ E(c, { className: "pointer-events-none size-3.5 text-muted-foreground" })]
}));
$e.displayName = "AutocompleteTrigger";
function et({ className: e, ...t }) {
	return /* @__PURE__ */ E(k.Clear, {
		"data-slot": "autocomplete-clear",
		render: /* @__PURE__ */ E(Ve, { size: "icon-xs" }),
		className: J(e),
		...t,
		children: /* @__PURE__ */ E(x, { className: "pointer-events-none" })
	});
}
function tt({ className: e, children: t, disabled: n = !1, showSearchIcon: r = !0, showClear: i = !1, ...a }) {
	return /* @__PURE__ */ D("div", {
		"data-slot": "autocomplete-input-group-wrapper",
		children: [/* @__PURE__ */ D(Le, {
			ref: S.useContext(Ye),
			className: J("w-auto", e),
			children: [
				r && /* @__PURE__ */ E(ze, {
					align: "inline-start",
					children: /* @__PURE__ */ E(te, {})
				}),
				/* @__PURE__ */ E(k.Input, {
					render: /* @__PURE__ */ E(Ue, { disabled: n }),
					...a
				}),
				t ? /* @__PURE__ */ E(ze, {
					align: "inline-end",
					children: t
				}) : null,
				i && /* @__PURE__ */ E(ze, {
					align: "inline-end",
					children: /* @__PURE__ */ E(et, { disabled: n })
				})
			]
		}), /* @__PURE__ */ E(Je, {
			orientation: "horizontal",
			"data-slot": "autocomplete-popover-separator",
			className: "w-[calc(100%+var(--spacing))]"
		})]
	});
}
function nt({ className: e, side: t = "bottom", sideOffset: n = 6, align: r = "start", alignOffset: i = 0, anchor: a, ...o }) {
	let s = S.useContext(Ye), c = a ?? s;
	return /* @__PURE__ */ E(k.Portal, { children: /* @__PURE__ */ E(k.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: t,
		sideOffset: n,
		align: r,
		alignOffset: i,
		anchor: c,
		className: "isolate",
		children: /* @__PURE__ */ E(k.Popup, {
			"data-slot": "autocomplete-content",
			className: J("quill-autocomplete__content group/autocomplete-content", e),
			...o
		})
	}) });
}
function rt({ className: e, ...t }) {
	return /* @__PURE__ */ E(k.List, {
		"data-slot": "autocomplete-list",
		className: J("quill-autocomplete__list scroll-mask-t-2 scroll-mask-b-4 scroll-pb-4 scroll-pt-6 empty:hidden", e),
		...t
	});
}
function it({ className: e, children: t, title: n, ...r }) {
	return /* @__PURE__ */ E(k.Item, {
		"data-slot": "autocomplete-item",
		className: J("quill-autocomplete__item", e),
		title: n ?? (typeof t == "string" ? t : void 0),
		render: /* @__PURE__ */ E(Y, {
			left: !0,
			className: "font-normal min-w-0 aria-selected:bg-fill-selected data-highlighted:border-ring data-highlighted:ring-2 data-highlighted:ring-ring/30 ring-offset-1"
		}),
		tabIndex: -1,
		...r,
		children: /* @__PURE__ */ E("span", {
			className: "flex items-center gap-1.5 min-w-0 truncate",
			children: t
		})
	});
}
function at({ className: e, ...t }) {
	return /* @__PURE__ */ E(k.Group, {
		"data-slot": "autocomplete-group",
		className: J("pb-1", e),
		...t
	});
}
function ot({ className: e, ...t }) {
	return /* @__PURE__ */ E(k.GroupLabel, {
		"data-slot": "autocomplete-label",
		className: J("quill-autocomplete__label mb-1 -mx-1 w-[calc(100%+var(--spacing)*2)]", e),
		render: /* @__PURE__ */ E(qe, {}),
		...t
	});
}
function st({ ...e }) {
	return /* @__PURE__ */ E(k.Collection, {
		"data-slot": "autocomplete-collection",
		...e
	});
}
function ct({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(k.Empty, {
		"data-slot": "autocomplete-empty",
		className: J("quill-autocomplete__empty", e),
		...n,
		children: /* @__PURE__ */ E(Ke, { children: t })
	});
}
function lt({ className: e, ...t }) {
	return /* @__PURE__ */ E(k.Separator, {
		"data-slot": "autocomplete-separator",
		className: J("quill-autocomplete__separator my-0", e),
		...t
	});
}
function ut(e) {
	return Array.isArray(e) ? e.reduce((e, t) => t && typeof t == "object" && "items" in t && Array.isArray(t.items) ? e + t.items.length : e + 1, 0) : 0;
}
function dt({ className: e, children: t, emptyContent: n, ...r }) {
	let i = ut(k.useFilteredItems()), a;
	return a = typeof t == "function" ? t(i) : t === void 0 ? i === 0 ? n : `${i} ${i === 1 ? "result" : "results"}` : t, /* @__PURE__ */ E(k.Status, {
		"data-slot": "autocomplete-status",
		className: J("quill-autocomplete__status bg-card border-b border-border text-xs text-muted-foreground px-2 py-1.5 empty:hidden", e),
		...r,
		children: a
	});
}
function ft() {
	let e = S.useContext(Ye);
	if (e === null) throw Error("useAutocompleteAnchor must be used within an Autocomplete");
	return e;
}
//#endregion
//#region src/avatar.tsx
var pt = S.forwardRef(function({ className: e, size: t = "default", ...n }, r) {
	return /* @__PURE__ */ E(P.Root, {
		ref: r,
		"data-quill": !0,
		"data-slot": "avatar",
		"data-size": t,
		className: J("quill-avatar", e),
		...n
	});
}), mt = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E(P.Image, {
		ref: n,
		"data-slot": "avatar-image",
		className: J("quill-avatar__image", e),
		...t
	});
}), ht = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E(P.Fallback, {
		ref: n,
		"data-slot": "avatar-fallback",
		className: J("quill-avatar__fallback", e),
		...t
	});
});
function gt({ className: e, stacked: t = !1, reverse: n = !1, size: r = "default", children: i, style: a, ...o }) {
	let s = S.Children.toArray(i);
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "avatar-group",
		"data-stacked": t ? "" : void 0,
		"data-reverse": n ? "" : void 0,
		"data-size": r,
		className: J("quill-avatar-group", e),
		style: {
			...a,
			"--avatar-count": s.length
		},
		...o,
		children: s.map((e, t) => {
			let n = S.isValidElement(e) && e.type === pt && e.props.size === void 0 ? S.cloneElement(e, { size: r }) : e;
			return /* @__PURE__ */ E("span", {
				"data-slot": "avatar-group-item",
				className: "quill-avatar-group__item",
				style: { "--avatar-index": t },
				children: n
			}, t);
		})
	});
}
pt.displayName = "Avatar", mt.displayName = "AvatarImage", ht.displayName = "AvatarFallback";
//#endregion
//#region src/badge.tsx
var _t = A("quill-badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap", {
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
function vt({ className: e, variant: t = "default", render: n, ...r }) {
	return N({
		defaultTagName: "span",
		props: M({
			"data-quill": "",
			className: J(_t({ variant: t }), e)
		}, r),
		render: n,
		state: {
			slot: "badge",
			variant: t
		}
	});
}
//#endregion
//#region src/chat/chat-bubble.tsx
function yt({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "bubble-group",
		className: J("quill-chat-bubble-group", e),
		...t
	});
}
var bt = A("quill-chat-bubble", {
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
function xt({ variant: e = "default", align: t = "start", className: n, ...r }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "bubble",
		"data-variant": e,
		"data-align": t,
		className: J(bt({ variant: e }), n),
		...r
	});
}
function St({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "div",
		props: M({
			"data-slot": "bubble-content",
			className: J("quill-chat-bubble__content", e)
		}, n),
		render: t,
		state: { slot: "bubble-content" }
	});
}
function Ct({ side: e = "bottom", align: t = "end", className: n, ...r }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "bubble-reactions",
		"data-align": t,
		"data-side": e,
		className: J("quill-chat-bubble-reactions", n),
		...r
	});
}
//#endregion
//#region src/lib/use-reduced-motion.ts
var wt = "(prefers-reduced-motion: reduce)";
function Tt(e) {
	let t = window.matchMedia(wt);
	return t.addEventListener("change", e), () => t.removeEventListener("change", e);
}
function Et() {
	return S.useSyncExternalStore(Tt, () => window.matchMedia(wt).matches, () => !1);
}
//#endregion
//#region src/chat/chat-globe.tsx
var X = {
	left: "M6.057 11.565 C2.081 11.565 0.371 8.159 0.371 5.964 C0.371 3.642 2.152 0.329 6.05 0.329",
	midLeft: "M6.012 11.55 C4.575 10.496 3.333 8.116 3.321 5.964 C3.307 3.399 4.974 0.977 6.012 0.329",
	midRight: "M6.012 11.55 C7.211 10.781 8.715 8.287 8.715 5.964 C8.715 3.399 7.24 1.233 6.012 0.329",
	right: "M6.012 11.55 C9.677 11.55 11.65 8.487 11.65 5.964 C11.65 3.499 9.748 0.329 6.012 0.329"
}, Dt = [
	X.left,
	X.midLeft,
	X.midRight,
	X.right,
	X.left
].join(";"), Ot = 13.48;
Math.round((Ot - 12) / 2 * 100) / 100;
var kt = `-0.74 -0.74 ${Ot} ${Ot}`, At = .95, jt = "7.2s", Mt = [
	"0s",
	"-1.2s",
	"-2.4s",
	"-3.6s",
	"-4.8s",
	"-6s"
], Nt = "0.42 0 0.58 1";
function Pt({ className: e, ...t }) {
	let n = Et();
	return /* @__PURE__ */ D("svg", {
		"data-quill": !0,
		"data-slot": "globe",
		viewBox: kt,
		width: "14",
		height: "14",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: At,
		strokeLinecap: "round",
		"aria-hidden": "true",
		className: J("quill-chat-globe", e),
		...t,
		children: [
			/* @__PURE__ */ E("circle", {
				cx: "6",
				cy: "6",
				r: "5.7",
				opacity: "0.9"
			}),
			/* @__PURE__ */ E("line", {
				x1: "0.3",
				y1: "6",
				x2: "11.7",
				y2: "6",
				opacity: "0.9"
			}),
			n ? /* @__PURE__ */ D(T, { children: [/* @__PURE__ */ E("path", {
				d: X.midLeft,
				opacity: "0.9"
			}), /* @__PURE__ */ E("path", {
				d: X.midRight,
				opacity: "0.9"
			})] }) : Mt.map((e) => /* @__PURE__ */ D("path", {
				d: X.left,
				opacity: "0",
				children: [/* @__PURE__ */ E("animate", {
					attributeName: "d",
					dur: jt,
					begin: e,
					repeatCount: "indefinite",
					calcMode: "spline",
					keyTimes: "0;0.25;0.5;0.75;1",
					keySplines: [
						Nt,
						Nt,
						Nt,
						Nt
					].join(";"),
					values: Dt
				}), /* @__PURE__ */ E("animate", {
					attributeName: "opacity",
					dur: jt,
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
//#endregion
//#region src/chat/chat-marker.tsx
var Ft = A("quill-chat-marker", {
	variants: { variant: {
		default: "",
		separator: "quill-chat-marker--separator",
		border: "quill-chat-marker--border"
	} },
	defaultVariants: { variant: "default" }
}), It = S.createContext(void 0);
function Lt({ body: e, ...t }) {
	return e != null && e !== !1 && e !== "" ? /* @__PURE__ */ E(zt, {
		body: e,
		...t
	}) : /* @__PURE__ */ E(Rt, { ...t });
}
function Rt({ className: e, variant: t = "default", status: n, render: r, defaultOpen: i, open: a, onOpenChange: o, ...s }) {
	let c = N({
		defaultTagName: "div",
		props: M({
			"data-quill": "",
			"data-slot": "marker",
			"data-variant": t,
			"data-status": n,
			className: J("quill-chat-row", Ft({
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
	return /* @__PURE__ */ E(It.Provider, {
		value: n,
		children: c
	});
}
function zt({ className: e, variant: t = "default", status: n, body: r, defaultOpen: i, open: a, onOpenChange: o, children: s, render: c, ...l }) {
	return /* @__PURE__ */ E(It.Provider, {
		value: n,
		children: /* @__PURE__ */ D(F.Root, {
			"data-quill": !0,
			"data-slot": "marker",
			"data-variant": t,
			"data-status": n,
			defaultOpen: i,
			open: a,
			onOpenChange: o,
			className: J(Ft({ variant: t }), "quill-chat-marker--collapsible"),
			children: [/* @__PURE__ */ D(F.Trigger, {
				className: J("quill-chat-row", "quill-chat-row--interactive", "quill-chat-marker__trigger", e),
				render: c,
				...l,
				children: [s, /* @__PURE__ */ E(d, {
					"aria-hidden": "true",
					className: J("quill-chat-chevron", "quill-chat-chevron--reveal")
				})]
			}), /* @__PURE__ */ E(F.Panel, {
				"data-slot": "marker-panel",
				className: J("quill-chat-collapse", "quill-chat-rail", "quill-chat-marker__panel"),
				children: r
			})]
		})
	});
}
function Bt({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "marker-icon",
		"aria-hidden": "true",
		className: J("quill-chat-marker__icon", e),
		...t
	});
}
function Vt({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "marker-content",
		className: J("quill-chat-marker__content", S.useContext(It) === "running" && "quill-shimmer", e),
		...t
	});
}
function Ht({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "marker-value",
		className: J("quill-chat-marker__value", e),
		...t
	});
}
//#endregion
//#region src/chat/chat-message.tsx
function Ut({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "message-group",
		className: J("quill-chat-message-group", e),
		...t
	});
}
function Wt({ className: e, align: t = "start", ...n }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "message",
		"data-align": t,
		className: J("quill-chat-message", e),
		...n
	});
}
function Gt({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "message-avatar",
		className: J("quill-chat-message__avatar", e),
		...t
	});
}
function Kt({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "message-content",
		className: J("quill-chat-message__content", e),
		...t
	});
}
function qt({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "message-header",
		className: J("quill-chat-message__header", e),
		...t
	});
}
function Jt({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "message-footer",
		className: J("quill-chat-message__footer", e),
		...t
	});
}
//#endregion
//#region ../../../../node_modules/.pnpm/@shadcn+react@0.1.0_@types+react@18.3.27_react@18.3.1/node_modules/@shadcn/react/dist/message-scroller/index.js
function Yt({ defaultTagName: e, props: t, render: n, state: r = {}, stateAttributesMapping: i }) {
	let a = Xt(Zt(r, i), t);
	if (!n) return S.createElement(e, a);
	if (typeof n == "function") return n(a, r);
	if (!S.isValidElement(n)) return null;
	let o = n.props, s = {
		...Xt(a, o),
		ref: en(a.ref, o.ref)
	};
	return S.cloneElement(n, s);
}
function Xt(...e) {
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
			} : n === "ref" ? t[n] = en(i, r) : $t(n) && typeof i == "function" && typeof r == "function" ? t[n] = Qt(r, i) : t[n] = r;
		}
	}
	return t;
}
function Zt(e, t) {
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
function Qt(e, t) {
	return function(n) {
		e(n), n.defaultPrevented || t(n);
	};
}
function $t(e) {
	return /^on[A-Z]/.test(e);
}
function en(...e) {
	let t = e.filter(Boolean);
	if (t.length !== 0) return (e) => {
		for (let n of t) typeof n == "function" ? n(e) : n && (n.current = e);
	};
}
var tn = 8, nn = 64, rn = 0, an = .5, on = 180, sn = /* @__PURE__ */ new Set([
	"ArrowDown",
	"ArrowUp",
	"End",
	"Home",
	"PageDown",
	"PageUp",
	" "
]), cn = {
	start: !1,
	end: !1
}, ln = {
	currentAnchorId: null,
	visibleMessageIds: []
};
function un({ content: e, scrollEdgeThreshold: t, spacer: n, viewport: r }) {
	if (!r || !e) return cn;
	let i = Sn({
		content: e,
		spacer: n,
		viewport: r
	});
	return {
		start: r.scrollTop > t,
		end: i - r.scrollTop - r.clientHeight > t
	};
}
function dn({ content: e, scrollMargin: t, scrollPreviousItemPeek: n, spacer: r, viewport: i, visibleMessageIds: a }) {
	if (!e || !i) return ln;
	let o = i.getBoundingClientRect(), s = o.top + t + n, c = typeof IntersectionObserver > "u", l = [], u = null;
	for (let t of fn(e, r)) {
		let e = t.dataset.messageId;
		if (!e) continue;
		let n = t.dataset.scrollAnchor === "true", r = n || c ? t.getBoundingClientRect() : null;
		(c && r ? r.bottom > s && r.top < o.bottom : a.has(e)) && l.push(e), n && r && r.top <= s + an && (u = e);
	}
	return l.length === 0 && u === null ? ln : {
		currentAnchorId: u,
		visibleMessageIds: l
	};
}
function fn(e, t) {
	return Array.from(e.children).filter((e) => e instanceof HTMLElement && e !== t);
}
function pn(e, t) {
	for (let n = t; n < e.length; n++) {
		let t = e[n];
		if (t?.dataset.scrollAnchor === "true") return t;
	}
	return null;
}
function mn(e, t) {
	for (let n of e) if (n.dataset.scrollAnchor === "true" && !t.has(n)) return n;
	return null;
}
function hn(e, t) {
	let n = 0;
	for (let r = t; r < e.length; r++) if (e[r]?.dataset.scrollAnchor === "true" && (n += 1, n > 1)) return !0;
	return !1;
}
function gn(e) {
	for (let t = e.length - 1; t >= 0; t--) {
		let n = e[t];
		if (n?.dataset.scrollAnchor === "true") return n;
	}
	return null;
}
function _n({ content: e, spacer: t, viewport: n }) {
	let r = n.getBoundingClientRect();
	for (let n of fn(e, t)) {
		if (!n.dataset.messageId) continue;
		let e = n.getBoundingClientRect();
		if (e.bottom > r.top && e.top < r.bottom) return n;
	}
	return null;
}
function vn({ align: e, element: t, scrollMargin: n, spacer: r, viewport: i }) {
	let a = yn(t, i), o = t.getBoundingClientRect().height, s = Tn(r);
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
function yn(e, t) {
	let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
	return n.top - r.top + t.scrollTop;
}
function bn(e, t) {
	return e.getBoundingClientRect().top - t.getBoundingClientRect().top;
}
function xn({ content: e, scrollTop: t, spacer: n, viewport: r }) {
	let i = Sn({
		content: e,
		spacer: n,
		viewport: r
	});
	return t + r.clientHeight - i;
}
function Sn({ content: e, spacer: t, viewport: n }) {
	let r = fn(e, t), i = wn(e), a = n.getBoundingClientRect(), o = n.scrollTop, s = i.start + i.end;
	for (let e of r) {
		let t = e.getBoundingClientRect();
		s = Math.max(s, t.bottom - a.top + o + i.end);
	}
	return s;
}
function Cn(e) {
	return Math.max(0, e.scrollHeight - e.clientHeight);
}
function wn(e) {
	let t = window.getComputedStyle(e);
	return {
		end: Dn(t.paddingBlockEnd || t.paddingBottom),
		start: Dn(t.paddingBlockStart || t.paddingTop)
	};
}
function Tn(e) {
	let t = e?.parentElement;
	return t ? wn(t) : {
		end: 0,
		start: 0
	};
}
function En(e) {
	if (!e) return 0;
	let t = window.getComputedStyle(e);
	return Dn(t.rowGap === "normal" ? t.gap : t.rowGap);
}
function Dn(e) {
	if (!e) return 0;
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
function On({ refs: e, commitScrollState: t, scheduleStateCommit: n, scheduleVisibilitySync: r }) {
	let { streamingTurnRef: i, autoScrollRef: a, autoscrollingRef: o, autoscrollingTimeoutRef: s, contentRef: c, defaultScrollPositionAppliedRef: l, itemCountRef: u, messageElementsRef: d, modeRef: f, pendingScrollToMessageRef: p, prependRestoreRef: m, scrollMarginRef: h, scrollPreviousItemPeekRef: g, spacerGapRef: ee, spacerHeightRef: _, spacerRef: v, viewportRef: y } = e, te = S.useCallback((e) => {
		s.current !== null && (window.clearTimeout(s.current), s.current = null), o.current !== e && (o.current = e, t()), e && (s.current = window.setTimeout(() => {
			s.current = null, o.current = !1, t();
		}, on));
	}, [t]), b = S.useCallback((e) => {
		let t = v.current;
		if (!t) return;
		let n = Math.max(0, Math.ceil(e));
		_.current !== n && (_.current = n, t.hidden = n === 0, t.style.height = `${n}px`, t.style.marginTop = n > 0 ? `${-ee.current}px` : "");
	}, []), x = S.useCallback((e, { behavior: r = "auto", autoscrolling: i = !1 } = {}) => {
		let a = y.current;
		if (!a) return;
		let o = Math.max(0, e);
		if (Math.abs(a.scrollTop - o) <= an) {
			a.scrollTop = o, t();
			return;
		}
		i && te(!0), a.scrollTo({
			top: o,
			behavior: r
		}), n();
	}, [
		t,
		n,
		te
	]), ne = S.useCallback(({ behavior: e = "auto" } = {}) => y.current ? (b(0), i.current = null, f.current = "free-scrolling", x(0, { behavior: e }), r(), !0) : !1, [
		r,
		x,
		b
	]), C = S.useCallback(({ behavior: e = "auto" } = {}) => {
		let t = y.current;
		return t ? (b(0), i.current = null, f.current = a.current ? "following-bottom" : "free-scrolling", x(Cn(t), {
			autoscrolling: !0,
			behavior: e
		}), r(), !0) : !1;
	}, [
		r,
		x,
		b
	]), w = S.useCallback((e, { align: t = "start", behavior: n = "auto", scrollMargin: a = h.current } = {}, { keepPreviousPeek: o = !1 } = {}) => {
		let s = c.current, l = y.current;
		if (!s || !l || !s.contains(e)) return !1;
		let u = vn({
			align: t,
			element: e,
			scrollMargin: o ? a + g.current : a,
			spacer: v.current,
			viewport: l
		}), d = xn({
			content: s,
			scrollTop: u,
			spacer: v.current,
			viewport: l
		});
		return b(d), m.current = {
			element: e,
			viewportTop: bn(e, l)
		}, f.current = o ? "anchored-to-message" : "settling-jump", i.current = o ? e : null, x(u, { behavior: n }), r(), !0;
	}, [
		r,
		x,
		b
	]), T = S.useCallback(() => {
		let e = i.current;
		return !e || !e.isConnected || f.current !== "anchored-to-message" ? !1 : w(e, { align: "start" }, { keepPreviousPeek: !0 });
	}, [w]), E = S.useCallback((e, t) => {
		let n = d.current.get(e);
		return n ? (l.current = !0, w(n, t) ? (p.current = null, !0) : (p.current = {
			messageId: e,
			options: t
		}, !0)) : u.current === 0 ? (p.current = {
			messageId: e,
			options: t
		}, l.current = !0, !0) : !1;
	}, [w]);
	return {
		flushPendingScrollToMessage: S.useCallback(() => {
			let e = p.current;
			if (!e) return !1;
			let t = d.current.get(e.messageId);
			return !t || !w(t, e.options) ? !1 : (p.current = null, l.current = !0, !0);
		}, [w]),
		reanchorToAnchoredMessage: T,
		scrollToElement: w,
		scrollToEnd: C,
		scrollToMessage: E,
		scrollToStart: ne
	};
}
function kn(e, t) {
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
function An(e, t) {
	return kn(e, t);
}
function jn() {
	return kn(ln, Nn);
}
function Mn(e, t) {
	return e.start === t.start && e.end === t.end;
}
function Nn(e, t) {
	return e.currentAnchorId !== t.currentAnchorId || e.visibleMessageIds.length !== t.visibleMessageIds.length ? !1 : e.visibleMessageIds.every((e, n) => e === t.visibleMessageIds[n]);
}
function Pn({ autoScroll: e, scrollEdgeThreshold: t, scrollMargin: n, scrollPreviousItemPeek: r }) {
	let i = S.useRef(e), a = S.useRef(!1), o = S.useRef(null), s = S.useRef(!1), c = S.useRef(t), l = S.useRef(0), u = S.useRef(null), d = S.useRef(e ? "following-bottom" : "free-scrolling"), f = S.useRef(/* @__PURE__ */ new Map()), p = S.useRef(null), m = S.useRef(null), h = S.useRef(null), g = S.useRef(r), ee = S.useRef(!0), _ = S.useRef(null), v = S.useRef(n), y = S.useRef(null), te = S.useRef(0), b = S.useRef(0), x = S.useRef(null), ne = S.useRef(null), C = S.useRef(null), w = S.useRef(null), T = S.useRef(null), E = S.useRef(null), D = S.useRef(null), O = S.useRef(null), k = S.useRef(/* @__PURE__ */ new Set()), re = S.useRef(/* @__PURE__ */ new WeakSet());
	return C.current === null && (C.current = An(cn, Mn)), O.current === null && (O.current = jn()), i.current = e, c.current = t, v.current = n, g.current = r, {
		autoScrollRef: i,
		autoscrollingRef: a,
		autoscrollingTimeoutRef: w,
		streamingTurnRef: h,
		contentRef: o,
		defaultScrollPositionAppliedRef: s,
		firstItemRef: u,
		itemCountRef: l,
		messageElementsRef: f,
		modeRef: d,
		pendingScrollFrameRef: y,
		pendingScrollToMessageRef: p,
		prependRestoreRef: m,
		preserveScrollOnPrependRef: ee,
		rootRef: _,
		scrollEdgeThresholdRef: c,
		scrollMarginRef: v,
		scrollPreviousItemPeekRef: g,
		spacerGapRef: te,
		spacerHeightRef: b,
		spacerRef: x,
		stateFrameRef: ne,
		stateStore: C.current,
		viewportRef: T,
		visibilityFrameRef: E,
		visibilityObserverRef: D,
		visibilityStore: O.current,
		visibleMessageIdsRef: k,
		handledScrollAnchorsRef: re
	};
}
function Fn(e, t) {
	return S.useCallback((n) => {
		e.current = n, n && t();
	}, [e, t]);
}
function In({ autoScroll: e = !1, defaultScrollPosition: t = "end", scrollEdgeThreshold: n = tn, scrollPreviousItemPeek: r = nn, scrollMargin: i = rn }) {
	let a = Pn({
		autoScroll: e,
		scrollEdgeThreshold: n,
		scrollMargin: i,
		scrollPreviousItemPeek: r
	}), { streamingTurnRef: o, autoScrollRef: s, autoscrollingRef: c, autoscrollingTimeoutRef: l, contentRef: u, defaultScrollPositionAppliedRef: d, firstItemRef: f, itemCountRef: p, messageElementsRef: m, modeRef: h, pendingScrollFrameRef: g, pendingScrollToMessageRef: ee, prependRestoreRef: _, preserveScrollOnPrependRef: v, rootRef: y, scrollEdgeThresholdRef: te, scrollMarginRef: b, scrollPreviousItemPeekRef: x, spacerGapRef: ne, spacerRef: C, stateFrameRef: w, stateStore: T, viewportRef: E, visibilityFrameRef: D, visibilityObserverRef: O, visibilityStore: k, visibleMessageIdsRef: re, handledScrollAnchorsRef: A } = a, j = S.useRef(t);
	j.current !== t && (j.current = t, d.current = !1);
	let ie = S.useCallback((e) => {
		let t = y.current, n = E.current, r = [e.start && "start", e.end && "end"].filter(Boolean).join(" "), i = c.current;
		for (let e of [t, n]) e && (r ? e.setAttribute("data-scrollable", r) : e.removeAttribute("data-scrollable"), e.toggleAttribute("data-autoscrolling", i));
	}, []), M = S.useCallback((e) => {
		s.current && !e.end && h.current !== "settling-jump" ? h.current = "following-bottom" : h.current === "following-bottom" && e.end && !c.current && (h.current = "free-scrolling");
	}, []), N = S.useCallback(() => {
		let e = un({
			content: u.current,
			scrollEdgeThreshold: te.current,
			spacer: C.current,
			viewport: E.current
		});
		M(e), ie(e), T.setSnapshot(e);
	}, [
		M,
		T,
		ie
	]), ae = S.useCallback(() => {
		w.current === null && (w.current = window.requestAnimationFrame(() => {
			w.current = null, N();
		}));
	}, [N]), P = S.useCallback(() => {
		k.hasListeners() && D.current === null && (D.current = window.requestAnimationFrame(() => {
			D.current = null, k.hasListeners() && k.setSnapshot(dn({
				content: u.current,
				scrollMargin: b.current,
				scrollPreviousItemPeek: x.current,
				spacer: C.current,
				viewport: E.current,
				visibleMessageIds: re.current
			}));
		}));
	}, [k]), { flushPendingScrollToMessage: F, reanchorToAnchoredMessage: oe, scrollToElement: I, scrollToEnd: L, scrollToMessage: se, scrollToStart: R } = On({
		refs: a,
		commitScrollState: N,
		scheduleStateCommit: ae,
		scheduleVisibilitySync: P
	}), z = S.useCallback(() => {
		let e = _.current, t = E.current;
		if (!e || !t || !e.element.isConnected) return !1;
		let n = bn(e.element, t) - e.viewportTop;
		return Math.abs(n) <= an ? !1 : (t.scrollTop += n, e.viewportTop = bn(e.element, t), ae(), P(), !0);
	}, [ae, P]), B = S.useCallback(() => {
		let e = u.current, t = E.current;
		if (!e || !t) {
			_.current = null;
			return;
		}
		let n = _n({
			content: e,
			spacer: C.current,
			viewport: t
		});
		_.current = n ? {
			element: n,
			viewportTop: bn(n, t)
		} : null;
	}, []), ce = S.useCallback(() => {
		g.current === null && (g.current = window.requestAnimationFrame(() => {
			g.current = null, F() && B();
		}));
	}, [B, F]), V = S.useCallback(() => {
		if (!t || d.current || p.current === 0) return !1;
		let e = !1;
		if (t === "last-anchor") {
			let t = u.current, n = E.current, r = t && n ? gn(fn(t, C.current)) : null;
			if (!t || !n || !r) e = L({ behavior: "auto" });
			else {
				let i = yn(r, n);
				e = Sn({
					content: t,
					spacer: C.current,
					viewport: n
				}) - i <= n.clientHeight ? L({ behavior: "auto" }) : I(r, { align: "start" }, { keepPreviousPeek: !0 });
			}
		} else e = t === "end" ? L({ behavior: "auto" }) : R({ behavior: "auto" });
		return e ? (d.current = !0, !0) : !1;
	}, [
		t,
		I,
		L,
		R
	]), le = S.useCallback(() => {
		let e = u.current;
		if (!e) return;
		let t = fn(e, C.current), n = p.current, r = f.current;
		p.current = t.length, f.current = t[0] ?? null, (() => {
			if (F()) return;
			if (n === 0) {
				if (V() || t.length > 0 && s.current && L({ behavior: "auto" })) return;
				N(), P();
				return;
			}
			let e = r ? t.indexOf(r) : -1;
			if (v.current && e > 0) {
				z();
				return;
			}
			if (t.length > n) {
				let e = pn(t, n);
				if (e) {
					if (s.current && h.current === "following-bottom" && hn(t, n)) {
						L({ behavior: "auto" });
						return;
					}
					I(e, { align: "start" }, { keepPreviousPeek: !0 }), A.current.add(e);
					return;
				}
			}
			if (t.length === n) {
				let e = mn(t, A.current);
				if (e) {
					I(e, { align: "start" }, { keepPreviousPeek: !0 }), A.current.add(e);
					return;
				}
			}
			h.current === "following-bottom" && s.current ? L({ behavior: "auto" }) : (N(), P());
		})(), B();
	}, [
		V,
		B,
		N,
		F,
		z,
		P,
		I,
		L
	]), ue = S.useCallback(() => {
		if (h.current === "following-bottom" && s.current) {
			L({ behavior: "auto" });
			return;
		}
		oe() || (ae(), P());
	}, [
		oe,
		ae,
		P,
		L
	]), de = S.useCallback(() => {
		let e = E.current;
		if (!(!e || !k.hasListeners())) {
			if (typeof IntersectionObserver > "u") {
				P();
				return;
			}
			O.current ||= new IntersectionObserver((e) => {
				for (let t of e) {
					let e = t.target.dataset.messageId;
					e && (t.isIntersecting ? re.current.add(e) : re.current.delete(e));
				}
				P();
			}, {
				root: e,
				rootMargin: `${-(b.current + x.current)}px 0px 0px 0px`,
				threshold: [
					0,
					.01,
					.5,
					1
				]
			}), m.current.forEach((e) => {
				O.current?.observe(e);
			}), P();
		}
	}, [P, k]), H = S.useCallback(() => {
		D.current !== null && (window.cancelAnimationFrame(D.current), D.current = null), O.current?.disconnect(), O.current = null, re.current.clear(), k.setSnapshot(ln);
	}, [k]), U = S.useCallback((e, t, n) => {
		if (t) {
			m.current.set(e, t), O.current?.observe(t), P(), ee.current?.messageId === e && ce();
			return;
		}
		n && m.current.get(e) === n && (m.current.delete(e), re.current.delete(e), O.current?.unobserve(n), P());
	}, [ce, P]), fe = S.useCallback(() => {
		(h.current === "following-bottom" || h.current === "anchored-to-message" || h.current === "settling-jump") && (o.current = null, h.current = "free-scrolling");
	}, []), W = S.useCallback(() => ie(T.getSnapshot()), [T, ie]), G = Fn(y, W), pe = Fn(E, W), K = S.useCallback((e) => {
		u.current = e;
	}, []), me = S.useCallback((e) => {
		C.current = e, ne.current = En(e?.parentElement ?? null);
	}, []), q = S.useCallback(() => {
		N(), P(), B();
	}, [
		B,
		N,
		P
	]), he = S.useMemo(() => ({
		handleContentChange: le,
		handleResize: ue,
		observeVisibility: de,
		preserveScrollOnPrependRef: v,
		scrollToEnd: L,
		scrollToMessage: se,
		scrollToStart: R,
		setContentElement: K,
		setRootElement: G,
		setSpacerElement: me,
		setViewportElement: pe,
		stateStore: T,
		syncAfterScroll: q,
		unobserveVisibility: H,
		userScrollIntent: fe,
		viewportRef: E,
		visibilityStore: k
	}), [
		le,
		ue,
		de,
		L,
		se,
		R,
		K,
		G,
		me,
		pe,
		T,
		q,
		H,
		fe,
		k
	]);
	return S.useLayoutEffect(() => {
		V();
	}, [V]), S.useEffect(() => () => {
		w.current !== null && (window.cancelAnimationFrame(w.current), w.current = null), D.current !== null && (window.cancelAnimationFrame(D.current), D.current = null), l.current !== null && (window.clearTimeout(l.current), l.current = null), g.current !== null && (window.cancelAnimationFrame(g.current), g.current = null), O.current?.disconnect(), O.current = null;
	}, []), S.useLayoutEffect(() => {
		if (e && h.current === "following-bottom" && p.current > 0) {
			L({ behavior: "auto" });
			return;
		}
		N();
	}, [
		e,
		N,
		L
	]), {
		context: he,
		registerMessage: U
	};
}
function Ln(e) {
	let t = S.useRef(e);
	return t.current = e, t;
}
var Rn = S.createContext(null), zn = S.createContext(null);
function Bn() {
	let e = S.useContext(Rn);
	if (!e) throw Error("useMessageScroller must be used within a MessageScroller.");
	return e;
}
function Vn() {
	let e = S.useContext(zn);
	if (!e) throw Error("MessageScrollerItem must be used within a MessageScroller.");
	return e;
}
function Hn() {
	let { scrollToEnd: e, scrollToMessage: t, scrollToStart: n } = Bn();
	return S.useMemo(() => ({
		scrollToEnd: e,
		scrollToMessage: t,
		scrollToStart: n
	}), [
		e,
		t,
		n
	]);
}
function Un() {
	let { stateStore: e } = Bn();
	return S.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getSnapshot);
}
function Wn() {
	let { observeVisibility: e, unobserveVisibility: t, visibilityStore: n } = Bn(), r = S.useCallback((r) => n.subscribe(r, e, t), [
		e,
		t,
		n
	]);
	return S.useSyncExternalStore(r, n.getSnapshot, n.getSnapshot);
}
function Gn({ autoScroll: e = !1, children: t, defaultScrollPosition: n = "end", scrollEdgeThreshold: r, scrollPreviousItemPeek: i, scrollMargin: a }) {
	let { context: o, registerMessage: s } = In({
		autoScroll: e,
		defaultScrollPosition: n,
		scrollEdgeThreshold: r,
		scrollPreviousItemPeek: i,
		scrollMargin: a
	});
	return E(Rn.Provider, {
		value: o,
		children: E(zn.Provider, {
			value: s,
			children: t
		})
	});
}
function Kn({ children: e, ...t }) {
	let { setRootElement: n } = Bn();
	return E("div", {
		ref: n,
		...t,
		children: e
	});
}
function qn({ "aria-label": e, children: t, onKeyDown: n, onScroll: r, onTouchMove: i, onWheel: a, preserveScrollOnPrepend: o = !0, ref: s, role: c, tabIndex: l, ...u }) {
	let { handleResize: d, preserveScrollOnPrependRef: f, setViewportElement: p, syncAfterScroll: m, userScrollIntent: h, viewportRef: g } = Bn();
	f.current = o;
	let ee = S.useCallback((e) => {
		p(e), en(s)?.(e);
	}, [s, p]);
	function _(e) {
		m(), r?.(e);
	}
	function v(e) {
		h(), a?.(e);
	}
	function y(e) {
		h(), i?.(e);
	}
	function te(e) {
		sn.has(e.key) && h(), n?.(e);
	}
	return S.useEffect(() => {
		let e = g.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver(d);
		return t.observe(e), () => t.disconnect();
	}, [d, g]), E("div", {
		ref: ee,
		role: c ?? "region",
		"aria-label": e ?? "Messages",
		tabIndex: l ?? 0,
		onKeyDown: te,
		onScroll: _,
		onTouchMove: y,
		onWheel: v,
		...u,
		children: t
	});
}
function Jn({ "aria-relevant": e, children: t, ref: n, role: r, spacerClassName: i, ...a }) {
	let { handleContentChange: o, handleResize: s, setContentElement: c, setSpacerElement: l } = Bn(), u = S.useRef(null), d = S.useCallback((e) => {
		u.current = e, c(e), en(n)?.(e);
	}, [n, c]);
	return S.useLayoutEffect(() => {
		let e = u.current;
		if (!e || (o(), typeof MutationObserver > "u")) return;
		let t = new MutationObserver(() => {
			o();
		});
		return t.observe(e, { childList: !0 }), () => t.disconnect();
	}, [o]), S.useEffect(() => {
		let e = u.current;
		if (!e || typeof ResizeObserver > "u") return;
		let t = new ResizeObserver(s);
		return t.observe(e), () => t.disconnect();
	}, [s]), D("div", {
		ref: d,
		role: r ?? "log",
		"aria-relevant": e ?? "additions",
		...a,
		children: [t, E("div", {
			ref: l,
			"aria-hidden": "true",
			"data-message-scroller-spacer": "",
			hidden: !0,
			className: i
		})]
	});
}
function Yn({ messageId: e, ref: t, scrollAnchor: n = !1, ...r }) {
	let i = Vn(), a = S.useRef(null);
	return E("div", {
		ref: S.useCallback((n) => {
			let r = a.current;
			a.current = n, e && i(e, n, r), en(t)?.(n);
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
function Xn({ behavior: e = "smooth", children: t, direction: n = "end", onClick: r, render: i, tabIndex: a, type: o = "button", ...s }) {
	let { scrollToEnd: c, scrollToStart: l, stateStore: u } = Bn(), d = Ln(r), f = S.useCallback((e) => u.subscribe(e), [u]), p = S.useCallback(() => {
		let e = u.getSnapshot();
		return n === "start" ? e.start : e.end;
	}, [n, u]), m = S.useSyncExternalStore(f, p, p), h = S.useCallback((t) => {
		m && (d.current?.(t), t.defaultPrevented || (t.currentTarget.blur(), n === "start" ? l({ behavior: e }) : c({ behavior: e })));
	}, [
		e,
		n,
		m,
		d,
		c,
		l
	]);
	return Yt({
		defaultTagName: "button",
		props: Xt({
			type: o,
			inert: !m,
			tabIndex: m ? a : -1,
			children: t ?? D("span", { children: ["Scroll to ", n] }),
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
var Zn = {
	Provider: Gn,
	Root: Kn,
	Viewport: qn,
	Content: Jn,
	Item: Yn,
	Button: Xn
};
//#endregion
//#region src/chat/chat-message-scroller.tsx
function Qn(e) {
	return /* @__PURE__ */ E(Zn.Provider, { ...e });
}
function $n({ className: e, ...t }) {
	return /* @__PURE__ */ E(Zn.Root, {
		"data-quill": !0,
		"data-slot": "chat-message-scroller",
		className: J("quill-chat-message-scroller group/chat-message-scroller", e),
		...t
	});
}
function er({ className: e, ...t }) {
	return /* @__PURE__ */ E(Zn.Viewport, {
		"data-slot": "chat-message-scroller-viewport",
		className: J("quill-chat-message-scroller__viewport", e),
		...t
	});
}
function tr({ className: e, density: t = "default", ...n }) {
	return /* @__PURE__ */ E(Zn.Content, {
		"data-slot": "chat-message-scroller-content",
		"data-density": t,
		className: J("quill-chat-message-scroller__content", e),
		...n
	});
}
function nr({ className: e, scrollAnchor: t = !1, ...n }) {
	return /* @__PURE__ */ E(Zn.Item, {
		"data-slot": "chat-message-scroller-item",
		scrollAnchor: t,
		className: J("quill-chat-message-scroller__item", e),
		...n
	});
}
function rr({ direction: e = "end", className: t, children: r, render: i, ...a }) {
	return /* @__PURE__ */ E(Zn.Button, {
		"data-slot": "chat-message-scroller-button",
		"data-direction": e,
		direction: e,
		className: J("quill-chat-message-scroller__button", t),
		render: i ?? /* @__PURE__ */ E(Y, {
			variant: "outline",
			size: "icon"
		}),
		...a,
		children: r ?? /* @__PURE__ */ D(T, { children: [/* @__PURE__ */ E(n, { className: "size-4" }), /* @__PURE__ */ E("span", {
			className: "sr-only",
			children: e === "end" ? "Scroll to end" : "Scroll to start"
		})] })
	});
}
//#endregion
//#region src/chat/chat-source.tsx
var ir = {
	pending: /* @__PURE__ */ E(h, {}),
	loading: /* @__PURE__ */ E(Pt, {}),
	done: /* @__PURE__ */ E(m, {})
};
function ar({ className: e, ...t }) {
	return /* @__PURE__ */ E("ul", {
		"data-quill": !0,
		"data-slot": "source-list",
		className: J("quill-chat-source-list", e),
		...t
	});
}
function or({ status: e = "pending", className: t, children: n, href: r, render: i, ...a }) {
	return /* @__PURE__ */ E("li", {
		"data-status": e,
		className: "quill-chat-source-item",
		children: N({
			defaultTagName: r == null ? "span" : "a",
			props: M({
				"data-slot": "source",
				href: r,
				className: J("quill-chat-source", t),
				children: /* @__PURE__ */ D(T, { children: [
					/* @__PURE__ */ E("span", {
						"data-slot": "source-bullet",
						"data-status": e,
						className: "quill-chat-bullet",
						children: /* @__PURE__ */ E(S.Fragment, { children: ir[e] }, e)
					}),
					n,
					r != null && /* @__PURE__ */ E(o, {
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
function sr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "source-title",
		className: J("quill-chat-source__title", e),
		...t
	});
}
function cr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "source-url",
		className: J("quill-chat-source__url", e),
		...t
	});
}
//#endregion
//#region src/chat/chat-stream.tsx
function lr({ pinned: e = !1, className: t, children: n, onScroll: r, ...i }) {
	let a = S.useRef(null), o = S.useRef(null), [s, c] = S.useState(e), l = S.useCallback(() => {
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
	S.useLayoutEffect(() => {
		let e = o.current;
		if (!e) return;
		let t = new ResizeObserver(l);
		return t.observe(e), () => t.disconnect();
	}, [l]), S.useEffect(() => {
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
	let u = S.useRef(s);
	return S.useLayoutEffect(() => {
		let e = a.current, t = o.current;
		if (u.current && !s && e && t) {
			let n = Math.max(0, t.offsetHeight - e.clientHeight), r = t.style.transition;
			t.style.transition = "none", t.style.setProperty("--quill-chat-stream-offset", "0px"), e.scrollTop = n, t.offsetHeight, t.style.transition = r;
		}
		u.current = s, l();
	}, [s, l]), /* @__PURE__ */ E("div", {
		ref: a,
		"data-quill": !0,
		"data-slot": "stream",
		"data-pinned": s || void 0,
		onScroll: (e) => {
			l(), r?.(e);
		},
		className: J("quill-chat-stream", t),
		...i,
		children: /* @__PURE__ */ E("div", {
			ref: o,
			"data-slot": "stream-lines",
			className: "quill-chat-stream__lines",
			children: n
		})
	});
}
function ur({ className: e, ...t }) {
	return /* @__PURE__ */ E("p", {
		"data-slot": "stream-line",
		className: J("quill-chat-stream__line", e),
		...t
	});
}
//#endregion
//#region src/chat/chat-task-list.tsx
var dr = {
	pending: /* @__PURE__ */ E(h, {}),
	active: /* @__PURE__ */ E(p, {}),
	done: /* @__PURE__ */ E(m, {}),
	failed: /* @__PURE__ */ E(g, {})
}, fr = S.createContext(null);
function pr(e) {
	let t = S.useContext(fr);
	if (!t) throw Error(`${e} must be used within a ChatTaskList`);
	return t;
}
function mr({ value: e, total: t, className: n, ...r }) {
	let i = S.useMemo(() => ({
		value: e,
		total: t
	}), [e, t]);
	return /* @__PURE__ */ E(fr.Provider, {
		value: i,
		children: /* @__PURE__ */ E(F.Root, {
			"data-quill": !0,
			"data-slot": "task-list",
			className: J("quill-chat-task-list", n),
			...r
		})
	});
}
function hr({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(F.Trigger, {
		"data-slot": "task-list-trigger",
		className: J("quill-chat-row", "quill-chat-row--interactive", "quill-chat-task-list__trigger", e),
		...n,
		children: t
	});
}
function gr({ className: e, ...t }) {
	let { value: n, total: r } = pr("ChatTaskListProgress"), i = r > 0 && n >= r;
	return /* @__PURE__ */ D("span", {
		"data-slot": "task-list-progress",
		"aria-hidden": "true",
		className: J("quill-chat-swap", "quill-chat-task-list__progress", e),
		...t,
		children: [/* @__PURE__ */ E("span", {
			"data-slot": "task-list-progress-icon",
			"data-status": i ? "done" : void 0,
			className: J("quill-chat-bullet", "quill-chat-swap__icon"),
			children: n <= 0 || r <= 0 ? /* @__PURE__ */ E(_, {}) : i ? /* @__PURE__ */ E(m, {}) : /* @__PURE__ */ E(_r, {
				value: n,
				total: r
			})
		}), /* @__PURE__ */ E(d, {
			"aria-hidden": "true",
			className: J("quill-chat-chevron", "quill-chat-swap__chevron")
		})]
	});
}
function _r({ value: e, total: t }) {
	let n = Math.round(Math.min(Math.max(e, 0), t) / t * 100);
	return /* @__PURE__ */ D("svg", {
		viewBox: "0 0 24 24",
		width: "14",
		height: "14",
		fill: "none",
		className: "quill-chat-task-list__ring",
		children: [/* @__PURE__ */ E("circle", {
			className: "quill-chat-task-list__ring-track",
			cx: "12",
			cy: "12",
			r: "10.5",
			stroke: "currentColor",
			strokeWidth: "2.2",
			strokeDasharray: "2.2 4.4",
			strokeLinecap: "round"
		}), /* @__PURE__ */ E("circle", {
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
function vr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "task-list-label",
		className: J("quill-chat-task-list__label", e),
		...t
	});
}
function yr({ className: e, ...t }) {
	let { value: n, total: r } = pr("ChatTaskListCount"), i = `${Math.min(Math.max(n, 0), r)}/${r}`;
	return /* @__PURE__ */ D("span", {
		"data-slot": "task-list-count",
		className: J("quill-chat-task-list__count", e),
		...t,
		children: [/* @__PURE__ */ D("span", {
			className: "sr-only",
			children: [
				Math.min(Math.max(n, 0), r),
				" of ",
				r,
				" done"
			]
		}), /* @__PURE__ */ E("span", {
			"aria-hidden": "true",
			className: "quill-chat-task-list__digits",
			children: i.split("").map((e, t) => /* @__PURE__ */ E(xr, { char: e }, t))
		})]
	});
}
var br = 250;
function xr({ char: e }) {
	let t = S.useRef(e), [n, r] = S.useState(null), i = Et();
	return S.useEffect(() => {
		if (e === t.current) return;
		let n = t.current;
		if (t.current = e, i) return;
		r({
			from: n,
			to: e
		});
		let a = setTimeout(() => r(null), br);
		return () => clearTimeout(a);
	}, [e, i]), n ? /* @__PURE__ */ E("span", {
		className: "quill-chat-task-list__char",
		children: /* @__PURE__ */ D("span", {
			className: "quill-chat-task-list__char-roll",
			children: [/* @__PURE__ */ E("span", { children: n.from }), /* @__PURE__ */ E("span", { children: n.to })]
		})
	}) : /* @__PURE__ */ E("span", {
		className: "quill-chat-task-list__char",
		children: e
	});
}
function Sr({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(F.Panel, {
		"data-slot": "task-list-panel",
		className: J("quill-chat-collapse", "quill-chat-rail", "quill-chat-task-list__panel"),
		children: /* @__PURE__ */ E("ol", {
			"data-slot": "task-list-items",
			className: J("quill-chat-task-list__items", e),
			...n,
			children: t
		})
	});
}
function Cr({ status: e = "pending", truncate: t = !1, className: n, children: r, ...i }) {
	return /* @__PURE__ */ D("li", {
		"data-slot": "task",
		"data-status": e,
		className: J("quill-chat-task", t && "quill-chat-task--truncate", n),
		...i,
		children: [/* @__PURE__ */ E("span", {
			"data-status": e,
			className: "quill-chat-bullet",
			children: /* @__PURE__ */ E(S.Fragment, { children: dr[e] }, e)
		}), /* @__PURE__ */ E("span", {
			"data-slot": "task-label",
			className: J("quill-chat-task__label", e === "active" && "quill-shimmer"),
			children: r
		})]
	});
}
function wr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "task-detail",
		className: J("quill-chat-task__detail", e),
		...t
	});
}
//#endregion
//#region src/tooltip.tsx
function Tr({ delay: e = 250, ...t }) {
	return /* @__PURE__ */ E(L.Provider, {
		"data-slot": "tooltip-provider",
		delay: e,
		...t
	});
}
function Er({ ...e }) {
	return /* @__PURE__ */ E(L.Root, {
		"data-slot": "tooltip",
		...e
	});
}
function Dr({ ...e }) {
	return /* @__PURE__ */ E(L.Trigger, {
		"data-slot": "tooltip-trigger",
		...e
	});
}
function Or({ className: e, side: t = "top", sideOffset: n = 4, align: r = "center", alignOffset: i = 0, children: a, ...o }) {
	return /* @__PURE__ */ E(L.Portal, { children: /* @__PURE__ */ E(L.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "tooltip",
		align: r,
		alignOffset: i,
		side: t,
		sideOffset: n,
		className: "isolate",
		children: /* @__PURE__ */ D(L.Popup, {
			"data-slot": "tooltip-content",
			className: J("quill-tooltip__content inline-flex items-center gap-1.5", e),
			...o,
			children: [a, /* @__PURE__ */ E(L.Arrow, { className: "quill-tooltip__arrow data-[side=bottom]:top-[5px] data-[side=inline-end]:top-1/2! data-[side=inline-end]:-start-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-end-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-[2px] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-[2px] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-[9px]" })]
		})
	}) });
}
//#endregion
//#region src/chat/thread-item.tsx
function kr({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "thread-item-group",
		className: J("quill-thread-item-group", e),
		...t
	});
}
function Ar({ className: e, ...t }) {
	return /* @__PURE__ */ E("article", {
		"data-quill": !0,
		"data-slot": "thread-item",
		className: J("quill-thread-item", e),
		...t
	});
}
function jr({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "thread-item-gutter",
		className: J("quill-thread-item__gutter", e),
		...t
	});
}
function Mr({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "thread-item-content",
		className: J("quill-thread-item__content", e),
		...t
	});
}
function Nr({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "thread-item-header",
		className: J("quill-thread-item__header", e),
		...t
	});
}
function Pr({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "span",
		props: M({
			"data-slot": "thread-item-author",
			className: J("quill-thread-item__author", e)
		}, n),
		render: t,
		state: { slot: "thread-item-author" }
	});
}
function Fr({ className: e, ...t }) {
	return /* @__PURE__ */ E("time", {
		"data-slot": "thread-item-timestamp",
		className: J("quill-thread-item__timestamp", e),
		...t
	});
}
function Ir({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "thread-item-body",
		className: J("quill-thread-item__body", e),
		...t
	});
}
function Lr({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "span",
		props: M({
			"data-slot": "thread-item-mention",
			className: J("quill-thread-item__mention", e)
		}, n),
		render: t,
		state: { slot: "thread-item-mention" }
	});
}
function Rr({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "a",
		props: M({
			"data-slot": "thread-item-link",
			className: J("quill-thread-item__link", e)
		}, n),
		render: t,
		state: { slot: "thread-item-link" }
	});
}
function zr({ className: e, defaultOpen: t = !0, ...n }) {
	return /* @__PURE__ */ E(F.Root, {
		"data-quill": !0,
		"data-slot": "thread-item-attachment",
		defaultOpen: t,
		className: J("quill-thread-item__attachment", e),
		...n
	});
}
function Br({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ D(F.Trigger, {
		"data-slot": "thread-item-attachment-trigger",
		className: J("quill-thread-item__attachment-trigger", t),
		...n,
		children: [e, /* @__PURE__ */ E(c, {
			"data-chevron": "down",
			className: "pointer-events-none shrink-0"
		})]
	});
}
function Vr({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ E(F.Panel, {
		"data-slot": "thread-item-attachment-content",
		className: "quill-thread-item__attachment-panel",
		...n,
		children: /* @__PURE__ */ E("div", {
			className: J("quill-thread-item__attachment-panel-content", t),
			children: e
		})
	});
}
function Hr({ className: e, alt: t, ...n }) {
	return /* @__PURE__ */ E("img", {
		alt: t,
		"data-slot": "thread-item-attachment-image",
		className: J("quill-thread-item__attachment-image", e),
		...n
	});
}
function Ur({ className: e, "aria-label": t = "Reactions", ...n }) {
	return /* @__PURE__ */ E("div", {
		role: "group",
		"aria-label": t,
		"data-slot": "thread-item-reactions",
		className: J("quill-thread-item__reactions", e),
		...n
	});
}
var Wr = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E(oe, {
		ref: n,
		"data-quill": !0,
		"data-slot": "thread-item-reaction",
		className: J("quill-thread-item__reaction", e),
		...t
	});
});
function Gr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"aria-hidden": "true",
		"data-slot": "thread-item-reaction-emoji",
		className: J("quill-thread-item__reaction-emoji", e),
		...t
	});
}
var Kr = S.createContext(!1);
function qr({ className: e, "aria-label": t = "Message actions", ...n }) {
	return /* @__PURE__ */ E(Kr.Provider, {
		value: !0,
		children: /* @__PURE__ */ E(Tr, { children: /* @__PURE__ */ E(I.Root, {
			"aria-label": t,
			"data-slot": "thread-item-actions",
			className: J("quill-thread-item__actions", e),
			...n
		}) })
	});
}
var Jr = S.forwardRef(function({ label: e, tooltipSide: t = "top", size: n = "icon-sm", children: r, ...i }, a) {
	let o = S.useContext(Kr), s = /* @__PURE__ */ E(Y, {
		ref: a,
		"data-slot": "thread-item-action",
		size: n,
		"aria-label": e,
		...i
	});
	return /* @__PURE__ */ D(Er, { children: [/* @__PURE__ */ E(Dr, {
		render: o ? /* @__PURE__ */ E(I.Button, { render: s }) : s,
		children: r
	}), /* @__PURE__ */ E(Or, {
		side: t,
		children: e
	})] });
});
function Yr({ className: e, ...t }) {
	return /* @__PURE__ */ E(Y, {
		"data-slot": "thread-item-replies",
		left: !0,
		className: J("quill-thread-item__replies", e),
		...t
	});
}
function Xr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "thread-item-replies-label",
		className: J("quill-thread-item__replies-label", e),
		...t
	});
}
function Zr({ className: e, ...t }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "thread-item-replies-meta",
		className: J("quill-thread-item__replies-meta", e),
		...t
	});
}
//#endregion
//#region src/button-group.tsx
var Qr = A("quill-button-group", {
	variants: { orientation: {
		horizontal: "",
		vertical: ""
	} },
	defaultVariants: { orientation: "horizontal" }
});
function $r({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ E("div", {
		role: "group",
		"data-quill": !0,
		"data-slot": "button-group",
		"data-orientation": t,
		className: J(Qr({ orientation: t }), e),
		...n
	});
}
function ei({ className: e, render: t, ...n }) {
	return N({
		defaultTagName: "div",
		props: M({ className: J("quill-button-group__text flex items-center gap-2", e) }, n),
		render: t,
		state: { slot: "button-group-text" }
	});
}
function ti({ className: e, orientation: t = "vertical", ...n }) {
	return /* @__PURE__ */ E(Je, {
		"data-slot": "button-group-separator",
		orientation: t,
		className: J("quill-button-group__separator", e),
		...n
	});
}
//#endregion
//#region src/card.tsx
function ni({ className: e, size: t = "default", flush: n = !1, ...r }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "card",
		"data-size": t,
		"data-flush": n ? "" : void 0,
		className: J("quill-card group/card flex flex-col", e),
		...r
	});
}
function ri({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "card-header",
		className: J("quill-card__header group/card-header", e),
		...t
	});
}
var ii = S.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ E("div", {
	ref: n,
	"data-slot": "card-title",
	className: J("quill-card__title", e),
	...t
}));
ii.displayName = "CardTitle";
function ai({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "card-description",
		className: J("quill-card__description", e),
		...t
	});
}
function oi({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "card-content",
		className: J("quill-card__content", e),
		...t
	});
}
function si({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "card-footer",
		className: J("quill-card__footer", e),
		...t
	});
}
//#endregion
//#region src/card-group.tsx
function ci({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "card-group",
		"data-size": t,
		className: J("quill-card-group group/card-group", e),
		...n
	});
}
//#endregion
//#region src/checkbox.tsx
var li = A("quill-checkbox-indicator flex shrink-0 items-center justify-center", {
	variants: { size: {
		default: "quill-checkbox-indicator--size-default",
		sm: "quill-checkbox-indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
}), ui = A("", {
	variants: { size: {
		default: "quill-checkbox-icon--size-default",
		sm: "quill-checkbox-icon--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function di({ checked: e, className: t, size: n = "default" }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "checkbox-indicator",
		className: J(li({ size: n }), e && "quill-checkbox-indicator--checked", t),
		children: e && /* @__PURE__ */ E(s, { className: ui({ size: n }) })
	});
}
var fi = A("quill-checkbox peer flex shrink-0 items-center justify-center", {
	variants: { size: {
		default: "quill-checkbox--size-default",
		sm: "quill-checkbox--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function pi({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ E(se.Root, {
		"data-quill": !0,
		"data-slot": "checkbox",
		className: J(fi({ size: t }), e),
		...n,
		children: /* @__PURE__ */ E(se.Indicator, {
			"data-slot": "checkbox-primitive-indicator",
			className: "grid place-content-center text-current transition-none",
			children: /* @__PURE__ */ E(di, {
				checked: !0,
				size: t ?? "default",
				className: "border-none bg-transparent"
			})
		})
	});
}
//#endregion
//#region src/chip.tsx
var mi = S.forwardRef(({ className: e, size: t = "sm", children: n, ...r }, i) => /* @__PURE__ */ E(Y, {
	ref: i,
	render: /* @__PURE__ */ E("div", {}),
	"data-quill": !0,
	"data-slot": "chip",
	size: t,
	variant: "outline",
	className: J("quill-chip gap-1", e),
	...r,
	children: n
}));
mi.displayName = "Chip";
var hi = S.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ E(Y, {
	ref: r,
	"data-slot": "chip-close",
	size: "icon-xs",
	className: J("quill-chip-close rounded-xs", e),
	...n,
	children: t ?? /* @__PURE__ */ E(x, {})
}));
hi.displayName = "ChipClose";
function gi({ className: e, ...t }) {
	return /* @__PURE__ */ E($r, {
		"data-slot": "chip-group",
		className: J("flex-wrap gap-0", e),
		...t
	});
}
//#endregion
//#region src/collapsible.tsx
var _i = S.createContext("default");
function vi({ variant: e = "default", className: t, ...n }) {
	return /* @__PURE__ */ E(_i.Provider, {
		value: e,
		children: /* @__PURE__ */ E(F.Root, {
			"data-quill": !0,
			"data-slot": "collapsible",
			"data-variant": e,
			className: J("group/collapsible", e === "default" && "quill-collapsible--variant-default", t),
			...n
		})
	});
}
function yi({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "collapsible-header",
		className: J("quill-collapsible__header flex w-full items-center gap-1.5", e),
		...t
	});
}
function bi({ children: e, className: t, iconOnly: n = !1, icon: r, ...i }) {
	let a = S.useContext(_i);
	if (n) return /* @__PURE__ */ D(F.Trigger, {
		"data-slot": "collapsible-trigger",
		"data-variant": a,
		className: J("quill-collapsible__trigger quill-collapsible__trigger--icon group/collapsible-trigger", r != null && "quill-collapsible__trigger--swap", t),
		render: /* @__PURE__ */ E(Y, { size: "icon-sm" }),
		...i,
		children: [
			r != null && /* @__PURE__ */ E("span", {
				"data-slot": "collapsible-trigger-rest-icon",
				className: "pointer-events-none shrink-0",
				children: r
			}),
			/* @__PURE__ */ E(d, {
				"data-slot": "collapsible-trigger-icon",
				"data-chevron": "right",
				className: "pointer-events-none shrink-0"
			}),
			e != null && /* @__PURE__ */ E("span", {
				className: "sr-only",
				children: e
			})
		]
	});
	let o = /* @__PURE__ */ D(T, { children: [/* @__PURE__ */ E(c, {
		"data-slot": "collapsible-trigger-icon",
		"data-chevron": "down",
		className: "pointer-events-none shrink-0"
	}), /* @__PURE__ */ E(f, {
		"data-slot": "collapsible-trigger-icon",
		"data-chevron": "up",
		className: "pointer-events-none shrink-0"
	})] });
	return /* @__PURE__ */ D(F.Trigger, {
		"data-slot": "collapsible-trigger",
		"data-variant": a,
		className: J("quill-collapsible__trigger group/collapsible-trigger flex items-center gap-2 justify-start", a === "folder" && "quill-collapsible__trigger--variant-folder", t),
		render: /* @__PURE__ */ E(Y, { size: "sm" }),
		...i,
		children: [
			a === "folder" && o,
			e,
			a === "default" && o
		]
	});
}
function xi({ children: e, className: t, ...n }) {
	let r = S.useContext(_i);
	return /* @__PURE__ */ E(F.Panel, {
		"data-slot": "collapsible-content",
		className: "quill-collapsible__panel",
		...n,
		children: /* @__PURE__ */ E("div", {
			className: J("quill-collapsible__panel-content", r === "folder" && "quill-collapsible__panel-content--variant-folder", t),
			children: e
		})
	});
}
//#endregion
//#region src/combobox.tsx
var Si = S.createContext(null);
function Ci({ children: e, ...t }) {
	let n = S.useRef(null);
	return /* @__PURE__ */ E(Si.Provider, {
		value: n,
		children: /* @__PURE__ */ E(R.Root, {
			...t,
			children: e
		})
	});
}
function wi({ ...e }) {
	return /* @__PURE__ */ E(R.Value, {
		"data-slot": "combobox-value",
		...e
	});
}
var Ti = S.forwardRef(({ className: e, children: t, ...n }, r) => /* @__PURE__ */ D(R.Trigger, {
	ref: r,
	"data-slot": "combobox-trigger",
	className: J("quill-combobox__trigger", e),
	...n,
	children: [t, /* @__PURE__ */ E(c, { className: "pointer-events-none size-3.5 text-muted-foreground" })]
}));
Ti.displayName = "ComboboxTrigger";
function Ei({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.Clear, {
		"data-slot": "combobox-clear",
		render: /* @__PURE__ */ E(Ve, { size: "icon-xs" }),
		className: J(e),
		...t,
		children: /* @__PURE__ */ E(x, { className: "pointer-events-none" })
	});
}
function Di({ className: e, children: t, disabled: n = !1, showTrigger: r = !0, showClear: i = !1, ...a }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "combobox-input-group-wrapper",
		children: /* @__PURE__ */ D(Le, {
			ref: S.useContext(Si),
			className: J("w-auto", e),
			children: [
				/* @__PURE__ */ E(R.Input, {
					render: /* @__PURE__ */ E(Ue, { disabled: n }),
					...a
				}),
				/* @__PURE__ */ D(ze, {
					align: "inline-end",
					children: [r && /* @__PURE__ */ E(Ve, {
						size: "icon-xs",
						render: /* @__PURE__ */ E(Ti, {}),
						"data-slot": "input-group-button",
						className: "group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent rounded-xs",
						disabled: n
					}), i && /* @__PURE__ */ E(Ei, { disabled: n })]
				}),
				t
			]
		})
	});
}
function Oi({ className: e, side: t = "bottom", sideOffset: n = 6, align: r = "start", alignOffset: i = 0, anchor: a, ...o }) {
	let s = S.useContext(Si), c = a ?? s;
	return /* @__PURE__ */ E(R.Portal, { children: /* @__PURE__ */ E(R.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: t,
		sideOffset: n,
		align: r,
		alignOffset: i,
		anchor: c,
		className: "isolate",
		children: /* @__PURE__ */ E(R.Popup, {
			"data-slot": "combobox-content",
			"data-chips": !!c,
			className: J("quill-combobox__content group/combobox-content", e),
			...o
		})
	}) });
}
function ki({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.List, {
		"data-slot": "combobox-list",
		className: J("quill-combobox__list scroll-mask-t-4 scroll-py-4", "not-has-[[data-slot=combobox-list-footer]]:scroll-mask-b-4", e),
		...t
	});
}
function Ai({ className: e, children: t, title: n, ...r }) {
	return /* @__PURE__ */ D(R.Item, {
		"data-slot": "combobox-item",
		className: J("quill-combobox__item", e),
		title: n ?? (typeof t == "string" ? t : void 0),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			left: !0,
			className: "min-w-0 aria-selected:bg-fill-selected"
		}),
		...r,
		children: [/* @__PURE__ */ E("span", {
			className: "flex items-center gap-1.5 min-w-0 truncate",
			children: t
		}), /* @__PURE__ */ E(R.ItemIndicator, {
			render: /* @__PURE__ */ E("span", { className: "pointer-events-none absolute start-2 flex items-center justify-center" }),
			children: /* @__PURE__ */ E(s, { className: "pointer-events-none" })
		})]
	});
}
function ji({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.Group, {
		"data-slot": "combobox-group",
		className: J(e),
		...t
	});
}
function Mi({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.GroupLabel, {
		"data-slot": "combobox-label",
		className: e,
		render: /* @__PURE__ */ E(qe, {}),
		...t
	});
}
function Ni({ ...e }) {
	return /* @__PURE__ */ E(R.Collection, {
		"data-slot": "combobox-collection",
		...e
	});
}
function Pi({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(R.Empty, {
		"data-slot": "combobox-empty",
		className: J("hidden group-data-empty/combobox-content:flex", e),
		...n,
		render: /* @__PURE__ */ E(Ke, { children: t })
	});
}
function Fi({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.Separator, {
		"data-slot": "combobox-separator",
		className: J("quill-combobox__separator", e),
		...t
	});
}
function Ii({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.Chips, {
		"data-slot": "combobox-chips",
		className: J("quill-combobox__chips flex flex-wrap items-center gap-1 py-1", e),
		...t
	});
}
function Li({ className: e, children: t, title: n, showRemove: r = !0, ...i }) {
	return /* @__PURE__ */ D(R.Chip, {
		render: /* @__PURE__ */ E(mi, { title: n ?? (typeof t == "string" ? t : void 0) }),
		"data-slot": "combobox-chip",
		className: J(e),
		...i,
		children: [/* @__PURE__ */ E("span", {
			className: "truncate flex-1",
			children: t
		}), r && /* @__PURE__ */ E(R.ChipRemove, {
			render: /* @__PURE__ */ E(hi, {}),
			children: /* @__PURE__ */ E(x, { className: "pointer-events-none" })
		})]
	});
}
function Ri({ className: e, ...t }) {
	return /* @__PURE__ */ E(R.Input, {
		"data-slot": "combobox-chip-input",
		className: J("quill-combobox__chips-input", e),
		...t
	});
}
function zi({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "combobox-list-footer",
		className: J("quill-combobox__list-footer quill-scroll-fade-top", e),
		children: /* @__PURE__ */ E("div", {
			className: "p-1",
			...t
		})
	});
}
function Bi() {
	let e = S.useContext(Si);
	if (e === null) throw Error("useComboboxAnchor must be used within a Combobox");
	return e;
}
//#endregion
//#region src/kbd.tsx
function Vi({ className: e, ...t }) {
	return /* @__PURE__ */ E("kbd", {
		"data-quill": !0,
		"data-slot": "kbd",
		className: J(Pe({
			variant: "outline",
			size: "xs"
		}), "quill-kbd inline-flex w-fit items-center justify-center gap-1", e),
		...t
	});
}
function Hi({ className: e, ...t }) {
	return /* @__PURE__ */ E("kbd", {
		"data-slot": "kbd-text",
		className: J("quill-kbd-text inline-flex w-fit items-center justify-center gap-1", e),
		...t
	});
}
function Ui({ className: e, ...t }) {
	return /* @__PURE__ */ E("kbd", {
		"data-slot": "kbd-group",
		className: J("inline-flex items-center gap-1", e),
		...t
	});
}
//#endregion
//#region src/radio-group.tsx
var Wi = A("quill-radio-indicator", {
	variants: { size: {
		default: "quill-radio-indicator--size-default",
		sm: "quill-radio-indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
}), Gi = A("quill-radio-dot", {
	variants: { size: {
		default: "quill-radio-dot--size-default",
		sm: "quill-radio-dot--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function Z({ checked: e, className: t, size: n = "default" }) {
	return /* @__PURE__ */ E("span", {
		"data-slot": "radio-indicator",
		className: J(Wi({ size: n }), e && "quill-radio-indicator--checked", t),
		children: e && /* @__PURE__ */ E("span", { className: Gi({ size: n }) })
	});
}
function Ki({ className: e, ...t }) {
	return /* @__PURE__ */ E(ce, {
		"data-quill": !0,
		"data-slot": "radio-group",
		className: J("grid w-full gap-3", e),
		...t
	});
}
var qi = A("quill-radio group/radio-group-item peer", {
	variants: { size: {
		default: "quill-radio--size-default",
		sm: "quill-radio--size-sm"
	} },
	defaultVariants: { size: "default" }
}), Ji = A("quill-radio__indicator", {
	variants: { size: {
		default: "quill-radio__indicator--size-default",
		sm: "quill-radio__indicator--size-sm"
	} },
	defaultVariants: { size: "default" }
});
function Yi({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ E(B.Root, {
		"data-slot": "radio-group-item",
		className: J(qi({ size: t }), e),
		...n,
		children: /* @__PURE__ */ E(B.Indicator, {
			"data-slot": "radio-group-indicator",
			className: Ji({ size: t }),
			children: /* @__PURE__ */ E("span", { className: Gi({ size: t }) })
		})
	});
}
//#endregion
//#region src/context-menu.tsx
function Xi({ ...e }) {
	return /* @__PURE__ */ E(z.Root, {
		"data-slot": "context-menu",
		...e
	});
}
function Zi({ ...e }) {
	return /* @__PURE__ */ E(z.Portal, {
		"data-slot": "context-menu-portal",
		...e
	});
}
function Qi({ className: e, ...t }) {
	return /* @__PURE__ */ E(z.Trigger, {
		"data-slot": "context-menu-trigger",
		className: J("select-none", e),
		...t
	});
}
function $i({ className: e, align: t = "start", alignOffset: n = 4, side: r = "inline-end", sideOffset: i = 0, children: a, ...o }) {
	return /* @__PURE__ */ E(z.Portal, { children: /* @__PURE__ */ E(z.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		className: "isolate outline-none",
		align: t,
		alignOffset: n,
		side: r,
		sideOffset: i,
		children: /* @__PURE__ */ E(z.Popup, {
			"data-slot": "context-menu-content",
			className: J("quill-menu__content", e),
			...o,
			children: /* @__PURE__ */ E("div", {
				className: "quill-menu__scroller scroll-mask-y-4 scroll-py-4",
				children: a
			})
		})
	}) });
}
function ea({ ...e }) {
	return /* @__PURE__ */ E(z.Group, {
		"data-slot": "context-menu-group",
		...e
	});
}
function ta({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ E(z.GroupLabel, {
		"data-slot": "context-menu-label",
		"data-inset": t,
		className: J("px-2 py-1.5 text-xs text-muted-foreground", t && "quill-menu-item--inset", e),
		...n
	});
}
function na({ className: e, inset: t, variant: n = "default", children: r, ...i }) {
	return /* @__PURE__ */ E(z.Item, {
		"data-slot": "context-menu-item",
		"data-inset": t,
		"data-variant": n,
		className: J("group/context-menu-item relative flex cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", "data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:text-destructive-foreground data-[variant=destructive]:[&_svg]:text-destructive-foreground data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-disabled:bg-destructive/50", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ E(Y, {
			variant: "default",
			className: "w-full font-normal",
			left: !0
		}),
		...i,
		children: r
	});
}
function ra({ ...e }) {
	return /* @__PURE__ */ E(z.SubmenuRoot, {
		"data-slot": "context-menu-sub",
		...e
	});
}
function ia({ className: e, inset: t, children: n, ...r }) {
	return /* @__PURE__ */ D(z.SubmenuTrigger, {
		"data-slot": "context-menu-sub-trigger",
		"data-inset": t,
		className: J("flex cursor-default items-center outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ E(d, { className: "rtl:rotate-180 ms-auto" })]
	});
}
function aa({ className: e, align: t = "start", alignOffset: n = -3, side: r = "inline-end", sideOffset: i = 0, ...a }) {
	return /* @__PURE__ */ E($i, {
		"data-slot": "context-menu-sub-content",
		className: J("quill-menu__sub-content w-auto", e),
		align: t,
		alignOffset: n,
		side: r,
		sideOffset: i,
		...a
	});
}
function oa({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ D(z.CheckboxItem, {
		"data-slot": "context-menu-checkbox-item",
		"data-inset": r,
		className: J("quill-menu-item--inset relative flex cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		checked: n,
		...i,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			children: [/* @__PURE__ */ E(pi, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ E(z.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(pi, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function sa({ ...e }) {
	return /* @__PURE__ */ E(z.RadioGroup, {
		"data-slot": "context-menu-radio-group",
		...e
	});
}
function ca({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ D(z.RadioItem, {
		"data-slot": "context-menu-radio-item",
		"data-inset": n,
		className: J("quill-menu-item--inset relative flex cursor-default items-center pe-2 outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			children: [/* @__PURE__ */ E(Z, { size: "sm" }), /* @__PURE__ */ E(z.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(Z, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function la({ className: e, ...t }) {
	return /* @__PURE__ */ E(z.Separator, {
		"data-slot": "context-menu-separator",
		className: J("quill-menu__separator", e),
		...t
	});
}
function ua({ className: e, ...t }) {
	return /* @__PURE__ */ E(Vi, {
		"data-slot": "context-menu-shortcut",
		className: J("quill-menu__shortcut", e),
		...t
	});
}
//#endregion
//#region src/scroll-area.tsx
var da = [
	"top",
	"right",
	"bottom",
	"left"
];
function fa(e) {
	return e ? e === "all" ? da : Array.isArray(e) ? e : [e] : [];
}
var pa = {
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
function ma({ edge: e, viewportRef: t }) {
	let n = pa[e], { Icon: r } = n;
	return /* @__PURE__ */ E(Y, {
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
		className: J("bg-background not-disabled:hover:bg-fill-hover absolute z-10 grid place-items-center rounded-full shadow-md", "opacity-0 scale-95 pointer-events-none", "transition-[opacity,transform,background-color] duration-150 ease-out", "motion-reduce:transition-none", "focus-visible:opacity-100 focus-visible:scale-100 focus-visible:pointer-events-auto", n.positionClasses, n.visibleClasses),
		children: /* @__PURE__ */ E(r, { className: "size-4" })
	});
}
var ha = "quill-scroll-area-shadows", ga = "\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"] {\n    --shadow-x-start: 0 0 0 0 transparent;\n    --shadow-x-end: 0 0 0 0 transparent;\n    --shadow-y-start: 0 0 0 0 transparent;\n    --shadow-y-end: 0 0 0 0 transparent;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -16px 0 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -16px 16px -16px rgb(0 0 0 / 25%);\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before,\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    content: '';\n    position: absolute;\n    inset: 0;\n    pointer-events: none;\n    z-index: 2;\n    border-radius: inherit;\n    transition: box-shadow 200ms ease;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::before {\n    box-shadow: var(--shadow-x-start) inset, var(--shadow-y-start) inset;\n}\n[data-component=\"scroll-area\"][data-scroll-shadows=\"true\"]::after {\n    box-shadow: var(--shadow-x-end) inset, var(--shadow-y-end) inset;\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-start] {\n    --shadow-x-start: 28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-x-end] {\n    --shadow-x-end: -28px 0 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-start] {\n    --shadow-y-start: 0 28px 24px -16px rgb(0 0 0 / 100%);\n}\n.dark [data-component=\"scroll-area\"][data-scroll-shadows=\"true\"][data-overflow-y-end] {\n    --shadow-y-end: 0 -28px 24px -16px rgb(0 0 0 / 100%);\n}\n";
if (typeof document < "u" && !document.getElementById("quill-scroll-area-shadows")) {
	let e = document.createElement("style");
	e.id = ha, e.textContent = ga, document.head.appendChild(e);
}
function _a({ className: e, children: t, scrollShadows: n = !0, hideScrollbars: r = !1, alwaysShowScrollbars: i = !1, showScrollToButton: a, viewportClassName: o, ...s }) {
	let c = S.useRef(null), l = fa(a);
	return typeof process < "u" && process.env.NODE_ENV !== "production" && r && i && console.warn("[ScrollArea] `hideScrollbars` and `alwaysShowScrollbars` are mutually exclusive; `alwaysShowScrollbars` will be ignored."), /* @__PURE__ */ D(le.Root, {
		"data-quill": !0,
		"data-slot": "scroll-area",
		"data-component": "scroll-area",
		"data-scroll-shadows": n,
		className: J("quill-scroll-area group/scroll-area", e),
		...s,
		children: [
			/* @__PURE__ */ E(le.Viewport, {
				ref: c,
				"data-slot": "scroll-area-viewport",
				className: J("quill-scroll-area__viewport", o),
				children: t
			}),
			!r && /* @__PURE__ */ D(T, { children: [
				/* @__PURE__ */ E(va, {
					orientation: "horizontal",
					alwaysVisible: i
				}),
				/* @__PURE__ */ E(va, {
					orientation: "vertical",
					alwaysVisible: i
				}),
				/* @__PURE__ */ E(le.Corner, {
					"data-slot": "scroll-area-corner",
					className: "quill-scroll-area__corner"
				})
			] }),
			l.map((e) => /* @__PURE__ */ E(ma, {
				edge: e,
				viewportRef: c
			}, e))
		]
	});
}
function va({ className: e, orientation: t = "vertical", alwaysVisible: n = !1, ...r }) {
	return /* @__PURE__ */ E(le.Scrollbar, {
		"data-slot": "scroll-area-scrollbar",
		"data-orientation": t,
		orientation: t,
		className: J("quill-scroll-area__scrollbar group/scrollbar flex", n ? "quill-scroll-area__scrollbar--always" : "quill-scroll-area__scrollbar--auto", e),
		...r,
		children: /* @__PURE__ */ E(le.Thumb, {
			"data-slot": "scroll-area-thumb",
			className: "quill-scroll-area__thumb"
		})
	});
}
//#endregion
//#region src/dialog.tsx
function ya({ ...e }) {
	return /* @__PURE__ */ E(V.Root, {
		"data-slot": "dialog",
		...e
	});
}
function ba({ ...e }) {
	return /* @__PURE__ */ E(V.Trigger, {
		"data-slot": "dialog-trigger",
		...e
	});
}
function xa({ ...e }) {
	return /* @__PURE__ */ E(V.Portal, {
		"data-slot": "dialog-portal",
		...e
	});
}
function Sa({ ...e }) {
	return /* @__PURE__ */ E(V.Close, {
		"data-slot": "dialog-close focus-visible:z-10",
		...e
	});
}
function Ca({ className: e, ...t }) {
	return /* @__PURE__ */ E(V.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "modal-overlay",
		"data-slot": "dialog-overlay",
		className: J("quill-dialog__overlay", e),
		...t
	});
}
function wa({ className: e, children: t, showCloseButton: n = !0, nested: r = !1, size: i, ...a }) {
	return /* @__PURE__ */ D(xa, { children: [/* @__PURE__ */ E(Ca, {}), /* @__PURE__ */ D(V.Popup, {
		"data-quill": !0,
		"data-quill-portal": "modal-content",
		"data-slot": "dialog-content",
		"data-size": i,
		className: J("quill-dialog__content grid", e),
		...a,
		children: [t, n && /* @__PURE__ */ D(V.Close, {
			"data-slot": "dialog-close",
			render: /* @__PURE__ */ E(Y, {
				className: "absolute top-2 end-2",
				size: "icon-sm"
			}),
			children: [/* @__PURE__ */ E(x, {}), /* @__PURE__ */ E("span", {
				className: "sr-only",
				children: "Close"
			})]
		})]
	})] });
}
function Ta({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "dialog-header",
		className: J("quill-dialog__header flex flex-col gap-1", e),
		...t
	});
}
function Ea({ className: e, showCloseButton: t = !1, children: n, ...r }) {
	return /* @__PURE__ */ D("div", {
		"data-slot": "dialog-footer",
		className: J("quill-dialog__footer flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", e),
		...r,
		children: [n, t && /* @__PURE__ */ E(V.Close, {
			render: /* @__PURE__ */ E(Y, { variant: "outline" }),
			children: "Close"
		})]
	});
}
function Da({ className: e, render: t, children: n, viewportClassName: r, ...i }) {
	let a = t ?? /* @__PURE__ */ E(_a, {
		"data-slot": "dialog-body",
		className: J("quill-dialog__body", e),
		viewportClassName: r
	});
	return N({
		defaultTagName: "div",
		props: M({
			className: J("quill-dialog__body", e),
			children: n
		}, i),
		render: a,
		state: { slot: "dialog-body" }
	});
}
function Oa({ className: e, ...t }) {
	return /* @__PURE__ */ E(V.Title, {
		"data-slot": "dialog-title",
		className: J("quill-dialog__title", e),
		...t
	});
}
function ka({ className: e, ...t }) {
	return /* @__PURE__ */ E(V.Description, {
		"data-slot": "dialog-description",
		className: J("quill-dialog__description", e),
		...t
	});
}
//#endregion
//#region src/dot.tsx
var Aa = A("quill-dot relative inline-flex p-0.5 shrink-0 items-center justify-center whitespace-nowrap", {
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
function ja({ className: e, variant: t = "default", pulse: n = !1, ...r }) {
	return /* @__PURE__ */ D("span", {
		"data-quill": !0,
		"data-slot": "dot",
		className: J(Aa({
			variant: t,
			pulse: n
		}), e),
		...r,
		children: [n && /* @__PURE__ */ E("span", {
			"aria-hidden": !0,
			"data-slot": "dot-pulse",
			className: "quill-dot__pulse pointer-events-none absolute inset-px"
		}), /* @__PURE__ */ E("span", {
			"data-slot": "dot-inner",
			className: "quill-dot__inner"
		})]
	});
}
//#endregion
//#region src/drawer.tsx
function Ma({ ...e }) {
	return /* @__PURE__ */ E(H.Root, {
		"data-slot": "drawer",
		...e
	});
}
function Na({ ...e }) {
	return /* @__PURE__ */ E(H.Trigger, {
		"data-slot": "drawer-trigger",
		...e
	});
}
function Pa({ ...e }) {
	return /* @__PURE__ */ E(H.Portal, {
		"data-slot": "drawer-portal",
		...e
	});
}
function Fa({ ...e }) {
	return /* @__PURE__ */ E(H.Close, {
		"data-slot": "drawer-close",
		...e
	});
}
function Ia({ className: e, ...t }) {
	return /* @__PURE__ */ E(H.Backdrop, {
		"data-quill": !0,
		"data-quill-portal": "drawer-backdrop",
		"data-slot": "drawer-backdrop",
		className: J("quill-drawer__backdrop", e),
		...t
	});
}
function La({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ D(Pa, { children: [/* @__PURE__ */ E(Ia, {}), /* @__PURE__ */ E(H.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "drawer-viewport",
		"data-slot": "drawer-viewport",
		className: "quill-drawer__viewport",
		children: /* @__PURE__ */ D(H.Popup, {
			"data-quill": !0,
			"data-slot": "drawer-content",
			className: J("quill-drawer__content group/drawer-content flex h-auto flex-col", e),
			...n,
			children: [/* @__PURE__ */ E(Ra, {}), /* @__PURE__ */ E("div", {
				className: "w-full max-w-[32rem] mx-auto",
				children: t
			})]
		})
	})] });
}
function Ra({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "drawer-handle",
		"aria-hidden": "true",
		className: J("quill-drawer__handle", e),
		...t
	});
}
function za({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "drawer-header",
		className: J("quill-drawer__header flex flex-col gap-1 p-4", e),
		...t
	});
}
function Ba({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "drawer-footer",
		className: J("quill-drawer__footer mt-auto flex flex-col gap-2 p-4", e),
		...t
	});
}
function Va({ className: e, ...t }) {
	return /* @__PURE__ */ E(H.Title, {
		"data-slot": "drawer-title",
		className: J("quill-drawer__title", e),
		...t
	});
}
function Ha({ className: e, ...t }) {
	return /* @__PURE__ */ E(H.Description, {
		"data-slot": "drawer-description",
		className: J("quill-drawer__description", e),
		...t
	});
}
//#endregion
//#region src/dropdown-menu.tsx
function Ua({ ...e }) {
	return /* @__PURE__ */ E(U.Root, {
		"data-slot": "dropdown-menu",
		...e
	});
}
function Wa({ ...e }) {
	return /* @__PURE__ */ E(U.Portal, {
		"data-slot": "dropdown-menu-portal",
		...e
	});
}
function Ga({ ...e }) {
	return /* @__PURE__ */ E(U.Trigger, {
		"data-slot": "dropdown-menu-trigger",
		...e
	});
}
function Ka({ align: e = "start", alignOffset: t = 0, side: n = "bottom", sideOffset: r = 4, className: i, anchor: a, children: o, ...s }) {
	return /* @__PURE__ */ E(U.Portal, { children: /* @__PURE__ */ E(U.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		className: "isolate outline-none",
		align: e,
		alignOffset: t,
		side: n,
		sideOffset: r,
		anchor: a,
		children: /* @__PURE__ */ E(U.Popup, {
			"data-slot": "dropdown-menu-content",
			className: J("quill-menu__content w-(--anchor-width)", i),
			...s,
			children: /* @__PURE__ */ E("div", {
				className: "quill-menu__scroller scroll-mask-y-4 scroll-py-4",
				children: o
			})
		})
	}) });
}
function qa({ ...e }) {
	return /* @__PURE__ */ E(U.Group, {
		"data-slot": "dropdown-menu-group",
		...e
	});
}
function Ja({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ E(U.GroupLabel, {
		"data-slot": "dropdown-menu-label",
		"data-inset": t,
		className: J(t && "quill-menu-item--inset", e),
		render: /* @__PURE__ */ E(qe, {}),
		...n
	});
}
function Ya({ className: e, inset: t, variant: n = "default", ...r }) {
	return /* @__PURE__ */ E(U.Item, {
		"data-slot": "dropdown-menu-item",
		"data-inset": t,
		"data-variant": n,
		className: J("group/dropdown-menu-item relative flex cursor-default items-center text-xs/relaxed outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", "data-[variant=destructive]:text-destructive-foreground data-[variant=destructive]:hover:text-destructive-foreground data-[variant=destructive]:[&_svg]:text-destructive-foreground data-[variant=destructive]:hover:bg-destructive/10 data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:data-highlighted:bg-destructive/10 dark:data-[variant=destructive]:hover:bg-destructive/20 dark:data-[variant=destructive]:focus:bg-destructive/20 dark:data-[variant=destructive]:data-highlighted:bg-destructive/20 data-[variant=destructive]:data-disabled:bg-destructive/50", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			variant: "default",
			className: "w-full font-normal [&_kbd]:ml-auto",
			left: !0
		}),
		...r
	});
}
function Xa({ ...e }) {
	return /* @__PURE__ */ E(U.SubmenuRoot, {
		"data-slot": "dropdown-menu-sub",
		...e
	});
}
function Za({ className: e, inset: t, children: n, ...r }) {
	return /* @__PURE__ */ D(U.SubmenuTrigger, {
		"data-slot": "dropdown-menu-sub-trigger",
		"data-inset": t,
		className: J("flex cursor-default items-center text-xs outline-hidden select-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ E(d, { className: "rtl:rotate-180 ms-auto" })]
	});
}
function Qa({ align: e = "start", alignOffset: t = -3, side: n = "inline-end", sideOffset: r = 0, className: i, ...a }) {
	return /* @__PURE__ */ E(Ka, {
		"data-slot": "dropdown-menu-sub-content",
		className: J("quill-menu__sub-content w-auto", i),
		align: e,
		alignOffset: t,
		side: n,
		sideOffset: r,
		...a
	});
}
function $a({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ D(U.CheckboxItem, {
		"data-slot": "dropdown-menu-checkbox-item",
		"data-inset": r,
		className: J("quill-menu-item--inset relative flex cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		checked: n,
		nativeButton: !("render" in i),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		...i,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-checkbox-item-indicator",
			children: [/* @__PURE__ */ E(pi, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ E(U.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(pi, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function eo({ ...e }) {
	return /* @__PURE__ */ E(U.RadioGroup, {
		"data-slot": "dropdown-menu-radio-group",
		...e
	});
}
function to({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ D(U.RadioItem, {
		"data-slot": "dropdown-menu-radio-item",
		"data-inset": n,
		className: J("quill-menu-item--inset relative flex min-h-7 cursor-default items-center pe-2 text-xs outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		nativeButton: !("render" in r),
		render: /* @__PURE__ */ E(Y, {
			className: "w-full font-normal",
			left: !0
		}),
		...r,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex items-center justify-center",
			"data-slot": "dropdown-menu-radio-item-indicator",
			children: [/* @__PURE__ */ E(Z, { size: "sm" }), /* @__PURE__ */ E(U.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(Z, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function no({ className: e, ...t }) {
	return /* @__PURE__ */ E(U.Separator, {
		"data-slot": "dropdown-menu-separator",
		className: J("quill-menu__separator", e),
		...t
	});
}
function ro(e, t, n, r) {
	let i = S.useMemo(() => {
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
		toggle: S.useCallback(() => {
			n(s ? [] : e.slice());
		}, [
			s,
			n,
			e
		])
	};
}
function io({ values: e, selected: t, onChange: n, getKey: r, selectLabel: i = "Select all", deselectLabel: a = "Deselect all", children: o, ...s }) {
	let c = ro(e, t, n, r);
	return o ? /* @__PURE__ */ E(T, { children: o(c) }) : /* @__PURE__ */ E(Ya, {
		...s,
		"data-slot": "dropdown-menu-select-all",
		"data-state": c.state,
		closeOnClick: !1,
		onClick: c.toggle,
		children: c.isAllSelected ? a : i
	});
}
function ao({ className: e, ...t }) {
	return /* @__PURE__ */ E(Vi, {
		"data-slot": "dropdown-menu-shortcut",
		className: J("quill-menu__shortcut", e),
		...t
	});
}
//#endregion
//#region src/empty.tsx
function oo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "empty",
		className: J("quill-empty flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4", e),
		...t
	});
}
function so({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "empty-header",
		className: J("flex max-w-sm flex-col items-center gap-1", e),
		...t
	});
}
var co = A("quill-empty__media flex shrink-0 items-center justify-center", {
	variants: { variant: {
		default: "quill-empty__media--variant-default",
		icon: "quill-empty__media--variant-icon"
	} },
	defaultVariants: { variant: "default" }
});
function lo({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "empty-icon",
		"data-variant": t,
		className: J(co({
			variant: t,
			className: e
		})),
		...n
	});
}
function uo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "empty-title",
		className: J("quill-empty__title", e),
		...t
	});
}
function fo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "empty-description",
		className: J("quill-empty__description", e),
		...t
	});
}
function po({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "empty-content",
		className: J("quill-empty__content flex w-full max-w-sm min-w-0 flex-col items-center gap-2", e),
		...t
	});
}
//#endregion
//#region src/label.tsx
function mo({ className: e, ...t }) {
	return /* @__PURE__ */ E("label", {
		"data-quill": !0,
		"data-slot": "label",
		className: J("quill-label flex items-center gap-2", e),
		...t
	});
}
//#endregion
//#region src/field.tsx
function ho({ className: e, ...t }) {
	return /* @__PURE__ */ E("fieldset", {
		"data-slot": "field-set",
		className: J("quill-field-set flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3", e),
		...t
	});
}
function go({ className: e, variant: t = "legend", ...n }) {
	return /* @__PURE__ */ E("legend", {
		"data-slot": "field-legend",
		"data-variant": t,
		className: J("quill-field-legend", e),
		...n
	});
}
function _o({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "field-group",
		className: J("group/field-group @container/field-group flex w-full flex-col gap-4 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4", e),
		...t
	});
}
var vo = A("quill-field group/field flex w-full gap-x-2 gap-y-1", {
	variants: { orientation: {
		vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
		horizontal: "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
		responsive: "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px"
	} },
	defaultVariants: { orientation: "vertical" }
});
function yo({ className: e, orientation: t = "vertical", ...n }) {
	return /* @__PURE__ */ E("div", {
		role: "group",
		"data-quill": !0,
		"data-slot": "field",
		"data-orientation": t,
		className: J(vo({ orientation: t }), e),
		...n
	});
}
function bo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "field-content",
		className: J("quill-field__content group/field-content flex flex-1 flex-col gap-0.5", e),
		...t
	});
}
function xo({ className: e, ...t }) {
	return /* @__PURE__ */ E(mo, {
		"data-slot": "field-label",
		className: J("quill-field__label group/field-label peer/field-label flex w-fit gap-2", e),
		...t
	});
}
function So({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "field-label",
		className: J("quill-field__title flex w-fit items-center gap-2", e),
		...t
	});
}
function Co({ className: e, ...t }) {
	return /* @__PURE__ */ E("p", {
		"data-slot": "field-description",
		className: J("quill-field__description last:mt-0 nth-last-2:mt-0", e),
		...t
	});
}
function wo({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ D("div", {
		"data-slot": "field-separator",
		"data-content": !!e,
		className: J("quill-field__separator", t),
		...n,
		children: [/* @__PURE__ */ E(Je, { className: "absolute inset-0 top-1/2" }), e && /* @__PURE__ */ E("span", {
			className: "quill-field__separator-content",
			"data-slot": "field-separator-content",
			children: e
		})]
	});
}
function To({ className: e, children: t, errors: n, ...r }) {
	let i = ne(() => {
		if (t) return t;
		if (!n?.length) return null;
		let e = [...new Map(n.map((e) => [e?.message, e])).values()];
		return e?.length == 1 ? e[0]?.message : /* @__PURE__ */ E("ul", {
			className: "ms-4 flex list-disc flex-col gap-1",
			children: e.map((e, t) => e?.message && /* @__PURE__ */ E("li", { children: e.message }, t))
		});
	}, [t, n]);
	return i ? /* @__PURE__ */ E("div", {
		role: "alert",
		"data-slot": "field-error",
		className: J("quill-field__error", e),
		...r,
		children: i
	}) : null;
}
//#endregion
//#region src/heading.tsx
var Eo = A("text-foreground font-semibold text-balance", {
	variants: { size: {
		"2xl": "text-2xl tracking-tight",
		xl: "text-xl tracking-tight",
		lg: "text-lg",
		base: "text-base",
		sm: "text-sm"
	} },
	defaultVariants: { size: "lg" }
});
function Do({ className: e, size: t = "lg", render: n, ...r }) {
	return N({
		defaultTagName: "h2",
		props: M({
			"data-quill": "",
			className: J(Eo({ size: t }), e)
		}, r),
		render: n,
		state: {
			slot: "heading",
			size: t
		}
	});
}
//#endregion
//#region src/number-field.tsx
function Oo({ className: e, ...t }) {
	return /* @__PURE__ */ E(j.Root, {
		"data-quill": !0,
		"data-slot": "number-field",
		className: J("flex flex-col gap-1", e),
		...t
	});
}
function ko({ className: e, ...t }) {
	return /* @__PURE__ */ E(j.Group, {
		"data-slot": "number-field-group",
		className: J("quill-number-field__group flex items-center", e),
		...t
	});
}
var Ao = S.forwardRef(({ className: e, ...t }, n) => /* @__PURE__ */ E(j.Input, {
	ref: n,
	"data-slot": "number-field-input",
	className: J("quill-number-field__input", e),
	...t
}));
Ao.displayName = "NumberFieldInput";
function jo({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(j.Increment, {
		"data-slot": "number-field-increment",
		className: J("quill-number-field__increment flex items-center justify-center", e),
		...n,
		children: t ?? /* @__PURE__ */ E(f, { className: "size-3.5" })
	});
}
function Mo({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ E(j.Decrement, {
		"data-slot": "number-field-decrement",
		className: J("quill-number-field__decrement flex items-center justify-center", e),
		...n,
		children: t ?? /* @__PURE__ */ E(c, { className: "size-3.5" })
	});
}
function No({ className: e, ...t }) {
	return /* @__PURE__ */ E(j.ScrubArea, {
		"data-slot": "number-field-scrub-area",
		className: J("cursor-ew-resize", e),
		...t
	});
}
function Po({ className: e, ...t }) {
	return /* @__PURE__ */ E(j.ScrubAreaCursor, {
		"data-slot": "number-field-scrub-area-cursor",
		className: J(e),
		...t
	});
}
//#endregion
//#region src/item.tsx
function Fo({ className: e, combined: t = !1, ...n }) {
	return /* @__PURE__ */ E("div", {
		role: "list",
		"data-slot": "item-group",
		"data-combined": t ? "" : void 0,
		className: J("quill-item-group group/item-group flex w-full flex-col", t ? "gap-0" : "gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2", e),
		...n
	});
}
function Io({ className: e, ...t }) {
	return /* @__PURE__ */ E(Je, {
		"data-slot": "item-separator",
		orientation: "horizontal",
		className: J("my-2", e),
		...t
	});
}
var Lo = A("quill-item item group/item flex w-full flex-wrap items-center", {
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
function Ro({ className: e, variant: t = "default", size: n = "default", tone: r = "default", role: i, render: a, ...o }) {
	return N({
		defaultTagName: "div",
		props: M({
			"data-quill": "",
			"data-tone": r && r !== "default" ? r : void 0,
			className: J(Lo({
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
var zo = S.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, ...i }, a) {
	return N({
		defaultTagName: "button",
		props: M({
			className: J(Lo({
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
}), Bo = S.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, children: i, ...a }, o) {
	let s = a["aria-checked"] === !0 || a["aria-checked"] === "true", c = N({
		defaultTagName: "button",
		props: M({
			className: J(Lo({
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
	return S.cloneElement(c, {}, /* @__PURE__ */ E(Uo, {
		variant: "checkbox",
		className: "-mr-2",
		children: /* @__PURE__ */ E(di, {
			checked: s,
			size: "sm"
		})
	}), i);
}), Vo = S.forwardRef(function({ className: e, variant: t = "default", size: n = "default", render: r, children: i, ...a }, o) {
	let s = a["aria-checked"] === !0 || a["aria-checked"] === "true", c = N({
		defaultTagName: "button",
		props: M({
			className: J(Lo({
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
	return S.cloneElement(c, {}, /* @__PURE__ */ E(Uo, {
		variant: "checkbox",
		className: "-mr-2",
		children: /* @__PURE__ */ E(Z, {
			checked: s,
			size: "sm"
		})
	}), i);
}), Ho = A("quill-item__media flex shrink-0 items-center justify-center gap-2", {
	variants: { variant: {
		default: "quill-item__media--variant-default",
		icon: "quill-item__media--variant-icon",
		image: "quill-item__media--variant-image",
		checkbox: "quill-item__media--variant-checkbox"
	} },
	defaultVariants: { variant: "default" }
});
function Uo({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-media",
		"data-variant": t,
		className: J(Ho({
			variant: t,
			className: e
		})),
		...n
	});
}
var Wo = A("quill-item__content flex flex-1 flex-col gap-1", {
	variants: { variant: {
		default: "",
		menuItem: "quill-item__content--variant-menu"
	} },
	defaultVariants: { variant: "default" }
});
function Go({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-content",
		className: J(Wo({
			variant: t,
			className: e
		})),
		...n
	});
}
function Ko({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-title",
		className: J("quill-item__title gap-2", e),
		...t
	});
}
function qo({ className: e, ...t }) {
	return /* @__PURE__ */ E("p", {
		"data-slot": "item-description",
		className: J("quill-item__description", e),
		...t
	});
}
function Jo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-actions",
		className: J("flex items-center gap-2", e),
		...t
	});
}
function Yo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-header",
		className: J("flex basis-full items-center justify-between gap-2", e),
		...t
	});
}
function Xo({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-slot": "item-footer",
		className: J("flex basis-full items-center justify-between gap-2", e),
		...t
	});
}
//#endregion
//#region src/menubar.tsx
function Zo({ className: e, ...t }) {
	return /* @__PURE__ */ E(fe, {
		"data-quill": !0,
		"data-slot": "menubar",
		className: J("quill-menubar flex items-center", e),
		...t
	});
}
function Qo({ ...e }) {
	return /* @__PURE__ */ E(Ua, {
		"data-slot": "menubar-menu",
		...e
	});
}
function $o({ ...e }) {
	return /* @__PURE__ */ E(qa, {
		"data-slot": "menubar-group",
		...e
	});
}
function es({ ...e }) {
	return /* @__PURE__ */ E(Wa, {
		"data-slot": "menubar-portal",
		...e
	});
}
function ts({ className: e, ...t }) {
	return /* @__PURE__ */ E(Ga, {
		"data-slot": "menubar-trigger",
		className: J("quill-menubar__trigger flex items-center outline-hidden select-none", e),
		...t
	});
}
function ns({ className: e, align: t = "start", alignOffset: n = -4, sideOffset: r = 8, ...i }) {
	return /* @__PURE__ */ E(Ka, {
		"data-slot": "menubar-content",
		align: t,
		alignOffset: n,
		sideOffset: r,
		className: e,
		...i
	});
}
function rs({ className: e, inset: t, variant: n = "default", ...r }) {
	return /* @__PURE__ */ E(Ya, {
		"data-slot": "menubar-item",
		"data-inset": t,
		variant: n,
		className: J("group/menubar-item min-h-7 gap-2 rounded-sm px-2 py-1 text-xs/relaxed focus:bg-fill-hover data-disabled:opacity-50", e),
		...r
	});
}
function is({ className: e, children: t, checked: n, inset: r, ...i }) {
	return /* @__PURE__ */ D(U.CheckboxItem, {
		"data-slot": "menubar-checkbox-item",
		"data-inset": r,
		className: J("quill-menu-item--inset relative flex min-h-7 cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 text-xs outline-hidden select-none hover:bg-[var(--fill-hover)] focus:bg-[var(--fill-hover)] focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", e),
		checked: n,
		...i,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex size-4 items-center justify-center",
			children: [/* @__PURE__ */ E(pi, {
				size: "sm",
				tabIndex: -1
			}), /* @__PURE__ */ E(U.CheckboxItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(pi, {
					size: "sm",
					checked: !0,
					tabIndex: -1
				})
			})]
		}), t]
	});
}
function as({ ...e }) {
	return /* @__PURE__ */ E(eo, {
		"data-slot": "menubar-radio-group",
		...e
	});
}
function os({ className: e, children: t, inset: n, ...r }) {
	return /* @__PURE__ */ D(U.RadioItem, {
		"data-slot": "menubar-radio-item",
		"data-inset": n,
		className: J("quill-menu-item--inset relative flex min-h-7 cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 text-xs outline-hidden select-none hover:bg-[var(--fill-hover)] focus:bg-[var(--fill-hover)] focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5", e),
		...r,
		children: [/* @__PURE__ */ D("span", {
			className: "pointer-events-none absolute start-2 flex size-4 items-center justify-center",
			children: [/* @__PURE__ */ E(Z, { size: "sm" }), /* @__PURE__ */ E(U.RadioItemIndicator, {
				className: "absolute",
				children: /* @__PURE__ */ E(Z, {
					size: "sm",
					checked: !0
				})
			})]
		}), t]
	});
}
function ss({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ E(Ja, {
		"data-slot": "menubar-label",
		"data-inset": t,
		className: J("px-2 py-1.5 text-xs text-muted-foreground", t && "quill-menu-item--inset", e),
		...n
	});
}
function cs({ className: e, ...t }) {
	return /* @__PURE__ */ E(no, {
		"data-slot": "menubar-separator",
		className: J("quill-menu__separator", e),
		...t
	});
}
function ls({ className: e, ...t }) {
	return /* @__PURE__ */ E(ao, {
		"data-slot": "menubar-shortcut",
		className: J("quill-menu__shortcut", e),
		...t
	});
}
function us({ ...e }) {
	return /* @__PURE__ */ E(Xa, {
		"data-slot": "menubar-sub",
		...e
	});
}
function ds({ className: e, inset: t, ...n }) {
	return /* @__PURE__ */ E(Za, {
		"data-slot": "menubar-sub-trigger",
		"data-inset": t,
		className: J("min-h-7 gap-2 rounded-sm px-2 py-1 text-xs focus:bg-fill-hover data-open:bg-fill-selected [&_svg:not([class*='size-'])]:size-3.5", t && "quill-menu-item--inset", e),
		...n
	});
}
function fs({ className: e, ...t }) {
	return /* @__PURE__ */ E(Qa, {
		"data-slot": "menubar-sub-content",
		className: e,
		...t
	});
}
//#endregion
//#region src/pagination.tsx
function ps({ className: e, ...t }) {
	return /* @__PURE__ */ E("nav", {
		"aria-label": "Pagination",
		"data-quill": !0,
		"data-slot": "pagination",
		className: J("quill-pagination", e),
		...t
	});
}
var ms = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("ul", {
		ref: n,
		"data-slot": "pagination-content",
		className: J("quill-pagination__content", e),
		...t
	});
}), hs = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("li", {
		ref: n,
		"data-slot": "pagination-item",
		className: J("quill-pagination__item", e),
		...t
	});
}), gs = S.forwardRef(function({ isActive: e, size: t = "icon-sm", className: n, ...r }, i) {
	return /* @__PURE__ */ E(Y, {
		ref: i,
		"data-slot": "pagination-button",
		"aria-current": e ? "page" : void 0,
		"aria-selected": e ? !0 : void 0,
		size: t,
		className: J("quill-pagination__button", n),
		...r
	});
}), _s = S.forwardRef(function({ className: e, children: t, ...n }, r) {
	return /* @__PURE__ */ D(gs, {
		ref: r,
		"aria-label": "Go to previous page",
		size: "sm",
		className: J("gap-1 px-2", e),
		...n,
		children: [/* @__PURE__ */ E(l, { className: "size-3.5" }), t ?? /* @__PURE__ */ E("span", { children: "Previous" })]
	});
}), vs = S.forwardRef(function({ className: e, children: t, ...n }, r) {
	return /* @__PURE__ */ D(gs, {
		ref: r,
		"aria-label": "Go to next page",
		size: "sm",
		className: J("gap-1 px-2", e),
		...n,
		children: [t ?? /* @__PURE__ */ E("span", { children: "Next" }), /* @__PURE__ */ E(u, { className: "size-3.5" })]
	});
});
function ys({ className: e, ...t }) {
	return /* @__PURE__ */ D("span", {
		"aria-hidden": !0,
		"data-slot": "pagination-ellipsis",
		className: J("quill-pagination__ellipsis", e),
		...t,
		children: [/* @__PURE__ */ E(y, { className: "size-3.5" }), /* @__PURE__ */ E("span", {
			className: "sr-only",
			children: "More pages"
		})]
	});
}
function bs(e, t, n = 1) {
	if (e <= n * 2 + 5) return Array.from({ length: e }, (e, t) => t);
	let r = Math.max(t - n, 0), i = Math.min(t + n, e - 1), a = r > 2, o = i < e - 3, s = e - 1, c = [0];
	if (a) c.push("ellipsis");
	else for (let e = 1; e < r; e++) c.push(e);
	for (let e = r; e <= i; e++) e !== 0 && e !== s && c.push(e);
	if (o) c.push("ellipsis");
	else for (let e = i + 1; e < s; e++) c.push(e);
	return c.push(s), c;
}
ps.displayName = "Pagination", ms.displayName = "PaginationContent", hs.displayName = "PaginationItem", gs.displayName = "PaginationButton", _s.displayName = "PaginationPrevious", vs.displayName = "PaginationNext";
//#endregion
//#region src/popover.tsx
function xs({ ...e }) {
	return /* @__PURE__ */ E(W.Root, {
		"data-slot": "popover",
		...e
	});
}
function Ss({ ...e }) {
	return /* @__PURE__ */ E(W.Trigger, {
		"data-slot": "popover-trigger",
		...e
	});
}
function Cs({ className: e, align: t = "center", alignOffset: n = 0, side: r = "bottom", sideOffset: i = 4, collisionAvoidance: a, container: o, ...s }) {
	return /* @__PURE__ */ E(W.Portal, {
		container: o,
		children: /* @__PURE__ */ E(W.Positioner, {
			"data-quill": !0,
			"data-quill-portal": "popover",
			align: t,
			alignOffset: n,
			side: r,
			sideOffset: i,
			collisionAvoidance: a,
			className: "isolate",
			children: /* @__PURE__ */ E(W.Popup, {
				"data-slot": "popover-content",
				className: J("quill-popover__content flex flex-col gap-4", e),
				...s
			})
		})
	});
}
//#endregion
//#region src/progress.tsx
var ws = A("quill-progress__indicator", {
	variants: { variant: {
		default: "quill-progress__indicator--variant-default",
		info: "quill-progress__indicator--variant-info",
		success: "quill-progress__indicator--variant-success",
		warning: "quill-progress__indicator--variant-warning",
		destructive: "quill-progress__indicator--variant-destructive"
	} },
	defaultVariants: { variant: "default" }
});
function Ts({ className: e, children: t, value: n, variant: r = "default", ...i }) {
	return /* @__PURE__ */ D(G.Root, {
		value: n,
		"data-quill": !0,
		"data-slot": "progress",
		"data-variant": r,
		className: J("flex flex-wrap gap-3", e),
		...i,
		children: [t, /* @__PURE__ */ E(Es, { children: /* @__PURE__ */ E(Ds, { variant: r }) })]
	});
}
function Es({ className: e, ...t }) {
	return /* @__PURE__ */ E(G.Track, {
		className: J("quill-progress__track relative flex items-center", e),
		"data-slot": "progress-track",
		...t
	});
}
function Ds({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ E(G.Indicator, {
		"data-slot": "progress-indicator",
		"data-variant": t,
		className: J(ws({ variant: t }), e),
		...n
	});
}
function Os({ className: e, ...t }) {
	return /* @__PURE__ */ E(G.Label, {
		className: J("quill-progress__label", e),
		"data-slot": "progress-label",
		...t
	});
}
function ks({ className: e, ...t }) {
	return /* @__PURE__ */ E(G.Value, {
		className: J("quill-progress__value ms-auto", e),
		"data-slot": "progress-value",
		...t
	});
}
//#endregion
//#region src/resizable.tsx
function As({ className: e, ...t }) {
	return /* @__PURE__ */ E(pe.Group, {
		"data-quill": !0,
		"data-slot": "resizable-panel-group",
		className: J("group/resizable-panel-group flex h-full w-full aria-[orientation=vertical]:flex-col", e),
		...t
	});
}
function js({ ...e }) {
	return /* @__PURE__ */ E(pe.Panel, {
		"data-slot": "resizable-panel",
		...e
	});
}
function Ms({ withHandle: e, className: t, ...n }) {
	let r = S.useRef(null);
	return S.useEffect(() => {
		let e = r.current;
		if (!e) return;
		let t = () => {
			e.blur();
		};
		return e.addEventListener("pointerup", t), () => e.removeEventListener("pointerup", t);
	}, []), /* @__PURE__ */ E(pe.Separator, {
		"data-slot": "resizable-handle",
		elementRef: r,
		className: J("quill-resizable__handle flex items-center justify-center", t),
		...n,
		children: e && /* @__PURE__ */ E("div", {})
	});
}
//#endregion
//#region src/select.tsx
var Ns = K.Root;
function Ps({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.Group, {
		"data-slot": "select-group",
		className: J("quill-select__group", e),
		...t
	});
}
function Fs({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.Value, {
		"data-slot": "select-value",
		className: J("quill-select__value", e),
		...t
	});
}
function Is({ className: e, ...t }) {
	return /* @__PURE__ */ E(c, {
		className: J("quill-select__icon", e),
		...t
	});
}
function Ls({ className: e, size: t = "default", children: n, ...r }) {
	return /* @__PURE__ */ D(K.Trigger, {
		"data-slot": "select-trigger",
		"data-size": t,
		className: J("quill-select__trigger group/select-trigger flex items-center justify-between gap-3 whitespace-nowrap outline-none", e),
		render: /* @__PURE__ */ E(Y, {
			variant: "outline",
			left: !0
		}),
		...r,
		children: [n, /* @__PURE__ */ E(K.Icon, { render: /* @__PURE__ */ E(Is, {}) })]
	});
}
function Rs({ className: e, children: t, side: n = "bottom", sideOffset: r = 4, align: i = "center", alignOffset: a = 0, alignItemWithTrigger: o = !0, ...s }) {
	return /* @__PURE__ */ E(K.Portal, { children: /* @__PURE__ */ E(K.Positioner, {
		"data-quill": !0,
		"data-quill-portal": "popover",
		side: n,
		sideOffset: r,
		align: i,
		alignOffset: a,
		alignItemWithTrigger: o,
		className: "isolate",
		children: /* @__PURE__ */ D(K.Popup, {
			"data-slot": "select-content",
			"data-align-trigger": o,
			className: J("quill-select__content", e),
			...s,
			children: [
				/* @__PURE__ */ E(Hs, { className: "quill-select__scroll-button flex items-center justify-center" }),
				/* @__PURE__ */ E(K.List, {
					className: "quill-select__list scroll-mask-y-4 scroll-py-4",
					children: t
				}),
				/* @__PURE__ */ E(Us, {})
			]
		})
	}) });
}
function zs({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.GroupLabel, {
		"data-slot": "select-label",
		className: e,
		render: /* @__PURE__ */ E(qe, {}),
		...t
	});
}
function Bs({ className: e, children: t, ...n }) {
	return /* @__PURE__ */ D(K.Item, {
		"data-slot": "select-item",
		className: J("quill-select__item group/select-item flex w-full cursor-default items-center gap-2 select-none", e),
		...n,
		children: [/* @__PURE__ */ E(K.ItemText, {
			className: "flex flex-1 shrink-0 gap-2 whitespace-nowrap",
			children: t
		}), /* @__PURE__ */ E(K.ItemIndicator, {
			render: /* @__PURE__ */ E("span", { className: "pointer-events-none absolute end-2 flex items-center justify-center" }),
			children: /* @__PURE__ */ E(s, { className: "pointer-events-none" })
		})]
	});
}
function Vs({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.Separator, {
		"data-slot": "select-separator",
		className: J("quill-select__separator", e),
		...t
	});
}
function Hs({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.ScrollUpArrow, {
		"data-slot": "select-scroll-up-button",
		className: J("quill-select__scroll-button quill-select__scroll-button--up", e),
		render: /* @__PURE__ */ E(Y, {
			variant: "outline",
			size: "icon-sm"
		}),
		...t,
		children: /* @__PURE__ */ E(f, {})
	});
}
function Us({ className: e, ...t }) {
	return /* @__PURE__ */ E(K.ScrollDownArrow, {
		"data-slot": "select-scroll-down-button",
		className: J("quill-select__scroll-button quill-select__scroll-button--down", e),
		render: /* @__PURE__ */ E(Y, {
			variant: "outline",
			size: "icon-sm"
		}),
		...t,
		children: /* @__PURE__ */ E(c, {})
	});
}
//#endregion
//#region src/skeleton.tsx
function Ws({ className: e, ...t }) {
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		"data-slot": "skeleton",
		className: J("quill-skeleton", e),
		...t
	});
}
//#endregion
//#region src/skeleton-text.tsx
function Gs({ lines: e = 3, className: t, minWidth: n = 60, maxWidth: r = 100 }) {
	let i = S.useMemo(() => Array.from({ length: e }).map((t, i) => {
		if (i === 0) return `${r}%`;
		if (i === e - 1) return `${Math.max(n, 40)}%`;
		let a = Math.random() * (r - n) + n;
		return `${Math.round(a)}%`;
	}), [
		e,
		n,
		r
	]);
	return /* @__PURE__ */ E("div", {
		"data-quill": !0,
		className: J("flex flex-col", t),
		children: i.map((e, t) => /* @__PURE__ */ E("span", {
			className: "relative block w-full",
			style: { height: "1lh" },
			children: /* @__PURE__ */ E(Ws, {
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
//#endregion
//#region src/slider.tsx
function Ks({ className: e, defaultValue: t, value: n, min: r = 0, max: i = 100, ...a }) {
	let o = S.useMemo(() => Array.isArray(n) ? n : Array.isArray(t) ? t : [r, i], [
		n,
		t,
		r,
		i
	]);
	return /* @__PURE__ */ E(me.Root, {
		"data-quill": !0,
		"data-slot": "slider",
		className: J("quill-slider", e),
		defaultValue: t,
		value: n,
		min: r,
		max: i,
		thumbAlignment: "edge",
		...a,
		children: /* @__PURE__ */ D(me.Control, {
			className: "quill-slider__control",
			children: [/* @__PURE__ */ E(me.Track, {
				"data-slot": "slider-track",
				className: "quill-slider__track",
				children: /* @__PURE__ */ E(me.Indicator, {
					"data-slot": "slider-range",
					className: "quill-slider__range"
				})
			}), Array.from({ length: o.length }, (e, t) => /* @__PURE__ */ E(me.Thumb, {
				"data-slot": "slider-thumb",
				className: "quill-slider__thumb flex items-center justify-center"
			}, t))]
		})
	});
}
//#endregion
//#region src/toast.tsx
var Q = q.createToastManager(), qs = q.createToastManager(), Js = {
	success: /* @__PURE__ */ E(m, { className: "quill-toast-card__icon--success size-6" }),
	info: /* @__PURE__ */ E(ee, { className: "quill-toast-card__icon--info size-6" }),
	warning: /* @__PURE__ */ E(b, { className: "quill-toast-card__icon--warning size-6" }),
	error: /* @__PURE__ */ E(x, { className: "quill-toast-card__icon--error size-6" }),
	loading: /* @__PURE__ */ E(Ne, { className: "quill-toast-card__icon--loading size-6" })
}, Ys = S.forwardRef(({ className: e, toastTitle: t, toastDescription: n, icon: r, action: i, onDismiss: a, showGapHitArea: o, children: s, ...c }, l) => {
	let u = t !== void 0 && n === void 0, d = n !== void 0 && t === void 0;
	return /* @__PURE__ */ D("div", {
		ref: l,
		className: J("quill-toast-card", e),
		...c,
		children: [
			o && /* @__PURE__ */ E("span", {
				className: "pointer-events-auto absolute left-0 top-full w-full",
				style: { height: "calc(var(--gap) + 1px)" }
			}),
			/* @__PURE__ */ D("div", {
				className: J("flex items-center gap-3", a && "pe-8"),
				children: [r && /* @__PURE__ */ E("span", {
					className: J("shrink-0 self-start mt-1", !t && n && "mt-0"),
					children: r
				}), /* @__PURE__ */ D("div", {
					className: "flex-1 min-w-0",
					children: [t && /* @__PURE__ */ E("div", {
						className: "quill-toast-card__title",
						children: t
					}), n && /* @__PURE__ */ E("div", {
						className: "quill-toast-card__description",
						children: n
					})]
				})]
			}),
			i && /* @__PURE__ */ D("div", {
				className: "flex items-center gap-3 mt-2",
				children: [r && /* @__PURE__ */ E("span", { className: "size-6 shrink-0" }), /* @__PURE__ */ E(Y, {
					variant: "outline",
					size: "sm",
					className: "quill-toast-card__action",
					onClick: i.onClick,
					children: i.label
				})]
			}),
			a && /* @__PURE__ */ E(Y, {
				size: "icon-sm",
				className: J("absolute right-2", u && "top-1" || d && "top-1" || "top-2"),
				onClick: a,
				children: /* @__PURE__ */ E(x, { className: "size-3.5" })
			}),
			s
		]
	});
});
Ys.displayName = "ToastCard";
var Xs = {
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
function Zs({ children: e, limit: t = 3, timeout: n = 5e3 }) {
	return /* @__PURE__ */ D(q.Provider, {
		toastManager: Q,
		limit: t,
		timeout: n,
		children: [/* @__PURE__ */ D(q.Provider, {
			toastManager: qs,
			limit: t,
			timeout: n,
			children: [e, /* @__PURE__ */ E($s, {})]
		}), /* @__PURE__ */ E(Qs, {})]
	});
}
function Qs() {
	let e = q.useToastManager();
	return /* @__PURE__ */ E(q.Portal, { children: /* @__PURE__ */ E(q.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "toast",
		className: "fixed bottom-4 right-4 w-[360px]",
		children: e.toasts.map((e) => {
			let t = e.type;
			return /* @__PURE__ */ E(q.Root, {
				toast: e,
				style: Xs,
				render: /* @__PURE__ */ E(Ys, {
					toastTitle: e.title,
					toastDescription: e.description,
					icon: t ? Js[t] : void 0,
					showGapHitArea: !0,
					action: e.data?.action ? {
						label: e.data.action.label,
						onClick: () => {
							Q.close(e.id), e.data?.action?.onClick();
						}
					} : void 0,
					onDismiss: () => Q.close(e.id),
					className: J("m-0 p-3", "data-[expanded]:![transform:translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]", "data-[expanded]:![height:var(--toast-height)]", "data-[starting-style]:![transform:translateY(150%)]", "data-[ending-style]:![transform:translateY(150%)]", "data-[ending-style]:opacity-0", "data-[limited]:opacity-0")
				})
			}, e.id);
		})
	}) });
}
function $s() {
	let e = q.useToastManager();
	return /* @__PURE__ */ E(q.Portal, { children: /* @__PURE__ */ E(q.Viewport, {
		"data-quill": !0,
		"data-quill-portal": "toast",
		className: "fixed",
		children: e.toasts.map((e) => /* @__PURE__ */ E(q.Positioner, {
			toast: e,
			side: "top",
			sideOffset: 8,
			children: /* @__PURE__ */ E(q.Root, {
				toast: e,
				render: /* @__PURE__ */ E(Ys, {
					toastTitle: e.title,
					toastDescription: e.description,
					className: J("data-[starting-style]:opacity-0 data-[starting-style]:scale-95", "data-[ending-style]:opacity-0 data-[ending-style]:scale-95", "transition-[opacity,transform] duration-200 ease-out")
				})
			})
		}, e.id))
	}) });
}
function ec(e) {
	let { title: t, description: n, type: r, timeout: i, onClose: a, action: o } = e;
	return Q.add({
		title: t,
		description: n,
		type: r,
		timeout: i,
		onClose: a,
		data: o ? { action: o } : void 0
	});
}
function $(e) {
	return ec(e);
}
$.success = (e) => ec({
	...e,
	type: "success"
}), $.info = (e) => ec({
	...e,
	type: "info"
}), $.warning = (e) => ec({
	...e,
	type: "warning"
}), $.error = (e) => ec({
	...e,
	type: "error"
}), $.loading = (e) => ec({
	...e,
	type: "loading",
	timeout: 0
}), $.dismiss = (e) => {
	Q.close(e);
}, $.update = (e, t) => {
	let { title: n, description: r, type: i, timeout: a, onClose: o, action: s } = t;
	Q.update(e, {
		title: n,
		description: r,
		type: i,
		timeout: a,
		onClose: o,
		data: s ? { action: s } : void 0
	});
};
function tc(e) {
	let { title: t, description: n, type: r, timeout: i, action: a, anchor: o, side: s, sideOffset: c, onClose: l } = e;
	return qs.add({
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
tc.dismiss = (e) => {
	qs.close(e);
};
//#endregion
//#region src/switch.tsx
function nc({ className: e, size: t = "default", ...n }) {
	return /* @__PURE__ */ E(he.Root, {
		"data-quill": !0,
		"data-slot": "switch",
		"data-size": t,
		className: J("quill-switch peer group/switch inline-flex shrink-0 items-center", e),
		...n,
		children: /* @__PURE__ */ E(he.Thumb, {
			"data-slot": "switch-thumb",
			className: "quill-switch__thumb"
		})
	});
}
//#endregion
//#region src/table.tsx
function rc(e, ...t) {
	for (let n of t) typeof n == "function" ? n(e) : n && (n.current = e);
}
function ic(e, t) {
	S.useEffect(() => {
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
var ac = S.forwardRef(function({ className: e, tableClassName: t, stickyHeader: n = !1, fullWidth: r = !1, size: i = "default", viewportRef: a, ...o }, s) {
	let c = S.useRef(null), l = S.useRef(null);
	ic(c, l);
	let u = S.useCallback((e) => rc(e, l, a), [a]);
	return /* @__PURE__ */ E("div", {
		ref: c,
		"data-quill": !0,
		"data-slot": "table-container",
		"data-page-sticky": n === "page" ? "" : void 0,
		className: J("quill-table__root", e),
		children: /* @__PURE__ */ E("div", {
			ref: u,
			"data-slot": "table-viewport",
			className: "quill-table__viewport",
			children: /* @__PURE__ */ E("table", {
				ref: s,
				"data-slot": "table",
				"data-sticky-header": n ? "" : void 0,
				"data-full-width": r ? "" : void 0,
				"data-size": i,
				className: J("quill-table", t),
				...o
			})
		})
	});
}), oc = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("thead", {
		ref: n,
		"data-slot": "table-header",
		className: J("quill-table__header", e),
		...t
	});
}), sc = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("tbody", {
		ref: n,
		"data-slot": "table-body",
		className: J("quill-table__body", e),
		...t
	});
}), cc = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("tfoot", {
		ref: n,
		"data-slot": "table-footer",
		className: J("quill-table__footer", e),
		...t
	});
}), lc = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("tr", {
		ref: n,
		"data-slot": "table-row",
		className: J("quill-table__row", e),
		...t
	});
}), uc = S.forwardRef(function({ className: e, sticky: t, align: n, valign: r, expand: i, scope: a = "col", ...o }, s) {
	return /* @__PURE__ */ E("th", {
		ref: s,
		"data-slot": "table-head",
		"data-sticky": t,
		"data-align": n,
		"data-valign": r,
		"data-expand": i ? "" : void 0,
		scope: a,
		className: J("quill-table__head", e),
		...o
	});
}), dc = S.forwardRef(function({ className: e, sticky: t, align: n, valign: r, expand: i, ...a }, o) {
	return /* @__PURE__ */ E("td", {
		ref: o,
		"data-slot": "table-cell",
		"data-sticky": t,
		"data-align": n,
		"data-valign": r,
		"data-expand": i ? "" : void 0,
		className: J("quill-table__cell", e),
		...a
	});
}), fc = S.forwardRef(function({ className: e, colSpan: t = 1e3, children: n, ...r }, i) {
	return /* @__PURE__ */ E("tbody", {
		"data-slot": "table-empty",
		children: /* @__PURE__ */ E("tr", { children: /* @__PURE__ */ E("td", {
			ref: i,
			colSpan: t,
			className: J("quill-table__empty", e),
			...r,
			children: /* @__PURE__ */ E("div", {
				className: "quill-table__empty-inner",
				children: n
			})
		}) })
	});
}), pc = S.forwardRef(function({ className: e, ...t }, n) {
	return /* @__PURE__ */ E("caption", {
		ref: n,
		"data-slot": "table-caption",
		className: J("quill-table__caption", e),
		...t
	});
});
ac.displayName = "Table", oc.displayName = "TableHeader", sc.displayName = "TableBody", cc.displayName = "TableFooter", lc.displayName = "TableRow", uc.displayName = "TableHead", dc.displayName = "TableCell", fc.displayName = "TableEmpty", pc.displayName = "TableCaption";
//#endregion
//#region src/tabs.tsx
function mc({ className: e, orientation: t = "horizontal", ...n }) {
	return /* @__PURE__ */ E(ge.Root, {
		"data-slot": "tabs",
		"data-orientation": t,
		className: J("group/tabs flex gap-2 data-[orientation=horizontal]:flex-col", e),
		...n
	});
}
var hc = A("quill-tabs__list group/tabs-list inline-flex w-fit items-center justify-center relative", {
	variants: { variant: {
		default: "quill-tabs__list--variant-default",
		line: "quill-tabs__list--variant-line"
	} },
	defaultVariants: { variant: "default" }
}), gc = A("quill-tabs__indicator", {
	variants: { variant: {
		default: "quill-tabs__indicator--variant-default",
		line: "quill-tabs__indicator--variant-line"
	} },
	defaultVariants: { variant: "default" }
});
function _c({ className: e, variant: t = "default", ...n }) {
	return /* @__PURE__ */ D(ge.List, {
		"data-quill": !0,
		"data-slot": "tabs-list",
		"data-variant": t,
		className: J(hc({ variant: t }), e),
		...n,
		children: [n.children, /* @__PURE__ */ E(ge.Indicator, { className: gc({ variant: t }) })]
	});
}
function vc({ className: e, ...t }) {
	return /* @__PURE__ */ E(ge.Tab, {
		"data-slot": "tabs-trigger",
		className: J("quill-tabs__trigger inline-flex items-center justify-center gap-1.5 whitespace-nowrap", e),
		...t,
		render: (e) => /* @__PURE__ */ E(Y, { ...e })
	});
}
function yc({ className: e, ...t }) {
	return /* @__PURE__ */ E(ge.Panel, {
		"data-slot": "tabs-content",
		className: J("quill-tabs__panel", e),
		...t
	});
}
//#endregion
//#region src/text.tsx
var bc = A("", {
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
function xc({ className: e, size: t = "base", variant: n = "default", weight: r = "normal", render: i, ...a }) {
	return N({
		defaultTagName: "p",
		props: M({
			"data-quill": "",
			className: J(bc({
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
//#endregion
//#region src/toggle.tsx
var Sc = A("quill-toggle group/toggle inline-flex items-center justify-center gap-1 whitespace-nowrap", {
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
function Cc({ className: e, variant: t = "default", size: n = "default", ...r }) {
	return /* @__PURE__ */ E(oe, {
		"data-quill": !0,
		"data-slot": "toggle",
		className: J(Sc({
			variant: t,
			size: n,
			className: e
		})),
		...r
	});
}
//#endregion
//#region src/toggle-group.tsx
var wc = S.createContext({
	size: "default",
	variant: "default",
	spacing: 0,
	orientation: "horizontal"
});
function Tc({ className: e, variant: t, size: n, spacing: r = 0, orientation: i = "horizontal", children: a, ...o }) {
	return /* @__PURE__ */ E(_e, {
		"data-quill": !0,
		"data-slot": "toggle-group",
		"data-variant": t,
		"data-size": n,
		"data-spacing": r,
		"data-orientation": i,
		style: { "--gap": r },
		className: J("quill-toggle-group group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch", e),
		...o,
		children: /* @__PURE__ */ E(wc.Provider, {
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
function Ec({ className: e, children: t, variant: n = "default", size: r = "default", ...i }) {
	let a = S.useContext(wc);
	return /* @__PURE__ */ E(oe, {
		"data-slot": "toggle-group-item",
		"data-variant": a.variant || n,
		"data-size": a.size || r,
		"data-spacing": a.spacing,
		className: J("quill-toggle-group__item", Sc({
			variant: a.variant || n,
			size: a.size || r
		}), e),
		...i,
		render: (e) => /* @__PURE__ */ E(Y, {
			variant: "outline",
			size: r,
			...e
		}),
		children: t
	});
}
//#endregion
//#region src/theme-provider.tsx
var Dc = "(prefers-color-scheme: dark)", Oc = [
	"dark",
	"light",
	"system"
], kc = S.createContext(void 0);
function Ac(e) {
	return e === null ? !1 : Oc.includes(e);
}
function jc() {
	return typeof window < "u" && window.matchMedia(Dc).matches ? "dark" : "light";
}
function Mc() {
	let e = document.createElement("style");
	return e.appendChild(document.createTextNode("*,*::before,*::after{-webkit-transition:none!important;transition:none!important}")), document.head.appendChild(e), () => {
		window.getComputedStyle(document.body), requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				e.remove();
			});
		});
	};
}
function Nc(e) {
	return e instanceof HTMLElement ? !!(e.isContentEditable || e.closest("input, textarea, select, [contenteditable='true']")) : !1;
}
function Pc({ children: e, defaultTheme: t = "system", storageKey: n = "theme", disableTransitionOnChange: r = !0, ...i }) {
	let [a, o] = S.useState(() => {
		if (typeof window < "u") {
			let e = localStorage.getItem(n);
			if (Ac(e)) return e;
		}
		return t;
	}), s = S.useCallback((e) => {
		typeof window < "u" && localStorage.setItem(n, e), o(e);
	}, [n]), c = S.useCallback((e) => {
		let t = document.documentElement, n = e === "system" ? jc() : e, i = r ? Mc() : null;
		t.classList.remove("light", "dark"), t.classList.add(n), i && i();
	}, [r]);
	S.useEffect(() => {
		if (c(a), a !== "system") return;
		let e = window.matchMedia(Dc), t = () => {
			c("system");
		};
		return e.addEventListener("change", t), () => {
			e.removeEventListener("change", t);
		};
	}, [a, c]), S.useEffect(() => {
		let e = (e) => {
			e.repeat || e.metaKey || e.ctrlKey || e.altKey || Nc(e.target) || e.key.toLowerCase() === "d" && o((e) => {
				let t = e === "dark" ? "light" : e === "light" ? "dark" : jc() === "dark" ? "light" : "dark";
				return localStorage.setItem(n, t), t;
			});
		};
		return window.addEventListener("keydown", e), () => {
			window.removeEventListener("keydown", e);
		};
	}, [n]), S.useEffect(() => {
		let e = (e) => {
			if (e.storageArea === localStorage && e.key === n) {
				if (Ac(e.newValue)) {
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
	let l = S.useMemo(() => ({
		theme: a,
		setTheme: s
	}), [a, s]);
	return /* @__PURE__ */ E(kc.Provider, {
		...i,
		value: l,
		children: e
	});
}
var Fc = () => {
	let e = S.useContext(kc);
	if (e === void 0) throw Error("useTheme must be used within a ThemeProvider");
	return e;
};
//#endregion
export { ye as Accordion, Se as AccordionContent, be as AccordionItem, xe as AccordionTrigger, Ce as AlertDialog, Ee as AlertDialogClose, Oe as AlertDialogContent, Ae as AlertDialogDescription, Me as AlertDialogFooter, je as AlertDialogHeader, De as AlertDialogOverlay, Te as AlertDialogPortal, ke as AlertDialogTitle, we as AlertDialogTrigger, Ze as Autocomplete, et as AutocompleteClear, st as AutocompleteCollection, nt as AutocompleteContent, ct as AutocompleteEmpty, at as AutocompleteGroup, tt as AutocompleteInput, it as AutocompleteItem, ot as AutocompleteLabel, rt as AutocompleteList, lt as AutocompleteSeparator, dt as AutocompleteStatus, $e as AutocompleteTrigger, Qe as AutocompleteValue, pt as Avatar, ht as AvatarFallback, gt as AvatarGroup, mt as AvatarImage, vt as Badge, Y as Button, $r as ButtonGroup, ti as ButtonGroupSeparator, ei as ButtonGroupText, ni as Card, oi as CardContent, ai as CardDescription, si as CardFooter, ci as CardGroup, ri as CardHeader, ii as CardTitle, xt as ChatBubble, St as ChatBubbleContent, yt as ChatBubbleGroup, Ct as ChatBubbleReactions, Pt as ChatGlobe, Lt as ChatMarker, Vt as ChatMarkerContent, Bt as ChatMarkerIcon, Ht as ChatMarkerValue, Wt as ChatMessage, Gt as ChatMessageAvatar, Kt as ChatMessageContent, Jt as ChatMessageFooter, Ut as ChatMessageGroup, qt as ChatMessageHeader, $n as ChatMessageScroller, rr as ChatMessageScrollerButton, tr as ChatMessageScrollerContent, nr as ChatMessageScrollerItem, Qn as ChatMessageScrollerProvider, er as ChatMessageScrollerViewport, or as ChatSource, ar as ChatSourceList, sr as ChatSourceTitle, cr as ChatSourceUrl, lr as ChatStream, ur as ChatStreamLine, Cr as ChatTask, wr as ChatTaskDetail, mr as ChatTaskList, Sr as ChatTaskListContent, yr as ChatTaskListCount, vr as ChatTaskListLabel, gr as ChatTaskListProgress, hr as ChatTaskListTrigger, pi as Checkbox, di as CheckboxIndicator, mi as Chip, hi as ChipClose, gi as ChipGroup, vi as Collapsible, xi as CollapsibleContent, yi as CollapsibleHeader, bi as CollapsibleTrigger, Ci as Combobox, Li as ComboboxChip, Ii as ComboboxChips, Ri as ComboboxChipsInput, Ni as ComboboxCollection, Oi as ComboboxContent, Pi as ComboboxEmpty, ji as ComboboxGroup, Di as ComboboxInput, Ai as ComboboxItem, Mi as ComboboxLabel, ki as ComboboxList, zi as ComboboxListFooter, Fi as ComboboxSeparator, Ti as ComboboxTrigger, wi as ComboboxValue, Xi as ContextMenu, oa as ContextMenuCheckboxItem, $i as ContextMenuContent, ea as ContextMenuGroup, na as ContextMenuItem, ta as ContextMenuLabel, Zi as ContextMenuPortal, sa as ContextMenuRadioGroup, ca as ContextMenuRadioItem, la as ContextMenuSeparator, ua as ContextMenuShortcut, ra as ContextMenuSub, aa as ContextMenuSubContent, ia as ContextMenuSubTrigger, Qi as ContextMenuTrigger, ya as Dialog, Da as DialogBody, Sa as DialogClose, wa as DialogContent, ka as DialogDescription, Ea as DialogFooter, Ta as DialogHeader, Ca as DialogOverlay, xa as DialogPortal, Oa as DialogTitle, ba as DialogTrigger, ue as DirectionProvider, ja as Dot, Ma as Drawer, Ia as DrawerBackdrop, Fa as DrawerClose, La as DrawerContent, Ha as DrawerDescription, Ba as DrawerFooter, Ra as DrawerHandle, za as DrawerHeader, Pa as DrawerPortal, Va as DrawerTitle, Na as DrawerTrigger, Ua as DropdownMenu, $a as DropdownMenuCheckboxItem, Ka as DropdownMenuContent, qa as DropdownMenuGroup, Ya as DropdownMenuItem, Ja as DropdownMenuLabel, Wa as DropdownMenuPortal, eo as DropdownMenuRadioGroup, to as DropdownMenuRadioItem, io as DropdownMenuSelectAll, no as DropdownMenuSeparator, ao as DropdownMenuShortcut, Xa as DropdownMenuSub, Qa as DropdownMenuSubContent, Za as DropdownMenuSubTrigger, Ga as DropdownMenuTrigger, oo as Empty, po as EmptyContent, fo as EmptyDescription, so as EmptyHeader, lo as EmptyMedia, uo as EmptyTitle, yo as Field, bo as FieldContent, Co as FieldDescription, To as FieldError, _o as FieldGroup, xo as FieldLabel, go as FieldLegend, wo as FieldSeparator, ho as FieldSet, So as FieldTitle, Do as Heading, Fe as Input, Le as InputGroup, ze as InputGroupAddon, Ve as InputGroupButton, Ue as InputGroupInput, Ge as InputGroupNumberInput, He as InputGroupText, We as InputGroupTextarea, Ro as Item, Jo as ItemActions, Bo as ItemCheckbox, Go as ItemContent, qo as ItemDescription, Xo as ItemFooter, Fo as ItemGroup, Yo as ItemHeader, Uo as ItemMedia, zo as ItemMenuItem, Vo as ItemRadio, Io as ItemSeparator, Ko as ItemTitle, Vi as Kbd, Ui as KbdGroup, Hi as KbdText, mo as Label, qe as MenuLabel, Zo as Menubar, is as MenubarCheckboxItem, ns as MenubarContent, $o as MenubarGroup, rs as MenubarItem, ss as MenubarLabel, Qo as MenubarMenu, es as MenubarPortal, as as MenubarRadioGroup, os as MenubarRadioItem, cs as MenubarSeparator, ls as MenubarShortcut, us as MenubarSub, fs as MenubarSubContent, ds as MenubarSubTrigger, ts as MenubarTrigger, Mo as NumberFieldDecrement, ko as NumberFieldGroup, jo as NumberFieldIncrement, Ao as NumberFieldInput, Oo as NumberFieldRoot, No as NumberFieldScrubArea, Po as NumberFieldScrubAreaCursor, ps as Pagination, gs as PaginationButton, ms as PaginationContent, ys as PaginationEllipsis, hs as PaginationItem, vs as PaginationNext, _s as PaginationPrevious, xs as Popover, Cs as PopoverContent, Ss as PopoverTrigger, Ts as Progress, Ds as ProgressIndicator, Os as ProgressLabel, Es as ProgressTrack, ks as ProgressValue, Ki as RadioGroup, Yi as RadioGroupItem, Z as RadioIndicator, Ms as ResizableHandle, js as ResizablePanel, As as ResizablePanelGroup, ha as SCROLL_SHADOWS_STYLE_ID, _a as ScrollArea, va as ScrollBar, Ns as Select, Rs as SelectContent, Ps as SelectGroup, zs as SelectGroupLabel, Bs as SelectItem, Vs as SelectSeparator, Ls as SelectTrigger, Is as SelectTriggerIcon, Fs as SelectValue, Je as Separator, Ws as Skeleton, Gs as SkeletonText, Ks as Slider, Ne as Spinner, nc as Switch, ac as Table, sc as TableBody, pc as TableCaption, dc as TableCell, fc as TableEmpty, cc as TableFooter, uc as TableHead, oc as TableHeader, lc as TableRow, mc as Tabs, yc as TabsContent, _c as TabsList, vc as TabsTrigger, xc as Text, Ie as Textarea, Pc as ThemeProvider, Ar as ThreadItem, Jr as ThreadItemAction, qr as ThreadItemActions, zr as ThreadItemAttachment, Vr as ThreadItemAttachmentContent, Hr as ThreadItemAttachmentImage, Br as ThreadItemAttachmentTrigger, Pr as ThreadItemAuthor, Ir as ThreadItemBody, Mr as ThreadItemContent, kr as ThreadItemGroup, jr as ThreadItemGutter, Nr as ThreadItemHeader, Rr as ThreadItemLink, Lr as ThreadItemMention, Wr as ThreadItemReaction, Gr as ThreadItemReactionEmoji, Ur as ThreadItemReactions, Yr as ThreadItemReplies, Xr as ThreadItemRepliesLabel, Zr as ThreadItemRepliesMeta, Fr as ThreadItemTimestamp, Ys as ToastCard, Zs as ToastProvider, Cc as Toggle, Tc as ToggleGroup, Ec as ToggleGroupItem, Er as Tooltip, Or as TooltipContent, Tr as TooltipProvider, Dr as TooltipTrigger, tc as anchoredToast, qs as anchoredToastManager, _t as badgeVariants, bt as bubbleVariants, Qr as buttonGroupVariants, Pe as buttonVariants, J as cn, Aa as dotVariants, bs as getPaginationRange, Eo as headingVariants, Ft as markerVariants, ws as progressIndicatorVariants, ga as scrollShadowsCss, bc as textVariants, $ as toast, Q as toastManager, Sc as toggleVariants, ft as useAutocompleteAnchor, Hn as useChatMessageScroller, Un as useChatMessageScrollerScrollable, Wn as useChatMessageScrollerVisibility, Bi as useComboboxAnchor, de as useDirection, ro as useDropdownMenuSelectAll, Fc as useTheme };
