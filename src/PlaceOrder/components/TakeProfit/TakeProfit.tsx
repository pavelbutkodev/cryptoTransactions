/* eslint @typescript-eslint/no-use-before-define: 0 */

import React, { useCallback, useEffect, useState } from "react";
import block from "bem-cn-lite";
import { AddCircle, Cancel } from "@material-ui/icons";

import { Switch, TextButton, NumberInput } from "components";

import { useStore } from "../../context";
import { QUOTE_CURRENCY } from "../../constants";
import { OrderSide } from "../../model";
import "./TakeProfit.scss";

type Props = {
  orderSide: OrderSide;
  profit: any,
  setProfit: any,
  errors: [],
  setErrors: [],
};

const b = block("take-profit");

const TakeProfit = ({
  orderSide,
  profit,
  setProfit,
  errors,
  setErrors
}: Props) => {
  const { price, amount, activeOrderSide } = useStore();
  const [contentView, setContentView] = useState(false);
  const [sum, setSum] = useState(0);

  const setProfitField = (id: number, field: any, value: number) => {
    setProfit((prevProfit) => {
      return prevProfit.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [field]: value
          };
        }

        return item;
      });
    });
  };

  const addProfit = (newProfit: any) => {
    setProfit((prevProfit) => {
      const amount = newProfit.amount || 20;
      const id = Math.max(...prevProfit.map((item) => item.id), 0) + 1;

      const amountToSellSum =
        prevProfit.reduce((sum, item) => sum + item.amount, 0) + amount;

      let newPrevAmount = [...prevProfit];
      if (amountToSellSum > 100) {
        let maxAmountToSellId = null;
        let maxAmountToSell = 0;

        prevProfit.forEach((item) => {
          if (item.amount > maxAmountToSell) {
            maxAmountToSell = item.amount;
            maxAmountToSellId = item.id;
          }
        });

        newPrevAmount = newPrevAmount.map((item) => {
          if (item.id === maxAmountToSellId) {
            return {
              ...item,
              amount: item.amount - (amountToSellSum - 100)
            };
          }

          return item;
        });
      }

      return [...newPrevAmount, { ...newProfit, amount, id }];
    });
  };

  const handleDelete = (id: number) => {
    if (profit.length === 1) {
      onChange(false);
    }
    setProfit((prevProfit) => prevProfit.filter((item) => item.id !== id));
  };

  const handleAddProfit = () => {
    if (profit.length < 5) {
      addProfit({
        profit: profit[profit.length - 1].profit + 2,
        tradePrice:
          price + price * (profit[profit.length - 1].profit + 2) * 0.01
      });
    }
  };

  const onChange = useCallback(
    (checked) => {
      if (checked) {
        addProfit({
          profit: 2,
          tradePrice: price + price * 2 * 0.01,
          amount: 100
        });
      } else {
        setProfit([]);
        setSum(0);
      }
      setContentView(checked);
    },
    [setContentView]
  );

  useEffect(() => {
    setProfit((prevProfit: any) =>
      prevProfit.map((item: any) => {
        return {
          ...item,
          tradePrice: price + price * item.profit * 0.01
        };
      })
    );
  }, [price]);

  useEffect(() => {
    projectedProfit();
  }, [profit, price, amount, activeOrderSide, contentView]);

  const projectedProfit = () => {
    if (activeOrderSide === "buy") {
      let sum = 0;
      profit.forEach((item) => {
        sum += amount * (item.tradePrice - price) * (item.amount / 100);
      });
      setSum(sum);
    } else {
      let sum = 0;
      profit.forEach((item) => {
        sum += amount * (price - item.tradePrice) * (item.amount / 100);
      });
      setSum(sum);
    }
  };

  return (
    <div className={b()}>
      <div className={b("switch")}>
        <span>Take profit</span>
        <Switch checked={contentView} onChange={onChange} />
      </div>
      {contentView && (
        <div className={b("content")}>
          {renderTitles()}
          {profit.map((item) => renderInputs(item))}
          {profit.length < 5 && (
            <TextButton onClick={handleAddProfit} className={b("add-button")}>
              <AddCircle className={b("add-icon")} />
              <span>Add profit target {profit.length}/5</span>
            </TextButton>
          )}
          <div className={b("projected-profit")}>
            <span className={b("projected-profit-title")}>
              Projected profit
            </span>
            <span className={b("projected-profit-value")}>
              <span>{sum.toFixed(2)}</span>
              <span className={b("projected-profit-currency")}>
                {QUOTE_CURRENCY}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );

  function renderInputs({ profit, tradePrice, amount, id }: any) {
    const profitError = errors.find((err) => {
      if (err.id === id && err.field === "profit") {
        return true;
      }
    });

    const priceError = errors.find((err) => {
      if (err.id === id && err.field === "tradePrice") {
        return true;
      }
    });

    const amountError = errors.find((err) => {
      if (err.id === id && err.field === "amount") {
        return true;
      }
    });

    return (
      <div className={b("inputs")} key={id}>
        <NumberInput
          onBlur={(value) => {
            setProfitField(id, "tradePrice", price + price * value * 0.01);
            setErrors([]);
          }}
          value={profit}
          decimalScale={2}
          InputProps={{ endAdornment: "%" }}
          variant="underlined"
          error={profitError && profitError.message}
          onChange={(value) => setProfitField(id, "profit", value)}
        />
        <NumberInput
          onBlur={(value) => {
            setProfitField(id, "profit", Math.round((value / price - 1) * 100));
            setErrors([]);
          }}
          value={tradePrice}
          decimalScale={2}
          InputProps={{ endAdornment: QUOTE_CURRENCY }}
          variant="underlined"
          error={priceError && priceError.message}
          onChange={(value) => setProfitField(id, "tradePrice", value)}
        />
        <NumberInput
          onBlur={() => setErrors([])}
          value={amount}
          decimalScale={2}
          InputProps={{ endAdornment: "%" }}
          variant="underlined"
          error={amountError && amountError.message}
          onChange={(value) => setProfitField(id, "amount", value)}
        />
        <div className={b("cancel-icon")}>
          <Cancel onClick={handleDelete.bind(null, id)} />
        </div>
      </div>
    );
  }

  function renderTitles() {
    return (
      <div className={b("titles")}>
        <span>Profit</span>
        <span>Trade price</span>
        <span>Amount to {orderSide === "buy" ? "sell" : "buy"}</span>
      </div>
    );
  }
};

export { TakeProfit };
