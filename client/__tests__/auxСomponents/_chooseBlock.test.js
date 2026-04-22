import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { _chooseBlock } from "../../src/auxComponents/_chooseBlock";

var mockedSetClouse = vi.fn();
var mockedCallback = vi.fn();

describe("test _chooseBlock", () => {
  const mocked = vi.hoisted(() => ({
    mockedUseState: vi.fn(() => {
      return false;
    }),
  }));

  beforeEach(() => {
    mockedSetClouse.mockClear();
    mockedCallback.mockClear();
    mocked.mockedUseState.mockClear();
  });

  vi.mock("react", () => {
    return {
      useState: () => [
        mocked.mockedUseState(),
        (el) => {
          if (typeof el === "function") mockedSetClouse(el());
          else mockedSetClouse(el);
        },
      ],
    };
  });

  it("test buttons", () => {
    let { result } = _chooseBlock({ 1: "test" }, mockedCallback);
    let comp = render(result);
    expect(mockedCallback).not.toHaveBeenCalled();
    let button = comp.getByText("test");
    fireEvent.click(button);
    expect(mockedCallback).toHaveBeenCalledOnce();
  });

  it("isclose false", () => {
    let { result, chengeState } = _chooseBlock({ 1: "test" }, mockedCallback);
    let comp = render(result);
    chengeState();
    expect(mockedSetClouse).toHaveBeenCalledOnce();
    expect(comp.getByTestId("visibleBlock")).toBeInTheDocument();
  });

  it("isClose true", () => {
    mocked.mockedUseState.mockReturnValue(true);
    let { result } = _chooseBlock({}, mockedCallback);
    let comp = render(result);
    expect(comp.getByTestId("unVisibleBlock")).toBeInTheDocument();
  });
});
