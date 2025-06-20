import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EcoWallet } from "@/components/wallet/EcoWallet"
import { toast } from "@/components/ui/use-toast"

jest.mock("@/components/ui/use-toast", () => ({
  toast: jest.fn(),
}))

jest.mock("@/components/wallet/QRModal", () => ({
  QRModal: ({ disabled, onRedeem }: any) => (
    <button disabled={disabled} onClick={onRedeem} data-testid="qr-redeem-btn">
      Redeem
    </button>
  ),
}))

jest.mock("@/app/providers", () => ({
  useApp: () => ({
    user: { id: "test-user", name: "Test User" },
  }),
}))

describe("EcoWallet Component", () => {
  it("renders available points and redeem button", () => {
    render(<EcoWallet />)
    expect(screen.getByText(/EcoWallet/)).toBeInTheDocument()
    expect(screen.getByText("2340")).toBeInTheDocument()
    expect(screen.getAllByTestId("qr-redeem-btn").length).toBeGreaterThan(0)
  })

  it("redeems a reward and updates points", async () => {
    render(<EcoWallet />)

    const redeemButtons = screen.getAllByTestId("qr-redeem-btn")
    fireEvent.click(redeemButtons[0])

    await waitFor(() => {
      expect(screen.getByText("2240")).toBeInTheDocument()
    })
  })
});
