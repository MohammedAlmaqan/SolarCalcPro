import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import Svg, { Path, Rect } from 'react-native-svg';

import {
  buildSignatureSvg,
  SIGNATURE_STROKE_COLOR,
  SIGNATURE_STROKE_WIDTH,
  SIGNATURE_VIEWBOX,
  SIGNATURE_VIEWBOX_HEIGHT,
  SIGNATURE_VIEWBOX_WIDTH,
  scaleToViewBox,
  strokePath,
  type SignaturePoint,
  type SignatureStroke,
} from '@/core/signature';

export interface SignaturePadProps {
  /** Fires with the current serialized signature whenever it changes. */
  onChange: (svg: string, hasInk: boolean) => void;
}

/** Touch capture pad for drawing an electronic signature. */
export function SignaturePad({ onChange }: SignaturePadProps) {
  const { colors } = useTheme();
  const [strokes, setStrokes] = useState<SignatureStroke[]>([]);
  const [current, setCurrent] = useState<SignatureStroke>([]);
  const [panResponder, setPanResponder] = useState<ReturnType<typeof PanResponder.create> | null>(
    null,
  );

  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const strokesRef = useRef<SignatureStroke[]>([]);
  const currentRef = useRef<SignatureStroke>([]);
  const layoutRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const mapPoint = (evt: GestureResponderEvent): SignaturePoint => {
      const { locationX, locationY } = evt.nativeEvent;
      return scaleToViewBox(
        { x: locationX, y: locationY },
        layoutRef.current.width,
        layoutRef.current.height,
      );
    };

    const finishStroke = () => {
      if (currentRef.current.length >= 2) {
        strokesRef.current = [...strokesRef.current, currentRef.current];
      }
      currentRef.current = [];
      setCurrent([]);
      setStrokes(strokesRef.current);
      onChangeRef.current(buildSignatureSvg(strokesRef.current), strokesRef.current.length > 0);
    };

    setPanResponder(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          currentRef.current = [mapPoint(evt)];
          setCurrent(currentRef.current);
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          currentRef.current = [...currentRef.current, mapPoint(evt)];
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: finishStroke,
        onPanResponderTerminate: finishStroke,
      }),
    );
  }, []);

  const onLayout = (evt: LayoutChangeEvent) => {
    layoutRef.current = {
      width: evt.nativeEvent.layout.width,
      height: evt.nativeEvent.layout.height,
    };
  };

  return (
    <View
      style={[styles.pad, { borderColor: colors.outline, backgroundColor: colors.surface }]}
      onLayout={onLayout}
      {...(panResponder?.panHandlers ?? {})}
    >
      <Svg width="100%" height="100%" viewBox={SIGNATURE_VIEWBOX} preserveAspectRatio="none">
        <Rect
          x={0}
          y={0}
          width={SIGNATURE_VIEWBOX_WIDTH}
          height={SIGNATURE_VIEWBOX_HEIGHT}
          fill={colors.surface}
        />
        {strokes.map((stroke, i) => (
          <Path
            key={`s${i}`}
            d={strokePath(stroke)}
            fill="none"
            stroke={SIGNATURE_STROKE_COLOR}
            strokeWidth={SIGNATURE_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {current.length >= 2 ? (
          <Path
            d={strokePath(current)}
            fill="none"
            stroke={SIGNATURE_STROKE_COLOR}
            strokeWidth={SIGNATURE_STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    height: 180,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
