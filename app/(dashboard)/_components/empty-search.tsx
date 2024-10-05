import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { useOrganization } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface EmptySearchProps {
  text: string
  createButton?: boolean
}

const EmptySearch = ({ text, createButton }: EmptySearchProps) => {
  const { mutate, pending } = useApiMutation(api.board.create)
  const { organization } = useOrganization()
  const router = useRouter()

  const onClick = () => {
    if (!organization) return
    mutate({
      orgId: organization.id,
      title: 'Untitled',
    })
      .then((id) => {
        toast.success('Board created')
        router.push(`/board/${id}`)
      })
      .catch(() => toast.error('Failed to create board'))
  }

  return (
    <div className='h-full flex flex-col items-center justify-center'>
      <h3 className='text-muted-foreground text-xl text-center'>{text}</h3>
      {createButton && (
        <Button size='lg' className='mt-6' onClick={onClick} disabled={pending}>
          Create new board
        </Button>
      )}
    </div>
  )
}

export default EmptySearch
