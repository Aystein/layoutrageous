import * as React from 'react';
import { useEffectEvent } from './useEffectEvent';

export function useSetRef<T extends HTMLElement>(callback: (element: T | null) => () => void) {
    // Create stable setRef
    const ref = React.useRef<T | null>(null);

    const setRef = useEffectEvent((element: T | null) => {
        ref.current = element;
        callback(element);
    });
    
    return { ref, setRef };
}