import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useEffectEvent<Args extends any[]>(handler: (...args: Args) => void) {
    const handlerRef = React.useRef(handler);

    React.useLayoutEffect(() => {
        handlerRef.current = handler;
    });

    return React.useCallback((...args: Args) => {
        const fn = handlerRef.current;
        return fn(...args);
    }, []);
}