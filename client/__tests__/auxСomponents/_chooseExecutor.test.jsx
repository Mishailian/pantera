import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { _chooseExecutor } from "../../src/auxComponents/_chooseExecutor";

let mockedFn = vi.fn();
describe("test choose executor", () => {
  it("cheack with currect props", () => {
    let comp = render(_chooseExecutor(mockedFn, "test", null));
    let box = comp.queryByText("test");
    fireEvent.click(box);
    fireEvent.click(box);
    expect(mockedFn).toHaveBeenCalledTimes(2);
    expect(box).toBeInTheDocument();
  });
});
