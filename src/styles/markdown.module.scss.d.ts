export type Styles = {
  'markdown': string;
  'tocWrapper': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
