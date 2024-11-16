"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "./ui/input";
import { Address, toTokens, toUnits, toWei } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import approve from "@/transactions/approve";
import swap from "@/transactions/swap";
import { ROUTER, tokens } from "@/constants";
import TransactionButton from "./TransactionButton";
import TokenSelect from "./TokenSelect";
import Token from "@/types/token";
import useQuote from "@/hooks/useQuote";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import { allowance as thirdwebAllowance, balanceOf } from "thirdweb/extensions/erc20";
import getContract from "@/lib/get-contract";

const fetchAllowance = async (tokenIn: Token, recipient: Address) => {
    return thirdwebAllowance({ contract: getContract({ address: tokenIn.address }), owner: recipient, spender: ROUTER });
}

const fetchBalance = async (tokenIn: Token, recipient: Address) => {
    return balanceOf({ contract: getContract({ address: tokenIn.address }), address: recipient });
}


function SwapButton({ tokenIn, tokenOut, amount, fee, recipient }: { tokenIn: Token, tokenOut: Token, amount: bigint, fee: number, recipient: Address }) {
    const [allowance, setAllowance] = useState(BigInt(0));
    const [balance, setBalance] = useState(BigInt(0));

    const refetchAllowance = useCallback(() => fetchAllowance(tokenIn, recipient).then(setAllowance), [tokenIn, recipient]);
    const refetchBalance = useCallback(() => fetchBalance(tokenIn, recipient).then(setBalance), [tokenIn, recipient]);
    useEffect(() => {
        refetchAllowance();
        refetchBalance()
    }, [tokenIn, recipient]);

    if (balance < amount) {
        return <div className="flex flex-col text-center">
            <div className="font-semibold text-red-500">Not enough {tokenIn.symbol}!</div>
            <div className="text-sm text-gray-400">Your balance: {toTokens(balance, tokenIn.decimals)}</div>
        </div>
    }

    // if (allowance < amount) {
    //     return (
    //         <TransactionButton
    //             transaction={() => {
    //                 return approve({
    //                     token: tokenIn,
    //                     amount: amount,
    //                     spender: ROUTER
    //                 })
    //             }}
    //             onSent="Approve your tokens for use..."
    //             onConfirmed="Tokens successfully approved for use."
    //             onError="Failed to approve tokens!"
    //             successCallback={refetchAllowance}
    //         >
    //             Approve
    //         </TransactionButton>
    //     )
    // }

    return (
        <TransactionButton
            transaction={async () => {
                return swap({
                    inputToken: tokenIn,
                    inputAmount: amount,
                    outputToken: tokenOut,
                    recipient: recipient,
                    fee
                });
            }}
            onSent="Swap submitted..."
            onConfirmed="Successfully swapped."
            onError="Failed to complete swap."
            successCallback={refetchBalance}
        >
            Swap
        </TransactionButton>
    )
}

// cast send 0x97E70E87a6AaD2006795a733174b5B96640D9696 --value 100ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545


export default function Swapper() {
    const account = useActiveAccount();
    const [amount, setAmount] = useState<number>(0);
    const [inputTokenKey, setInputTokenKey] = useState<string | undefined>();
    const [outputTokenKey, setOutputTokenKey] = useState<string | undefined>();

    const inputToken = useMemo(() => inputTokenKey ? tokens[inputTokenKey] : undefined, [inputTokenKey]);
    const outputToken = useMemo(() => outputTokenKey ? tokens[outputTokenKey] : undefined, [outputTokenKey]);
    const { loading: quoteLoading, fee, outputAmount } = useQuote({ tokenIn: inputToken, tokenOut: outputToken, amount: toUnits(amount.toString(), inputToken?.decimals ?? 18) });

    const canSwap = !quoteLoading && account && inputToken && outputToken && amount && fee;

    return <div>
        <div className="w-full rounded-3xl grig grid-rows-2 p-6 gap-2 relative">
            <div className="flex gap-4 p-2">
                <p className="px-4 py-1 hover:bg-gray-200 bg-gray-200 rounded-full">Swap</p>
                <p className="px-2 py-1 hover:bg-gray-200 rounded-full">Limit</p>
                <p className="px-2 py-1 hover:bg-gray-200 rounded-full">Send</p>
                <p className="px-2 py-1 hover:bg-gray-200 rounded-full">Buy</p>
            </div>
            <div className="w-100 flex justify-between rounded-xl p-3 border mb-2">
                <div className="grid grid-rows-3 gap-4 text-gray-400">
                    <p>Sell</p>
                    <input type="number" className="text-2xl border-none focus:outline-none bg-inherit" onChange={(e) => setAmount(parseFloat(e.target.value || "0"))} placeholder="0" />
                    <p>$0</p>
                    <div className="relative">
                    <div className="absolute m-0 left-[60%]">
                        <div className="border p-2 w-16 bg-white rounded-xl">
                            SWAP
                        </div>
                    </div>
                </div>
                </div>
                <div className="m-0 flex justify-center items-center">
                    <TokenSelect selectedKey={inputTokenKey} onSelect={setInputTokenKey} />
                </div>
            </div>
            <div className="w-full flex justify-between rounded-xl p-3 border bg-gray-50">
                <div className="grid grid-rows-3 gap-3 text-gray-400">
                    <p>Buy</p>
                    <input disabled className="text-2xl focus:outline-none bg-inherit" value={outputAmount && outputToken ? toTokens(outputAmount, outputToken.decimals) : 0} />
                    <p>{outputAmount && outputToken ? toTokens(outputAmount, outputToken.decimals) : 0}</p>
                </div>
                <div className="m-0 flex justify-center items-center">
                    <TokenSelect selectedKey={outputTokenKey} onSelect={setOutputTokenKey} />
                </div>
            </div>
            <div className="mt-4 w-full">
                {canSwap ? <SwapButton fee={fee} recipient={account.address as Address} tokenIn={inputToken} tokenOut={outputToken} amount={toUnits(amount.toString(), inputToken?.decimals ?? 18)} /> : <></>}
            </div>
        </div>
    </div>
}
