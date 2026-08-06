import { Series } from '../core/types';
/** Re-render comparison series at reduced opacity so they read as subordinate to their
 *  primary. Series whose colour is missing or already an `rgba(...)` string are left as-is
 *  — `hexToRGBA` only handles hex inputs. */
export declare function applyComparisonDimming<Meta = unknown>(series: Series<Meta>[], comparisonOf: Record<string, string> | undefined): Series<Meta>[];
/** Apply alpha dimming to a hex colour. Returns the input unchanged for non-hex inputs
 *  (CSS variables, `rgba(...)`, undefined) since `hexToRGBA` only handles hex. */
export declare function dimHex(color: string | undefined, alpha: number): string | undefined;
