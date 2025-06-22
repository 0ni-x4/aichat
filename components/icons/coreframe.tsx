import { SVGProps } from "react"

export function CoreframeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#coreframe)">
        <path
          d="M5.52 0.400024L2.8 5.60002H0.64V10.4H2.8L5.52 15.6H10.48L13.2 10.4H15.36V5.60002H13.2L10.48 0.400024H5.52Z"
          fill="url(#paint0_radial_2074_149)"
        />
        <path
          d="M6.72 4.00002H9.28L11.84 8.00002L9.28 12H6.72L4.16 8.00002L6.72 4.00002Z"
          fill="#141414"
        />
        <defs>
          <radialGradient
            id="paint0_radial_2074_149"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(8 8) rotate(90) scale(7.04569 6.65985)"
          >
            <stop stopColor="#333333" />
            <stop offset="1" stopColor="#DDDDDD" />
          </radialGradient>
          <clipPath id="coreframe">
            <rect width="16" height="16" fill="white" />
          </clipPath>
        </defs>
      </g>
    </svg>
  )
} 