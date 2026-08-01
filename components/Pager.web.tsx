import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';

// Web stand-in for react-native-pager-view, which imports native-only RN
// internals (codegenNativeCommands) and breaks the web export. Horizontal
// paging ScrollView with the same surface the screens use.
export type PagerRef = { setPage: (index: number) => void };

type Props = React.PropsWithChildren<{
  style?: any;
  initialPage?: number;
  onPageSelected?: (e: { nativeEvent: { position: number } }) => void;
}>;

const Pager = forwardRef<PagerRef, Props>(
  ({ children, style, initialPage = 0, onPageSelected }, ref) => {
    const scrollRef = useRef<ScrollView>(null);
    const [width, setWidth] = useState(0);
    const pages = React.Children.toArray(children);
    const didInit = useRef(false);

    useImperativeHandle(ref, () => ({
      setPage: (index: number) => {
        scrollRef.current?.scrollTo({ x: index * width, animated: true });
        onPageSelected?.({ nativeEvent: { position: index } });
      },
    }));

    return (
      <View
        style={[{ flex: 1 }, style]}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          setWidth(w);
          // Honour initialPage once the width is known.
          if (!didInit.current && w > 0 && initialPage > 0) {
            didInit.current = true;
            requestAnimationFrame(() =>
              scrollRef.current?.scrollTo({ x: initialPage * w, animated: false }),
            );
          }
        }}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            if (!width) return;
            const position = Math.round(e.nativeEvent.contentOffset.x / width);
            onPageSelected?.({ nativeEvent: { position } });
          }}
          style={{ flex: 1 }}
        >
          {pages.map((child, i) => (
            <View key={i} style={{ width: width || '100%', flex: 1 }}>
              {child}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  },
);

Pager.displayName = 'Pager';
export default Pager;
