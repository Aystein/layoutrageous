import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEffectEvent<T extends (...args: any[]) => any>(handler: T) {
    const handlerRef = React.useRef(handler);

    React.useLayoutEffect(() => {
        handlerRef.current = handler;
    });

    return React.useCallback((...args: Parameters<T>) => {
        const fn = handlerRef.current;
        return fn(...args);
    }, []);
}