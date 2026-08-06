import { t as e } from "./createLucideIcon-QjQsCOg8.js";
import * as t from "react";
import { useCallback as n, useMemo as r, useState as i } from "react";
import { Badge as a, Button as o, Empty as s, EmptyHeader as c, EmptyMedia as l, EmptyTitle as u, InputGroup as d, InputGroupNumberInput as f, Pagination as p, PaginationButton as m, PaginationContent as h, PaginationEllipsis as g, PaginationItem as _, PaginationNext as v, PaginationPrevious as y, ScrollArea as b, Select as x, SelectContent as S, SelectGroup as C, SelectItem as w, SelectTrigger as T, SelectValue as E, Separator as ee, Switch as D, Table as O, TableBody as k, TableCell as A, TableHead as te, TableHeader as j, TableRow as ne, Tooltip as re, TooltipContent as ie, TooltipProvider as ae, TooltipTrigger as oe, cn as se, getPaginationRange as ce } from "@hanzo/quill-primitives";
import { Fragment as le, jsx as M, jsxs as N } from "react/jsx-runtime";
//#region ../../../../node_modules/.pnpm/@tanstack+table-core@8.21.3/node_modules/@tanstack/table-core/build/lib/index.mjs
function P(e, t) {
	return typeof e == "function" ? e(t) : e;
}
function F(e, t) {
	return (n) => {
		t.setState((t) => ({
			...t,
			[e]: P(n, t[e])
		}));
	};
}
function ue(e) {
	return e instanceof Function;
}
function de(e) {
	return Array.isArray(e) && e.every((e) => typeof e == "number");
}
function fe(e, t) {
	let n = [], r = (e) => {
		e.forEach((e) => {
			n.push(e);
			let i = t(e);
			i != null && i.length && r(i);
		});
	};
	return r(e), n;
}
function I(e, t, n) {
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
function L(e, t, n, r) {
	return {
		debug: () => e?.debugAll ?? e[t],
		key: process.env.NODE_ENV === "development" && n,
		onChange: r
	};
}
function pe(e, t, n, r) {
	let i = {
		id: `${t.id}_${n.id}`,
		row: t,
		column: n,
		getValue: () => t.getValue(r),
		renderValue: () => i.getValue() ?? e.options.renderFallbackValue,
		getContext: I(() => [
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
		}), L(e.options, "debugCells", "cell.getContext"))
	};
	return e._features.forEach((r) => {
		r.createCell == null || r.createCell(i, n, t, e);
	}, {}), i;
}
function me(e, t, n, r) {
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
		getFlatColumns: I(() => [!0], () => [c, ...c.columns?.flatMap((e) => e.getFlatColumns())], L(e.options, "debugColumns", "column.getFlatColumns")),
		getLeafColumns: I(() => [e._getOrderColumnsFn()], (e) => {
			var t;
			return (t = c.columns) != null && t.length ? e(c.columns.flatMap((e) => e.getLeafColumns())) : [c];
		}, L(e.options, "debugColumns", "column.getLeafColumns"))
	};
	for (let t of e._features) t.createColumn == null || t.createColumn(c, e);
	return c;
}
var R = "debugHeaders";
function he(e, t, n) {
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
var ge = { createTable: (e) => {
	e.getHeaderGroups = I(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => {
		let a = r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], o = i?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], s = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id)));
		return _e(t, [
			...a,
			...s,
			...o
		], e);
	}, L(e.options, R, "getHeaderGroups")), e.getCenterHeaderGroups = I(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left,
		e.getState().columnPinning.right
	], (t, n, r, i) => (n = n.filter((e) => !(r != null && r.includes(e.id)) && !(i != null && i.includes(e.id))), _e(t, n, e, "center")), L(e.options, R, "getCenterHeaderGroups")), e.getLeftHeaderGroups = I(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.left
	], (t, n, r) => _e(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "left"), L(e.options, R, "getLeftHeaderGroups")), e.getRightHeaderGroups = I(() => [
		e.getAllColumns(),
		e.getVisibleLeafColumns(),
		e.getState().columnPinning.right
	], (t, n, r) => _e(t, r?.map((e) => n.find((t) => t.id === e)).filter(Boolean) ?? [], e, "right"), L(e.options, R, "getRightHeaderGroups")), e.getFooterGroups = I(() => [e.getHeaderGroups()], (e) => [...e].reverse(), L(e.options, R, "getFooterGroups")), e.getLeftFooterGroups = I(() => [e.getLeftHeaderGroups()], (e) => [...e].reverse(), L(e.options, R, "getLeftFooterGroups")), e.getCenterFooterGroups = I(() => [e.getCenterHeaderGroups()], (e) => [...e].reverse(), L(e.options, R, "getCenterFooterGroups")), e.getRightFooterGroups = I(() => [e.getRightHeaderGroups()], (e) => [...e].reverse(), L(e.options, R, "getRightFooterGroups")), e.getFlatHeaders = I(() => [e.getHeaderGroups()], (e) => e.map((e) => e.headers).flat(), L(e.options, R, "getFlatHeaders")), e.getLeftFlatHeaders = I(() => [e.getLeftHeaderGroups()], (e) => e.map((e) => e.headers).flat(), L(e.options, R, "getLeftFlatHeaders")), e.getCenterFlatHeaders = I(() => [e.getCenterHeaderGroups()], (e) => e.map((e) => e.headers).flat(), L(e.options, R, "getCenterFlatHeaders")), e.getRightFlatHeaders = I(() => [e.getRightHeaderGroups()], (e) => e.map((e) => e.headers).flat(), L(e.options, R, "getRightFlatHeaders")), e.getCenterLeafHeaders = I(() => [e.getCenterFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), L(e.options, R, "getCenterLeafHeaders")), e.getLeftLeafHeaders = I(() => [e.getLeftFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), L(e.options, R, "getLeftLeafHeaders")), e.getRightLeafHeaders = I(() => [e.getRightFlatHeaders()], (e) => e.filter((e) => {
		var t;
		return !((t = e.subHeaders) != null && t.length);
	}), L(e.options, R, "getRightLeafHeaders")), e.getLeafHeaders = I(() => [
		e.getLeftHeaderGroups(),
		e.getCenterHeaderGroups(),
		e.getRightHeaderGroups()
	], (e, t, n) => [
		...e[0]?.headers ?? [],
		...t[0]?.headers ?? [],
		...n[0]?.headers ?? []
	].map((e) => e.getLeafHeaders()).flat(), L(e.options, R, "getLeafHeaders"));
} };
function _e(e, t, n, r) {
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
				let i = he(n, c, {
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
	s(t.map((e, t) => he(n, e, {
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
var ve = (e, t, n, r, i, a, o) => {
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
		getLeafRows: () => fe(s.subRows, (e) => e.subRows),
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
		getAllCells: I(() => [e.getAllLeafColumns()], (t) => t.map((t) => pe(e, s, t, t.id)), L(e.options, "debugRows", "getAllCells")),
		_getAllCellsByColumnId: I(() => [s.getAllCells()], (e) => e.reduce((e, t) => (e[t.column.id] = t, e), {}), L(e.options, "debugRows", "getAllCellsByColumnId"))
	};
	for (let t = 0; t < e._features.length; t++) {
		let n = e._features[t];
		n == null || n.createRow == null || n.createRow(s, e);
	}
	return s;
}, ye = { createColumn: (e, t) => {
	e._getFacetedRowModel = t.options.getFacetedRowModel && t.options.getFacetedRowModel(t, e.id), e.getFacetedRowModel = () => e._getFacetedRowModel ? e._getFacetedRowModel() : t.getPreFilteredRowModel(), e._getFacetedUniqueValues = t.options.getFacetedUniqueValues && t.options.getFacetedUniqueValues(t, e.id), e.getFacetedUniqueValues = () => e._getFacetedUniqueValues ? e._getFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getFacetedMinMaxValues = t.options.getFacetedMinMaxValues && t.options.getFacetedMinMaxValues(t, e.id), e.getFacetedMinMaxValues = () => {
		if (e._getFacetedMinMaxValues) return e._getFacetedMinMaxValues();
	};
} }, be = (e, t, n) => {
	var r, i;
	let a = n == null || (r = n.toString()) == null ? void 0 : r.toLowerCase();
	return !!(!((i = e.getValue(t)) == null || (i = i.toString()) == null || (i = i.toLowerCase()) == null) && i.includes(a));
};
be.autoRemove = (e) => B(e);
var xe = (e, t, n) => {
	var r;
	return !!(!((r = e.getValue(t)) == null || (r = r.toString()) == null) && r.includes(n));
};
xe.autoRemove = (e) => B(e);
var Se = (e, t, n) => {
	var r;
	return ((r = e.getValue(t)) == null || (r = r.toString()) == null ? void 0 : r.toLowerCase()) === n?.toLowerCase();
};
Se.autoRemove = (e) => B(e);
var Ce = (e, t, n) => e.getValue(t)?.includes(n);
Ce.autoRemove = (e) => B(e);
var we = (e, t, n) => !n.some((n) => {
	var r;
	return !((r = e.getValue(t)) != null && r.includes(n));
});
we.autoRemove = (e) => B(e) || !(e != null && e.length);
var Te = (e, t, n) => n.some((n) => e.getValue(t)?.includes(n));
Te.autoRemove = (e) => B(e) || !(e != null && e.length);
var Ee = (e, t, n) => e.getValue(t) === n;
Ee.autoRemove = (e) => B(e);
var De = (e, t, n) => e.getValue(t) == n;
De.autoRemove = (e) => B(e);
var Oe = (e, t, n) => {
	let [r, i] = n, a = e.getValue(t);
	return a >= r && a <= i;
};
Oe.resolveFilterValue = (e) => {
	let [t, n] = e, r = typeof t == "number" ? t : parseFloat(t), i = typeof n == "number" ? n : parseFloat(n), a = t === null || Number.isNaN(r) ? -Infinity : r, o = n === null || Number.isNaN(i) ? Infinity : i;
	if (a > o) {
		let e = a;
		a = o, o = e;
	}
	return [a, o];
}, Oe.autoRemove = (e) => B(e) || B(e[0]) && B(e[1]);
var z = {
	includesString: be,
	includesStringSensitive: xe,
	equalsString: Se,
	arrIncludes: Ce,
	arrIncludesAll: we,
	arrIncludesSome: Te,
	equals: Ee,
	weakEquals: De,
	inNumberRange: Oe
};
function B(e) {
	return e == null || e === "";
}
var ke = {
	getDefaultColumnDef: () => ({ filterFn: "auto" }),
	getInitialState: (e) => ({
		columnFilters: [],
		...e
	}),
	getDefaultOptions: (e) => ({
		onColumnFiltersChange: F("columnFilters", e),
		filterFromLeafRows: !1,
		maxLeafRowFilterDepth: 100
	}),
	createColumn: (e, t) => {
		e.getAutoFilterFn = () => {
			let n = t.getCoreRowModel().flatRows[0]?.getValue(e.id);
			return typeof n == "string" ? z.includesString : typeof n == "number" ? z.inNumberRange : typeof n == "boolean" || typeof n == "object" && n ? z.equals : Array.isArray(n) ? z.arrIncludes : z.weakEquals;
		}, e.getFilterFn = () => ue(e.columnDef.filterFn) ? e.columnDef.filterFn : e.columnDef.filterFn === "auto" ? e.getAutoFilterFn() : t.options.filterFns?.[e.columnDef.filterFn] ?? z[e.columnDef.filterFn], e.getCanFilter = () => (e.columnDef.enableColumnFilter ?? !0) && (t.options.enableColumnFilters ?? !0) && (t.options.enableFilters ?? !0) && !!e.accessorFn, e.getIsFiltered = () => e.getFilterIndex() > -1, e.getFilterValue = () => {
			var n;
			return (n = t.getState().columnFilters) == null || (n = n.find((t) => t.id === e.id)) == null ? void 0 : n.value;
		}, e.getFilterIndex = () => t.getState().columnFilters?.findIndex((t) => t.id === e.id) ?? -1, e.setFilterValue = (n) => {
			t.setColumnFilters((t) => {
				let r = e.getFilterFn(), i = t?.find((t) => t.id === e.id), a = P(n, i ? i.value : void 0);
				if (Ae(r, a, e)) return t?.filter((t) => t.id !== e.id) ?? [];
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
			e.options.onColumnFiltersChange == null || e.options.onColumnFiltersChange((e) => P(t, e)?.filter((e) => {
				let t = n.find((t) => t.id === e.id);
				return !(t && Ae(t.getFilterFn(), e.value, t));
			}));
		}, e.resetColumnFilters = (t) => {
			e.setColumnFilters(t ? [] : e.initialState?.columnFilters ?? []);
		}, e.getPreFilteredRowModel = () => e.getCoreRowModel(), e.getFilteredRowModel = () => (!e._getFilteredRowModel && e.options.getFilteredRowModel && (e._getFilteredRowModel = e.options.getFilteredRowModel(e)), e.options.manualFiltering || !e._getFilteredRowModel ? e.getPreFilteredRowModel() : e._getFilteredRowModel());
	}
};
function Ae(e, t, n) {
	return (e && e.autoRemove ? e.autoRemove(t, n) : !1) || t === void 0 || typeof t == "string" && !t;
}
var je = {
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
		if (!de(n)) return;
		if (n.length === 1) return n[0];
		let r = Math.floor(n.length / 2), i = n.sort((e, t) => e - t);
		return n.length % 2 == 0 ? (i[r - 1] + i[r]) / 2 : i[r];
	},
	unique: (e, t) => Array.from(new Set(t.map((t) => t.getValue(e))).values()),
	uniqueCount: (e, t) => new Set(t.map((t) => t.getValue(e))).size,
	count: (e, t) => t.length
}, Me = {
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
		onGroupingChange: F("grouping", e),
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
			if (typeof n == "number") return je.sum;
			if (Object.prototype.toString.call(n) === "[object Date]") return je.extent;
		}, e.getAggregationFn = () => {
			if (!e) throw Error();
			return ue(e.columnDef.aggregationFn) ? e.columnDef.aggregationFn : e.columnDef.aggregationFn === "auto" ? e.getAutoAggregationFn() : t.options.aggregationFns?.[e.columnDef.aggregationFn] ?? je[e.columnDef.aggregationFn];
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
function Ne(e, t, n) {
	if (!(t != null && t.length) || !n) return e;
	let r = e.filter((e) => !t.includes(e.id));
	return n === "remove" ? r : [...t.map((t) => e.find((e) => e.id === t)).filter(Boolean), ...r];
}
var Pe = {
	getInitialState: (e) => ({
		columnOrder: [],
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnOrderChange: F("columnOrder", e) }),
	createColumn: (e, t) => {
		e.getIndex = I((e) => [Ge(t, e)], (t) => t.findIndex((t) => t.id === e.id), L(t.options, "debugColumns", "getIndex")), e.getIsFirstColumn = (n) => Ge(t, n)[0]?.id === e.id, e.getIsLastColumn = (n) => {
			let r = Ge(t, n);
			return r[r.length - 1]?.id === e.id;
		};
	},
	createTable: (e) => {
		e.setColumnOrder = (t) => e.options.onColumnOrderChange == null ? void 0 : e.options.onColumnOrderChange(t), e.resetColumnOrder = (t) => {
			e.setColumnOrder(t ? [] : e.initialState.columnOrder ?? []);
		}, e._getOrderColumnsFn = I(() => [
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
			return Ne(i, t, n);
		}, L(e.options, "debugTable", "_getOrderColumnsFn"));
	}
}, Fe = () => ({
	left: [],
	right: []
}), Ie = {
	getInitialState: (e) => ({
		columnPinning: Fe(),
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnPinningChange: F("columnPinning", e) }),
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
		e.getCenterVisibleCells = I(() => [
			e._getAllVisibleCells(),
			t.getState().columnPinning.left,
			t.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.column.id));
		}, L(t.options, "debugRows", "getCenterVisibleCells")), e.getLeftVisibleCells = I(() => [e._getAllVisibleCells(), t.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "left"
		})), L(t.options, "debugRows", "getLeftVisibleCells")), e.getRightVisibleCells = I(() => [e._getAllVisibleCells(), t.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.column.id === t)).filter(Boolean).map((e) => ({
			...e,
			position: "right"
		})), L(t.options, "debugRows", "getRightVisibleCells"));
	},
	createTable: (e) => {
		e.setColumnPinning = (t) => e.options.onColumnPinningChange == null ? void 0 : e.options.onColumnPinningChange(t), e.resetColumnPinning = (t) => e.setColumnPinning(t ? Fe() : e.initialState?.columnPinning ?? Fe()), e.getIsSomeColumnsPinned = (t) => {
			let n = e.getState().columnPinning;
			return t ? !!n[t]?.length : !!(n.left?.length || n.right?.length);
		}, e.getLeftLeafColumns = I(() => [e.getAllLeafColumns(), e.getState().columnPinning.left], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), L(e.options, "debugColumns", "getLeftLeafColumns")), e.getRightLeafColumns = I(() => [e.getAllLeafColumns(), e.getState().columnPinning.right], (e, t) => (t ?? []).map((t) => e.find((e) => e.id === t)).filter(Boolean), L(e.options, "debugColumns", "getRightLeafColumns")), e.getCenterLeafColumns = I(() => [
			e.getAllLeafColumns(),
			e.getState().columnPinning.left,
			e.getState().columnPinning.right
		], (e, t, n) => {
			let r = [...t ?? [], ...n ?? []];
			return e.filter((e) => !r.includes(e.id));
		}, L(e.options, "debugColumns", "getCenterLeafColumns"));
	}
};
function Le(e) {
	return e || (typeof document < "u" ? document : null);
}
var Re = {
	size: 150,
	minSize: 20,
	maxSize: 2 ** 53 - 1
}, ze = () => ({
	startOffset: null,
	startSize: null,
	deltaOffset: null,
	deltaPercentage: null,
	isResizingColumn: !1,
	columnSizingStart: []
}), Be = {
	getDefaultColumnDef: () => Re,
	getInitialState: (e) => ({
		columnSizing: {},
		columnSizingInfo: ze(),
		...e
	}),
	getDefaultOptions: (e) => ({
		columnResizeMode: "onEnd",
		columnResizeDirection: "ltr",
		onColumnSizingChange: F("columnSizing", e),
		onColumnSizingInfoChange: F("columnSizingInfo", e)
	}),
	createColumn: (e, t) => {
		e.getSize = () => {
			let n = t.getState().columnSizing[e.id];
			return Math.min(Math.max(e.columnDef.minSize ?? Re.minSize, n ?? e.columnDef.size ?? Re.size), e.columnDef.maxSize ?? Re.maxSize);
		}, e.getStart = I((e) => [
			e,
			Ge(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(0, e.getIndex(t)).reduce((e, t) => e + t.getSize(), 0), L(t.options, "debugColumns", "getStart")), e.getAfter = I((e) => [
			e,
			Ge(t, e),
			t.getState().columnSizing
		], (t, n) => n.slice(e.getIndex(t) + 1).reduce((e, t) => e + t.getSize(), 0), L(t.options, "debugColumns", "getAfter")), e.resetSize = () => {
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
				if (!r || !i || (a.persist == null || a.persist(), Ue(a) && a.touches && a.touches.length > 1)) return;
				let o = e.getSize(), s = e ? e.getLeafHeaders().map((e) => [e.column.id, e.column.getSize()]) : [[r.id, r.getSize()]], c = Ue(a) ? Math.round(a.touches[0].clientX) : a.clientX, l = {}, u = (e, n) => {
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
				}, p = Le(n), m = {
					moveHandler: (e) => d(e.clientX),
					upHandler: (e) => {
						p?.removeEventListener("mousemove", m.moveHandler), p?.removeEventListener("mouseup", m.upHandler), f(e.clientX);
					}
				}, h = {
					moveHandler: (e) => (e.cancelable && (e.preventDefault(), e.stopPropagation()), d(e.touches[0].clientX), !1),
					upHandler: (e) => {
						p?.removeEventListener("touchmove", h.moveHandler), p?.removeEventListener("touchend", h.upHandler), e.cancelable && (e.preventDefault(), e.stopPropagation()), f(e.touches[0]?.clientX);
					}
				}, g = He() ? { passive: !1 } : !1;
				Ue(a) ? (p?.addEventListener("touchmove", h.moveHandler, g), p?.addEventListener("touchend", h.upHandler, g)) : (p?.addEventListener("mousemove", m.moveHandler, g), p?.addEventListener("mouseup", m.upHandler, g)), t.setColumnSizingInfo((e) => ({
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
			e.setColumnSizingInfo(t ? ze() : e.initialState.columnSizingInfo ?? ze());
		}, e.getTotalSize = () => e.getHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getLeftTotalSize = () => e.getLeftHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getCenterTotalSize = () => e.getCenterHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0, e.getRightTotalSize = () => e.getRightHeaderGroups()[0]?.headers.reduce((e, t) => e + t.getSize(), 0) ?? 0;
	}
}, Ve = null;
function He() {
	if (typeof Ve == "boolean") return Ve;
	let e = !1;
	try {
		let t = { get passive() {
			return e = !0, !1;
		} }, n = () => {};
		window.addEventListener("test", n, t), window.removeEventListener("test", n);
	} catch {
		e = !1;
	}
	return Ve = e, Ve;
}
function Ue(e) {
	return e.type === "touchstart";
}
var We = {
	getInitialState: (e) => ({
		columnVisibility: {},
		...e
	}),
	getDefaultOptions: (e) => ({ onColumnVisibilityChange: F("columnVisibility", e) }),
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
		e._getAllVisibleCells = I(() => [e.getAllCells(), t.getState().columnVisibility], (e) => e.filter((e) => e.column.getIsVisible()), L(t.options, "debugRows", "_getAllVisibleCells")), e.getVisibleCells = I(() => [
			e.getLeftVisibleCells(),
			e.getCenterVisibleCells(),
			e.getRightVisibleCells()
		], (e, t, n) => [
			...e,
			...t,
			...n
		], L(t.options, "debugRows", "getVisibleCells"));
	},
	createTable: (e) => {
		let t = (t, n) => I(() => [n(), n().filter((e) => e.getIsVisible()).map((e) => e.id).join("_")], (e) => e.filter((e) => e.getIsVisible == null ? void 0 : e.getIsVisible()), L(e.options, "debugColumns", t));
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
function Ge(e, t) {
	return t ? t === "center" ? e.getCenterVisibleLeafColumns() : t === "left" ? e.getLeftVisibleLeafColumns() : e.getRightVisibleLeafColumns() : e.getVisibleLeafColumns();
}
var Ke = { createTable: (e) => {
	e._getGlobalFacetedRowModel = e.options.getFacetedRowModel && e.options.getFacetedRowModel(e, "__global__"), e.getGlobalFacetedRowModel = () => e.options.manualFiltering || !e._getGlobalFacetedRowModel ? e.getPreFilteredRowModel() : e._getGlobalFacetedRowModel(), e._getGlobalFacetedUniqueValues = e.options.getFacetedUniqueValues && e.options.getFacetedUniqueValues(e, "__global__"), e.getGlobalFacetedUniqueValues = () => e._getGlobalFacetedUniqueValues ? e._getGlobalFacetedUniqueValues() : /* @__PURE__ */ new Map(), e._getGlobalFacetedMinMaxValues = e.options.getFacetedMinMaxValues && e.options.getFacetedMinMaxValues(e, "__global__"), e.getGlobalFacetedMinMaxValues = () => {
		if (e._getGlobalFacetedMinMaxValues) return e._getGlobalFacetedMinMaxValues();
	};
} }, qe = {
	getInitialState: (e) => ({
		globalFilter: void 0,
		...e
	}),
	getDefaultOptions: (e) => ({
		onGlobalFilterChange: F("globalFilter", e),
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
		e.getGlobalAutoFilterFn = () => z.includesString, e.getGlobalFilterFn = () => {
			let { globalFilterFn: t } = e.options;
			return ue(t) ? t : t === "auto" ? e.getGlobalAutoFilterFn() : e.options.filterFns?.[t] ?? z[t];
		}, e.setGlobalFilter = (t) => {
			e.options.onGlobalFilterChange == null || e.options.onGlobalFilterChange(t);
		}, e.resetGlobalFilter = (t) => {
			e.setGlobalFilter(t ? void 0 : e.initialState.globalFilter);
		};
	}
}, Je = {
	getInitialState: (e) => ({
		expanded: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onExpandedChange: F("expanded", e),
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
}, Ye = 0, Xe = 10, Ze = () => ({
	pageIndex: Ye,
	pageSize: Xe
}), Qe = {
	getInitialState: (e) => ({
		...e,
		pagination: {
			...Ze(),
			...e?.pagination
		}
	}),
	getDefaultOptions: (e) => ({ onPaginationChange: F("pagination", e) }),
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
		}, e.setPagination = (t) => e.options.onPaginationChange == null ? void 0 : e.options.onPaginationChange((e) => P(t, e)), e.resetPagination = (t) => {
			e.setPagination(t ? Ze() : e.initialState.pagination ?? Ze());
		}, e.setPageIndex = (t) => {
			e.setPagination((n) => {
				let r = P(t, n.pageIndex), i = e.options.pageCount === void 0 || e.options.pageCount === -1 ? 2 ** 53 - 1 : e.options.pageCount - 1;
				return r = Math.max(0, Math.min(r, i)), {
					...n,
					pageIndex: r
				};
			});
		}, e.resetPageIndex = (t) => {
			var n;
			e.setPageIndex(t ? Ye : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageIndex) ?? Ye);
		}, e.resetPageSize = (t) => {
			var n;
			e.setPageSize(t ? Xe : ((n = e.initialState) == null || (n = n.pagination) == null ? void 0 : n.pageSize) ?? Xe);
		}, e.setPageSize = (t) => {
			e.setPagination((e) => {
				let n = Math.max(1, P(t, e.pageSize)), r = e.pageSize * e.pageIndex, i = Math.floor(r / n);
				return {
					...e,
					pageIndex: i,
					pageSize: n
				};
			});
		}, e.setPageCount = (t) => e.setPagination((n) => {
			let r = P(t, e.options.pageCount ?? -1);
			return typeof r == "number" && (r = Math.max(-1, r)), {
				...n,
				pageCount: r
			};
		}), e.getPageOptions = I(() => [e.getPageCount()], (e) => {
			let t = [];
			return e && e > 0 && (t = [...Array(e)].fill(null).map((e, t) => t)), t;
		}, L(e.options, "debugTable", "getPageOptions")), e.getCanPreviousPage = () => e.getState().pagination.pageIndex > 0, e.getCanNextPage = () => {
			let { pageIndex: t } = e.getState().pagination, n = e.getPageCount();
			return n === -1 ? !0 : n === 0 ? !1 : t < n - 1;
		}, e.previousPage = () => e.setPageIndex((e) => e - 1), e.nextPage = () => e.setPageIndex((e) => e + 1), e.firstPage = () => e.setPageIndex(0), e.lastPage = () => e.setPageIndex(e.getPageCount() - 1), e.getPrePaginationRowModel = () => e.getExpandedRowModel(), e.getPaginationRowModel = () => (!e._getPaginationRowModel && e.options.getPaginationRowModel && (e._getPaginationRowModel = e.options.getPaginationRowModel(e)), e.options.manualPagination || !e._getPaginationRowModel ? e.getPrePaginationRowModel() : e._getPaginationRowModel()), e.getPageCount = () => e.options.pageCount ?? Math.ceil(e.getRowCount() / e.getState().pagination.pageSize), e.getRowCount = () => e.options.rowCount ?? e.getPrePaginationRowModel().rows.length;
	}
}, $e = () => ({
	top: [],
	bottom: []
}), et = {
	getInitialState: (e) => ({
		rowPinning: $e(),
		...e
	}),
	getDefaultOptions: (e) => ({ onRowPinningChange: F("rowPinning", e) }),
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
		e.setRowPinning = (t) => e.options.onRowPinningChange == null ? void 0 : e.options.onRowPinningChange(t), e.resetRowPinning = (t) => e.setRowPinning(t ? $e() : e.initialState?.rowPinning ?? $e()), e.getIsSomeRowsPinned = (t) => {
			let n = e.getState().rowPinning;
			return t ? !!n[t]?.length : !!(n.top?.length || n.bottom?.length);
		}, e._getPinnedRows = (t, n, r) => (e.options.keepPinnedRows ?? !0 ? (n ?? []).map((t) => {
			let n = e.getRow(t, !0);
			return n.getIsAllParentsExpanded() ? n : null;
		}) : (n ?? []).map((e) => t.find((t) => t.id === e))).filter(Boolean).map((e) => ({
			...e,
			position: r
		})), e.getTopRows = I(() => [e.getRowModel().rows, e.getState().rowPinning.top], (t, n) => e._getPinnedRows(t, n, "top"), L(e.options, "debugRows", "getTopRows")), e.getBottomRows = I(() => [e.getRowModel().rows, e.getState().rowPinning.bottom], (t, n) => e._getPinnedRows(t, n, "bottom"), L(e.options, "debugRows", "getBottomRows")), e.getCenterRows = I(() => [
			e.getRowModel().rows,
			e.getState().rowPinning.top,
			e.getState().rowPinning.bottom
		], (e, t, n) => {
			let r = /* @__PURE__ */ new Set([...t ?? [], ...n ?? []]);
			return e.filter((e) => !r.has(e.id));
		}, L(e.options, "debugRows", "getCenterRows"));
	}
}, tt = {
	getInitialState: (e) => ({
		rowSelection: {},
		...e
	}),
	getDefaultOptions: (e) => ({
		onRowSelectionChange: F("rowSelection", e),
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
				nt(i, t.id, r, !0, e);
			}), i;
		}), e.getPreSelectedRowModel = () => e.getCoreRowModel(), e.getSelectedRowModel = I(() => [e.getState().rowSelection, e.getCoreRowModel()], (t, n) => Object.keys(t).length ? rt(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, L(e.options, "debugTable", "getSelectedRowModel")), e.getFilteredSelectedRowModel = I(() => [e.getState().rowSelection, e.getFilteredRowModel()], (t, n) => Object.keys(t).length ? rt(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, L(e.options, "debugTable", "getFilteredSelectedRowModel")), e.getGroupedSelectedRowModel = I(() => [e.getState().rowSelection, e.getSortedRowModel()], (t, n) => Object.keys(t).length ? rt(e, n) : {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, L(e.options, "debugTable", "getGroupedSelectedRowModel")), e.getIsAllRowsSelected = () => {
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
				return nt(o, e.id, n, r?.selectChildren ?? !0, t), o;
			});
		}, e.getIsSelected = () => {
			let { rowSelection: n } = t.getState();
			return it(e, n);
		}, e.getIsSomeSelected = () => {
			let { rowSelection: n } = t.getState();
			return at(e, n) === "some";
		}, e.getIsAllSubRowsSelected = () => {
			let { rowSelection: n } = t.getState();
			return at(e, n) === "all";
		}, e.getCanSelect = () => typeof t.options.enableRowSelection == "function" ? t.options.enableRowSelection(e) : t.options.enableRowSelection ?? !0, e.getCanSelectSubRows = () => typeof t.options.enableSubRowSelection == "function" ? t.options.enableSubRowSelection(e) : t.options.enableSubRowSelection ?? !0, e.getCanMultiSelect = () => typeof t.options.enableMultiRowSelection == "function" ? t.options.enableMultiRowSelection(e) : t.options.enableMultiRowSelection ?? !0, e.getToggleSelectedHandler = () => {
			let t = e.getCanSelect();
			return (n) => {
				t && e.toggleSelected(n.target?.checked);
			};
		};
	}
}, nt = (e, t, n, r, i) => {
	var a;
	let o = i.getRow(t, !0);
	n ? (o.getCanMultiSelect() || Object.keys(e).forEach((t) => delete e[t]), o.getCanSelect() && (e[t] = !0)) : delete e[t], r && (a = o.subRows) != null && a.length && o.getCanSelectSubRows() && o.subRows.forEach((t) => nt(e, t.id, n, r, i));
};
function rt(e, t) {
	let n = e.getState().rowSelection, r = [], i = {}, a = function(e, t) {
		return e.map((e) => {
			var t;
			let o = it(e, n);
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
function it(e, t) {
	return t[e.id] ?? !1;
}
function at(e, t, n) {
	var r;
	if (!((r = e.subRows) != null && r.length)) return !1;
	let i = !0, a = !1;
	return e.subRows.forEach((e) => {
		if (!(a && !i) && (e.getCanSelect() && (it(e, t) ? a = !0 : i = !1), e.subRows && e.subRows.length)) {
			let n = at(e, t);
			n === "all" ? a = !0 : (n === "some" && (a = !0), i = !1);
		}
	}), i ? "all" : a ? "some" : !1;
}
var ot = /([0-9]+)/gm, st = (e, t, n) => mt(V(e.getValue(n)).toLowerCase(), V(t.getValue(n)).toLowerCase()), ct = (e, t, n) => mt(V(e.getValue(n)), V(t.getValue(n))), lt = (e, t, n) => pt(V(e.getValue(n)).toLowerCase(), V(t.getValue(n)).toLowerCase()), ut = (e, t, n) => pt(V(e.getValue(n)), V(t.getValue(n))), dt = (e, t, n) => {
	let r = e.getValue(n), i = t.getValue(n);
	return r > i ? 1 : r < i ? -1 : 0;
}, ft = (e, t, n) => pt(e.getValue(n), t.getValue(n));
function pt(e, t) {
	return e === t ? 0 : e > t ? 1 : -1;
}
function V(e) {
	return typeof e == "number" ? isNaN(e) || e === Infinity || e === -Infinity ? "" : String(e) : typeof e == "string" ? e : "";
}
function mt(e, t) {
	let n = e.split(ot).filter(Boolean), r = t.split(ot).filter(Boolean);
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
var ht = {
	alphanumeric: st,
	alphanumericCaseSensitive: ct,
	text: lt,
	textCaseSensitive: ut,
	datetime: dt,
	basic: ft
}, gt = [
	ge,
	We,
	Pe,
	Ie,
	ye,
	ke,
	Ke,
	qe,
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
			onSortingChange: F("sorting", e),
			isMultiSortEvent: (e) => e.shiftKey
		}),
		createColumn: (e, t) => {
			e.getAutoSortingFn = () => {
				let n = t.getFilteredRowModel().flatRows.slice(10), r = !1;
				for (let t of n) {
					let n = t?.getValue(e.id);
					if (Object.prototype.toString.call(n) === "[object Date]") return ht.datetime;
					if (typeof n == "string" && (r = !0, n.split(ot).length > 1)) return ht.alphanumeric;
				}
				return r ? ht.text : ht.basic;
			}, e.getAutoSortDir = () => typeof t.getFilteredRowModel().flatRows[0]?.getValue(e.id) == "string" ? "asc" : "desc", e.getSortingFn = () => {
				if (!e) throw Error();
				return ue(e.columnDef.sortingFn) ? e.columnDef.sortingFn : e.columnDef.sortingFn === "auto" ? e.getAutoSortingFn() : t.options.sortingFns?.[e.columnDef.sortingFn] ?? ht[e.columnDef.sortingFn];
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
	Me,
	Je,
	Qe,
	et,
	tt,
	Be
];
function _t(e) {
	process.env.NODE_ENV !== "production" && (e.debugAll || e.debugTable) && console.info("Creating Table Instance...");
	let t = [...gt, ...e._features ?? []], n = { _features: t }, r = n._features.reduce((e, t) => Object.assign(e, t.getDefaultOptions == null ? void 0 : t.getDefaultOptions(n)), {}), i = (e) => n.options.mergeOptions ? n.options.mergeOptions(r, e) : {
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
			let t = P(e, n.options);
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
		_getDefaultColumnDef: I(() => [n.options.defaultColumn], (e) => (e ??= {}, {
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
		}), L(e, "debugColumns", "_getDefaultColumnDef")),
		_getColumnDefs: () => n.options.columns,
		getAllColumns: I(() => [n._getColumnDefs()], (e) => {
			let t = function(e, r, i) {
				return i === void 0 && (i = 0), e.map((e) => {
					let a = me(n, e, i, r), o = e;
					return a.columns = o.columns ? t(o.columns, a, i + 1) : [], a;
				});
			};
			return t(e);
		}, L(e, "debugColumns", "getAllColumns")),
		getAllFlatColumns: I(() => [n.getAllColumns()], (e) => e.flatMap((e) => e.getFlatColumns()), L(e, "debugColumns", "getAllFlatColumns")),
		_getAllFlatColumnsById: I(() => [n.getAllFlatColumns()], (e) => e.reduce((e, t) => (e[t.id] = t, e), {}), L(e, "debugColumns", "getAllFlatColumnsById")),
		getAllLeafColumns: I(() => [n.getAllColumns(), n._getOrderColumnsFn()], (e, t) => t(e.flatMap((e) => e.getLeafColumns())), L(e, "debugColumns", "getAllLeafColumns")),
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
function vt() {
	return (e) => I(() => [e.options.data], (t) => {
		let n = {
			rows: [],
			flatRows: [],
			rowsById: {}
		}, r = function(t, i, a) {
			i === void 0 && (i = 0);
			let o = [];
			for (let c = 0; c < t.length; c++) {
				let l = ve(e, e._getRowId(t[c], c, a), t[c], c, i, void 0, a?.id);
				if (n.flatRows.push(l), n.rowsById[l.id] = l, o.push(l), e.options.getSubRows) {
					var s;
					l.originalSubRows = e.options.getSubRows(t[c], c), (s = l.originalSubRows) != null && s.length && (l.subRows = r(l.originalSubRows, i + 1, l));
				}
			}
			return o;
		};
		return n.rows = r(t), n;
	}, L(e.options, "debugTable", "getRowModel", () => e._autoResetPageIndex()));
}
function yt(e) {
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
function bt(e) {
	return (e) => I(() => [
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
		} : yt({
			rows: a,
			flatRows: o,
			rowsById: s
		}), u.flatRows = [];
		let d = (e) => {
			u.flatRows.push(e), e.subRows.length && e.subRows.forEach(d);
		};
		return u.rows.forEach(d), u;
	}, L(e.options, "debugTable", "getPaginationRowModel"));
}
function xt() {
	return (e) => I(() => [e.getState().sorting, e.getPreSortedRowModel()], (t, n) => {
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
	}, L(e.options, "debugTable", "getSortedRowModel", () => e._autoResetPageIndex()));
}
//#endregion
//#region ../../../../node_modules/.pnpm/@tanstack+react-table@8.21.3_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@tanstack/react-table/build/lib/index.mjs
function St(e, n) {
	return e ? Ct(e) ? /*#__PURE__*/ t.createElement(e, n) : e : null;
}
function Ct(e) {
	return wt(e) || typeof e == "function" || Tt(e);
}
function wt(e) {
	return typeof e == "function" && (() => {
		let t = Object.getPrototypeOf(e);
		return t.prototype && t.prototype.isReactComponent;
	})();
}
function Tt(e) {
	return typeof e == "object" && typeof e.$$typeof == "symbol" && ["react.memo", "react.forward_ref"].includes(e.$$typeof.description);
}
function Et(e) {
	let n = {
		state: {},
		onStateChange: () => {},
		renderFallbackValue: null,
		...e
	}, [r] = t.useState(() => ({ current: _t(n) })), [i, a] = t.useState(() => r.current.initialState);
	return r.current.setOptions((t) => ({
		...t,
		...e,
		state: {
			...i,
			...e.state
		},
		onStateChange: (t) => {
			a(t), e.onStateChange == null || e.onStateChange(t);
		}
	})), r.current;
}
var Dt = e("arrow-down", [["path", {
	d: "M12 5v14",
	key: "s699le"
}], ["path", {
	d: "m19 12-7 7-7-7",
	key: "1idqje"
}]]), Ot = e("arrow-right", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}], ["path", {
	d: "m12 5 7 7-7 7",
	key: "xquz4c"
}]]), kt = e("arrow-up", [["path", {
	d: "m5 12 7-7 7 7",
	key: "hav0vg"
}], ["path", {
	d: "M12 19V5",
	key: "x0mq9r"
}]]), At = e("chevron-left", [["path", {
	d: "m15 18-6-6 6-6",
	key: "1wnfg3"
}]]), jt = e("chevron-right", [["path", {
	d: "m9 18 6-6-6-6",
	key: "mthhwq"
}]]), Mt = e("chevrons-up-down", [["path", {
	d: "m7 15 5 5 5-5",
	key: "1hf1tw"
}], ["path", {
	d: "m7 9 5-5 5 5",
	key: "sgt6xg"
}]]), Nt = e("inbox", [["polyline", {
	points: "22 12 16 12 14 15 10 15 8 12 2 12",
	key: "o97t9d"
}], ["path", {
	d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
	key: "oot6mr"
}]]), Pt = e("settings", [["path", {
	d: "M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915",
	key: "1i5ecw"
}], ["circle", {
	cx: "12",
	cy: "12",
	r: "3",
	key: "1v7zrd"
}]]), Ft = {
	asc: "ascending",
	desc: "descending"
}, It = /* @__PURE__ */ M(s, { children: /* @__PURE__ */ N(c, { children: [/* @__PURE__ */ M(l, {
	variant: "icon",
	children: /* @__PURE__ */ M(Nt, {})
}), /* @__PURE__ */ M(u, { children: "No results" })] }) });
function Lt({ table: e, pageSizeOptions: t }) {
	let { pageIndex: n, pageSize: r } = e.getState().pagination, i = e.getPageCount(), a = e.getFilteredRowModel().rows.length, o = a === 0 ? 0 : n * r + 1, s = Math.min((n + 1) * r, a), c = ce(i, n);
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
			}), t?.length ? /* @__PURE__ */ N(x, {
				value: String(r),
				onValueChange: (t) => e.setPageSize(Number(t)),
				children: [/* @__PURE__ */ M(T, {
					size: "sm",
					className: "w-auto gap-1",
					"aria-label": "Rows per page",
					children: /* @__PURE__ */ M(E, {})
				}), /* @__PURE__ */ M(S, { children: /* @__PURE__ */ M(C, { children: t.map((e) => /* @__PURE__ */ N(w, {
					value: String(e),
					children: [e, " / page"]
				}, e)) }) })]
			}) : null]
		}), /* @__PURE__ */ M(p, {
			className: "w-auto",
			children: /* @__PURE__ */ N(h, { children: [
				/* @__PURE__ */ M(_, { children: /* @__PURE__ */ M(y, {
					disabled: !e.getCanPreviousPage(),
					onClick: () => e.previousPage(),
					children: /* @__PURE__ */ M("span", {
						className: "sr-only",
						children: "Previous"
					})
				}) }),
				c.map((t, r) => t === "ellipsis" ? /* @__PURE__ */ M(_, { children: /* @__PURE__ */ M(g, {}) }, `ellipsis-${r}`) : /* @__PURE__ */ M(_, { children: /* @__PURE__ */ M(m, {
					isActive: t === n,
					"aria-label": `Go to page ${t + 1}`,
					onClick: () => e.setPageIndex(t),
					children: t + 1
				}) }, t)),
				/* @__PURE__ */ M(_, { children: /* @__PURE__ */ M(v, {
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
function Rt({ columns: e, data: n, className: r, stickyHeader: i, fullWidth: a, size: s, empty: c = It, pageSize: l, pageSizeOptions: u }) {
	let d = l != null, [f, p] = t.useState([]), [m, h] = t.useState({
		pageIndex: 0,
		pageSize: l ?? 10
	});
	t.useEffect(() => {
		l != null && h((e) => ({
			...e,
			pageIndex: 0,
			pageSize: l
		}));
	}, [l]);
	let g = Et({
		data: n,
		columns: e,
		state: {
			sorting: f,
			...d ? { pagination: m } : {}
		},
		onSortingChange: p,
		...d ? { onPaginationChange: h } : {},
		getCoreRowModel: vt(),
		getSortedRowModel: xt(),
		...d ? { getPaginationRowModel: bt() } : {}
	}), _ = g.getRowModel().rows, v = /* @__PURE__ */ N(O, {
		className: r,
		stickyHeader: i,
		fullWidth: a,
		size: s,
		children: [/* @__PURE__ */ M(j, { children: g.getHeaderGroups().map((e) => /* @__PURE__ */ M(ne, { children: e.headers.map((e) => {
			let t = e.column.getIsSorted(), { align: n, expand: r } = e.column.columnDef.meta ?? {}, i = e.isPlaceholder ? null : St(e.column.columnDef.header, e.getContext());
			return /* @__PURE__ */ M(te, {
				colSpan: e.colSpan,
				align: n,
				expand: r,
				"aria-sort": t ? Ft[t] : void 0,
				children: e.column.getCanSort() && !e.isPlaceholder ? /* @__PURE__ */ N(o, {
					size: "sm",
					"aria-selected": t ? !0 : void 0,
					className: se("gap-1.5", t && "text-foreground", !t && "hover:bg-fill-hover/50"),
					onClick: e.column.getToggleSortingHandler(),
					children: [i, t === "asc" ? /* @__PURE__ */ M(kt, { className: "size-3" }) : t === "desc" ? /* @__PURE__ */ M(Dt, { className: "size-3" }) : /* @__PURE__ */ M(Mt, { className: "size-3 opacity-50" })]
				}) : i
			}, e.id);
		}) }, e.id)) }), /* @__PURE__ */ M(k, { children: _.length ? _.map((e) => /* @__PURE__ */ M(ne, {
			"data-state": e.getIsSelected() ? "selected" : void 0,
			children: e.getVisibleCells().map((e) => /* @__PURE__ */ M(A, {
				align: e.column.columnDef.meta?.align,
				expand: e.column.columnDef.meta?.expand,
				children: St(e.column.columnDef.cell, e.getContext())
			}, e.id))
		}, e.id)) : /* @__PURE__ */ M(ne, { children: /* @__PURE__ */ M(A, {
			colSpan: e.length,
			className: "p-2 hover:bg-transparent",
			children: c
		}) }) })]
	});
	return !d || g.getFilteredRowModel().rows.length === 0 ? v : /* @__PURE__ */ N("div", {
		className: "flex flex-col gap-2",
		children: [v, /* @__PURE__ */ M(Lt, {
			table: g,
			pageSizeOptions: u
		})]
	});
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constants.js
var zt = 365.2425, Bt = 6048e5, Vt = 864e5, Ht = 6e4, Ut = 36e5, Wt = 3600 * 24;
Wt * 7, Wt * zt / 12 * 3;
var Gt = Symbol.for("constructDateFrom");
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constructFrom.js
function H(e, t) {
	return typeof e == "function" ? e(t) : e && typeof e == "object" && Gt in e ? e[Gt](t) : e instanceof Date ? new e.constructor(t) : new Date(t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/toDate.js
function U(e, t) {
	return H(t || e, e);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addDays.js
function Kt(e, t, n) {
	let r = U(e, n?.in);
	return isNaN(t) ? H(n?.in || e, NaN) : (t && r.setDate(r.getDate() + t), r);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addMonths.js
function W(e, t, n) {
	let r = U(e, n?.in);
	if (isNaN(t)) return H(n?.in || e, NaN);
	if (!t) return r;
	let i = r.getDate(), a = H(n?.in || e, r.getTime());
	return a.setMonth(r.getMonth() + t + 1, 0), i >= a.getDate() ? a : (r.setFullYear(a.getFullYear(), a.getMonth(), i), r);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addMilliseconds.js
function qt(e, t, n) {
	return H(n?.in || e, +U(e) + t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addHours.js
function Jt(e, t, n) {
	return qt(e, t * Ut, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/defaultOptions.js
var Yt = {};
function Xt() {
	return Yt;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeek.js
function G(e, t) {
	let n = Xt(), r = t?.weekStartsOn ?? t?.locale?.options?.weekStartsOn ?? n.weekStartsOn ?? n.locale?.options?.weekStartsOn ?? 0, i = U(e, t?.in), a = i.getDay(), o = (a < r ? 7 : 0) + a - r;
	return i.setDate(i.getDate() - o), i.setHours(0, 0, 0, 0), i;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeek.js
function Zt(e, t) {
	return G(e, {
		...t,
		weekStartsOn: 1
	});
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeekYear.js
function Qt(e, t) {
	let n = U(e, t?.in), r = n.getFullYear(), i = H(n, 0);
	i.setFullYear(r + 1, 0, 4), i.setHours(0, 0, 0, 0);
	let a = Zt(i), o = H(n, 0);
	o.setFullYear(r, 0, 4), o.setHours(0, 0, 0, 0);
	let s = Zt(o);
	return n.getTime() >= a.getTime() ? r + 1 : n.getTime() >= s.getTime() ? r : r - 1;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/getTimezoneOffsetInMilliseconds.js
function $t(e) {
	let t = U(e), n = new Date(Date.UTC(t.getFullYear(), t.getMonth(), t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds()));
	return n.setUTCFullYear(t.getFullYear()), e - +n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/normalizeDates.js
function en(e, ...t) {
	let n = H.bind(null, e || t.find((e) => typeof e == "object"));
	return t.map(n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfDay.js
function K(e, t) {
	let n = U(e, t?.in);
	return n.setHours(0, 0, 0, 0), n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/differenceInCalendarDays.js
function tn(e, t, n) {
	let [r, i] = en(n?.in, e, t), a = K(r), o = K(i), s = +a - $t(a), c = +o - $t(o);
	return Math.round((s - c) / Vt);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfISOWeekYear.js
function nn(e, t) {
	let n = Qt(e, t), r = H(t?.in || e, 0);
	return r.setFullYear(n, 0, 4), r.setHours(0, 0, 0, 0), Zt(r);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addMinutes.js
function rn(e, t, n) {
	let r = U(e, n?.in);
	return r.setTime(r.getTime() + t * Ht), r;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addWeeks.js
function an(e, t, n) {
	return Kt(e, t * 7, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/addYears.js
function on(e, t, n) {
	return W(e, t * 12, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/constructNow.js
function sn(e) {
	return H(e, Date.now());
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isSameDay.js
function cn(e, t, n) {
	let [r, i] = en(n?.in, e, t);
	return +K(r) == +K(i);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isDate.js
function ln(e) {
	return e instanceof Date || typeof e == "object" && Object.prototype.toString.call(e) === "[object Date]";
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isValid.js
function un(e) {
	return !(!ln(e) && typeof e != "number" || isNaN(+U(e)));
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/endOfDay.js
function dn(e, t) {
	let n = U(e, t?.in);
	return n.setHours(23, 59, 59, 999), n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/endOfMonth.js
function fn(e, t) {
	let n = U(e, t?.in), r = n.getMonth();
	return n.setFullYear(n.getFullYear(), r + 1, 0), n.setHours(23, 59, 59, 999), n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/normalizeInterval.js
function pn(e, t) {
	let [n, r] = en(e, t.start, t.end);
	return {
		start: n,
		end: r
	};
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/eachDayOfInterval.js
function mn(e, t) {
	let { start: n, end: r } = pn(t?.in, e), i = +n > +r, a = i ? +n : +r, o = i ? r : n;
	o.setHours(0, 0, 0, 0);
	let s = t?.step ?? 1;
	if (!s) return [];
	s < 0 && (s = -s, i = !i);
	let c = [];
	for (; +o <= a;) c.push(H(n, o)), o.setDate(o.getDate() + s), o.setHours(0, 0, 0, 0);
	return i ? c.reverse() : c;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/eachMonthOfInterval.js
function hn(e, t) {
	let { start: n, end: r } = pn(t?.in, e), i = +n > +r, a = i ? +n : +r, o = i ? r : n;
	o.setHours(0, 0, 0, 0), o.setDate(1);
	let s = t?.step ?? 1;
	if (!s) return [];
	s < 0 && (s = -s, i = !i);
	let c = [];
	for (; +o <= a;) c.push(H(n, o)), o.setMonth(o.getMonth() + s);
	return i ? c.reverse() : c;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/eachWeekOfInterval.js
function gn(e, t) {
	let { start: n, end: r } = pn(t?.in, e), i = +n > +r, a = G(i ? r : n, t), o = G(i ? n : r, t);
	a.setHours(15), o.setHours(15);
	let s = +o.getTime(), c = a, l = t?.step ?? 1;
	if (!l) return [];
	l < 0 && (l = -l, i = !i);
	let u = [];
	for (; +c <= s;) c.setHours(0), u.push(H(n, c)), c = an(c, l), c.setHours(15);
	return i ? u.reverse() : u;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfMonth.js
function _n(e, t) {
	let n = U(e, t?.in);
	return n.setDate(1), n.setHours(0, 0, 0, 0), n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfYear.js
function vn(e, t) {
	let n = U(e, t?.in);
	return n.setFullYear(n.getFullYear(), 0, 1), n.setHours(0, 0, 0, 0), n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/endOfWeek.js
function yn(e, t) {
	let n = Xt(), r = t?.weekStartsOn ?? t?.locale?.options?.weekStartsOn ?? n.weekStartsOn ?? n.locale?.options?.weekStartsOn ?? 0, i = U(e, t?.in), a = i.getDay(), o = (a < r ? -7 : 0) + 6 - (a - r);
	return i.setDate(i.getDate() + o), i.setHours(23, 59, 59, 999), i;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US/_lib/formatDistance.js
var bn = {
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
}, xn = (e, t, n) => {
	let r, i = bn[e];
	return r = typeof i == "string" ? i : t === 1 ? i.one : i.other.replace("{{count}}", t.toString()), n?.addSuffix ? n.comparison && n.comparison > 0 ? "in " + r : r + " ago" : r;
};
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildFormatLongFn.js
function Sn(e) {
	return (t = {}) => {
		let n = t.width ? String(t.width) : e.defaultWidth;
		return e.formats[n] || e.formats[e.defaultWidth];
	};
}
var Cn = {
	date: Sn({
		formats: {
			full: "EEEE, MMMM do, y",
			long: "MMMM do, y",
			medium: "MMM d, y",
			short: "MM/dd/yyyy"
		},
		defaultWidth: "full"
	}),
	time: Sn({
		formats: {
			full: "h:mm:ss a zzzz",
			long: "h:mm:ss a z",
			medium: "h:mm:ss a",
			short: "h:mm a"
		},
		defaultWidth: "full"
	}),
	dateTime: Sn({
		formats: {
			full: "{{date}} 'at' {{time}}",
			long: "{{date}} 'at' {{time}}",
			medium: "{{date}}, {{time}}",
			short: "{{date}}, {{time}}"
		},
		defaultWidth: "full"
	})
}, wn = {
	lastWeek: "'last' eeee 'at' p",
	yesterday: "'yesterday at' p",
	today: "'today at' p",
	tomorrow: "'tomorrow at' p",
	nextWeek: "eeee 'at' p",
	other: "P"
}, Tn = (e, t, n, r) => wn[e];
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildLocalizeFn.js
function En(e) {
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
var Dn = {
	ordinalNumber: (e, t) => {
		let n = Number(e), r = n % 100;
		if (r > 20 || r < 10) switch (r % 10) {
			case 1: return n + "st";
			case 2: return n + "nd";
			case 3: return n + "rd";
		}
		return n + "th";
	},
	era: En({
		values: {
			narrow: ["B", "A"],
			abbreviated: ["BC", "AD"],
			wide: ["Before Christ", "Anno Domini"]
		},
		defaultWidth: "wide"
	}),
	quarter: En({
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
	month: En({
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
	day: En({
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
	dayPeriod: En({
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
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchFn.js
function On(e) {
	return (t, n = {}) => {
		let r = n.width, i = r && e.matchPatterns[r] || e.matchPatterns[e.defaultMatchWidth], a = t.match(i);
		if (!a) return null;
		let o = a[0], s = r && e.parsePatterns[r] || e.parsePatterns[e.defaultParseWidth], c = Array.isArray(s) ? An(s, (e) => e.test(o)) : kn(s, (e) => e.test(o)), l;
		l = e.valueCallback ? e.valueCallback(c) : c, l = n.valueCallback ? n.valueCallback(l) : l;
		let u = t.slice(o.length);
		return {
			value: l,
			rest: u
		};
	};
}
function kn(e, t) {
	for (let n in e) if (Object.prototype.hasOwnProperty.call(e, n) && t(e[n])) return n;
}
function An(e, t) {
	for (let n = 0; n < e.length; n++) if (t(e[n])) return n;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/_lib/buildMatchPatternFn.js
function jn(e) {
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
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/locale/en-US.js
var Mn = {
	code: "en-US",
	formatDistance: xn,
	formatLong: Cn,
	formatRelative: Tn,
	localize: Dn,
	match: {
		ordinalNumber: jn({
			matchPattern: /^(\d+)(th|st|nd|rd)?/i,
			parsePattern: /\d+/i,
			valueCallback: (e) => parseInt(e, 10)
		}),
		era: On({
			matchPatterns: {
				narrow: /^(b|a)/i,
				abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
				wide: /^(before christ|before common era|anno domini|common era)/i
			},
			defaultMatchWidth: "wide",
			parsePatterns: { any: [/^b/i, /^(a|c)/i] },
			defaultParseWidth: "any"
		}),
		quarter: On({
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
		month: On({
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
		day: On({
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
		dayPeriod: On({
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
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDayOfYear.js
function Nn(e, t) {
	let n = U(e, t?.in);
	return tn(n, vn(n)) + 1;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getISOWeek.js
function Pn(e, t) {
	let n = U(e, t?.in), r = Zt(n) - +nn(n);
	return Math.round(r / Bt) + 1;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeekYear.js
function Fn(e, t) {
	let n = U(e, t?.in), r = n.getFullYear(), i = Xt(), a = t?.firstWeekContainsDate ?? t?.locale?.options?.firstWeekContainsDate ?? i.firstWeekContainsDate ?? i.locale?.options?.firstWeekContainsDate ?? 1, o = H(t?.in || e, 0);
	o.setFullYear(r + 1, 0, a), o.setHours(0, 0, 0, 0);
	let s = G(o, t), c = H(t?.in || e, 0);
	c.setFullYear(r, 0, a), c.setHours(0, 0, 0, 0);
	let l = G(c, t);
	return +n >= +s ? r + 1 : +n >= +l ? r : r - 1;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfWeekYear.js
function In(e, t) {
	let n = Xt(), r = t?.firstWeekContainsDate ?? t?.locale?.options?.firstWeekContainsDate ?? n.firstWeekContainsDate ?? n.locale?.options?.firstWeekContainsDate ?? 1, i = Fn(e, t), a = H(t?.in || e, 0);
	return a.setFullYear(i, 0, r), a.setHours(0, 0, 0, 0), G(a, t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getWeek.js
function Ln(e, t) {
	let n = U(e, t?.in), r = G(n, t) - +In(n, t);
	return Math.round(r / Bt) + 1;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/addLeadingZeros.js
function q(e, t) {
	return (e < 0 ? "-" : "") + Math.abs(e).toString().padStart(t, "0");
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/lightFormatters.js
var J = {
	y(e, t) {
		let n = e.getFullYear(), r = n > 0 ? n : 1 - n;
		return q(t === "yy" ? r % 100 : r, t.length);
	},
	M(e, t) {
		let n = e.getMonth();
		return t === "M" ? String(n + 1) : q(n + 1, 2);
	},
	d(e, t) {
		return q(e.getDate(), t.length);
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
		return q(e.getHours() % 12 || 12, t.length);
	},
	H(e, t) {
		return q(e.getHours(), t.length);
	},
	m(e, t) {
		return q(e.getMinutes(), t.length);
	},
	s(e, t) {
		return q(e.getSeconds(), t.length);
	},
	S(e, t) {
		let n = t.length, r = e.getMilliseconds();
		return q(Math.trunc(r * 10 ** (n - 3)), t.length);
	}
}, Rn = {
	am: "am",
	pm: "pm",
	midnight: "midnight",
	noon: "noon",
	morning: "morning",
	afternoon: "afternoon",
	evening: "evening",
	night: "night"
}, zn = {
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
		return J.y(e, t);
	},
	Y: function(e, t, n, r) {
		let i = Fn(e, r), a = i > 0 ? i : 1 - i;
		return t === "YY" ? q(a % 100, 2) : t === "Yo" ? n.ordinalNumber(a, { unit: "year" }) : q(a, t.length);
	},
	R: function(e, t) {
		return q(Qt(e), t.length);
	},
	u: function(e, t) {
		return q(e.getFullYear(), t.length);
	},
	Q: function(e, t, n) {
		let r = Math.ceil((e.getMonth() + 1) / 3);
		switch (t) {
			case "Q": return String(r);
			case "QQ": return q(r, 2);
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
			case "qq": return q(r, 2);
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
			case "MM": return J.M(e, t);
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
			case "LL": return q(r + 1, 2);
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
		let i = Ln(e, r);
		return t === "wo" ? n.ordinalNumber(i, { unit: "week" }) : q(i, t.length);
	},
	I: function(e, t, n) {
		let r = Pn(e);
		return t === "Io" ? n.ordinalNumber(r, { unit: "week" }) : q(r, t.length);
	},
	d: function(e, t, n) {
		return t === "do" ? n.ordinalNumber(e.getDate(), { unit: "date" }) : J.d(e, t);
	},
	D: function(e, t, n) {
		let r = Nn(e);
		return t === "Do" ? n.ordinalNumber(r, { unit: "dayOfYear" }) : q(r, t.length);
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
			case "ee": return q(a, 2);
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
			case "cc": return q(a, t.length);
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
			case "ii": return q(i, t.length);
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
		switch (i = r === 12 ? Rn.noon : r === 0 ? Rn.midnight : r / 12 >= 1 ? "pm" : "am", t) {
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
		switch (i = r >= 17 ? Rn.evening : r >= 12 ? Rn.afternoon : r >= 4 ? Rn.morning : Rn.night, t) {
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
		return J.h(e, t);
	},
	H: function(e, t, n) {
		return t === "Ho" ? n.ordinalNumber(e.getHours(), { unit: "hour" }) : J.H(e, t);
	},
	K: function(e, t, n) {
		let r = e.getHours() % 12;
		return t === "Ko" ? n.ordinalNumber(r, { unit: "hour" }) : q(r, t.length);
	},
	k: function(e, t, n) {
		let r = e.getHours();
		return r === 0 && (r = 24), t === "ko" ? n.ordinalNumber(r, { unit: "hour" }) : q(r, t.length);
	},
	m: function(e, t, n) {
		return t === "mo" ? n.ordinalNumber(e.getMinutes(), { unit: "minute" }) : J.m(e, t);
	},
	s: function(e, t, n) {
		return t === "so" ? n.ordinalNumber(e.getSeconds(), { unit: "second" }) : J.s(e, t);
	},
	S: function(e, t) {
		return J.S(e, t);
	},
	X: function(e, t, n) {
		let r = e.getTimezoneOffset();
		if (r === 0) return "Z";
		switch (t) {
			case "X": return Vn(r);
			case "XXXX":
			case "XX": return Y(r);
			default: return Y(r, ":");
		}
	},
	x: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "x": return Vn(r);
			case "xxxx":
			case "xx": return Y(r);
			default: return Y(r, ":");
		}
	},
	O: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "O":
			case "OO":
			case "OOO": return "GMT" + Bn(r, ":");
			default: return "GMT" + Y(r, ":");
		}
	},
	z: function(e, t, n) {
		let r = e.getTimezoneOffset();
		switch (t) {
			case "z":
			case "zz":
			case "zzz": return "GMT" + Bn(r, ":");
			default: return "GMT" + Y(r, ":");
		}
	},
	t: function(e, t, n) {
		return q(Math.trunc(e / 1e3), t.length);
	},
	T: function(e, t, n) {
		return q(+e, t.length);
	}
};
function Bn(e, t = "") {
	let n = e > 0 ? "-" : "+", r = Math.abs(e), i = Math.trunc(r / 60), a = r % 60;
	return a === 0 ? n + String(i) : n + String(i) + t + q(a, 2);
}
function Vn(e, t) {
	return e % 60 == 0 ? (e > 0 ? "-" : "+") + q(Math.abs(e) / 60, 2) : Y(e, t);
}
function Y(e, t = "") {
	let n = e > 0 ? "-" : "+", r = Math.abs(e), i = q(Math.trunc(r / 60), 2), a = q(r % 60, 2);
	return n + i + t + a;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/_lib/format/longFormatters.js
var Hn = (e, t) => {
	switch (e) {
		case "P": return t.date({ width: "short" });
		case "PP": return t.date({ width: "medium" });
		case "PPP": return t.date({ width: "long" });
		default: return t.date({ width: "full" });
	}
}, Un = (e, t) => {
	switch (e) {
		case "p": return t.time({ width: "short" });
		case "pp": return t.time({ width: "medium" });
		case "ppp": return t.time({ width: "long" });
		default: return t.time({ width: "full" });
	}
}, Wn = {
	p: Un,
	P: (e, t) => {
		let n = e.match(/(P+)(p+)?/) || [], r = n[1], i = n[2];
		if (!i) return Hn(e, t);
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
		return a.replace("{{date}}", Hn(r, t)).replace("{{time}}", Un(i, t));
	}
}, Gn = /^D+$/, Kn = /^Y+$/, qn = [
	"D",
	"DD",
	"YY",
	"YYYY"
];
function Jn(e) {
	return Gn.test(e);
}
function Yn(e) {
	return Kn.test(e);
}
function Xn(e, t, n) {
	let r = Zn(e, t, n);
	if (console.warn(r), qn.includes(e)) throw RangeError(r);
}
function Zn(e, t, n) {
	let r = e[0] === "Y" ? "years" : "days of the month";
	return `Use \`${e.toLowerCase()}\` instead of \`${e}\` (in \`${t}\`) for formatting ${r} to the input \`${n}\`; see: https://github.com/date-fns/date-fns/blob/master/docs/unicodeTokens.md`;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/format.js
var Qn = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g, $n = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g, er = /^'([^]*?)'?$/, tr = /''/g, nr = /[a-zA-Z]/;
function X(e, t, n) {
	let r = Xt(), i = n?.locale ?? r.locale ?? Mn, a = n?.firstWeekContainsDate ?? n?.locale?.options?.firstWeekContainsDate ?? r.firstWeekContainsDate ?? r.locale?.options?.firstWeekContainsDate ?? 1, o = n?.weekStartsOn ?? n?.locale?.options?.weekStartsOn ?? r.weekStartsOn ?? r.locale?.options?.weekStartsOn ?? 0, s = U(e, n?.in);
	if (!un(s)) throw RangeError("Invalid time value");
	let c = t.match($n).map((e) => {
		let t = e[0];
		if (t === "p" || t === "P") {
			let n = Wn[t];
			return n(e, i.formatLong);
		}
		return e;
	}).join("").match(Qn).map((e) => {
		if (e === "''") return {
			isToken: !1,
			value: "'"
		};
		let t = e[0];
		if (t === "'") return {
			isToken: !1,
			value: rr(e)
		};
		if (zn[t]) return {
			isToken: !0,
			value: e
		};
		if (t.match(nr)) throw RangeError("Format string contains an unescaped latin alphabet character `" + t + "`");
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
		(!n?.useAdditionalWeekYearTokens && Yn(a) || !n?.useAdditionalDayOfYearTokens && Jn(a)) && Xn(a, t, String(e));
		let o = zn[a[0]];
		return o(s, a, i.localize, l);
	}).join("");
}
function rr(e) {
	let t = e.match(er);
	return t ? t[1].replace(tr, "'") : e;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDate.js
function ir(e, t) {
	return U(e, t?.in).getDate();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDay.js
function ar(e, t) {
	return U(e, t?.in).getDay();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getDaysInMonth.js
function or(e, t) {
	let n = U(e, t?.in), r = n.getFullYear(), i = n.getMonth(), a = H(n, 0);
	return a.setFullYear(r, i + 1, 0), a.setHours(0, 0, 0, 0), a.getDate();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getHours.js
function sr(e, t) {
	return U(e, t?.in).getHours();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getMinutes.js
function cr(e, t) {
	return U(e, t?.in).getMinutes();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getMonth.js
function Z(e, t) {
	return U(e, t?.in).getMonth();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/getYear.js
function Q(e, t) {
	return U(e, t?.in).getFullYear();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isAfter.js
function lr(e, t) {
	return +U(e) > +U(t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isBefore.js
function ur(e, t) {
	return +U(e) < +U(t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isEqual.js
function dr(e, t) {
	return +U(e) == +U(t);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isSameMonth.js
function fr(e, t, n) {
	let [r, i] = en(n?.in, e, t);
	return r.getFullYear() === i.getFullYear() && r.getMonth() === i.getMonth();
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/isToday.js
function pr(e, t) {
	return cn(H(t?.in || e, e), sn(t?.in || e));
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subDays.js
function mr(e, t, n) {
	return Kt(e, -t, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setMonth.js
function hr(e, t, n) {
	let r = U(e, n?.in), i = r.getFullYear(), a = r.getDate(), o = H(n?.in || e, 0);
	o.setFullYear(i, t, 15), o.setHours(0, 0, 0, 0);
	let s = or(o);
	return r.setMonth(t, Math.min(a, s)), r;
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/set.js
function gr(e, t, n) {
	let r = U(e, n?.in);
	return isNaN(+r) ? H(n?.in || e, NaN) : (t.year != null && r.setFullYear(t.year), t.month != null && (r = hr(r, t.month)), t.date != null && r.setDate(t.date), t.hours != null && r.setHours(t.hours), t.minutes != null && r.setMinutes(t.minutes), t.seconds != null && r.setSeconds(t.seconds), t.milliseconds != null && r.setMilliseconds(t.milliseconds), r);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/setYear.js
function _r(e, t, n) {
	let r = U(e, n?.in);
	return isNaN(+r) ? H(n?.in || e, NaN) : (r.setFullYear(t), r);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/startOfToday.js
function vr(e) {
	return K(Date.now(), e);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subMonths.js
function $(e, t, n) {
	return W(e, -t, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subHours.js
function yr(e, t, n) {
	return Jt(e, -t, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subMinutes.js
function br(e, t, n) {
	return rn(e, -t, n);
}
//#endregion
//#region ../../../../node_modules/.pnpm/date-fns@4.1.0/node_modules/date-fns/subYears.js
function xr(e, t, n) {
	return on(e, -t, n);
}
//#endregion
//#region src/use-calendar.ts
var Sr = {
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
}, Cr = {
	SUNDAY: 0,
	MONDAY: 1,
	TUESDAY: 2,
	WEDNESDAY: 3,
	THURSDAY: 4,
	FRIDAY: 5,
	SATURDAY: 6
}, wr = (e, t, n) => (dr(e, t) || lr(e, t)) && (dr(e, n) || ur(e, n)), Tr = (e) => gr(e, {
	hours: 0,
	minutes: 0,
	seconds: 0,
	milliseconds: 0
}), Er = ({ weekStartsOn: e = Cr.SUNDAY, viewing: t = /* @__PURE__ */ new Date(), selected: a = [], numberOfMonths: o = 1 } = {}) => {
	let [s, c] = i(t), l = n(() => c(vr()), []), u = n((e) => c((t) => hr(t, e)), []), d = n(() => c((e) => $(e, 1)), []), f = n(() => c((e) => W(e, 1)), []), p = n((e) => c((t) => _r(t, e)), []), m = n(() => c((e) => xr(e, 1)), []), h = n(() => c((e) => on(e, 1)), []), [g, _] = i(a.map(Tr)), v = n(() => _([]), []), y = n((e) => g.findIndex((t) => dr(t, e)) > -1, [g]), b = n((e, t) => {
		_(t ? Array.isArray(e) ? e : [e] : (t) => t.concat(Array.isArray(e) ? e : [e]));
	}, []), x = n((e) => _((t) => Array.isArray(e) ? t.filter((t) => !e.map((e) => e.getTime()).includes(t.getTime())) : t.filter((t) => !dr(t, e))), []);
	return {
		clearTime: Tr,
		inRange: wr,
		viewing: s,
		setViewing: c,
		viewToday: l,
		viewMonth: u,
		viewPreviousMonth: d,
		viewNextMonth: f,
		viewYear: p,
		viewPreviousYear: m,
		viewNextYear: h,
		selected: g,
		setSelected: _,
		clearSelected: v,
		isSelected: y,
		select: b,
		deselect: x,
		toggle: n((e, t) => y(e) ? x(e) : b(e, t), [
			x,
			y,
			b
		]),
		selectRange: n((e, t, n) => {
			_(n ? mn({
				start: e,
				end: t
			}) : (n) => n.concat(mn({
				start: e,
				end: t
			})));
		}, []),
		deselectRange: n((e, t) => {
			_((n) => n.filter((n) => !mn({
				start: e,
				end: t
			}).map((e) => e.getTime()).includes(n.getTime())));
		}, []),
		calendar: r(() => hn({
			start: _n(s),
			end: fn(W(s, o - 1))
		}).map((t) => gn({
			start: _n(t),
			end: fn(t)
		}, { weekStartsOn: e }).map((t) => mn({
			start: G(t, { weekStartsOn: e }),
			end: yn(t, { weekStartsOn: e })
		}))), [
			s,
			e,
			o
		])
	};
}, Dr = new Date(2020, 0, 23), Or = [
	"Su",
	"Mo",
	"Tu",
	"We",
	"Th",
	"Fr",
	"Sa"
], kr = [
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
function Ar(e) {
	return new Date(e.getFullYear(), e.getMonth(), e.getDate());
}
function jr({ day: e, startDate: t, endDate: n, viewing: r, minDate: i, maxDate: a, onClick: s }) {
	let c = !fr(e, r), l = Ar(e), u = l.getTime() > Ar(a).getTime(), d = i ? l.getTime() < Ar(i).getTime() : !1, f = c || u || d, p = !f && cn(t, e), m = !f && cn(n, e), h = cn(t, n), g = !f && !p && !m && lr(e, t) && !lr(e, n), _ = pr(e), v = X(e, "dd");
	return /* @__PURE__ */ M("div", {
		"data-is-between": g,
		"data-is-start": p,
		"data-is-end": m,
		"data-is-today": _,
		"data-is-same-day": h,
		className: se("w-8 h-8 flex items-center justify-center", g && "bg-fill-selected", p && !h && "bg-fill-selected rounded-l-full", m && !h && "bg-fill-selected rounded-r-full"),
		children: /* @__PURE__ */ M(o, {
			variant: p || m ? "primary" : "default",
			size: "icon-sm",
			disabled: f,
			"aria-label": `Select ${X(e, "PP")}`,
			title: f ? void 0 : `Select ${X(e, "PP")}`,
			onClick: () => s(e),
			className: se("w-full h-full !rounded-full p-0 text-[11px] tabular-nums", _ && !p && !m && "border border-primary", f && "opacity-20"),
			children: v
		})
	});
}
function Mr({ defaultViewing: e, startDate: n, endDate: r, minDate: i, maxDate: a, onSelect: s, onViewChange: c, siblingViewing: l, weekStartsOn: u }) {
	let { calendar: d, viewing: f, setViewing: p, viewPreviousMonth: m, viewNextMonth: h } = Er({
		viewing: e,
		weekStartsOn: u
	}), g = t.useRef(e);
	t.useEffect(() => {
		fr(g.current, e) || (p(e), g.current = e);
	}, [e, p]);
	let _ = () => {
		m(), c($(f, 1));
	}, v = () => {
		h(), c(W(f, 1));
	}, y = i && i.getTime() > Dr.getTime() ? i : Dr, b = Q(y), ee = Z(y), D = b * 12 + ee, O = Q(a) * 12 + Z(a), k = Q(f) * 12 + Z(f), A = k >= O || !!l && Z(l) === Z(W(f, 1)) && Q(l) === Q(W(f, 1)), te = k <= D || !!l && Z(l) === Z($(f, 1)) && Q(l) === Q($(f, 1)), j = Q(a), ne = Z(a), re = Q(f), ie = Z(f), ae = (e, t) => e * 12 + t, oe = ae(re, ie), se = l ? ae(Q(l), Z(l)) : null, ce = [];
	for (let e = b; e <= j; e++) {
		let t = e === b ? ee : 0, n = e === j ? ne : 11;
		for (let r = t; r <= n; r++) ce.push({
			key: ae(e, r),
			year: e,
			month: r
		});
	}
	let le = (e) => {
		let t = Math.floor(e / 12), n = e % 12, r = new Date(t, n, 1);
		p(r), c(r);
	};
	return /* @__PURE__ */ N("div", { children: [
		/* @__PURE__ */ N("div", {
			className: "flex justify-center items-center py-1 gap-1",
			children: [
				/* @__PURE__ */ M(o, {
					variant: "default",
					size: "icon-sm",
					onClick: _,
					disabled: te,
					"aria-label": "Previous month",
					title: te ? "Disabled" : "Previous month",
					className: "disabled:cursor-not-allowed",
					children: /* @__PURE__ */ M(At, {})
				}),
				/* @__PURE__ */ N(x, {
					value: oe,
					onValueChange: (e) => {
						e !== null && le(e);
					},
					children: [/* @__PURE__ */ M(T, {
						size: "sm",
						"aria-label": "Month and year",
						className: "h-6 px-2 text-xs",
						children: /* @__PURE__ */ M(E, { children: (e) => `${kr[e % 12]} ${Math.floor(e / 12)}` })
					}), /* @__PURE__ */ M(S, { children: /* @__PURE__ */ M(C, { children: ce.map(({ key: e, year: t, month: n }) => /* @__PURE__ */ N(w, {
						value: e,
						disabled: e === se,
						children: [
							kr[n],
							" ",
							t
						]
					}, e)) }) })]
				}),
				/* @__PURE__ */ M(o, {
					variant: "default",
					size: "icon-sm",
					onClick: v,
					disabled: A,
					"aria-label": "Next month",
					title: A ? "Disabled" : "Next month",
					className: "disabled:cursor-not-allowed",
					children: /* @__PURE__ */ M(jt, {})
				})
			]
		}),
		/* @__PURE__ */ M("div", {
			className: "grid grid-cols-7",
			children: d[0][0].map((e) => /* @__PURE__ */ M("div", {
				className: "w-8 h-6 flex items-center justify-center text-[10px] text-muted-foreground uppercase",
				children: Or[ar(e)]
			}, `h-${ar(e)}`))
		}),
		/* @__PURE__ */ M("div", {
			className: "flex flex-col",
			children: d[0].map((e, t) => /* @__PURE__ */ M("div", {
				className: "grid grid-cols-7",
				children: e.map((e) => /* @__PURE__ */ M(jr, {
					day: e,
					startDate: n,
					endDate: r,
					viewing: f,
					minDate: i,
					maxDate: a,
					onClick: s
				}, e.toISOString()))
			}, `w-${t}`))
		})
	] });
}
//#endregion
//#region src/date-time-ranges.ts
var Nr = {
	id: 0,
	name: "Custom",
	rangeSetter: (e) => e
}, Pr = [
	Nr,
	{
		id: 1,
		name: "Last 5 minutes",
		rangeSetter: (e) => br(e, 5)
	},
	{
		id: 2,
		name: "Last 15 minutes",
		rangeSetter: (e) => br(e, 15)
	},
	{
		id: 3,
		name: "Last 30 minutes",
		rangeSetter: (e) => br(e, 30)
	},
	{
		id: 4,
		name: "Last 1 hour",
		rangeSetter: (e) => yr(e, 1)
	},
	{
		id: 5,
		name: "Last 3 hours",
		rangeSetter: (e) => yr(e, 3)
	},
	{
		id: 6,
		name: "Last 6 hours",
		rangeSetter: (e) => yr(e, 6)
	},
	{
		id: 7,
		name: "Last 12 hours",
		rangeSetter: (e) => yr(e, 12)
	},
	{
		id: 8,
		name: "Last 24 hours",
		rangeSetter: (e) => mr(e, 1)
	},
	{
		id: 9,
		name: "Last 2 days",
		rangeSetter: (e) => mr(e, 2)
	},
	{
		id: 10,
		name: "Last 7 days",
		rangeSetter: (e) => mr(e, 7)
	},
	{
		id: 11,
		name: "Last 30 days",
		rangeSetter: (e) => mr(e, 30)
	},
	{
		id: 12,
		name: "Last 90 days",
		rangeSetter: (e) => mr(e, 90)
	},
	{
		id: 13,
		name: "Last 6 months",
		rangeSetter: (e) => $(e, 6)
	},
	{
		id: 14,
		name: "Last 1 year",
		rangeSetter: (e) => xr(e, 1)
	},
	{
		id: 15,
		name: "Last 2 years",
		rangeSetter: (e) => xr(e, 2)
	}
], Fr = {
	MDY: "MM/DD/YY",
	DMY: "DD/MM/YY",
	YMD: "YY-MM-DD"
}, Ir = { minimumIntegerDigits: 2 };
function Lr({ date: e, maxDate: n, onChange: r, dateFormat: i, showTime: a }) {
	let [o, s] = t.useState(Z(e) + 1), [c, l] = t.useState(ir(e)), [u, p] = t.useState(Q(e) % 100), [m, h] = t.useState(sr(e)), [g, _] = t.useState(cr(e)), v = t.useRef(r);
	t.useEffect(() => {
		v.current = r;
	}, [r]), t.useEffect(() => {
		s(Z(e) + 1), l(ir(e)), p(Q(e) % 100), h(sr(e)), _(cr(e));
	}, [e]);
	let y = t.useRef(!1);
	t.useEffect(() => {
		if (!y.current) return;
		let e = setTimeout(() => {
			v.current(new Date(2e3 + u, o - 1, c, m, g)), y.current = !1;
		}, 400);
		return () => clearTimeout(e);
	}, [
		o,
		c,
		u,
		m,
		g
	]);
	let b = (e) => (t) => {
		t !== null && (y.current = !0, e(t));
	}, x = "w-7 flex-none text-center tabular-nums p-0", S = "text-xs text-muted-foreground select-none", C = i === "YMD" ? "-" : "/", w = Q(n) % 100, T = u === w, E = T ? Z(n) + 1 : 12, ee = T && o === E ? ir(n) : or(new Date(2e3 + u, o - 1)), D = /* @__PURE__ */ M(f, {
		"aria-label": "Month",
		value: o,
		onValueChange: b(s),
		min: 1,
		max: E,
		format: Ir,
		className: x
	}, "month"), O = /* @__PURE__ */ M(f, {
		"aria-label": "Day",
		value: c,
		onValueChange: b(l),
		min: 1,
		max: ee,
		format: Ir,
		className: x
	}, "day"), k = /* @__PURE__ */ M(f, {
		"aria-label": "Year",
		value: u,
		onValueChange: b(p),
		min: 0,
		max: w,
		format: Ir,
		className: x
	}, "year");
	return /* @__PURE__ */ M(ae, { children: /* @__PURE__ */ N("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ N(re, { children: [/* @__PURE__ */ M(oe, { render: /* @__PURE__ */ M(d, {
			className: "w-auto px-1.5",
			children: (i === "DMY" ? [
				O,
				D,
				k
			] : i === "YMD" ? [
				k,
				D,
				O
			] : [
				D,
				O,
				k
			]).map((e, n) => /* @__PURE__ */ N(t.Fragment, { children: [n > 0 && /* @__PURE__ */ M("span", {
				className: S,
				children: C
			}), e] }, n))
		}) }), /* @__PURE__ */ M(ie, { children: Fr[i] })] }), a && /* @__PURE__ */ N(d, {
			className: "w-auto px-1.5",
			children: [
				/* @__PURE__ */ M(f, {
					"aria-label": "Hour",
					value: m,
					onValueChange: b(h),
					min: 0,
					max: 23,
					format: Ir,
					className: x
				}),
				/* @__PURE__ */ M("span", {
					className: S,
					children: ":"
				}),
				/* @__PURE__ */ M(f, {
					"aria-label": "Minute",
					value: g,
					onValueChange: b(_),
					min: 0,
					max: 59,
					format: Ir,
					className: x
				})
			]
		})]
	}) });
}
//#endregion
//#region src/date-time-picker.tsx
var Rr = {
	MDY: "MM/dd/yy HH:mm:ss",
	DMY: "dd/MM/yy HH:mm:ss",
	YMD: "yy-MM-dd HH:mm:ss"
}, zr = {
	MDY: "MM/dd/yy",
	DMY: "dd/MM/yy",
	YMD: "yy-MM-dd"
}, Br = "(min-width: 64rem)";
function Vr(e) {
	let [n, r] = t.useState(!1);
	return t.useEffect(() => {
		let t = window.matchMedia(e), n = () => r(t.matches);
		return n(), t.addEventListener("change", n), () => t.removeEventListener("change", n);
	}, [e]), n;
}
function Hr({ value: e, onApply: n, onCancel: r, minDate: i, maxDate: s, dateFormat: c = "MDY", weekStartsOn: l, onDateTimeSettings: u, compact: d = !1, ranges: f = Pr, showHeader: p = !0, showTime: m = !0, className: h }) {
	let g = f.filter((e) => e.id !== Nr.id), _ = g.length > 0, v = s ?? /* @__PURE__ */ new Date(), y = s !== void 0, x = Vr(Br), S = !d && x, [C, w] = t.useState(e.start), [T, E] = t.useState(e.end), [D, O] = t.useState(e.range), [k, A] = t.useState(null), [te, j] = t.useState(e.end), [ne, re] = t.useState($(e.end, 1)), ie = (e) => {
		let t = K(e), n = dn(e);
		t.getTime() < C.getTime() ? (w(t), A("start")) : n.getTime() > T.getTime() || k === "start" ? (E(n), A("end")) : k === "end" ? (w(t), A("start")) : (w(t), E(n)), O(Nr);
	}, ae = (e) => {
		let t = new Date(Q(e), Z(e), 1);
		S ? re(t) : j(t);
	}, oe = (e) => {
		j(new Date(Q(e), Z(e), 1));
	}, ce = (e) => {
		C.getTime() !== e.getTime() && (O(Nr), A("start"), e.getTime() > T.getTime() ? (w(T), E(e), oe(e)) : (w(e), ae(e)));
	}, P = (e) => {
		T.getTime() !== e.getTime() && (O(Nr), A("end"), e.getTime() < C.getTime() ? (E(C), w(e), ae(e)) : (E(e), oe(e)));
	}, F = () => {
		let e = /* @__PURE__ */ new Date();
		C.getTime() > e.getTime() && w(e), E(e), A("end"), oe(e);
	}, ue = (e) => {
		let t = /* @__PURE__ */ new Date(), n = e.rangeSetter(t), r = e.endSetter?.(t) ?? t;
		w(n), E(r), O(e), A(null), j(r), re($(r, 1));
	}, de = m ? Rr[c] : zr[c], fe = X(C, de), I = X(T, de);
	return /* @__PURE__ */ N("div", {
		className: se("bg-card text-foreground rounded-lg shadow-md ring-1 ring-foreground/10 overflow-hidden", d ? "w-[15rem]" : "w-[15rem] lg:w-full max-w-[42rem]", h),
		children: [
			!d && p && /* @__PURE__ */ N("div", {
				className: _ ? "hidden lg:grid lg:grid-cols-[minmax(0,1fr)_9rem]" : "hidden lg:grid",
				children: [/* @__PURE__ */ N("div", {
					className: "flex items-center gap-2 px-2 py-1 bg-muted/30 border-b border-border rounded-tl-lg",
					children: [/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground uppercase tracking-wide",
						children: "Choose date range"
					}), (i || y) && /* @__PURE__ */ N("div", {
						className: "flex items-center gap-1 ml-auto",
						children: [
							i && /* @__PURE__ */ N(a, {
								variant: "default",
								className: "text-[10px] px-1.5 py-0",
								children: ["Min: ", X(i, "MMM d, yy")]
							}),
							i && y && /* @__PURE__ */ M("span", {
								className: "text-[10px] text-muted-foreground",
								children: /* @__PURE__ */ M(Ot, { className: "size-3" })
							}),
							y && /* @__PURE__ */ N(a, {
								variant: "default",
								className: "text-[10px] px-1.5 py-0",
								children: ["Max: ", X(v, "MMM d, yy")]
							})
						]
					})]
				}), _ && /* @__PURE__ */ M("div", {
					className: "flex justify-start px-2 py-1 bg-muted/30 border-b border-l border-border rounded-tr-lg",
					children: /* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground uppercase tracking-wide",
						children: "Quick ranges"
					})
				})]
			}),
			/* @__PURE__ */ N("div", {
				className: d || !_ ? "flex flex-col" : "flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_9rem]",
				children: [/* @__PURE__ */ N("div", {
					className: d ? "order-1" : "order-1 lg:order-none",
					children: [!d && /* @__PURE__ */ M("div", {
						className: "hidden lg:flex justify-center items-center px-3 pt-3 pb-1",
						children: /* @__PURE__ */ N("div", {
							className: "flex items-center gap-1.5",
							children: [
								u && /* @__PURE__ */ M(o, {
									size: "icon-xs",
									onClick: u,
									"aria-label": "Date and time settings",
									title: "Date and time settings",
									className: "text-muted-foreground hover:text-foreground",
									children: /* @__PURE__ */ M(Pt, {})
								}),
								/* @__PURE__ */ M(Lr, {
									date: C,
									maxDate: v,
									onChange: ce,
									dateFormat: c,
									showTime: m
								}),
								/* @__PURE__ */ M("span", {
									className: "text-xs text-muted-foreground",
									children: "to"
								}),
								/* @__PURE__ */ M(Lr, {
									date: T,
									maxDate: v,
									onChange: P,
									dateFormat: c,
									showTime: m
								}),
								m && /* @__PURE__ */ M(o, {
									variant: "link",
									size: "xs",
									onClick: F,
									"aria-label": "Set end to now",
									title: "Set end to now",
									children: "Now"
								})
							]
						})
					}), /* @__PURE__ */ N("div", {
						className: d ? "flex flex-col justify-between" : "flex flex-col lg:flex-row justify-between",
						children: [!d && /* @__PURE__ */ M("div", {
							className: "p-2 hidden lg:block",
							children: /* @__PURE__ */ M(Mr, {
								defaultViewing: ne,
								startDate: C,
								endDate: T,
								minDate: i,
								maxDate: v,
								onSelect: ie,
								onViewChange: re,
								siblingViewing: te,
								weekStartsOn: l
							})
						}), /* @__PURE__ */ M("div", {
							className: "p-2",
							children: /* @__PURE__ */ M(Mr, {
								defaultViewing: te,
								startDate: C,
								endDate: T,
								minDate: i,
								maxDate: v,
								onSelect: ie,
								onViewChange: j,
								siblingViewing: S ? ne : void 0,
								weekStartsOn: l
							})
						})]
					})]
				}), _ && /* @__PURE__ */ M("div", {
					className: d ? "order-0 border-b border-border" : "order-0 lg:order-none lg:relative lg:border-l lg:border-border border-b border-border lg:border-b-0",
					children: /* @__PURE__ */ M(b, {
						className: d ? "w-full" : "w-full lg:absolute lg:inset-0",
						children: /* @__PURE__ */ M("ul", {
							className: d ? "flex flex-row p-2 gap-px max-h-[320px]" : "flex flex-row lg:flex-col p-2 gap-px max-h-[320px]",
							children: g.map((e) => /* @__PURE__ */ M("li", {
								className: d ? void 0 : "lg:w-full",
								children: /* @__PURE__ */ M(o, {
									variant: "default",
									size: "sm",
									left: !0,
									className: d ? "whitespace-nowrap" : "whitespace-nowrap lg:w-full lg:justify-start",
									"aria-selected": D.id === e.id,
									"aria-label": `Choose ${e.name.toLowerCase()}`,
									title: e.name,
									onClick: () => ue(e),
									"data-attr": `date-time-picker-quick-range-${e.name.toLowerCase().replace(/\s+/g, "-")}`,
									children: e.name
								})
							}, e.id))
						})
					})
				})]
			}),
			/* @__PURE__ */ M(ee, {}),
			/* @__PURE__ */ N("div", {
				className: "flex justify-end px-3 py-2 items-center gap-2 bg-muted/30",
				children: [
					/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground flex items-center gap-1 tabular-nums mr-auto",
						children: D.id === Nr.id ? /* @__PURE__ */ N(le, { children: [
							fe,
							" ",
							/* @__PURE__ */ M(Ot, { className: "size-3" }),
							" ",
							I
						] }) : D.name
					}),
					r ? /* @__PURE__ */ M(o, {
						variant: "outline",
						size: "sm",
						onClick: r,
						"aria-label": "Cancel",
						"data-attr": "date-time-picker-cancel",
						children: "Cancel"
					}) : null,
					/* @__PURE__ */ M(o, {
						variant: "primary",
						size: "sm",
						"aria-label": "Apply date range",
						title: "Apply date range",
						onClick: () => n({
							start: C,
							end: T,
							range: D
						}),
						"data-attr": "date-time-picker-apply-date-range",
						children: "Apply"
					})
				]
			})
		]
	});
}
//#endregion
//#region src/date-picker.tsx
var Ur = {
	MDY: "MM/dd/yy HH:mm",
	DMY: "dd/MM/yy HH:mm",
	YMD: "yy-MM-dd HH:mm"
}, Wr = {
	MDY: "MM/dd/yy",
	DMY: "dd/MM/yy",
	YMD: "yy-MM-dd"
};
function Gr({ value: e, onApply: n, onCancel: r, minDate: i, maxDate: s, dateFormat: c = "MDY", weekStartsOn: l, onDateTimeSettings: u, showTime: d = !1, showTimeToggle: f = d, onIncludeTimeChange: p, className: m }) {
	let h = s ?? /* @__PURE__ */ new Date(), g = s !== void 0, [_, v] = t.useState(e), [y, b] = t.useState(d), [x, S] = t.useState(new Date(Q(e), Z(e), 1)), C = t.useId(), w = (e) => {
		let t = new Date(e.getFullYear(), e.getMonth(), e.getDate(), y ? sr(_) : 0, y ? cr(_) : 0);
		v(t);
	}, T = (e) => {
		let t = i && e.getTime() < i.getTime() ? i : e;
		t.getTime() !== _.getTime() && (v(t), S(new Date(Q(t), Z(t), 1)));
	}, E = (e) => {
		b(e), p?.(e);
	}, O = () => {
		n(y ? _ : K(_));
	}, k = X(_, y ? Ur[c] : Wr[c]);
	return /* @__PURE__ */ N("div", {
		className: se("bg-card text-foreground rounded-lg shadow-md ring-1 ring-foreground/10 overflow-hidden w-[15rem]", m),
		children: [
			/* @__PURE__ */ N("div", {
				className: "flex items-center gap-2 px-2 py-1 bg-muted/30 border-b border-border rounded-t-lg",
				children: [/* @__PURE__ */ M("span", {
					className: "text-[10px] text-muted-foreground uppercase tracking-wide",
					children: "Choose date"
				}), (i || g) && /* @__PURE__ */ N("div", {
					className: "flex items-center gap-1 ml-auto",
					children: [i && /* @__PURE__ */ N(a, {
						variant: "default",
						className: "text-[10px] px-1.5 py-0",
						children: ["Min: ", X(i, "MMM d, yy")]
					}), g && /* @__PURE__ */ N(a, {
						variant: "default",
						className: "text-[10px] px-1.5 py-0",
						children: ["Max: ", X(h, "MMM d, yy")]
					})]
				})]
			}),
			/* @__PURE__ */ M("div", {
				className: "flex justify-center items-center px-3 pt-3 pb-1",
				children: /* @__PURE__ */ N("div", {
					className: "flex items-center gap-1.5",
					children: [u && /* @__PURE__ */ M(o, {
						size: "icon-xs",
						onClick: u,
						"aria-label": "Date and time settings",
						title: "Date and time settings",
						className: "text-muted-foreground hover:text-foreground",
						children: /* @__PURE__ */ M(Pt, {})
					}), /* @__PURE__ */ M(Lr, {
						date: _,
						maxDate: h,
						onChange: T,
						dateFormat: c,
						showTime: y
					})]
				})
			}),
			/* @__PURE__ */ M("div", {
				className: "p-2 flex justify-center",
				children: /* @__PURE__ */ M(Mr, {
					defaultViewing: x,
					startDate: _,
					endDate: _,
					minDate: i,
					maxDate: h,
					onSelect: w,
					onViewChange: S,
					weekStartsOn: l
				})
			}),
			f && /* @__PURE__ */ N("div", {
				className: "flex items-center gap-2 px-3 py-1.5 border-t border-border",
				children: [/* @__PURE__ */ M(D, {
					checked: y,
					onCheckedChange: E,
					"aria-label": "Include time",
					id: C,
					"data-attr": "date-picker-include-time"
				}), /* @__PURE__ */ M("label", {
					htmlFor: C,
					className: "text-xs text-muted-foreground select-none",
					children: "Include time"
				})]
			}),
			/* @__PURE__ */ M(ee, {}),
			/* @__PURE__ */ N("div", {
				className: "flex justify-end px-3 py-2 items-center gap-2 bg-muted/30",
				children: [
					/* @__PURE__ */ M("span", {
						className: "text-[10px] text-muted-foreground tabular-nums mr-auto",
						children: k
					}),
					r ? /* @__PURE__ */ M(o, {
						variant: "outline",
						size: "sm",
						onClick: r,
						"aria-label": "Cancel",
						"data-attr": "date-picker-cancel",
						children: "Cancel"
					}) : null,
					/* @__PURE__ */ M(o, {
						variant: "primary",
						size: "sm",
						"aria-label": "Apply date",
						title: "Apply date",
						onClick: O,
						"data-attr": "date-picker-apply",
						children: "Apply"
					})
				]
			})
		]
	});
}
//#endregion
export { Nr as CUSTOM_RANGE, Rt as DataTable, Gr as DatePicker, Hr as DateTimePicker, Cr as Day, Sr as Month, Pr as quickRanges, Er as useCalendar };
