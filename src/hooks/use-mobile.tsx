import { useState, useEffect } from 'react'

export function useDeviceDetect() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      return window.innerWidth <= 1024 || window.screen.width <= 1024
    }

    const handleResize = () => {
      setIsMobile(checkMobile())
    }

    handleResize() // Initial check
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return { isMobile }
}
