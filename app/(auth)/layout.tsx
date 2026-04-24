export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070910] p-4 relative overflow-hidden dot-grid">
      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-violet-600/[0.12] blur-[80px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/[0.10] blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-900/[0.08] blur-[100px]" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <div
              className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px oklch(0.64 0.26 278 / 40%)' }}
            >
              <span className="text-white text-[13px] font-black">V</span>
            </div>
            <span className="text-[28px] font-black tracking-[-0.05em] gradient-text leading-none">venti</span>
          </div>
          <p className="text-[13px] text-[#4a5270] font-medium">Tu sistema de gestión</p>
        </div>
        {children}
      </div>
    </div>
  )
}
