export interface LabelBox {
    key: string;
    x: number;
    y: number;
    halfWidth: number;
    halfHeight: number;
    /** Priority used to resolve collisions — larger values are kept first. */
    value: number;
    lines: string[];
}
export declare function overlaps(a: LabelBox, b: LabelBox): boolean;
/** Keys of the boxes whose centered box doesn't collide with an already-kept one. Higher-`value`
 *  boxes win, so when labels crowd the same region the most significant ones survive and the rest
 *  are dropped rather than overlapping. */
export declare function nonCollidingKeys(boxes: LabelBox[]): Set<string>;
