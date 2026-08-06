import * as React from 'react';
export type Theme = 'dark' | 'light' | 'system';
type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
    disableTransitionOnChange?: boolean;
};
type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
};
export declare function ThemeProvider({ children, defaultTheme, storageKey, disableTransitionOnChange, ...props }: ThemeProviderProps): React.ReactElement;
export declare const useTheme: () => ThemeProviderState;
export {};
