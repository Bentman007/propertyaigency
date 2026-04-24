'use client'
import { useState, useRef, useEffect } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      setSupported(true)
    }
  }, [])

  const startListening = () => {
    if (!supported || listening) return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-ZA'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      title={listening ? 'Click to stop' : 'Click to speak'}
      style={{
        width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer',
        backgroundColor: listening ? '#ef4444' : '#4a4238',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all 0.2s',
        animation: listening ? 'pulse 1s infinite' : 'none',
      }}
    >
      <span style={{fontSize: '16px'}}>{listening ? '⏹' : '🎤'}</span>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </button>
  )
}
