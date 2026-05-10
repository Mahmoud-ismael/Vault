'use client'

import { useEffect } from 'react'
import { useTopbar } from './TopbarContext'

export function SetTopbar({ 
  title, 
  leftNode = null, 
  rightNode = null 
}: { 
  title: React.ReactNode, 
  leftNode?: React.ReactNode, 
  rightNode?: React.ReactNode 
}) {
  const { setTitle, setLeftNode, setRightNode, setAction } = useTopbar()
  
  useEffect(() => {
    setTitle(title)
    setLeftNode(leftNode)
    setRightNode(rightNode)
    setAction(null)
  }, [title, leftNode, rightNode, setTitle, setLeftNode, setRightNode, setAction])
  
  return null
}
