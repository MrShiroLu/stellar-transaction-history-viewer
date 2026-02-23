import React, { useState } from 'react';
import { checkConnection, retrievePublicKey, getBalance, getTransaction, sendTransaction } from './Freighter';

const Header = () => {
    const [connected, setConnected] = useState(false);
    const [publicKey, setPublicKey] = useState("");
    const [balance, setBalance] = useState("0");
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Transaction state
    const [sendDestination, setSendDestination] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [txStatus, setTxStatus] = useState({ loading: false, success: false, error: null, hash: null });

    const disconnectWallet = () => {
        // Clear all app state
        setPublicKey("");
        setBalance("0");
        setTransactions([]);
        setConnected(false);
        setSendDestination("");
        setSendAmount("");
        setTxStatus({ loading: false, success: false, error: null, hash: null });

        // Clear browser storage
        localStorage.clear();
        sessionStorage.clear();

        // Reload page to fully sever Freighter connection
        window.location.reload();
    };

    const connectWallet = async () => {
        setIsLoading(true);
        try {
            const allowed = await checkConnection();
            if (!allowed) {
                alert('Connection was not approved. Please try again and allow access in Freighter.');
                setIsLoading(false);
                return;
            }

            const key = await retrievePublicKey();
            const bal = await getBalance();
            const txs = await getTransaction();

            setPublicKey(key);
            setBalance(Number(bal).toFixed(2));
            setConnected(true);
            setTransactions(Array.isArray(txs) ? txs : []);
        } catch (error) {
            console.error('Wallet connection error:', error);
            let errorMessage = 'Failed to connect wallet. Please try again.';

            if (error.message?.includes('install') || error.message?.includes('extension') || error.message?.includes('not available')) {
                errorMessage = 'Freighter wallet extension not found. Please install it from the Chrome Web Store.';
            } else if (error.message?.includes('undefined') || error.toString().includes('stellar')) {
                errorMessage = 'Freighter extension is not installed or not enabled. Please check your browser extensions.';
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                errorMessage = 'Network connection error. Check your internet and try again.';
            } else if (error.message?.includes('not found') || error.message?.includes('No account')) {
                errorMessage = 'No Stellar account found. Please create one in Freighter.';
            }

            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const truncateAddress = (addr) => {
        if (!addr) return '-';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    const handleSendTransaction = async () => {
        if (!sendDestination || !sendAmount) {
            alert("Please enter a destination address and amount.");
            return;
        }

        setTxStatus({ loading: true, success: false, error: null, hash: null });
        try {
            const result = await sendTransaction(sendDestination, sendAmount);
            setTxStatus({ loading: false, success: true, error: null, hash: result.hash });

            // Immediately refresh balance and transactions
            const bal = await getBalance();
            const txs = await getTransaction();
            setBalance(Number(bal).toFixed(2));
            setTransactions(Array.isArray(txs) ? txs : []);

            setSendDestination("");
            setSendAmount("");
        } catch (error) {
            console.error(error);
            setTxStatus({ loading: false, success: false, error: error.message || "An error occurred during the transaction.", hash: null });
        }
    };

    return (
        <div className="header-container">
            <h1 className="site-title">WALLET DETAILS</h1>
            {!connected ? (
                <button className="connect-btn" onClick={connectWallet} disabled={isLoading}>
                    {isLoading ? 'INITIATING CONNECTION...' : 'INITIALIZE WALLET'}
                </button>
            ) : (
                <div className="wallet-info">
                    <button className="disconnect-btn" onClick={disconnectWallet}>
                        DISCONNECT WALLET
                    </button>
                    <div className="info-row">
                        <span className="info-label">NETWORK</span>
                        <span className="info-value">TESTNET</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">PUBLIC KEY</span>
                        <span className="info-value">{publicKey}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">BALANCE</span>
                        <span className="info-value">{balance} XLM</span>
                    </div>

                    <div className="tx-section">
                        <h2 className="tx-title">SEND XLM</h2>
                        <div className="tx-form">
                            <input
                                type="text"
                                className="tx-input"
                                placeholder="Destination Address (G...)"
                                value={sendDestination}
                                onChange={(e) => setSendDestination(e.target.value)}
                            />
                            <input
                                type="text"
                                className="tx-input"
                                placeholder="Amount (XLM)"
                                value={sendAmount}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Sadece sayı ve tek bir noktaya izin ver
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setSendAmount(val);
                                    }
                                }}
                            />
                            <button
                                className="connect-btn tx-send-btn"
                                onClick={handleSendTransaction}
                                disabled={txStatus.loading || !sendDestination || !sendAmount}
                            >
                                {txStatus.loading ? 'SIGN & SENDING...' : 'SEND TRANSACTION'}
                            </button>
                        </div>

                        {txStatus.error && (
                            <div className="tx-status-message error">
                                ERROR: {txStatus.error}
                            </div>
                        )}

                        {txStatus.success && (
                            <div className="tx-status-message success">
                                SUCCESS! HASH: <br />
                                <span className="tx-hash">{txStatus.hash}</span>
                            </div>
                        )}
                    </div>

                    <div className="tx-section">
                        <h2 className="tx-title">RECENT OPERATIONS ({transactions.length})</h2>
                        <ul className="tx-list">
                            {transactions.length === 0 ? (
                                <li className="tx-item">
                                    <div className="tx-detail" style={{ justifyContent: 'center', color: '#666' }}>
                                        NO RECENT TRANSACTIONS FOUND
                                    </div>
                                </li>
                            ) : transactions.map((tx) => (
                                <li className="tx-item" key={tx.id || Math.random()}>
                                    <div className="tx-detail">
                                        <span className="tx-detail-label">ID</span>
                                        <span className="tx-detail-value">{tx.id || '-'}</span>
                                    </div>
                                    <div className="tx-detail">
                                        <span className="tx-detail-label">TIMESTAMP</span>
                                        <span className="tx-detail-value">{tx.created_at ? new Date(tx.created_at).toLocaleString('en-US') : '-'}</span>
                                    </div>
                                    <div className="tx-detail">
                                        <span className="tx-detail-label">STATUS</span>
                                        <span className="tx-detail-value">
                                            {String(transactions.successful) ?
                                                <span className="tx-status-success">SUCCESS</span> :
                                                <span className="tx-status-failed">FAILED</span>
                                            }
                                        </span>
                                    </div>
                                    <div className="tx-detail">
                                        <span className="tx-detail-label">TYPE</span>
                                        <span className="tx-detail-value">{tx.type ? tx.type.replace(/_/g, ' ').toUpperCase() : 'UNKNOWN'}</span>
                                    </div>
                                    {(tx.amount || tx.starting_balance) && (
                                        <div className="tx-detail">
                                            <span className="tx-detail-label">AMOUNT</span>
                                            <span className="tx-detail-value">
                                                {(tx.from === publicKey || tx.funder === publicKey || tx.source_account === publicKey) ? '-' : ''}
                                                {tx.amount || tx.starting_balance} {tx.asset_type === 'native' || !tx.asset_code ? 'XLM' : tx.asset_code}
                                            </span>
                                        </div>
                                    )}
                                    {tx.from && (
                                        <div className="tx-detail">
                                            <span className="tx-detail-label">FROM</span>
                                            <span className="tx-detail-value">{truncateAddress(tx.from)}</span>
                                        </div>
                                    )}
                                    {(tx.to || tx.account || tx.funder) && (
                                        <div className="tx-detail">
                                            <span className="tx-detail-label">TO</span>
                                            <span className="tx-detail-value">{truncateAddress(tx.to || tx.account || tx.funder)}</span>
                                        </div>
                                    )}
                                    {tx.transaction_hash && (
                                        <div className="tx-detail">
                                            <span className="tx-detail-label">HASH</span>
                                            <span className="tx-hash-value">{tx.transaction_hash}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
