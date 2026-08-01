import PagerView from 'react-native-pager-view';

// Native: the real thing, untouched. The .web sibling stands in on web,
// where react-native-pager-view pulls in native-only RN internals and
// cannot bundle. Same surface both sides: setPage + onPageSelected.
export type PagerRef = { setPage: (index: number) => void };

export default PagerView as unknown as React.ComponentType<
  React.PropsWithChildren<{
    style?: any;
    initialPage?: number;
    onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
    ref?: React.Ref<PagerRef>;
  }>
>;
