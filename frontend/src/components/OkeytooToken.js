import React from "react";

export function OkeytooToken({ tokenSymbol, burnTokens, transferTokens }) {
    return (
        <div>
            <div className="my-4">
                <h4>Burn</h4>
                <form
                    onSubmit={(event) => {
                        // This function just calls the transferTokens callback with the
                        // form's data.
                        event.preventDefault();

                        const formData = new FormData(event.target);
                        const amount = formData.get("amount");

                        if (amount) {
                            burnTokens(amount);
                        }
                    }}
                >
                    <div className="input-group">
                        <input
                            className="form-control"
                            type="number"
                            name="amount"
                            placeholder={"Amount of " + tokenSymbol}
                            min={0}
                            required
                        />
                        <div className="input-group-append">
                            <input className="btn btn-danger" type="submit" value="Burn" />
                        </div>
                    </div>
                </form>
            </div>
            <div>
                <h4>Transfer</h4>
                <form
                    onSubmit={(event) => {
                        // This function just calls the transferTokens callback with the
                        // form's data.
                        event.preventDefault();

                        const formData = new FormData(event.target);
                        const to = formData.get("to");
                        const amount = formData.get("amount");

                        if (to && amount) {
                            transferTokens(to, amount);
                        }
                    }}
                >
                    <div className="input-group">
                        <input
                            className="form-control"
                            type="number"
                            name="amount"
                            placeholder={"Amount of " + tokenSymbol}
                            min={0}
                            required
                        />
                        <input className="form-control w-50" type="text" name="to" placeholder="Recipient" required />
                        <div className="input-group-append">
                            <input className="btn btn-info" type="submit" value="Transfer" />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
