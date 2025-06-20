import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/app/auth/login/page";
import { ThemeProvider } from "@/components/theme-provider";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/login",
  useSearchParams: () => new URLSearchParams(""),
}));

describe("LoginPage interaction", () => {
  it("accepts user credentials and attempts login", () => {
    render(
      <ThemeProvider>
        <LoginPage />
      </ThemeProvider>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "test123" },
    });

    const buttons = screen.getAllByRole("button", { name: /sign in/i });
    fireEvent.click(buttons[0]);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });
});
