import {TextVariants} from './types';
export const variantStyles = {
  [TextVariants.H1]: {fontSize: '24px', fontWeight: 700, letterSpacing: '-.03em'},
  [TextVariants.H2]: {fontSize: '16px', fontWeight: 700, letterSpacing: '-.4px'},
  [TextVariants.H3]: {fontSize: '14px', fontWeight: 700},
  [TextVariants.T1]: {fontSize: '18px', fontWeight: 500},
  [TextVariants.T2]: {fontSize: '16px', fontWeight: 500},
  [TextVariants.T3]: {fontSize: '14px', fontWeight: 400},
  [TextVariants.T4]: {fontSize: '11px', fontWeight: 400},
} as const;
