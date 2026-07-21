import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  type ComponentProps,
  type ReactNode,
} from 'react';
import { findNodeHandle, ScrollView, TextInput, type TextInputProps } from 'react-native';

type ScrollViewProps = ComponentProps<typeof ScrollView>;

interface FormScrollContextValue {
  scrollToFocused: (target: TextInput | null) => void;
}

const FormScrollContext = createContext<FormScrollContextValue | null>(null);

/** ScrollView, который умеет прокручивать к сфокусированному инпуту. */
export const FormScrollView = forwardRef<ScrollView, ScrollViewProps>(
  function FormScrollView({ children, keyboardShouldPersistTaps = 'handled', ...props }, ref) {
    const innerRef = useRef<ScrollView | null>(null);

    const setRefs = useCallback(
      (node: ScrollView | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const scrollToFocused = useCallback((target: TextInput | null) => {
      if (!target || !innerRef.current) return;

      const handle = findNodeHandle(target);
      if (!handle) return;

      const responder = (
        innerRef.current as ScrollView & {
          getScrollResponder?: () => {
            scrollResponderScrollNativeHandleToKeyboard?: (
              nodeHandle: number,
              additionalOffset: number,
              preventNegativeScrolling: boolean,
            ) => void;
          };
        }
      ).getScrollResponder?.();

      // Небольшая задержка — клавиатура успевает начать открываться.
      requestAnimationFrame(() => {
        setTimeout(() => {
          responder?.scrollResponderScrollNativeHandleToKeyboard?.(handle, 180, true);
        }, 50);
      });
    }, []);

    return (
      <FormScrollContext.Provider value={{ scrollToFocused }}>
        <ScrollView
          ref={setRefs}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          {...props}>
          {children}
        </ScrollView>
      </FormScrollContext.Provider>
    );
  },
);

/** TextInput с автоскроллом к себе внутри FormScrollView. */
export const FormTextInput = forwardRef<TextInput, TextInputProps>(function FormTextInput(
  { onFocus, ...props },
  ref,
) {
  const ctx = useContext(FormScrollContext);
  const localRef = useRef<TextInput | null>(null);

  const setRefs = useCallback(
    (node: TextInput | null) => {
      localRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  return (
    <TextInput
      ref={setRefs}
      onFocus={(event) => {
        onFocus?.(event);
        ctx?.scrollToFocused(localRef.current);
      }}
      {...props}
    />
  );
});

export function FormScrollProvider({
  children,
  scrollToFocused,
}: {
  children: ReactNode;
  scrollToFocused: (target: TextInput | null) => void;
}) {
  return (
    <FormScrollContext.Provider value={{ scrollToFocused }}>{children}</FormScrollContext.Provider>
  );
}
