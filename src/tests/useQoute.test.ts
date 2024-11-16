import { renderHook, act } from '@testing-library/react';
import useQuote from '@/hooks/useQuote';
import { simulateTransaction } from 'thirdweb';
import { getUniswapV3Pool } from 'thirdweb/extensions/uniswap';
import toast from 'react-hot-toast';
import type Token from '@/types/token';

// Mock dependencies
jest.mock('thirdweb', () => ({
  simulateTransaction: jest.fn(),
}));

jest.mock('thirdweb/extensions/uniswap', () => ({
  getUniswapV3Pool: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
}));

describe('useQuote Hook', () => {
  // Using real token addresses and proper decimals
  const mockTokenIn: Token = {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    symbol: 'WETH',
    decimals: 18,
    image: '/path/to/weth.png'
  };

  const mockTokenOut: Token = {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    symbol: 'USDC',
    decimals: 6,
    image: '/path/to/usdc.png'
  };

  const mockWallet = '0x1234567890123456789012345678901234567890';
  const mockAmount = BigInt('1000000000000000000'); // 1 WETH in wei

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useQuote({}));
    expect(result.current).toEqual({
      loading: false,
      fee: undefined,
      outputAmount: undefined,
    });
  });

  it('should handle successful quote', async () => {
    const mockPools = [{
      poolFee: 3000, // 0.3%
      token0: mockTokenIn.address,
      token1: mockTokenOut.address,
    }];
    const mockOutput = BigInt('1800000000'); // 1800 USDC (6 decimals)

    (getUniswapV3Pool as jest.Mock).mockResolvedValue(mockPools);
    (simulateTransaction as jest.Mock).mockResolvedValue(mockOutput);

    const { result } = renderHook(() => 
      useQuote({ 
        tokenIn: mockTokenIn, 
        tokenOut: mockTokenOut, 
        amount: mockAmount,
      })
    );

    // Initial state
    expect(result.current.loading).toBe(false);

    // Wait for loading state
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current.loading).toBe(true);

    // Wait for quote
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.fee).toBe(3000);
    expect(result.current.outputAmount).toBe(mockOutput);
  });

  it('should handle no pools found', async () => {
    (getUniswapV3Pool as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => 
      useQuote({ 
        tokenIn: mockTokenIn, 
        tokenOut: mockTokenOut, 
        amount: mockAmount,
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "No path found for this token pair",
      expect.any(Object)
    );
    expect(result.current.fee).toBeUndefined();
    expect(result.current.outputAmount).toBeUndefined();
  });

  it('should handle simulation failure', async () => {
    const mockPools = [{
      poolFee: 3000,
      token0: mockTokenIn.address,
      token1: mockTokenOut.address,
    }];

    (getUniswapV3Pool as jest.Mock).mockResolvedValue(mockPools);
    (simulateTransaction as jest.Mock).mockRejectedValue(new Error('Simulation failed'));

    const { result } = renderHook(() => 
      useQuote({ 
        tokenIn: mockTokenIn, 
        tokenOut: mockTokenOut, 
        amount: mockAmount,
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(toast.error).toHaveBeenCalledWith(
      "No path found for this token pair",
      expect.any(Object)
    );
  });

  it('should use cached pools for same token pair', async () => {
    const mockPools = [{
      poolFee: 3000,
      token0: mockTokenIn.address,
      token1: mockTokenOut.address,
    }];
    const mockOutput = BigInt('1800000000'); // 1800 USDC

    (getUniswapV3Pool as jest.Mock).mockResolvedValue(mockPools);
    (simulateTransaction as jest.Mock).mockResolvedValue(mockOutput);

    // First render
    const { rerender } = renderHook(({ tokenIn, tokenOut, amount, walletAddress }) => 
      useQuote({ tokenIn, tokenOut, amount }),
      {
        initialProps: {
          tokenIn: mockTokenIn,
          tokenOut: mockTokenOut,
          amount: mockAmount,
          walletAddress: mockWallet,
        },
      }
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Second render with same tokens but different amount
    rerender({
      tokenIn: mockTokenIn,
      tokenOut: mockTokenOut,
      amount: BigInt('2000000000000000000'), // 2 WETH
      walletAddress: mockWallet,
    });

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // getUniswapV3Pool should only be called once due to caching
    expect(getUniswapV3Pool).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined inputs', () => {
    const { result } = renderHook(() => 
      useQuote({ 
        tokenIn: undefined, 
        tokenOut: undefined, 
        amount: undefined,
      })
    );

    expect(result.current).toEqual({
      loading: false,
      fee: undefined,
      outputAmount: undefined,
    });
  });

  it('should handle zero amount', async () => {
    const { result } = renderHook(() => 
      useQuote({ 
        tokenIn: mockTokenIn, 
        tokenOut: mockTokenOut, 
        amount: BigInt(0),
      })
    );

    expect(result.current).toEqual({
      loading: false,
      fee: undefined,
      outputAmount: undefined,
    });
  });
});