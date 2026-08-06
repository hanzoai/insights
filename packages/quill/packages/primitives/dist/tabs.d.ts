import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';
import { VariantProps } from 'class-variance-authority';
import * as React from 'react';
declare function Tabs({ className, orientation, ...props }: TabsPrimitive.Root.Props): React.ReactElement;
declare const tabsListVariants: (props?: ({
    variant?: "line" | "default" | null | undefined;
} & import('class-variance-authority/types').ClassProp) | undefined) => string;
declare function TabsList({ className, variant, ...props }: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>): React.ReactElement;
declare function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props): React.ReactElement;
declare function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props): React.ReactElement;
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants };
