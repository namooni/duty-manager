export const ButtonSizes = {SM: 'sm', MD: 'md', LG: 'lg'} as const;
export type ButtonSize = (typeof ButtonSizes)[keyof typeof ButtonSizes];
export const ButtonVariants = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  TEXT: 'text',
  WARNING: 'warning',
  DANGER: 'danger',
  DANGER_TEXT: 'dangerText',
} as const;
export type ButtonVariant = (typeof ButtonVariants)[keyof typeof ButtonVariants];
