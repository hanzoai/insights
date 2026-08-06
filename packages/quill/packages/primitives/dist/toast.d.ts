import * as React from 'react';
type ToastActionData = {
    action?: {
        label: string;
        onClick: () => void;
    };
};
declare const toastManager: import('@base-ui/react').ToastManager<ToastActionData>;
declare const anchoredToastManager: import('@base-ui/react').ToastManager<ToastActionData>;
type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';
type ToastOptions = {
    title?: string;
    description?: string;
    type?: ToastType;
    timeout?: number;
    onClose?: () => void;
    action?: {
        label: string;
        onClick: () => void;
    };
};
declare const toastIconMap: Record<ToastType, React.ReactNode>;
type ToastCardAction = {
    label: string;
    onClick: () => void;
};
type ToastCardProps = React.ComponentPropsWithRef<'div'> & {
    toastTitle?: React.ReactNode;
    toastDescription?: React.ReactNode;
    icon?: React.ReactNode;
    action?: ToastCardAction;
    onDismiss?: () => void;
    showGapHitArea?: boolean;
};
declare const ToastCard: React.ForwardRefExoticComponent<Omit<ToastCardProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
type ToastProviderProps = {
    children: React.ReactNode;
    limit?: number;
    timeout?: number;
};
declare function ToastProvider({ children, limit, timeout }: ToastProviderProps): React.ReactElement;
declare function toast(options: ToastOptions): string;
declare namespace toast {
    var success: (options: Omit<ToastOptions, "type">) => string;
    var info: (options: Omit<ToastOptions, "type">) => string;
    var warning: (options: Omit<ToastOptions, "type">) => string;
    var error: (options: Omit<ToastOptions, "type">) => string;
    var loading: (options: Omit<ToastOptions, "type">) => string;
    var dismiss: (id: string) => void;
    var update: (id: string, options: ToastOptions) => void;
}
type AnchoredToastOptions = ToastOptions & {
    anchor: Element | null;
    side?: 'top' | 'bottom' | 'left' | 'right';
    sideOffset?: number;
    onClose?: () => void;
};
declare function anchoredToast(options: AnchoredToastOptions): string;
declare namespace anchoredToast {
    var dismiss: (id: string) => void;
}
export { anchoredToast, anchoredToastManager, toast, ToastCard, toastIconMap, toastManager, ToastProvider, type AnchoredToastOptions, type ToastCardProps, type ToastOptions, type ToastType, };
