import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { _tasksInputFields } from "../../src/auxComponents/_tasksInputFields";

let mockedFn = vi.fn();
describe("test tasks input fields", () => {
  let props = {
    del: (e) => {
      mockedFn(e);
    },
    name: "test",
    data: { test: { title: "test" } },
  };
  it("cheack with currect props", () => {
    let copm = render(_tasksInputFields(props));
    expect(copm.queryByDisplayValue("test")).toBeInTheDocument();
  });

  it("test buttons", () => {
    let copm = render(_tasksInputFields(props));
    fireEvent.click(copm.queryByText("del"));
    expect(mockedFn).toHaveBeenCalledOnce();
    expect(mockedFn).toHaveBeenCalledWith("test");
  });
});
