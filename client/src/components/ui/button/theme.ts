import {theme} from '@/styles/theme';
export const variantSizes = {
  sm: {minHeight: '32px', padding: '5px 10px', fontSize: '12px'},
  md: {minHeight: '40px', padding: '9px 16px', fontSize: '13px'},
  lg: {minHeight: '48px', padding: '12px 24px', fontSize: '14px'},
} as const;
export const variantStyles = {
  primary: {
    backgroundColor: theme.palette.primary,
    borderColor: theme.palette.primary,
    color: theme.palette.white,
  },
  secondary: {
    backgroundColor: theme.palette.white,
    borderColor: theme.palette.gray300,
    color: theme.palette.gray700,
  },
  text: {backgroundColor: 'transparent', borderColor: 'transparent', color: theme.palette.primary},
} as const;
