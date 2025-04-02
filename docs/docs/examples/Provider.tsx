import { MantineProvider, Paper } from '@mantine/core';
import '@mantine/core/styles.css';

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <Paper w="100%" h="50vh" pos="relative" display="flex" bg="gray.0">
        {children}
      </Paper>
    </MantineProvider>
  );
}
