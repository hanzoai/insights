import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import * as React from 'react';
declare function Accordion({ className, ...props }: AccordionPrimitive.Root.Props): React.ReactElement;
declare function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props): React.ReactElement;
declare function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props): React.ReactElement;
declare function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props): React.ReactElement;
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
