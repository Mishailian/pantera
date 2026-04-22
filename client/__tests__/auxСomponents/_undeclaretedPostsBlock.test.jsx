import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { _undeclaretedPostsBlock } from "../../src/auxComponents/_undeclaretedPostsBlock";

var mockedFn = vi.fn();
describe("test _undeclaretedPostsBlock", () => {
  it("cheack with currect props", () => {
    let comp = render(_undeclaretedPostsBlock(mockedFn));
    let but = comp.queryByTestId("_undeclaretedPostsBlock");
    fireEvent.click(but);
    expect(mockedFn).toHaveBeenCalledOnce();
  });
});
