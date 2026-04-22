import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { _postBlock } from "../../src/auxComponents/_postBlock";

let mockedChengePost = vi.fn();
let mockedDeletePost = vi.fn();

describe("test post block", () => {
  vi.mock("react-router-dom", () => {
    return {
      useNavigate: () => {},
    };
  });

  vi.mock("../../src/app/api/apiSlice", () => {
    return {
      useChengePostMutation: () => [mockedChengePost],
      useDeletePostMutation: () => [mockedDeletePost],
    };
  });

  vi.mock("../../src/static/static", () => {
    return {
      staticApi: () => ({
        structure: {
          chooseBlock: (_, fn) => {
            fn();
            return { result: "", chengeState: "" };
          },
          postBlockButtons: (_, fn) => {
            fn();
          },
          chooseExecutor: () => {},
        },
      }),
    };
  });

  it("", () => {
    let props = { data: { name: "test", date_create: null, id: 12 } };
    let comp = render(_postBlock(props));
    expect(mockedDeletePost).toHaveBeenCalledOnce();
    expect(mockedChengePost).toHaveBeenCalledOnce();
    expect(comp.queryByText("test")).toBeInTheDocument();
  });
});
