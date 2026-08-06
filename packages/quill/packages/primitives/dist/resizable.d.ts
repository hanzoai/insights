import * as React from 'react';
import * as ResizablePrimitive from 'react-resizable-panels';
declare function ResizablePanelGroup({ className, ...props }: ResizablePrimitive.GroupProps): React.ReactElement;
declare function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps): React.ReactElement;
declare function ResizableHandle({ withHandle, className, ...props }: ResizablePrimitive.SeparatorProps & {
    withHandle?: boolean;
}): React.ReactElement;
export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
