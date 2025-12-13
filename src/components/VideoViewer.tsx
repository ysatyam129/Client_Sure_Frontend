"use client"

import { useState } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from 'lucide-react'

interface VideoViewerProps {
  url: string
  title: string
  showControls?: boolean
  autoPlay?: boolean
  className?: string
}

export default function VideoViewer({ 
  url, 
  title, 
  showControls = true,
  autoPlay = false,
  className = "" 
}: VideoViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      let videoId = ''
      if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('watch?v=')[1].split('&')[0]
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0]
      }
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&controls=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&cc_load_policy=0&fs=1&disablekb=0&end_screen=0`
    }
    
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0]
      return `https://player.vimeo.com/video/${videoId}?controls=1&title=0&byline=0&portrait=0&suggested=0&related=0`
    }
    
    return url
  }

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const isVimeo = url.includes('vimeo.com')
  const isDirectVideo = !isYouTube && !isVimeo

  const openExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video bg-black">
        {isYouTube || isVimeo ? (
          <iframe
            src={getEmbedUrl(url)}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        ) : isDirectVideo ? (
          <video
            className="w-full h-full object-contain"
            controls={showControls}
            autoPlay={autoPlay}
            muted={isMuted}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={url} type="video/mp4" />
            <source src={url} type="video/webm" />
            <source src={url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Video format not supported</p>
            </div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          {showControls && (
            <button
              onClick={openExternal}
              className="p-2 rounded-lg bg-white border hover:bg-gray-50 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}