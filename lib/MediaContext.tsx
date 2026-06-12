'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type MediaType = 'movie' | 'tv'

interface MediaContextType {
  mediaType: MediaType
  setMediaType: (type: MediaType) => void
  isInitialized: boolean
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaType, setMediaTypeState] = useState<MediaType>('movie')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('global-media-type')
    if (saved === 'movie' || saved === 'tv') {
      setMediaTypeState(saved as MediaType)
    }
    setIsInitialized(true)
  }, [])

  const setMediaType = (type: MediaType) => {
    setMediaTypeState(type)
    if (typeof window !== 'undefined') {
      localStorage.setItem('global-media-type', type)
    }
  }

  return (
    <MediaContext.Provider value={{ mediaType, setMediaType, isInitialized }}>
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider')
  }
  return context
}
