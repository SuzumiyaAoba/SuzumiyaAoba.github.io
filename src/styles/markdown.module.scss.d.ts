export type Styles = {
  'markdown': string;
  'toc-content': string;
  'toc-flex-wrapper': string;
  'toc-sidebar': string;
  'tocMain': string;
  'tocSide': string;
  'tocSideStyles': string;
  'tocWrapper': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
