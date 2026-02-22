import React, { useState } from 'react';
import { checkConnection, retrievePublicKey, getBalance, getTransaction } from './Freighter';

const Header = () => {
    const [connected, setConnected] = useState(false);
    const [publicKey, setPublicKey] = useState("");
    const [balance, setBalance] = useState("0");
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const connectWallet = async () => {
        setIsLoading(true);
        try {
            const allowed = await checkConnection();
            if (!allowed) {
                alert('Connection Denied. Please allow access in Freighter.');
                setIsLoading(false);
                return;
            }

            const key = await retrievePublicKey();
            const bal = await getBalance();
            const txs = await getTransaction(5);

            setPublicKey(key);
            setBalance(Number(bal).toFixed(2));
            setConnected(true);
            setTransactions(Array.isArray(txs) ? txs : []);
        } catch (error) {
            console.error(error);
            alert('An error occurred while connecting. See console for details.');
        } finally {
            setIsLoading(false);
        }
    };

    const truncateAddress = (addr) => {
        if (!addr) return '-';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
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
