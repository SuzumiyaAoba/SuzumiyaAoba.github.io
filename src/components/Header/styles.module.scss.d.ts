export type Styles = {
  'header': string;
  'menu': string;
  'menus': string;
  'nav': string;
  'title': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
