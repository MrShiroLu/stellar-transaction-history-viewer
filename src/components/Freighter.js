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

const sendTransaction = async (destination, amount) => {
    const { address } = await getAddress();
    const account = await Server.loadAccount(address);
    let fee = "100";
    try {
        fee = (await Server.fetchBaseFee()).toString();
    } catch (e) {
        console.warn("Could not fetch base fee, defaulting to 100 stroops", e);
    }

    const transaction = new StellarSdk.TransactionBuilder(account, {
        fee,
        networkPassphrase: StellarSdk.Networks.TESTNET,
    })
        .addOperation(StellarSdk.Operation.payment({
            destination,
            asset: StellarSdk.Asset.native(),
            amount: amount.toString(),
        }))
        .setTimeout(30)
        .build();

    const xdr = transaction.toXDR();
    let signedTx = await signTransaction(xdr, {
        networkPassphrase: StellarSdk.Networks.TESTNET,
        address: address,
    });

    if (signedTx?.error) {
        throw new Error(signedTx.error);
    }

    // Freighter v6 returns { signedTxXdr, signerAddress, error }
    const signedXdr = signedTx.signedTxXdr || signedTx.signedTransaction || (typeof signedTx === "string" ? signedTx : null);
    if (!signedXdr) {
        throw new Error("Failed to get signed transaction from Freighter");
    }

    const transactionToSubmit = new StellarSdk.Transaction(signedXdr, StellarSdk.Networks.TESTNET);
    const response = await Server.submitTransaction(transactionToSubmit);
    return response;
}

export { checkConnection, retrievePublicKey, getBalance, userSignTransaction, getTransaction, sendTransaction };