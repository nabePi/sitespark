import { useEffect, useCallback } from 'react'
import { useWebsiteStore } from '@/stores/website.store'
import type { Website } from '@/types'

export function useWebsites() {
  const {
    websites,
    currentWebsite,
    isLoading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    setCurrentWebsite,
    deployWebsite,
  } = useWebsiteStore()

  useEffect(() => {
    if (websites.length === 0 && !isLoading) {
      fetchWebsites()
    }
  }, [websites.length, isLoading, fetchWebsites])

  const selectWebsite = useCallback((website: Website | null) => {
    setCurrentWebsite(website)
  }, [setCurrentWebsite])

  return {
    websites,
    currentWebsite,
    isLoading,
    error,
    fetchWebsites,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    selectWebsite,
    deployWebsite,
  }
}

export function useWebsite(id?: string) {
  const {
    currentWebsite,
    isLoading,
    error,
    fetchWebsite,
    updateWebsite,
    deployWebsite,
  } = useWebsiteStore()

  useEffect(() => {
    if (id && (!currentWebsite || currentWebsite.id !== id)) {
      fetchWebsite(id)
    }
  }, [id, currentWebsite, fetchWebsite])

  return {
    website: currentWebsite,
    isLoading,
    error,
    fetchWebsite,
    updateWebsite,
    deployWebsite,
  }
}
