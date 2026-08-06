import * as React from 'react';
type AvatarSize = 'lg' | 'default' | 'sm' | 'xs';
declare const Avatar: React.ForwardRefExoticComponent<Omit<Omit<import('@base-ui/react').AvatarRootProps, "ref"> & React.RefAttributes<HTMLSpanElement> & {
    size?: AvatarSize;
}, "ref"> & React.RefAttributes<HTMLSpanElement>>;
declare const AvatarImage: React.ForwardRefExoticComponent<Omit<Omit<import('@base-ui/react').AvatarImageProps, "ref"> & React.RefAttributes<HTMLImageElement>, "ref"> & React.RefAttributes<HTMLImageElement>>;
declare const AvatarFallback: React.ForwardRefExoticComponent<Omit<Omit<import('@base-ui/react').AvatarFallbackProps, "ref"> & React.RefAttributes<HTMLSpanElement>, "ref"> & React.RefAttributes<HTMLSpanElement>>;
declare function AvatarGroup({ className, stacked, reverse, size, children, style, ...props }: React.ComponentProps<'div'> & {
    stacked?: boolean;
    reverse?: boolean;
    size?: AvatarSize;
}): React.ReactElement;
export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
