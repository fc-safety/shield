import { act, renderHook } from "@testing-library/react";
import { useCustomInput } from "./use-custom-input";

describe("useCustomInput", () => {
  test("should not cause infinite loop when valueProp reference changes but content remains same", () => {
    let renderCount = 0;
    const initialValue = "test";
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ value }: { value: string | undefined }) => {
        renderCount++;
        return useCustomInput<string>({ value, onValueChange: callback });
      },
      { initialProps: { value: initialValue } }
    );

    // Simulate parent re-render with new reference but same content
    rerender({ value: initialValue });
    rerender({ value: initialValue });

    // If there's an infinite loop, renderCount would keep increasing
    expect(renderCount).toBeLessThan(10); // Reasonable threshold
  });

  test("defaultValue sets initial value but does not trigger updates on change", () => {
    const initialDefault = "initial";
    const newDefault = "new";
    const callback = jest.fn();

    const { result, rerender } = renderHook(
      ({ defaultValue }: { defaultValue: string | undefined }) =>
        useCustomInput<string>({ defaultValue, onValueChange: callback }),
      { initialProps: { defaultValue: initialDefault } }
    );

    expect(result.current.value).toBe(initialDefault);
    expect(result.current.appliedValue).toBe(initialDefault);

    rerender({ defaultValue: newDefault });
    expect(result.current.value).toBe(initialDefault); // Should not update to new default
    expect(result.current.appliedValue).toBe(initialDefault);
    expect(callback).not.toHaveBeenCalled();
  });

  test("value prop triggers updates when changed", () => {
    const initialValue = "initial";
    const newValue = "new";

    const { result, rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useCustomInput<string>({ value }),
      { initialProps: { value: initialValue } }
    );

    expect(result.current.value).toBe(initialValue);
    expect(result.current.appliedValue).toBe(initialValue);

    rerender({ value: newValue });
    expect(result.current.value).toBe(newValue);
    expect(result.current.appliedValue).toBe(newValue);
  });

  test("onValueChange is only called when applyValue is called", () => {
    const callback = jest.fn();
    const initialValue = "initial";
    const newValue = "new";

    const { result } = renderHook(() =>
      useCustomInput<string>({
        defaultValue: initialValue,
        onValueChange: callback,
      })
    );

    act(() => {
      result.current.setValue(newValue);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.applyValue();
    });

    expect(callback).toHaveBeenCalledWith(newValue);
  });

  test("appliedValue is only updated when applyValue is called", () => {
    const initialValue = "initial";
    const newValue = "new";

    const { result } = renderHook(() =>
      useCustomInput<string>({ defaultValue: initialValue })
    );

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toBe(newValue);
    expect(result.current.appliedValue).toBe(initialValue);

    act(() => {
      result.current.applyValue();
    });

    expect(result.current.appliedValue).toBe(newValue);
  });

  test("setValue updates pending value immediately", () => {
    const initialValue = "initial";
    const newValue = "new";

    const { result } = renderHook(() =>
      useCustomInput<string>({ defaultValue: initialValue })
    );

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toBe(newValue);
    expect(result.current.appliedValue).toBe(initialValue);
  });

  test("internal value follows value prop when present, otherwise maintains own state", () => {
    const initialValue = "initial";
    const controlledValue = "controlled";
    const newValue = "new";

    const { result, rerender } = renderHook(
      ({ value }: { value: string | undefined }) =>
        useCustomInput<string>({ defaultValue: initialValue, value }),
      { initialProps: { value: undefined as string | undefined } }
    );

    expect(result.current.appliedValue).toBe(initialValue);

    act(() => {
      result.current.setValue(newValue);
    });
    act(() => {
      result.current.applyValue();
    });
    expect(result.current.appliedValue).toBe(newValue);

    rerender({ value: controlledValue });
    expect(result.current.appliedValue).toBe(controlledValue);

    act(() => {
      result.current.setValue("ignored");
    });
    act(() => {
      result.current.applyValue();
    });
    expect(result.current.appliedValue).toBe(controlledValue); // Should ignore setValue when controlled

    rerender({ value: undefined });
    act(() => {
      result.current.setValue("independent");
    });
    act(() => {
      result.current.applyValue();
    });
    expect(result.current.appliedValue).toBe("independent"); // Should maintain own state when uncontrolled
  });
});
