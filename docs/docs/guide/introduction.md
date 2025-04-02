# Introduction

Layoutrageous is a powerful and flexible tiling window manager for the web, designed to help developers create dynamic, efficient, and customizable layouts with ease. Its API is inspired by TanStack Table (https://tanstack.com/table/latest) and other hook-centric libraries, embracing a declarative and composable approach to window management. Whether you're building a dashboard, an IDE-like interface, or a multi-pane application, Layoutrageous provides the tools to streamline layout logic while maintaining full control over behavior and styling.

## Installation

You can install `layoutrageous` via the npm package:

```sh
yarn add layoutrageous
```

## Use cases

Layoutrageous is designed for scenarios where flexible, dynamic, and efficient layout management is essential. It excels in applications that require seamless window tiling, resizable panes, and customizable layouts.

- **Dashboards** – Create interactive and responsive admin panels or data visualization dashboards with resizable and rearrangeable tiles.
- **IDEs & Code Editors** – Build web-based development environments with split views, draggable panels, and persistent layout states.
- **Multi-Pane Applications** – Develop productivity apps, knowledge management tools, or document editors with intuitive multi-pane navigation.
- **Embedded Layouts** – Integrate Layoutrageous into existing applications to manage complex UI structures without losing flexibility.

With its headless architecture and declarative API, Layoutrageous adapts to a wide range of use cases, making it a powerful tool for modern web applications.

## API design

Layoutrageous draws inspiration from [TanStack Table](https://tanstack.com/table/latest) and follows a hook-centric design for flexibility and control. The main entry point is the `useLayout` hook, which can be used in both controlled and uncontrolled modes. It returns a layout instance that provides various actions, such as automatically determining the best split placement and adding tiles dynamically.

The hook itself is headless, meaning it does not render anything. Rendering is handled by the `Layout` component, which takes the layout instance as a prop. This separation of logic and presentation ensures maximum flexibility, allowing you to customize rendering while leveraging powerful layout management features.

## Examples