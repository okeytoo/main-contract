import { useRef, React } from "react";

export function OkeytooNFT({ depositToken, depositUSDT, tokens, withdrawCredits }) {
    const inputWithdrawTokenIdRef = useRef(null);
    const inputWithdrawAmountRef = useRef(null);

    const inputTokenRef = useRef(null);

    const inputUSDTRef = useRef(null);

    function handleWithdrawCredits() {
        const tokenId = inputWithdrawTokenIdRef.current.value;
        const amount = inputWithdrawAmountRef.current.value;
        if (tokenId && amount) {
            withdrawCredits(amount, tokenId);
        }
    }

    function handleDepositToken() {
        const value = inputTokenRef.current.value;
        if (value > 0) {
            depositToken(value);
        }
    }

    function handleDepositUSDT() {
        const value = inputUSDTRef.current.value;
        if (value > 0) {
            depositUSDT(value);
        }
    }

    return (
        <div>
            <div>
                <h5>Deposit</h5>
                <div className="input-group mt-4">
                    <input
                        className="form-control"
                        type="number"
                        name="amount"
                        placeholder="Amount of OKT"
                        min={0}
                        ref={inputTokenRef}
                        required
                    />
                    <div className="input-group-append">
                        <button className="btn btn-info" onClick={() => handleDepositToken()}>
                            Deposit $OKT
                        </button>
                    </div>
                </div>
                <div className="input-group mt-4">
                    <input
                        className="form-control"
                        type="number"
                        name="amount"
                        placeholder="Amount of USDT"
                        min={0}
                        ref={inputUSDTRef}
                        required
                    />

                    <div className="input-group-append">
                        <button className="btn btn-info" onClick={() => handleDepositUSDT()}>
                            Deposit $USDT
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h5>Tokens</h5>
                {tokens.map((token, index) => {
                    return (
                        <div className="input-group mb-2" key={index}>
                            <div className="input-group-prepend">
                                <span className="input-group-text" style={{ whiteSpace: "pre-wrap" }}>
                                    {index + 1}.
                                </span>
                            </div>
                            <input
                                className="form-control"
                                type="text"
                                name="tokenId"
                                value={JSON.stringify(token)}
                                disabled
                                required
                            />
                        </div>
                    );
                })}
            </div>
            <div>
                <h5>Withdraw</h5>
                <div className="input-group">
                    <input
                        className="form-control"
                        type="number"
                        name="amount"
                        placeholder="Token ID"
                        ref={inputWithdrawTokenIdRef}
                        min={0}
                        required
                    />
                    <input
                        className="form-control w-50"
                        type="number"
                        name="amount"
                        placeholder="Amount of Credits"
                        ref={inputWithdrawAmountRef}
                        min={0}
                        required
                    />
                    <div className="input-group-append">
                        <button className="btn btn-success" onClick={() => handleWithdrawCredits()}>
                            Withdraw
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
