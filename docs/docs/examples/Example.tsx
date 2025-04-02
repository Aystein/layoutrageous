import { Button, Center, CloseButton, Group, Paper, Text } from '@mantine/core';
import { useLayout, Dock } from 'layoutrageous';

import 'layoutrageous/styles.css';

import {
  addBestFitting,
  deleteTile,
  getInitialState,
} from '../../../dist/layoutAdapter';

export function Example() {
  const instance = useLayout({
    initialState: getInitialState(),
  });

  return (
    <>
      <Dock
        instance={instance}
        renderHeader={(tile) => (
          <Group align="center" h="100%" ml={8} mr={4} wrap="nowrap">
            <Text
              size="sm"
              c="dimmed"
              style={{ flexGrow: 1 }}
              truncate
              data-draggable
            >
              You can grab me here!
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
            <Center h="100%" w="100%">
              <Text data-draggable>You can also grab me here!</Text>
            </Center>
          );
        }}
      />

      <Group
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
        }}
      >
        <Button
          onClick={() => {
            instance.produce((draft) => {
              addBestFitting(draft, {} as unknown);
            });
          }}
        >
          Add tile
        </Button>

        <Button
          onClick={() => {
            instance.produce(() => getInitialState());
          }}
        >
          Reset
        </Button>
      </Group>
    </>
  );
}
