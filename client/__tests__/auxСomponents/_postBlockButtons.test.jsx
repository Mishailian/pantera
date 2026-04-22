import { expect, describe, test, vi, it, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import { _postBlockButtons } from "../../src/auxComponents/_postBlockButtons";

var mockedDellete = vi.fn();
var mockedNavigate = vi.fn();

describe("test post block button", () => {
  it("cheack with currect props and superUser", () => {
    let comp = render(
      _postBlockButtons(12, mockedDellete, mockedNavigate, true)
    );
    let firstButton = comp.queryByText("перейти");
    let secondButton = comp.queryByText("удалить");
    fireEvent.click(firstButton);
    fireEvent.click(secondButton);
    expect(firstButton).toBeInTheDocument();
    expect(secondButton).toBeInTheDocument();
    expect(mockedDellete).toHaveBeenCalledOnce();
    expect(mockedNavigate).toHaveBeenCalledOnce();
  });
  it("cheack with currect props and not superUser", () => {
    let comp = render(
      _postBlockButtons(12, mockedDellete, mockedNavigate, false)
    );
    let firstButton = comp.queryByText("перейти");
    let secondButton = comp.queryByText("удалить");
    fireEvent.click(firstButton);
    expect(firstButton).toBeInTheDocument();
    expect(secondButton).not.toBeInTheDocument();
    expect(mockedDellete).toHaveBeenCalledOnce();
    expect(mockedNavigate).not.toHaveBeenCalledOnce();
  });

  it("cheack function", () => {
    let comp = render(
      _postBlockButtons(12, mockedDellete, mockedNavigate, false)
    );
    let firstButton = comp.queryByText("перейти");
    fireEvent.click(firstButton);
    expect(mockedNavigate).toHaveBeenCalledWith("12");
  });
});
