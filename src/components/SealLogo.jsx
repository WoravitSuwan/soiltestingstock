import { useId } from 'react'

const NAVY = '#1B2A6B'

export default function SealLogo({ size = 56 }) {
  const uid = useId().replace(/[:]/g, '')
  const topPathId = `seal-top-${uid}`
  const bottomPathId = `seal-bottom-${uid}`

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className="shrink-0">
      <defs>
        {/* top semicircle, left-to-right over the top, for upright top text */}
        <path id={topPathId} d="M 22 100 A 78 78 0 1 1 178 100" fill="none" />
        {/* bottom semicircle, right-to-left under the bottom, for upright bottom text */}
        <path id={bottomPathId} d="M 178 100 A 78 78 0 1 1 22 100" fill="none" />
      </defs>

      <circle cx="100" cy="100" r="96" fill="white" stroke={NAVY} strokeWidth="2.5" />
      <circle cx="100" cy="100" r="88" fill="none" stroke={NAVY} strokeWidth="1.5" />

      <text fill={NAVY} fontSize="15" fontWeight="700" letterSpacing="1.5" fontFamily="Arial, sans-serif">
        <textPath href={`#${topPathId}`} startOffset="50%" textAnchor="middle">
          SOIL TESTING SIAM
        </textPath>
      </text>
      <text fill={NAVY} fontSize="15" fontWeight="700" letterSpacing="1.5" fontFamily="Arial, sans-serif">
        <textPath href={`#${bottomPathId}`} startOffset="50%" textAnchor="middle">
          COMPANY LIMITED
        </textPath>
      </text>

      <circle cx="22" cy="100" r="6" fill={NAVY} />
      <circle cx="178" cy="100" r="6" fill={NAVY} />

      <g stroke={NAVY} strokeWidth="1.5" fill="none" opacity="0.85">
        <path d="M100 38 Q66 100 100 162 Q134 100 100 38 Z" strokeDasharray="3 3" />
        <ellipse cx="100" cy="100" rx="46" ry="13" strokeDasharray="3 3" />
        <path d="M100 38 Q84 100 100 162" strokeDasharray="3 3" />
        <path d="M100 38 Q116 100 100 162" strokeDasharray="3 3" />
      </g>

      <text
        x="100"
        y="120"
        textAnchor="middle"
        fontSize="58"
        fontWeight="800"
        fill={NAVY}
        fontFamily="Arial, sans-serif"
      >
        STS
      </text>
    </svg>
  )
}
