# API reference

This guide provides an overview of the API, though it is not exhaustive. For real-world usage, refer to the examples section.

## Instance

The layout instance manages the state of windows and offers an intuitive way to dispatch actions that modify the state.

The `produce` method allows you to update the state by mutating an **immer draft**. Here’s how it’s defined:

```ts
produce: (updater: (draft: WritableDraft<LayoutState<T>>) => void) => void;
```

With this, you can modify the state using actions. For example, to remove a window by its ID when clicking a close button, you would first import the action:

```ts
import { deleteTile } from 'layoutrageous';
```

Then, in your button's onClick handler, call:

```ts
instance.produce((draft) => {
  deleteTile(draft, id);
});
```

For simple actions, there's an even more streamlined approach:

```ts
instance.applyDraftAction(deleteTile, id);
```

This method partially applies the action’s arguments, so you don’t need to manually pass the state.

## Uncontrolled

In an uncontrolled setup, the hook internally manages state. Simply provide an initial value.

```tsx
import { createTactileAdapter, Dock, useLayout, getInitialState } from 'layoutrageous';

function Component() {
    const instance = useLayout({
        initialState: getInitialState(),
    });

    return <Dock instance={instance} />;
}
```

## Controlled

For full control, manage the state externally and pass it to the hook.

```tsx
import { createTactileAdapter, useTactile, getInitialState } from 'layoutrageous';

function Component() {
    const [state, onStateChange] = React.useState(getInitialState());

    const instance = useTactile({
        state,
        onStateChange,
    });

    return <Dock instance={instance} />;
}
```

:::warning
Controlled and uncontrolled modes should not be mixed, as this may result in unexpected state behavior.
:::

## Tree shaking

While this approach may seem overly complex at first, it is designed to ensure that users can import only the actions they need, allowing tree-shaking to function correctly. If all actions were included directly within the instance, tree-shaking would not be effective.

## Dock

The `Dock` component is the actual UI component of layoutrageous. It takes the instance and renders the individual windows using the user supplied `renderTile` and `renderHeader` functions. In a very basic example where we want want to display the window id as header and some text as content:

## Making things draggable

In the examples, you'll notice that certain areas serve as drag handles. You can designate drag handles in both the header and content simply by setting the data-draggable attribute on an element. This makes the element, along with all its children, function as a drag handle for the windows. To make an entire header draggable, you only need to apply this attribute to the parent element rather than each child individually.

