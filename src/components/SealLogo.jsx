export default function SealLogo({ size = 56 }) {
  const id = 'seal-text-path'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
      <defs>
        <path id={id} d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
      </defs>
      <circle cx="50" cy="50" r="48" fill="#0B0F19" stroke="#2F63D6" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#2F63D6" strokeWidth="1.5" />
      <text fill="#4E82F4" fontSize="7" fontWeight="700" letterSpacing="1.5">
        <textPath href={`#${id}`} startOffset="2%">
          SOIL TESTING SIAM • COMPANY LIMITED •
        </textPath>
      </text>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#2F63D6" strokeWidth="1" />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="22"
        fontWeight="800"
        fill="#4E82F4"
        fontFamily="Inter, sans-serif"
      >
        STS
      </text>
    </svg>
  )
}
