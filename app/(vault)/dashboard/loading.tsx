import { Skeleton } from '@/components/shared/Skeleton'
import { SetTopbar } from '@/components/vault/SetTopbar'

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-12 w-full max-w-5xl mx-auto pb-10">
      <SetTopbar title="Dashboard" />
      <div className="flex flex-col gap-2 mt-4">
        <Skeleton className="h-[40px] w-[300px]" />
        <Skeleton className="h-[14px] w-[200px]" />
      </div>
      <Skeleton className="h-[140px] w-full mt-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[100px] w-full" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 mt-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  )
}
