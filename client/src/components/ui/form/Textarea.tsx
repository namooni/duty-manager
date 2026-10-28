import styled from 'styled-components';
import {controlStyles} from './controlStyles';
const Textarea = styled.textarea`
  ${controlStyles}
  min-height:80px;
  resize: vertical;
`;
export default Textarea;
