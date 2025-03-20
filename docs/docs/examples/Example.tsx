import { Button, Center, CloseButton, Group, MantineProvider, Paper, Text } from '@mantine/core';
import { useLayout, Dock } from 'layoutrageous';

import '@mantine/core/styles.css';
import 'layoutrageous/styles.css';

export function Example() {
  const instance = useLayout({
    initialState: {
      ids: [],
      nodes: {},
      root: undefined,
    },
  });

  return (
    <MantineProvider>
      <Paper w="100%" h="50vh" pos="relative" display="flex" bg="gray.0">
        <Dock
          instance={instance}
          renderHeader={(tile) => (
            <Group align='center' h="100%" ml={8} mr={4} wrap="nowrap">
              <Text size="sm" c="dimmed" style={{ flexGrow: 1 }} truncate data-draggable>Some meaningless window title</Text>
              <CloseButton size="sm" onClick={() => {
                instance.deleteNode(tile.id);
              }} />
            </Group>
          )}
          renderTile={() => {
            return <Center h="100%" w="100%">
              <Text data-draggable>You can grab me here!</Text>
            </Center>
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <Button
            onClick={() => {
              instance.addBestFitting({});
            }}
          >
            Add tile
          </Button>
        </div>
      </Paper>
    </MantineProvider>
  );
}
