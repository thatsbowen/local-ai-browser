interface AILogoProps {
  size?: number
  animated?: boolean
  className?: string
}

export default function AILogo({ size = 24, animated = false, className = '' }: AILogoProps) {
  const smallerSize = Math.floor(size * 0.4)
  const eyeSize = Math.floor(size * 0.15)

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        className={animated ? 'animate-pulse' : ''}
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>

        {/* 圆形头部 */}
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          stroke="url(#logoGradient)"
          strokeWidth="2"
        />

        {/* 圆形眼睛 */}
        <circle
          cx="20"
          cy="14"
          r={eyeSize}
          fill="#6366F1"
          className={animated ? 'animate-pulse' : ''}
        />

        {/* 三角形身体/嘴巴 - 代表AI/对话 */}
        <path
          d={`M ${20 - smallerSize} ${26} L ${20 + smallerSize} ${26} L ${20} ${20 + smallerSize * 0.8} Z`}
          fill="url(#logoGradient)"
          opacity="0.9"
        />

        {/* 内部小圆形表示交互 */}
        <circle
          cx="20"
          cy="14"
          r={eyeSize * 0.5}
          fill="white"
        />
      </svg>
    </div>
  )
}
