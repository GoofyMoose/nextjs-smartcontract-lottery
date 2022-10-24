import { useMoralis, useWeb3Contract } from "react-moralis"
import { useEffect, useState } from "react"
import { abi, contractAddresses } from "../constants"
import { ethers } from "ethers"
import { useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { Moralis, isWeb3Enabled, chainId: chainIdHex } = useMoralis() // Moralis obtains the chainId from the connectButton in the header component. ChainId is in hex format.
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const [entranceFee, setEntranceFee] = useState("0") // use state variable instead of 'let entranceFee' in order for the page to re-render
    const [numberOfPlayers, setNumberOfPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState("0")
    const dispatch = useNotification() // dispatch is the pop-up notification

    // the following pulls the runContractFunction out of useWeb3Contract and assigns it to enterRaffle
    const {
        runContractFunction: enterRaffle,
        isFetching,
        isLoading,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })

    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numberOfPlayersFromCall = (await getNumberOfPlayers()).toString()
        const RecentWinnerFromCall = (await getRecentWinner()).toString()
        setEntranceFee(entranceFeeFromCall) // change state variable, so that the page re-renders
        setNumberOfPlayers(numberOfPlayersFromCall)
        setRecentWinner(RecentWinnerFromCall)
    }

    // run the following, when isWeb3Enabled changes
    useEffect(() => {
        // read the raffle entrance fee
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled]) // executed without parameters: this is executed once on load (will be false). When page loads, localStorage variable 'connected' will be set and isWeb3Enabled set to true

    const handleSuccess = async function (tx) {
        await tx.wait(1)
        updateUI()
        handleNewNotification(tx)
    }

    // attributes can be found in https://web3ui.github.io/web3uikit/ section 5. Popup => Notification
    const handleNewNotification = function () {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Tx Notification",
            position: "topR",
            icon: "bell",
        })
    }

    return (
        <div className="p-5">
            <br />
            {raffleAddress ? (
                <div>
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
                        onClick={async function () {
                            await enterRaffle({
                                onSuccess: handleSuccess, // built-in event handlers
                                onError: (error) => console.log(error),
                            })
                        }}
                        disabled={isFetching || isLoading}
                    >
                        {isLoading || isFetching ? (
                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                        ) : (
                            "Enter Raffle"
                        )}
                    </button>
                    <br />
                    Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                    <br />
                    Number of Players: {numberOfPlayers}
                    <br />
                    Recent Winner: {recentWinner}
                </div>
            ) : (
                <div>No Address detected</div>
            )}
        </div>
    )
}
