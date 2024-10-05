'use client'

import { ClerkProvider, SignInButton, useAuth } from '@clerk/nextjs'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import {
  AuthLoading,
  Authenticated,
  ConvexReactClient,
  Unauthenticated,
} from 'convex/react'
import { Loading } from '@/components/auth/loading'
import { Button } from '@/components/ui/button'

interface ConvexClientProviderProps {
  children: React.ReactNode
}

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!

const convex = new ConvexReactClient(convexUrl)

export const ConvexClientProvider = ({
  children,
}: ConvexClientProviderProps) => {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <div className='flex justify-center items-center w-full h-full'>
            <SignInButton mode='modal'>
              <Button size='lg'>Sign in</Button>
            </SignInButton>
          </div>
        </Unauthenticated>
        <AuthLoading>
          <Loading />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  )
}
