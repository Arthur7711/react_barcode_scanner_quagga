import { SvgIcon, SvgIconProps } from '@mui/material';

export const UMSLogo = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 512 512">
    <circle cx="256" cy="256" r="256" fill="#6200EE" />
    <text
      x="256"
      y="300"
      fill="white"
      fontSize="200"
      fontFamily="Arial, sans-serif"
      textAnchor="middle"
      fontWeight="bold"
    >
      U
    </text>
  </SvgIcon>
); 