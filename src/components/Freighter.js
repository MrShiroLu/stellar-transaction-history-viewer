import { signTransaction, setAllowed, getAddress } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const Server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

const checkConnection = async () => {
    return await setAllowed();
}

const retrievePublicKey = async () => {
    const { address } = await getAddress();
    return address;
}

const getBalance = async () => {
    await setAllowed();
    const { address } = await getAddress();
    const account = await Server.loadAccount(address);
    const xlm = account.balances.find((b) => b.asset_type === "native");
    return xlm?.balance // "0";
}

const getTransaction = async (limit = 50) => {

    const { address } = await getAddress();
    const transactions = await Server.operations()
        .forAccount(address)
        .order("desc")
        .limit(limit)
        .call();
    console.log("Operations data:", transactions.records);
    return transactions.records;
}

const userSignTransaction = async (xdr, network, signWith) => {
    return await signTransaction(xdr, {
        network,
        accountToSign: signWith,
    });
}

export { checkConnection, retrievePublicKey, getBalance, userSignTransaction, getTransaction };