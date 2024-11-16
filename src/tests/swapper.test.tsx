type UseQuoteReturnType = {
  loading: boolean;
  fee: number;
  outputAmount: number;
};

type ActiveAccountReturnType = {
  address: string;
};

type SwapTransactionArgs = {
  inputToken: object;
  inputAmount: bigint;
  outputToken: object;
  recipient: string;
  fee: number;
};

jest.mock("@/hooks/useQuote", () => ({
  __esModule: true,
  default: jest.fn<UseQuoteReturnType, []>(),
}));

jest.mock("thirdweb/react", () => ({
  __esModule: true,
  useActiveAccount: jest.fn<ActiveAccountReturnType, []>(),
}));

jest.mock("@/transactions/swap", () => ({
  __esModule: true,
  default: jest.fn<Promise<void>, [SwapTransactionArgs]>(),
}));

import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import Swapper from "@/components/Swapper";
import useQuote from "@/hooks/useQuote";
import { useActiveAccount } from "thirdweb/react";
import approve from "@/transactions/approve";
import swap from "@/transactions/swap";

// Mock the thirdweb hooks and custom functions
jest.mock("thirdweb/react");
jest.mock("@/hooks/useQuote");
jest.mock("@/transactions/approve");
jest.mock("@/transactions/swap");

describe("Swapper Component", () => {
  const mockAddress = "0x1234567890abcdef1234567890abcdef12345678";

  beforeEach(() => {
    // Mock `useActiveAccount` to simulate an active account
    (useActiveAccount as jest.Mock).mockReturnValue({ address: mockAddress });

    // Mock `useQuote` hook for valid scenarios
    (useQuote as jest.Mock).mockReturnValue({
      loading: false,
      fee: 1.5,
      outputAmount: 1000,
    });
  });

  it("should render the swap input fields", () => {
    render(<Swapper />);

    // Check if input field is rendered
    expect(screen.getByPlaceholderText("0")).toBeInTheDocument();
  });

  it("should show the swap button when inputs are valid", async () => {
    render(<Swapper />);

    // Simulate user entering a valid input
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "10" },
    });

    // Check if the Swap button is rendered and enabled
    const swapButton = screen.getByText("Swap");
    expect(swapButton).toBeInTheDocument();
    expect(swapButton).not.toBeDisabled();
  });

  it("should call the swap transaction on button click", async () => {
    render(<Swapper />);

    // Simulate user entering an input amount
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "10" },
    });

    // Find and click the Swap button
    const swapButton = screen.getByText("Swap");
    fireEvent.click(swapButton);

    // Ensure the `swap` function was called with the correct arguments
    expect(swap).toHaveBeenCalledWith({
      inputToken: expect.any(Object),
      inputAmount: expect.any(BigInt),
      outputToken: expect.any(Object),
      recipient: mockAddress,
      fee: 1.5,
    });
  });

  it("should display an error if there are insufficient funds", async () => {
    render(<Swapper />);

    // Simulate user entering an input amount that exceeds the available balance
    fireEvent.change(screen.getByPlaceholderText("0"), {
      target: { value: "10000" },
    });

    // Check if the error message is displayed
    expect(screen.getByText("Not enough")).toBeInTheDocument();
  });
});
