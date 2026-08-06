import * as React from 'react';
declare function Card({ className, size, flush, ...props }: React.ComponentProps<'div'> & {
    size?: 'default' | 'sm';
    flush?: boolean;
}): React.ReactElement;
declare function CardHeader({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare const CardTitle: React.ForwardRefExoticComponent<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;
declare function CardDescription({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function CardAction({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function CardContent({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
declare function CardFooter({ className, ...props }: React.ComponentProps<'div'>): React.ReactElement;
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
