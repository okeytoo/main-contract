import { useRef, React } from "react";

export function Multisig({
    multiSigData,
    addOwner,
    removeOwner,
    submitTransaction,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    recoverETH,
    distribute,
}) {
    const addOwnerInputRef = useRef(null);

    const txAddressInputRef = useRef(null);

    const txValueInputRef = useRef(null);

    const txAbiInputRef = useRef(null);

    const txFuncInputRef = useRef(null);

    const txParamsInputRef = useRef(null);

    const recoverEthOwnersInputRef = useRef(null);
    const distributeTokenInputRef = useRef(null);
    const distributeOwnersInputRef = useRef(null);

    const handleRemoveOwner = (owner) => {
        removeOwner(owner);
    };

    function handleAddOwner() {
        const owner = addOwnerInputRef.current.value;
        if (owner) {
            addOwner(owner);
        }
    }

    function handleSubmitTransaction() {
        const txAddress = txAddressInputRef.current.value;
        const txValue = txValueInputRef.current.value;
        const txAbi = txAbiInputRef.current.value;
        const txFunc = txFuncInputRef.current.value;
        const txParams = txParamsInputRef.current.value;
        if (txAddress && txValue && txAbi && txFunc && txParams) {
            submitTransaction(txAddress, txValue, JSON.parse(txAbi), txFunc, txParams);
        }
    }

    function handleConfirmTransaction(index) {
        confirmTransaction(index);
    }

    function handleRevokeConfirmation(index) {
        revokeConfirmation(index);
    }

    function handleExecuteTransaction(index) {
        executeTransaction(index);
    }

    function handleRecoverETH() {
        const owners = recoverEthOwnersInputRef.current.value;
        if (owners) {
            recoverETH(owners.split(","));
        }
    }

    function handleDistribute() {
        const token = distributeTokenInputRef.current.value;
        const owners = distributeOwnersInputRef.current.value;
        if (token && owners) {
            distribute(token, owners.split(","));
        }
    }

    return (
        <div>
            <div className="input-group my-4">
                <input
                    className="form-control"
                    type="text"
                    name="owners"
                    placeholder="Owners, comma separated"
                    ref={recoverEthOwnersInputRef}
                />
                <div className="input-group-append">
                    <button className="btn btn-warning" onClick={() => handleRecoverETH()}>
                        Recover ETH
                    </button>
                </div>
            </div>
            <div className="input-group my-4">
                <input
                    className="form-control"
                    type="text"
                    name="owners"
                    placeholder="Token"
                    ref={distributeTokenInputRef}
                />
                <input
                    className="form-control"
                    type="text"
                    name="token"
                    placeholder="Owners, comma separated"
                    ref={distributeOwnersInputRef}
                />
                <div className="input-group-append">
                    <button className="btn btn-warning" onClick={() => handleDistribute()}>
                        Distribute
                    </button>
                </div>
            </div>
            <div className="form-group">
                <h5>Transactions</h5>
                {multiSigData.transactions.map((transaction, index) => {
                    return (
                        <div className="input-group mb-2" key={index}>
                            <div className="input-group-prepend">
                                <span className="input-group-text" style={{ whiteSpace: "pre-wrap" }}>
                                    {(index + 1).toString().padStart(2)}.
                                </span>
                            </div>
                            <textarea
                                className="form-control w-75 f-family-code"
                                rows={2}
                                cols={80}
                                value={
                                    transaction.contractName + "." + transaction.func + "(" + transaction.params + ")"
                                }
                                disabled
                            />
                            {/* <input
                                className="form-control w-50"
                                type="text"
                                name="owner"
                                value={
                                    transaction.contractName + "." + transaction.func + "(" + transaction.params + ")"
                                }
                                disabled
                            /> */}
                            {/* <input
                                className="form-control"
                                type="text"
                                name="owner"
                                value={transaction.value}
                                disabled
                            /> */}
                            <div className="d-block">
                                <div className="form-control d-flex">
                                    <span className="mr-2 font-weight-bold">
                                        {transaction.numConfirmations + " / " + multiSigData.numConfirmationsRequired}
                                    </span>
                                    <div
                                        className="progress d-inline-block"
                                        data-percentage={parseInt(
                                            (transaction.numConfirmations * 100) / multiSigData.numConfirmationsRequired
                                        )}
                                    >
                                        <span className="progress-left">
                                            <span className="progress-bar"></span>
                                        </span>
                                        <span className="progress-right">
                                            <span className="progress-bar"></span>
                                        </span>
                                    </div>
                                </div>
                                <div className="input-group d-grid">
                                    <button
                                        className="btn btn-sm btn-outline-info"
                                        onClick={() => handleConfirmTransaction(index)}
                                        disabled={transaction.executed || transaction.isConfirmedByCurrentSigner}
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={() => handleRevokeConfirmation(index)}
                                        disabled={transaction.executed || !transaction.isConfirmedByCurrentSigner}
                                    >
                                        Revoke
                                    </button>
                                    <button
                                        className="btn btn-sm btn-outline-success"
                                        onClick={() => handleExecuteTransaction(index)}
                                        disabled={
                                            transaction.executed ||
                                            transaction.numConfirmations < multiSigData.numConfirmationsRequired
                                        }
                                    >
                                        Execute
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <h5>Owners</h5>
                {multiSigData.owners.map((owner, index) => {
                    return (
                        <div className="input-group mb-2" key={index}>
                            <div className="input-group-prepend">
                                <span className="input-group-text">{index + 1}.</span>
                            </div>
                            <input className="form-control" type="text" name="owner" value={owner} disabled required />
                            <div className="input-group-append">
                                <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveOwner(owner)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="input-group">
                <input className="form-control" type="text" name="owner" placeholder="Address" ref={addOwnerInputRef} />
                <div className="input-group-append">
                    <button className="btn btn-primary" onClick={() => handleAddOwner()}>
                        Add Owner
                    </button>
                </div>
            </div>
            <div className="input-group d-none">
                <div className="input-group">
                    <div className="input-group mt-4">
                        <input
                            className="form-control"
                            type="text"
                            name="txAddress"
                            placeholder="Address"
                            ref={txAddressInputRef}
                        />
                        <input
                            className="form-control"
                            type="number"
                            name="txValue"
                            placeholder="Value"
                            ref={txValueInputRef}
                            min={0}
                        />
                    </div>
                    <div className="input-group">
                        <textarea
                            className="form-control"
                            rows={5}
                            cols={35}
                            name="txData"
                            placeholder="ABI"
                            ref={txAbiInputRef}
                        />
                    </div>
                    <div className="input-group">
                        <input
                            className="form-control"
                            type="text"
                            name="txFunc"
                            placeholder="Function"
                            ref={txFuncInputRef}
                        />
                        <input
                            className="form-control"
                            type="text"
                            name="txParams"
                            placeholder="Parameters separated by comma"
                            ref={txParamsInputRef}
                        />
                    </div>
                    <button className="btn btn-warning w-100" onClick={() => handleSubmitTransaction()}>
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}
