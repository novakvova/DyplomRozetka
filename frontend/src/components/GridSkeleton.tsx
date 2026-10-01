type GridSkeletonProps = {
    count?: number;
    variant?: 'default' | 'catalog';
};

export function GridSkeleton({ count = 4, variant = 'default' }: GridSkeletonProps) {
    return (
        <div className={variant === 'catalog' ? 'grid grid-catalog' : 'grid'} aria-hidden="true">
            {Array.from({ length: count }).map((_, index) => (
                <div className="product-skeleton" key={index}>
                    <div className="skeleton skeleton-media" />
                    <div className="skeleton skeleton-line skeleton-line-wide" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line skeleton-line-short" />
                </div>
            ))}
        </div>
    );
}