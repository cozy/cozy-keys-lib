/* Made automatically with svgr from <rootDir>/assets/icon-cozy-security.svg */

import React from 'react'

function SvgIconCozySecurity(props) {
  return (
    <svg viewBox="0 0 104 104" fill="none" {...props}>
      <g filter="url(#icon-connect_svg__filter0_ddd_8318_41471)">
        <rect x={16} y={12} width={72} height={72} rx={36} fill="#fff" />
        <path
          d="M28 50.5c0 7.364 5.97 13.333 13.333 13.333h21.334C70.03 63.833 76 57.863 76 50.5c0-6.53-4.693-11.962-10.89-13.11C63.962 31.193 58.53 26.5 52 26.5c-6.53 0-11.962 4.693-13.11 10.89C32.693 38.538 28 43.97 28 50.5z"
          fill="#B3D3FF"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M54 50.584A5.001 5.001 0 0052 41a5 5 0 00-2 9.584V55a2 2 0 104 0v-4.416z"
          fill="#297EF2"
        />
      </g>
      <defs>
        <filter
          id="icon-connect_svg__filter0_ddd_8318_41471"
          x={0}
          y={0}
          width={104}
          height={104}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={4} />
          <feGaussianBlur stdDeviation={8} />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_8318_41471"
          />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy={2} />
          <feGaussianBlur stdDeviation={2} />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0" />
          <feBlend
            in2="effect1_dropShadow_8318_41471"
            result="effect2_dropShadow_8318_41471"
          />
          <feColorMatrix
            in="SourceAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feMorphology
            radius={0.5}
            operator="dilate"
            in="SourceAlpha"
            result="effect3_dropShadow_8318_41471"
          />
          <feOffset />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
          <feBlend
            in2="effect2_dropShadow_8318_41471"
            result="effect3_dropShadow_8318_41471"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect3_dropShadow_8318_41471"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  )
}

export default SvgIconCozySecurity
