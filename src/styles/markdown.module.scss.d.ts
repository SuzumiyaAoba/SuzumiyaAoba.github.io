export type Styles = {
  'markdown': string;
  'toc-container': string;
  'toc-link': string;
  'toc-list': string;
  'toc-list-item': string;
};

export type ClassNames = keyof Styles;

declare const styles: Styles;

export default styles;
