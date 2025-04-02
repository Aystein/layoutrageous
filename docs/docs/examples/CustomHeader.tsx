import { Alert, CloseButton, Group, Text } from '@mantine/core';
import { useLayout, Dock } from 'layoutrageous';

import 'layoutrageous/styles.css';

import {
  addBestFitting,
  deleteTile,
  getInitialState,
} from '../../../dist/layoutAdapter';
import { css } from '@emotion/css';
import { useState } from 'react';

export function CustomHeader() {
  const [initialState] = useState(() => {
    const state = getInitialState();
    addBestFitting(state, {} as unknown);
    return state;
  });

  const instance = useLayout({
    initialState,
  });

  return (
    <Dock
      instance={instance}
      tileClassNames={{
        header: css`
          height: 50px;
          background: #faa2c1;
        `,
        body: css`
          background: #fdd;
        `,
        root: css`
          border: 1px solid #f00;
        `,
      }}
      renderHeader={(tile) => (
        <Group align="center" h="100%" ml={8} mr={4} wrap="nowrap">
          <Text size="sm" style={{ flexGrow: 1 }} truncate data-draggable>
            I am customized and draggable
          </Text>
          <CloseButton
            size="sm"
            onClick={() => {
              instance.applyDraftAction(deleteTile, tile.id);
            }}
          />
        </Group>
      )}
      renderTile={() => {
        return (
          <Alert m="xs" variant="white">
            I am content
          </Alert>
        );
      }}
    />
  );
}
