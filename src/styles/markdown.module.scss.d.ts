export type Styles = {
  'markdown': string;
  'tocMain': string;
  'tocSide': string;
  'tocSideStyles': string;
  'tocWrapper': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
