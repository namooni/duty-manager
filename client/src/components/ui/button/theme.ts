import {theme} from '@/styles/theme';
export const variantSizes = {
  sm: {minHeight: '32px', padding: '5px 10px', fontSize: '12px'},
  md: {minHeight: '36px', padding: '7px 12px', fontSize: '13px'},
  lg: {minHeight: '40px', padding: '9px 16px', fontSize: '14px'},
} as const;
export const variantStyles = {
  warning: {
    backgroundColor: theme.palette.white,
    borderColor: theme.palette.warning,
    color: theme.palette.warning,
    '&:hover:not(:disabled)': {backgroundColor: theme.palette.accentSubtle},
  },
  danger: {
    backgroundColor: theme.palette.error,
    borderColor: theme.palette.error,
    color: theme.palette.white,
    '&:hover:not(:disabled)': {
      backgroundColor: theme.palette.errorHover,
      borderColor: theme.palette.errorHover,
    },
  },
  dangerText: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: theme.palette.error,
    '&:hover:not(:disabled)': {backgroundColor: theme.palette.errorSubtle},
  },
  primary: {
    backgroundColor: theme.palette.primary,
    borderColor: theme.palette.primary,
    color: theme.palette.white,
    '&:hover:not(:disabled)': {
      backgroundColor: theme.palette.primaryHover,
      borderColor: theme.palette.primaryHover,
    },
  },
  secondary: {
    backgroundColor: theme.palette.white,
    borderColor: theme.palette.gray300,
    color: theme.palette.textMain,
    '&:hover:not(:disabled)': {backgroundColor: theme.palette.subtle},
  },
  text: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    color: theme.palette.primary,
    '&:hover:not(:disabled)': {backgroundColor: theme.palette.subtle},
  },
} as const;
