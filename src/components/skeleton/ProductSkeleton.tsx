import { Skeleton } from "../ui/skeleton";

export default function ProductSkeleton() {
    return (
        <div className="flex gap-3 flex-col sm:flex-row">
            <Skeleton className="size-14" />
            <div className="flex-1">
                <Skeleton className="w-full h-5" />
                <Skeleton className="w-full h-4 mt-2" />
            </div>
            <Skeleton className="h-7 w-24" />
        </div>
    )
}