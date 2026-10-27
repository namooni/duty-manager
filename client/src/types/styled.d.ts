import 'styled-components';
import type {Theme} from '@/styles/theme';
declare module 'styled-components' {
  export interface DefaultTheme {
    palette: Theme['palette'];
    semantic: Theme['semantic'];
    radius: Theme['radius'];
    spacing: Theme['spacing'];
    typography: Theme['typography'];
  }
}
