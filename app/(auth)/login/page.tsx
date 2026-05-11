'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setLoading(true)
    setError(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen bg-vault-bg">
      {/* Left Side - 60% */}
      <div className="hidden lg:flex relative w-[60%] bg-[#f4ebe8]">
        <Image
          src="/login-bg.png"
          alt="Vault Logo"
          fill
          className="object-cover object-center"
          priority
        />
      </div>

      {/* Right Side - 40% */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[40%] p-8 bg-vault-bg border-l border-vault-border">
        <div className="w-full max-w-[420px] bg-vault-bg-2 border border-vault-border rounded-[6px] p-[32px] transition-colors duration-150 ease-in-out hover:border-vault-border-2 hover:bg-vault-bg-3">
          <div className="font-mono text-[10px] text-vault-text-3 uppercase tracking-[0.2em] mb-8">Vault</div>
          
          <h2 className="font-serif text-[22px] mb-2 text-vault-text">Sign in</h2>
          <p className="font-sans text-[14px] text-vault-text-2 mb-8">
            Enter your credentials to access your Vault.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="Email address"
                className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] px-3 py-2 font-sans text-[15px] text-vault-text placeholder-vault-text-3 placeholder:italic focus:outline-none focus:border-vault-accent transition-all duration-150"
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="Password"
                className="w-full bg-vault-bg-4 border border-vault-border rounded-[4px] px-3 py-2 font-sans text-[15px] text-vault-text placeholder-vault-text-3 placeholder:italic focus:outline-none focus:border-vault-accent transition-all duration-150"
                disabled={loading}
              />
              {error && (
                <span className="font-mono text-[11px] text-vault-danger mt-1">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-vault-accent text-[#0D0D0F] font-mono text-[11px] uppercase tracking-[0.1em] py-2 px-4 rounded-[4px] hover:bg-vault-accent-2 disabled:opacity-50 transition-colors duration-150 h-10 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIGN IN"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}