import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import type { SldDiagram, SldNode } from '@/reports/sld';

const NODE_W = 150;
const NODE_H = 60;
const R = 8;

const typeColors: Record<SldNode['type'], string> = {
  source: '#0B4F6C',
  protection: '#7D5A1A',
  converter: '#1B7F4B',
  storage: '#8D4A9B',
  load: '#3F4850',
  grid: '#6F7C84',
};

function NodeBox(props: { node: SldNode; onPress: () => void }) {
  const { node, onPress } = props;
  const fill = typeColors[node.type];
  return (
    <G onPress={onPress}>
      {node.flagged ? (
        <Rect
          x={node.x - 3}
          y={node.y - 3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={R + 3}
          ry={R + 3}
          stroke="#B3261E"
          strokeWidth={2.5}
          fill="none"
        />
      ) : null}
      <Rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={R} ry={R} fill={fill} />
      {node.flagged ? (
        <SvgText x={node.x + NODE_W - 10} y={node.y + 14} fontSize={13} fill="#FFFFFF" textAnchor="middle">
          ⚠
        </SvgText>
      ) : null}
      <SvgText
        x={node.x + NODE_W / 2}
        y={node.y + 25}
        fontSize={13}
        fontWeight="700"
        fill="#FFFFFF"
        textAnchor="middle"
      >
        {node.label}
      </SvgText>
      <SvgText
        x={node.x + NODE_W / 2}
        y={node.y + 44}
        fontSize={9.5}
        fill="#EAF2F6"
        textAnchor="middle"
      >
        {node.sublabel}
      </SvgText>
    </G>
  );
}

export function SldView(props: { diagram: SldDiagram }) {
  const { diagram } = props;
  const theme = useTheme();
  const [selected, setSelected] = useState<SldNode | null>(null);

  const midY = (a: SldNode, b: SldNode) => Math.max(a.y, b.y) + NODE_H / 2;
  const isBranch = (a: SldNode, b: SldNode) => a.y !== b.y;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal bounces={false}>
        <ScrollView bounces={false}>
          <Svg width={diagram.width} height={diagram.height}>
            {diagram.edges.map((edge) => {
              const from = diagram.nodes.find((n) => n.id === edge.from);
              const to = diagram.nodes.find((n) => n.id === edge.to);
              if (!from || !to) return null;
              const fromX = from.x + NODE_W;
              const fromY = from.y + NODE_H / 2;
              const toX = to.x;
              const toY = to.y + NODE_H / 2;
              const branch = isBranch(from, to);
              const control = branch ? midY(from, to) : fromY;
              const d = branch
                ? `M ${fromX} ${fromY} C ${fromX + 40} ${control}, ${toX - 40} ${control}, ${toX} ${toY}`
                : `M ${fromX} ${fromY} L ${toX} ${toY}`;
              return (
                <G key={edge.id}>
                  <Path
                    d={d}
                    stroke={theme.colors.outline}
                    strokeWidth={edge.dashed ? 1.5 : 2}
                    fill="none"
                    strokeDasharray={edge.dashed ? '6 4' : undefined}
                  />
                  {edge.dashed ? null : (
                    <Line
                      x1={toX - 8}
                      y1={toY}
                      x2={toX}
                      y2={toY}
                      stroke={theme.colors.outline}
                      strokeWidth={2}
                    />
                  )}
                </G>
              );
            })}
            {diagram.nodes.map((node) => (
              <NodeBox key={node.id} node={node} onPress={() => setSelected(node)} />
            ))}
          </Svg>
        </ScrollView>
      </ScrollView>
      <Text variant="bodySmall" style={[styles.hint, { color: theme.colors.onSurfaceVariant }]}>
        Tap a component for details · dashed line = DC battery branch · red border = compliance issue
      </Text>

      <Portal>
        <Dialog visible={selected !== null} onDismiss={() => setSelected(null)}>
          <Dialog.Title>
            {selected?.label}
            {selected?.flagged ? ' ⚠' : ''}
          </Dialog.Title>
          <Dialog.Content>
            {selected?.flagged && selected.flaggedReason ? (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
                {selected.flaggedReason}
              </Text>
            ) : null}
            {(selected?.detail ?? []).map((detail) => (
              <Text key={detail} variant="bodyMedium" style={styles.detailRow}>
                • {detail}
              </Text>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSelected(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  hint: {
    marginTop: 6,
    textAlign: 'center',
  },
  detailRow: {
    marginVertical: 2,
  },
});
