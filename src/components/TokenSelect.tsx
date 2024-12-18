"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import client from "@/lib/thirdweb-client";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { tokens } from "@/constants"
import { useMemo } from "react"
import { getWalletBalance } from "thirdweb/wallets"
import { useActiveAccount } from "thirdweb/react"
import anvil from "@/lib/anvil";
type TokenSelectProps = {
    selectedKey?: string;
    onSelect: (tokenKey?: string) => void;
}

export default function TokenSelect(props: TokenSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [balance, setBalance] = React.useState<any>({})
    const account = useActiveAccount();
    const selectedToken = useMemo(() => props.selectedKey ? tokens[props.selectedKey] : undefined, [props.selectedKey]);

    const getBalance = async () => {
        if (!account) return
        await getWalletBalance({
            address: account?.address,
            client,
            chain: anvil,
            tokenAddress: selectedToken?.address,
        }).then(res => {
            console.log(res)
            setBalance(res)
        }).catch((err) => {
            return err
        })
    }

    React.useEffect(() => {
        getBalance()
    }, [selectedToken])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="rounded-full"
                >
                    {selectedToken && <Image src={selectedToken.image} alt="" width={50} height={50} className="w-4 h-4 mr-1 rounded-r-full" />}
                    {selectedToken?.symbol ?? "Select token"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    {selectedToken && balance.displayValue}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[150px]">
                <Command>
                    <CommandInput placeholder="Search token..." />
                    <CommandEmpty>No token found.</CommandEmpty>
                    <CommandGroup>
                        {Object.entries(tokens).map(([key, token]) => (
                            <CommandItem
                                key={key}
                                value={key}
                                onSelect={(currentValue) => {
                                    props.onSelect(currentValue !== props.selectedKey ? currentValue : undefined)
                                    setOpen(false)
                                }}
                            >
                                <Image src={token.image} alt="" width={50} height={50} className={cn("w-4 h-4 mr-2", selectedToken?.symbol === token.symbol ? "opacity-1000" : "opacity-25")} />
                                {token.symbol}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
