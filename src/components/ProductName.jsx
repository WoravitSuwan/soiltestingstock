import { useState } from 'react'

// Long product names are cut with "…" so the number columns stay on screen;
// tap/click the name (or hover on desktop) to see it in full.
export default function ProductName({ name, className = '' }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      title={name}
      onClick={() => setExpanded((e) => !e)}
      className={`cursor-pointer ${
        expanded ? 'max-w-[18rem] whitespace-normal sm:max-w-[32rem]' : 'max-w-[7.5rem] truncate sm:max-w-[14rem] lg:max-w-[20rem] xl:max-w-[24rem] 2xl:max-w-[34rem]'
      } ${className}`}
    >
      {name}
    </div>
  )
}
