import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import LoginPage from "@/app/auth/login/page";
import { Providers } from "@/app/providers";

jest.mock("@/app/providers", () => {
  const actual = jest.requireActual("@/app/providers");
  return {
    ...actual,
    useApp: () => ({
      supabase: {
        auth: {
          signInWithPassword: jest.fn(() => ({
            data: {},
            error: null,
          })),
        },
      },
    }),
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("LoginPage", () => {
  it("renders and accepts input", async () => {
    await act(async () => {
      render(
        <Providers>
          <LoginPage />
        </Providers>
      );
    });

    const emailInput = screen.getByPlaceholderText("name@example.com");
    const passwordInput = screen.getByPlaceholderText("••••••••");

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });

    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("testpassword");
  });
});
