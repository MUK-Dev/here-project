import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { CreateOrganization } from '@clerk/nextjs'

const EmptyOrg = () => {
  return (
    <div className='h-full flex flex-col items-center justify-center'>
      <h2 className='text-2xl font-semibold mt-6 bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 text-transparent'>
        Welcome to here-project
      </h2>
      <h5 className='text-muted-foreground text-sm mt-2'>
        No boards available
      </h5>
      <h5 className='text-muted-foreground text-sm mt-2'>
        Create a new organization to get started
      </h5>
      <div className='mt-6'>
        <Dialog>
          <DialogTrigger asChild>
            <Button size='lg'>Create organization</Button>
          </DialogTrigger>
          <DialogContent className='p-0 bg-transparent border-none max-w-[480px]'>
            <CreateOrganization />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default EmptyOrg
