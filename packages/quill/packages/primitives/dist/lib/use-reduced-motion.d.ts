/**
 * Whether the user asked for reduced motion.
 *
 * CSS is the right place to honour this for anything a media query can reach, so reach for this hook
 * only when it can't — SMIL (`<animate>`) is the case in quill today: it ignores CSS entirely, so the
 * only way to stop it is to not render it.
 */
declare function useReducedMotion(): boolean;
export { useReducedMotion };
