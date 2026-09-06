import { useEffect, useRef } from 'react';

export function useReveal<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        if (typeof IntersectionObserver === 'undefined') {
            node.classList.add('in-view');
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        observer.unobserve(entry.target);
                    }
                }
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    return ref;
}