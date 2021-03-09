import React, { Profiler, useState } from "react";
import { observer } from "mobx-react";
import block from "bem-cn-lite";

import { NumberInput, Button } from "components";

import { BASE_CURRENCY, QUOTE_CURRENCY } from "./constants";
import { useStore } from "./context";
import { PlaceOrderTypeSwitch } from "./components/PlaceOrderTypeSwitch/PlaceOrderTypeSwitch";
import { TakeProfit } from "./components/TakeProfit/TakeProfit";
import "./PlaceOrderForm.scss";

const b = block("place-order-form");

export const PlaceOrderForm = observer(() => {
  const {
    activeOrderSide,
    price,
    total,
    amount,
    setPrice,
    setAmount,
    setTotal,
    setOrderSide
  } = useStore();

  const [profit, setProfit] = useState([]);
  const [errors, setErrors] = useState([]);

  const maxPrevProfitValidation = () => {
    const errs = [];
    profit.map((item, index) => {
      if (profit[index - 1]) {
        if (item.profit < profit[index - 1].profit) {
          errs.push({
            id: item.id,
            field: "profit",
            message:
              "Each target's profit should be greater than the previous one"
          });
        }
      }

      if (errs.length > 0) setErrors(errs);
    });
  };

  const maxProfitSumValidation = () => {
    const profitSum = profit.reduce(
      (profitSum, item) => profitSum + item.profit,
      0
    );

    if (profitSum > 500) {
      const errs = [];
      profit.forEach((item) => {
        errs.push({
          id: item.id,
          field: "profit",
          message: "Maximum profit sum is 500%"
        });
      });

      if (errs.length > 0) setErrors(errs);
    }
  };

  const minValueProfitValidation = () => {
    const errs = [];
    profit.forEach((item) => {
      if (item.profit <= 0.009) {
        errs.push({
          id: item.id,
          field: "profit",
          message: "Minimum value is 0.01"
        });
      }
    });

    if (errs.length > 0) setErrors(errs);
  };

  const minValuePriceValidation = () => {
    const errs = [];
    profit.forEach((item) => {
      if (item.tradePrice <= 0) {
        errs.push({
          id: item.id,
          field: "tradePrice",
          message: "Price must be greater than 0"
        });
      }
    });

    if (errs.length > 0) setErrors(errs);
  };

  const maxAmountValidation = () => {
    const amountSum = profit.reduce(
      (amountSum, item) => amountSum + item.amount,
      0
    );

    let maxValue = 0;
    profit.map((item) => {
      if (item.amount > maxValue) {
        maxValue = item.amount;
      }
    });

    const errs = [];
    if (amountSum > 100) {
      profit.forEach((item) => {
        errs.push({
          id: item.id,
          maxValue: amountSum,
          field: "amount",
          message: `${amountSum} out of 100% selected. Please decrease by ${maxValue}`
        });
      });
    }

    if (errs.length > 0) setErrors(errs);
  };

  const onSubmitButtonClick = (e) => {
    maxProfitSumValidation();
    minValueProfitValidation();
    minValuePriceValidation();
    maxAmountValidation();
    maxPrevProfitValidation();
  };

  return (
    <form className={b()}>
      <div className={b("header")}>
        Binance: {`${BASE_CURRENCY} / ${QUOTE_CURRENCY}`}
      </div>
      <div className={b("type-switch")}>
        <PlaceOrderTypeSwitch
          activeOrderSide={activeOrderSide}
          onChange={setOrderSide}
        />
      </div>
      <div className={b("price")}>
        <NumberInput
          label="Price"
          value={price}
          onChange={(value) => setPrice(Number(value))}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
        />
      </div>
      <div className={b("amount")}>
        <NumberInput
          value={amount}
          label="Amount"
          onChange={(value) => setAmount(Number(value))}
          InputProps={{ endAdornment: BASE_CURRENCY }}
        />
      </div>
      <div className={b("total")}>
        <NumberInput
          value={total}
          label="Total"
          onChange={(value) => setTotal(Number(value))}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
        />
      </div>
      <div className={b("take-profit")}>
        <TakeProfit
          orderSide={activeOrderSide}
          errors={errors}
          profit={profit}
          setProfit={setProfit}
          setErrors={setErrors}
        />
      </div>
      <div className="submit">
        <Button
          color={activeOrderSide === "buy" ? "green" : "red"}
          onClick={onSubmitButtonClick}
          // type="submit"
          fullWidth
        >
          {activeOrderSide === "buy"
            ? `Buy ${BASE_CURRENCY}`
            : `Sell ${QUOTE_CURRENCY}`}
        </Button>
      </div>
    </form>
  );
});
