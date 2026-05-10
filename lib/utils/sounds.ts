type SoundType = 'open' | 'close' | 'payment' | 'scan'

const SOUNDS: Record<SoundType, { freq: number; duration: number; gain: number; type?: OscillatorType }> = {
  open:    { freq: 880,  duration: 0.18, gain: 0.12, type: 'sine' },
  close:   { freq: 440,  duration: 0.25, gain: 0.12, type: 'sine' },
  payment: { freq: 1046, duration: 0.22, gain: 0.15, type: 'sine' },
  scan:    { freq: 1200, duration: 0.12, gain: 0.15, type: 'sine' },
}

export function playSound(type: SoundType) {
  try {
    const { freq, duration, gain, type: oscType = 'sine' } = SOUNDS[type]
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.type = oscType
    osc.frequency.value = freq
    gainNode.gain.setValueAtTime(gain, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gainNode)
    gainNode.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch { /* ignore */ }
}
