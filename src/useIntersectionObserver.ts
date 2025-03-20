import { useState } from "react";
import { useSetRef } from "./useSetRef";

export function useIntersectionObserver(options?: IntersectionObserverInit) {
    const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

    const { ref, setRef } = useSetRef((element) => {
        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];

            if (entry) {
                setEntry(entry);
            }
        }, options);

        if (element) {
            observer.observe(element);
        }

        return () => {
            observer.disconnect();
        };
    });

    return { ref, setRef, entry };
}